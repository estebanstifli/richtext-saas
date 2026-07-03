import { redirect } from "next/navigation";

// Pagina de upgrade para usuarios autenticados.
// Desde aqui se lanza checkout y se muestra estado de error si Stripe falla.

import { AppHeader } from "@/components/layout/app-header";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { Badge } from "@/components/ui/badge";
import { hasPaidAccess } from "@/lib/billing";
import { requireUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { syncLatestCheckoutSessionForUser } from "@/lib/stripe-sync";
import { messages } from "@/messages/en";

type UpgradePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Flujo: requireUser -> reconciliar estado Stripe si hace falta -> render pricing en modo checkout.
export default async function UpgradePage({ searchParams }: UpgradePageProps) {
  let user = await requireUser();
  const params = await searchParams;
  const selectedPlan = typeof params.plan === "string" ? params.plan : undefined;
  const error = params.error === "checkout";

  // Si aparece como free pero tiene customer Stripe, intentamos rescatar el ultimo checkout completado.
  if (!hasPaidAccess(user.subscription) && user.stripeCustomerId) {
    try {
      const synced = await syncLatestCheckoutSessionForUser(user.id, user.stripeCustomerId);

      if (synced) {
        user =
          (await prisma.user.findUnique({
            where: { id: user.id },
            include: { subscription: true }
          })) ?? user;
      }
    } catch (syncError) {
      logger.error("Upgrade billing reconciliation failed", syncError);
    }
  }

  // Si ya tiene acceso activo y no viene plan concreto, no tiene sentido quedarse en upgrade.
  if (hasPaidAccess(user.subscription) && !selectedPlan) {
    redirect("/app/dashboard");
  }

  return (
    <div className="min-h-screen bg-muted/35">
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="muted">{messages.upgrade.currentPlan}</Badge>
            <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">{messages.upgrade.title}</h1>
            <p className="text-muted-foreground">{messages.upgrade.subtitle}</p>
          </div>
        </div>
        {error ? (
          // Banner simple para avisar si /api/billing/checkout devolvio error.
          <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {messages.upgrade.checkoutError}
          </div>
        ) : null}
        <PricingCards mode="checkout" selectedPlan={selectedPlan} />
      </main>
    </div>
  );
}
