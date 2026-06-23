import Link from "next/link";

import { DocumentRow } from "@/components/dashboard/document-row";
import { NewDocumentForm } from "@/components/dashboard/new-document-form";
import { buttonVariants } from "@/components/ui/button";
import { getSubscriptionState, hasPaidAccess } from "@/lib/billing";
import { formatDocumentDate, getNextDocumentTitle } from "@/lib/documents";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messages } from "@/messages/en";

export default async function DashboardPage() {
  const user = await requireUser();
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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-normal">{messages.dashboard.title}</h1>
          <p className="text-muted-foreground">{messages.dashboard.subtitle}</p>
        </div>
        <NewDocumentForm canCreate={canManageDocuments} suggestedTitle={suggestedDocumentTitle} />
      </div>

      {subscriptionState !== "active" ? (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{messages.dashboard.upgradeNotice}</p>
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/upgrade">
            {messages.dashboard.upgradeButton}
          </Link>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        {documents.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="text-xl font-semibold tracking-normal">{messages.dashboard.emptyTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{messages.dashboard.emptyDescription}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="hidden grid-cols-[1fr_180px_170px] gap-4 bg-muted/60 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
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
