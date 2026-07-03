import Link from "next/link";

// Pagina de vuelta desde Stripe Checkout.
// Hace fallback de reconciliacion por session_id por si el webhook va tarde.

import { AppHeader } from "@/components/layout/app-header";
import { buttonVariants } from "@/components/ui/button";
import { hasPaidAccess } from "@/lib/billing";
import { requireUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { syncCheckoutSession } from "@/lib/stripe-sync";
import { messages } from "@/messages/en";

// Forzamos dinamico porque depende de session/cookies y query params en runtime.
export const dynamic = "force-dynamic";

type BillingSuccessPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Flujo: requireUser -> syncCheckoutSession(session_id) -> refrescar estado local -> pintar success/pending.
export default async function BillingSuccessPage({ searchParams }: BillingSuccessPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : null;

  // Fallback server-side: valida ownership y sincroniza sin esperar al webhook.
  if (sessionId) {
    try {
      await syncCheckoutSession(sessionId, user.id);
    } catch (error) {
      logger.error("Checkout Session validation from success page failed", error);
    }
  }

  // Releemos usuario para reflejar estado actualizado tras sync/webhook.
  const refreshedUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { subscription: true }
  });
  const accessActive = hasPaidAccess(refreshedUser?.subscription);

  // Si aun no esta activo, mostramos pending (suele ser retraso de webhook/procesado).
  const title = accessActive ? messages.billing.successTitle : messages.billing.pendingTitle;
  const subtitle = accessActive ? messages.billing.successSubtitle : messages.billing.pendingSubtitle;

  return (
    <div className="min-h-screen bg-muted/35">
      <AppHeader user={refreshedUser ?? user} />
      <main className="mx-auto flex w-full max-w-2xl px-4 py-16 sm:px-6">
        <div className="w-full rounded-lg border border-border bg-background p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-normal">{title}</h1>
          <p className="mt-3 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">
            <Link className={buttonVariants()} href="/app/dashboard">
              {messages.billing.dashboardButton}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
