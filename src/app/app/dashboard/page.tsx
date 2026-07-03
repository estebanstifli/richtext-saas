import Link from "next/link";

// Dashboard principal del usuario logueado.
// Aqui se mezcla estado de billing + lista de documentos + acciones de entrada.

import { DocumentRow } from "@/components/dashboard/document-row";
import { NewDocumentForm } from "@/components/dashboard/new-document-form";
import { buttonVariants } from "@/components/ui/button";
import {
  getSubscriptionPlanLabel,
  getSubscriptionRenewalLabel,
  getSubscriptionState,
  getSubscriptionStatusLabel,
  hasPaidAccess
} from "@/lib/billing";
import { formatDocumentDate, getNextDocumentTitle } from "@/lib/documents";
import { requireUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { syncLatestCheckoutSessionForUser } from "@/lib/stripe-sync";
import { messages } from "@/messages/en";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Flujo base: requireUser -> reconciliar billing (si toca) -> cargar docs -> render UI.
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  let user = await requireUser();
  const params = await searchParams;
  const billingPortalError = params.billing === "portal-error";

  // Si el user esta free pero tiene customer Stripe, intentamos recuperar ultimo checkout completado.
  if (!hasPaidAccess(user.subscription) && user.stripeCustomerId) {
    try {
      const synced = await syncLatestCheckoutSessionForUser(user.id, user.stripeCustomerId);

      if (synced) {
        // Refresca user para pintar estado actualizado de subscription.
        user =
          (await prisma.user.findUnique({
            where: { id: user.id },
            include: { subscription: true }
          })) ?? user;
      }
    } catch (error) {
      logger.error("Dashboard billing reconciliation failed", error);
    }
  }

  // Lista docs del usuario, ordenados por ultima modificacion.
  const documents = await prisma.document.findMany({
    where: {
      userId: user.id
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
  const subscriptionState = getSubscriptionState(user.subscription);
  const canManageDocuments = hasPaidAccess(user.subscription);
  const suggestedDocumentTitle = getNextDocumentTitle(documents);

  // Tarjetas resumen para plan/status/renovacion.
  const billingSummary = [
    {
      label: messages.dashboard.planLabel,
      value: getSubscriptionPlanLabel(user.subscription)
    },
    {
      label: messages.dashboard.statusLabel,
      value: getSubscriptionStatusLabel(user.subscription)
    },
    {
      label: messages.dashboard.renewsLabel,
      value: getSubscriptionRenewalLabel(user.subscription)
    }
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-normal">{messages.dashboard.title}</h1>
          <p className="text-muted-foreground">{messages.dashboard.subtitle}</p>
        </div>
        <NewDocumentForm canCreate={canManageDocuments} suggestedTitle={suggestedDocumentTitle} />
      </div>

      <section className="mb-6">
        <h2 className="sr-only">{messages.dashboard.billingSummaryTitle}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {billingSummary.map((item) => (
            <div className="rounded-lg border border-border bg-background p-4 shadow-sm" key={item.label}>
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-lg font-semibold tracking-normal">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {billingPortalError ? (
        // Banner si Stripe Portal devolvio error al volver.
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {messages.dashboard.billingPortalError}
        </div>
      ) : null}

      {subscriptionState !== "active" ? (
        // CTA upgrade visible cuando no hay acceso de pago activo.
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{messages.dashboard.upgradeNotice}</p>
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/upgrade">
            {messages.dashboard.upgradeButton}
          </Link>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        {documents.length === 0 ? (
          // Estado vacio del dashboard.
          <div className="p-10 text-center">
            <h2 className="text-xl font-semibold tracking-normal">{messages.dashboard.emptyTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{messages.dashboard.emptyDescription}</p>
          </div>
        ) : (
          // Tabla/listado de documentos.
          <div className="divide-y divide-border">
            <div className="hidden grid-cols-[1fr_180px_120px] gap-4 bg-muted/60 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
              <span>{messages.dashboard.titleColumn}</span>
              <span>{messages.dashboard.modifiedColumn}</span>
              <span className="text-right">{messages.dashboard.actionsColumn}</span>
            </div>
            {documents.map((document) => (
              <DocumentRow
                canManage={canManageDocuments}
                document={{
                  id: document.id,
                  title: document.title,
                  updatedAtLabel: formatDocumentDate(document.updatedAt)
                }}
                key={document.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
