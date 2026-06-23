import "server-only";

import type { Prisma, Subscription } from "@prisma/client";
import Stripe from "stripe";

import {
  type BillingPlan,
  databaseValueToPlan,
  normalizePlan,
  planToDatabaseValue
} from "@/lib/billing";
import { ForbiddenError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getStripe, planFromPriceId } from "@/lib/stripe";

const MAX_PROCESSED_EVENTS = 50;

type BillingStateInput = {
  userId: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  checkoutSessionId?: string | null;
  plan?: BillingPlan | null;
  status: "FREE" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "LIFETIME";
  currentPeriodEnd?: Date | null;
  lifetimeAccess?: boolean;
  lastPaymentFailedAt?: Date | null;
  eventId?: string;
};

function stripeId(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "id" in value && typeof value.id === "string") {
    return value.id;
  }

  return null;
}

function parseProcessedEvents(subscription: Subscription | null | undefined) {
  if (!subscription?.processedStripeEvents) {
    return [];
  }

  try {
    const parsed = JSON.parse(subscription.processedStripeEvents);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function appendProcessedEvent(subscription: Subscription | null | undefined, eventId?: string) {
  const events = parseProcessedEvents(subscription);

  if (!eventId || events.includes(eventId)) {
    return JSON.stringify(events);
  }

  return JSON.stringify([...events, eventId].slice(-MAX_PROCESSED_EVENTS));
}

function wasProcessed(subscription: Subscription | null | undefined, eventId?: string) {
  return Boolean(eventId && parseProcessedEvents(subscription).includes(eventId));
}

function dateFromStripeTimestamp(timestamp: unknown) {
  return typeof timestamp === "number" ? new Date(timestamp * 1000) : null;
}

async function retrieveStripeSubscription(subscriptionId: string | null) {
  if (!subscriptionId) {
    return null;
  }

  try {
    return await getStripe().subscriptions.retrieve(subscriptionId);
  } catch (error) {
    logger.error("Unable to retrieve Stripe subscription", { subscriptionId, error });
    return null;
  }
}

function currentPeriodEndFromSubscription(subscription: Stripe.Subscription | null) {
  return dateFromStripeTimestamp((subscription as unknown as { current_period_end?: number })?.current_period_end);
}

async function findUserForStripe(customerId: string | null, subscriptionId: string | null) {
  const directUserFilters: Prisma.UserWhereInput[] = [];
  const subscriptionFilters: Prisma.SubscriptionWhereInput[] = [];

  if (customerId) {
    directUserFilters.push({ stripeCustomerId: customerId });
    subscriptionFilters.push({ stripeCustomerId: customerId });
  }

  if (subscriptionId) {
    directUserFilters.push({ stripeSubscriptionId: subscriptionId });
    subscriptionFilters.push({ stripeSubscriptionId: subscriptionId });
  }

  if (directUserFilters.length > 0) {
    const user = await prisma.user.findFirst({
      where: { OR: directUserFilters },
      include: { subscription: true }
    });

    if (user) {
      return user;
    }
  }

  if (subscriptionFilters.length > 0) {
    const subscription = await prisma.subscription.findFirst({
      where: { OR: subscriptionFilters },
      include: {
        user: {
          include: {
            subscription: true
          }
        }
      }
    });

    if (subscription?.user) {
      return subscription.user;
    }
  }

  return null;
}

async function applyBillingState(input: BillingStateInput) {
  const existing = await prisma.subscription.findUnique({
    where: { userId: input.userId }
  });

  if (wasProcessed(existing, input.eventId)) {
    logger.info("Skipping already processed Stripe event", { eventId: input.eventId });
    return;
  }

  const plan = input.plan ? planToDatabaseValue(input.plan) : existing?.plan ?? "FREE";
  const userData: Prisma.UserUpdateInput = {};

  if (input.customerId) {
    userData.stripeCustomerId = input.customerId;
  }

  if (input.subscriptionId) {
    userData.stripeSubscriptionId = input.subscriptionId;
  }

  const subscriptionData: Prisma.SubscriptionUncheckedCreateInput = {
    userId: input.userId,
    status: input.status,
    plan,
    stripeCustomerId: input.customerId ?? null,
    stripeSubscriptionId: input.subscriptionId ?? null,
    stripeCheckoutSessionId: input.checkoutSessionId ?? null,
    currentPeriodEnd: input.currentPeriodEnd,
    lifetimeAccess: input.lifetimeAccess ?? input.status === "LIFETIME",
    lastPaymentFailedAt: input.lastPaymentFailedAt,
    processedStripeEvents: appendProcessedEvent(existing, input.eventId)
  };

  const updateData: Prisma.SubscriptionUncheckedUpdateInput = {
    status: input.status,
    plan,
    lifetimeAccess: input.lifetimeAccess ?? input.status === "LIFETIME",
    processedStripeEvents: appendProcessedEvent(existing, input.eventId)
  };

  if (input.customerId !== undefined) {
    updateData.stripeCustomerId = input.customerId;
  }

  if (input.subscriptionId !== undefined) {
    updateData.stripeSubscriptionId = input.subscriptionId;
  }

  if (input.checkoutSessionId !== undefined) {
    updateData.stripeCheckoutSessionId = input.checkoutSessionId;
  }

  if (input.currentPeriodEnd !== undefined) {
    updateData.currentPeriodEnd = input.currentPeriodEnd;
  }

  if (input.lastPaymentFailedAt !== undefined) {
    updateData.lastPaymentFailedAt = input.lastPaymentFailedAt;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: userData
    }),
    prisma.subscription.upsert({
      where: { userId: input.userId },
      create: subscriptionData,
      update: updateData
    })
  ]);
}

