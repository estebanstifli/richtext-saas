import fs from "node:fs";
import Stripe from "stripe";

loadDotEnv();

const email = process.argv[2]?.trim().toLowerCase();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const planByPriceId = buildPlanMap();

if (!email) {
  fail("Usage: npm run stripe:status -- user@example.com");
}

if (!stripeSecretKey || stripeSecretKey.includes("...")) {
  fail("STRIPE_SECRET_KEY is required in the environment or .env file.");
}

const stripe = new Stripe(stripeSecretKey);
const customers = await findCustomersByEmail(email);

if (customers.length === 0) {
  console.log(JSON.stringify({ email, found: false, message: "No Stripe customer found for email." }, null, 2));
  process.exit(0);
}

const reports = [];

for (const customer of customers) {
  const [subscriptions, checkoutSessions] = await Promise.all([
    stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
      expand: ["data.items.data.price"]
    }),
    stripe.checkout.sessions.list({
      customer: customer.id,
      limit: 10,
      expand: ["data.subscription"]
    })
  ]);

  const activeSubscriptions = subscriptions.data.filter((subscription) => {
    return ["active", "trialing"].includes(subscription.status);
  });
  const completedCheckoutSessions = checkoutSessions.data.filter((session) => {
    return session.status === "complete";
  });
  const subscriptionReports = activeSubscriptions.map((subscription) => buildSubscriptionReport(subscription));
  const checkoutSessionReports = await Promise.all(
    completedCheckoutSessions.map((session) => buildCheckoutSessionReport(session))
  );
  const hasActiveKnownSubscription = subscriptionReports.some((subscription) => {
    return subscription.matchesConfiguredPlan || !hasConfiguredPrices();
  });
  const hasLifetimeCheckout = checkoutSessionReports.some((session) => {
    return (
      session.mode === "payment" &&
      session.paymentStatus === "paid" &&
      (session.matchedPlans.includes("lifetime") || session.planMetadata === "lifetime")
    );
  });

  reports.push({
    customerId: customer.id,
    email: customer.email,
    paidAccessLikely: hasActiveKnownSubscription || hasLifetimeCheckout,
    activeSubscriptions: subscriptionReports,
    completedCheckoutSessions: checkoutSessionReports
  });
}

console.log(JSON.stringify({ email, found: true, reports }, null, 2));

async function findCustomersByEmail(customerEmail) {
  try {
    const result = await stripe.customers.search({
      query: `email:'${escapeStripeSearchValue(customerEmail)}'`,
      limit: 10
    });

    return result.data;
  } catch {
    const result = await stripe.customers.list({
      email: customerEmail,
      limit: 10
    });

    return result.data;
  }
}

function toIso(timestamp) {
  return typeof timestamp === "number" ? new Date(timestamp * 1000).toISOString() : null;
}

function buildSubscriptionReport(subscription) {
  const priceIds = subscription.items.data.map((item) => item.price?.id).filter(Boolean);
  const matchedPlans = unique(priceIds.map((priceId) => planByPriceId.get(priceId)).filter(Boolean));

  return {
    id: subscription.id,
    status: subscription.status,
    currentPeriodEnd: toIso(subscription.current_period_end),
    priceIds,
    matchedPlans,
    matchesConfiguredPlan: matchedPlans.length > 0,
    planMetadata: subscription.metadata?.plan || null
  };
}

async function buildCheckoutSessionReport(session) {
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
  const priceIds = lineItems.data.map((item) => item.price?.id).filter(Boolean);
  const matchedPlans = unique([
    ...priceIds.map((priceId) => planByPriceId.get(priceId)).filter(Boolean),
    session.metadata?.plan
  ].filter(Boolean));

  return {
    id: session.id,
    mode: session.mode,
    status: session.status,
    paymentStatus: session.payment_status,
    planMetadata: session.metadata?.plan || null,
    subscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null,
    created: toIso(session.created),
    priceIds,
    matchedPlans,
    matchesConfiguredPlan: matchedPlans.length > 0
  };
}

function buildPlanMap() {
  return new Map(
    [
      [process.env.STRIPE_MONTHLY_PRICE_ID, "monthly"],
      [process.env.STRIPE_ANNUAL_PRICE_ID, "annual"],
      [process.env.STRIPE_LIFETIME_PRICE_ID, "lifetime"]
    ].filter(([priceId]) => priceId && !priceId.includes("..."))
  );
}

function hasConfiguredPrices() {
  return planByPriceId.size > 0;
}

function unique(values) {
  return Array.from(new Set(values));
}

function escapeStripeSearchValue(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

function loadDotEnv() {
  if (!fs.existsSync(".env")) {
    return;
  }

  const lines = fs.readFileSync(".env", "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex < 1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex);
    let value = trimmed.slice(separatorIndex + 1);

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
