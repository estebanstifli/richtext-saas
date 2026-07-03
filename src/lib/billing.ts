import type { Subscription } from "@prisma/client";

// Reglas de negocio de billing en un solo sitio.
// Si hay dudas de "tiene acceso o no", la verdad vive aqui.

import { ValidationError } from "@/lib/errors";
import { messages } from "@/messages/en";

export type BillingPlan = "monthly" | "annual" | "lifetime";

// Orden de planes para render en pricing/cards.
export const planKeys: BillingPlan[] = ["monthly", "annual", "lifetime"];

// Normaliza/valida plan desde query/form/webhook metadata.
export function normalizePlan(plan: unknown): BillingPlan {
  if (plan === "monthly" || plan === "annual" || plan === "lifetime") {
    return plan;
  }

  throw new ValidationError(messages.errors.invalidPlan);
}

// Valor que guardamos en DB (convencion en mayusculas).
export function planToDatabaseValue(plan: BillingPlan) {
  return plan.toUpperCase();
}

// Valor que leemos de DB -> version tipada para app.
export function databaseValueToPlan(plan: string | null | undefined): BillingPlan | null {
  const normalized = plan?.toLowerCase();

  if (normalized === "monthly" || normalized === "annual" || normalized === "lifetime") {
    return normalized;
  }

  return null;
}

// Regla principal de acceso de pago.
// Lifetime manda, y para recurring pedimos ACTIVE + periodo vigente.
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

// Estado simplificado para UI (active/past_due/free).
export function getSubscriptionState(subscription: Subscription | null | undefined) {
  if (hasPaidAccess(subscription)) {
    return "active";
  }

  if (subscription?.status === "PAST_DUE") {
    return "past_due";
  }

  return "free";
}

// Etiqueta de plan para mostrar en dashboard/header.
export function getSubscriptionPlanLabel(subscription: Subscription | null | undefined) {
  const plan = databaseValueToPlan(subscription?.plan);

  if (subscription?.lifetimeAccess || subscription?.status === "LIFETIME" || plan === "lifetime") {
    return messages.dashboard.planLifetime;
  }

  if (plan === "annual") {
    return messages.dashboard.planAnnual;
  }

  if (plan === "monthly") {
    return messages.dashboard.planMonthly;
  }

  return messages.dashboard.planFree;
}

// Etiqueta de status para UI.
export function getSubscriptionStatusLabel(subscription: Subscription | null | undefined) {
  const state = getSubscriptionState(subscription);

  if (state === "active") {
    return messages.dashboard.statusActive;
  }

  if (state === "past_due") {
    return messages.dashboard.statusPastDue;
  }

  if (subscription?.status === "CANCELED") {
    return messages.dashboard.statusCanceled;
  }

  return messages.dashboard.statusFree;
}

// Etiqueta de renovacion (fecha, lifetime o none).
export function getSubscriptionRenewalLabel(subscription: Subscription | null | undefined) {
  if (subscription?.lifetimeAccess || subscription?.status === "LIFETIME") {
    return messages.dashboard.renewsLifetime;
  }

  if (!subscription?.currentPeriodEnd) {
    return messages.dashboard.renewsNone;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(subscription.currentPeriodEnd);
}