async function applyCheckoutSession(session: Stripe.Checkout.Session, eventId?: string) {
  const userId = session.client_reference_id;

  if (!userId) {
    logger.error("Checkout Session missing client_reference_id", { sessionId: session.id });
    return false;
  }

  const plan = normalizePlan(session.metadata?.plan);
  const customerId = stripeId(session.customer);
  let subscriptionId = stripeId(session.subscription);
  let stripeSubscription =
    typeof session.subscription === "object" ? (session.subscription as Stripe.Subscription) : null;

  if (!stripeSubscription && subscriptionId) {
    stripeSubscription = await retrieveStripeSubscription(subscriptionId);
  }

  if (!subscriptionId) {
    subscriptionId = stripeId(stripeSubscription);
  }

  const isLifetime = plan === "lifetime";
  const subscriptionComplete = session.mode === "subscription" && Boolean(subscriptionId);
  const lifetimeComplete = session.mode === "payment" && session.payment_status === "paid";

  if (session.status !== "complete" || (!subscriptionComplete && !lifetimeComplete)) {
    logger.info("Checkout Session is not complete enough to unlock access", {
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.payment_status
    });
    return false;
  }

  await applyBillingState({
    userId,
    customerId,
    subscriptionId,
    checkoutSessionId: session.id,
    plan,
    status: isLifetime ? "LIFETIME" : "ACTIVE",
    currentPeriodEnd: isLifetime ? null : currentPeriodEndFromSubscription(stripeSubscription),
    lifetimeAccess: isLifetime,
    lastPaymentFailedAt: null,
    eventId
  });

  return true;
}

export async function syncCheckoutSession(sessionId: string, expectedUserId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"]
  });

  if (session.client_reference_id !== expectedUserId) {
    throw new ForbiddenError();
  }

  return applyCheckoutSession(session);
}

export async function syncLatestCheckoutSessionForUser(userId: string, customerId: string | null | undefined) {
  if (!customerId) {
    return false;
  }

  const sessions = await getStripe().checkout.sessions.list({
    customer: customerId,
    limit: 10,
    expand: ["data.subscription"]
  });

  const completedSession = sessions.data.find((session) => {
    return session.client_reference_id === userId && session.status === "complete";
  });

  if (!completedSession) {
    return false;
  }

  return applyCheckoutSession(completedSession);
}

