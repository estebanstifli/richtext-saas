import type { Subscription } from "@prisma/client";

import { ValidationError } from "@/lib/errors";
import { messages } from "@/messages/en";

export type BillingPlan = "monthly" | "annual" | "lifetime";

export const planKeys: BillingPlan[] = ["monthly", "annual", "lifetime"];

export function normalizePlan(plan: unknown): BillingPlan {
  if (plan === "monthly" || plan === "annual" || plan === "lifetime") {
    return plan;
  }

  throw new ValidationError(messages.errors.invalidPlan);
}

export function planToDatabaseValue(plan: BillingPlan) {
  return plan.toUpperCase();
}

export function databaseValueToPlan(plan: string | null | undefined): BillingPlan | null {
  const normalized = plan?.toLowerCase();

  if (normalized === "monthly" || normalized === "annual" || normalized === "lifetime") {
    return normalized;
  }

  return null;
}

export function hasPaidAccess(subscription: Subscription | null | undefined) {
  if (!subscription) {
    return false;
  }

  if (subscription.lifetimeAccess || subscription.status === "LIFETIME") {
    return true;
  }

  if (subscription.status !== "ACTIVE") {
    return false;
  }

  if (!subscription.currentPeriodEnd) {
    return true;
  }

  return subscription.currentPeriodEnd > new Date();
}

export function getSubscriptionState(subscription: Subscription | null | undefined) {
  if (hasPaidAccess(subscription)) {
    return "active";
  }

  if (subscription?.status === "PAST_DUE") {
    return "past_due";
  }

  return "free";
}
