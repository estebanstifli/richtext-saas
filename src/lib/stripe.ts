import "server-only";

import Stripe from "stripe";

import { type BillingPlan, normalizePlan } from "@/lib/billing";
import { BillingError } from "@/lib/errors";
import { messages } from "@/messages/en";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new BillingError(messages.errors.stripeNotConfigured, 500);
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      appInfo: {
        name: "Draftly MVP"
      }
    });
  }

  return stripeClient;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getCheckoutPlan(rawPlan: unknown): {
  plan: BillingPlan;
  mode: "payment" | "subscription";
  priceId: string;
} {
  const plan = normalizePlan(rawPlan);
  const priceId =
    plan === "monthly"
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : plan === "annual"
        ? process.env.STRIPE_ANNUAL_PRICE_ID
        : process.env.STRIPE_LIFETIME_PRICE_ID;

  if (!priceId) {
    throw new BillingError(messages.errors.planNotConfigured, 500);
  }

  return {
    plan,
    mode: plan === "lifetime" ? "payment" : "subscription",
    priceId
  };
}

export function planFromPriceId(priceId: string | null | undefined): BillingPlan | null {
  if (!priceId) {
    return null;
  }

  if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID) {
    return "monthly";
  }

  if (priceId === process.env.STRIPE_ANNUAL_PRICE_ID) {
    return "annual";
  }

  if (priceId === process.env.STRIPE_LIFETIME_PRICE_ID) {
    return "lifetime";
  }

  return null;
}