async function applyInvoicePaid(invoice: Stripe.Invoice, eventId: string) {
  const invoiceRecord = invoice as unknown as {
    subscription?: string | Stripe.Subscription | null;
    customer?: string | Stripe.Customer | null;
    lines?: {
      data?: Array<{
        price?: {
          id?: string;
        };
      }>;
    };
  };

  const customerId = stripeId(invoiceRecord.customer);
  const subscriptionId = stripeId(invoiceRecord.subscription);

  if (!subscriptionId) {
    logger.debug("invoice.paid without subscription", { invoiceId: invoice.id });
    return;
  }

  const stripeSubscription = await retrieveStripeSubscription(subscriptionId);
  const user = await findUserForStripe(customerId, subscriptionId);

  if (!user) {
    logger.error("No user found for invoice.paid", { customerId, subscriptionId });
    return;
  }

  if (wasProcessed(user.subscription, eventId)) {
    logger.info("Skipping already processed invoice.paid", { eventId });
    return;
  }

  const priceId =
    invoiceRecord.lines?.data?.[0]?.price?.id ??
    (stripeSubscription as unknown as { items?: { data?: Array<{ price?: { id?: string } }> } })?.items?.data?.[0]
      ?.price?.id;
  const existingPlan = databaseValueToPlan(user.subscription?.plan);
  const plan = planFromPriceId(priceId) ?? existingPlan ?? "monthly";

  await applyBillingState({
    userId: user.id,
    customerId,
    subscriptionId,
    plan,
    status: "ACTIVE",
    currentPeriodEnd: currentPeriodEndFromSubscription(stripeSubscription),
    lifetimeAccess: false,
    lastPaymentFailedAt: null,
    eventId
  });
}

async function applyInvoicePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
  const invoiceRecord = invoice as unknown as {
    subscription?: string | Stripe.Subscription | null;
    customer?: string | Stripe.Customer | null;
  };
  const customerId = stripeId(invoiceRecord.customer);
  const subscriptionId = stripeId(invoiceRecord.subscription);
  const user = await findUserForStripe(customerId, subscriptionId);

  if (!user) {
    logger.error("No user found for invoice.payment_failed", { customerId, subscriptionId });
    return;
  }

  if (wasProcessed(user.subscription, eventId)) {
    logger.info("Skipping already processed invoice.payment_failed", { eventId });
    return;
  }

  await applyBillingState({
    userId: user.id,
    customerId,
    subscriptionId,
    plan: databaseValueToPlan(user.subscription?.plan),
    status: "PAST_DUE",
    lifetimeAccess: false,
    lastPaymentFailedAt: new Date(),
    eventId
  });
}

async function applySubscriptionDeleted(subscription: Stripe.Subscription, eventId: string) {
  const customerId = stripeId(subscription.customer);
  const subscriptionId = subscription.id;
  const user = await findUserForStripe(customerId, subscriptionId);

  if (!user) {
    logger.error("No user found for customer.subscription.deleted", { customerId, subscriptionId });
    return;
  }

  if (wasProcessed(user.subscription, eventId)) {
    logger.info("Skipping already processed customer.subscription.deleted", { eventId });
    return;
  }

  const stillLifetime = Boolean(user.subscription?.lifetimeAccess);

  await applyBillingState({
    userId: user.id,
    customerId,
    subscriptionId,
    plan: databaseValueToPlan(user.subscription?.plan),
    status: stillLifetime ? "LIFETIME" : "CANCELED",
    currentPeriodEnd:
      dateFromStripeTimestamp((subscription as unknown as { ended_at?: number })?.ended_at) ??
      currentPeriodEndFromSubscription(subscription),
    lifetimeAccess: stillLifetime,
    eventId
  });
}

export async function processStripeWebhookEvent(event: Stripe.Event) {
  logger.info("Processing Stripe webhook", { eventId: event.id, type: event.type });

  switch (event.type) {
    case "checkout.session.completed":
      await applyCheckoutSession(event.data.object as Stripe.Checkout.Session, event.id);
      break;
    case "invoice.paid":
      await applyInvoicePaid(event.data.object as Stripe.Invoice, event.id);
      break;
    case "invoice.payment_failed":
      await applyInvoicePaymentFailed(event.data.object as Stripe.Invoice, event.id);
      break;
    case "customer.subscription.deleted":
      await applySubscriptionDeleted(event.data.object as Stripe.Subscription, event.id);
      break;
    default:
      logger.debug("Ignored Stripe webhook type", { type: event.type });
  }
}
