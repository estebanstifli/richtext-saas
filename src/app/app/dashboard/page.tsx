import { FilePlus2 } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDocumentAction, deleteDocumentAction, renameDocumentAction } from "@/lib/document-actions";
import { formatDocumentDate } from "@/lib/documents";
import { getSubscriptionState } from "@/lib/billing";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-normal">{messages.dashboard.title}</h1>
          <p className="text-muted-foreground">{messages.dashboard.subtitle}</p>
        </div>
        <form action={createDocumentAction}>
          <Button type="submit">
            <FilePlus2 aria-hidden="true" className="h-4 w-4" />
            {messages.dashboard.newDocument}
          </Button>
        </form>
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
            <div className="hidden grid-cols-[1fr_180px_290px] gap-4 bg-muted/60 px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
              <span>{messages.dashboard.titleColumn}</span>
              <span>{messages.dashboard.modifiedColumn}</span>
              <span>{messages.dashboard.actionsColumn}</span>
            </div>
            {documents.map((document) => (
              <div
                className="grid gap-4 px-4 py-4 md:grid-cols-[1fr_180px_290px] md:items-center"
                key={document.id}
              >
                <div className="min-w-0">
                  <Link
                    className="block truncate font-medium text-foreground hover:text-primary"
                    href={`/documents/${document.id}`}
                  >
                    {document.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground md:hidden">
                    {formatDocumentDate(document.updatedAt)}
                  </p>
                </div>
                <span className="hidden text-sm text-muted-foreground md:block">
                  {formatDocumentDate(document.updatedAt)}
                </span>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <form action={renameDocumentAction} className="flex gap-2">
                    <input name="documentId" type="hidden" value={document.id} />
                    <Input
                      aria-label={messages.dashboard.renameLabel}
                      className="h-9"
                      defaultValue={document.title}
                      name="title"
                    />
                    <Button size="sm" type="submit" variant="outline">
                      {messages.dashboard.rename}
                    </Button>
                  </form>
                  <form action={deleteDocumentAction}>
                    <input name="documentId" type="hidden" value={document.id} />
                    <Button
                      className={cn("w-full sm:w-auto")}
                      size="sm"
                      type="submit"
                      variant="destructive"
                    >
                      {messages.dashboard.delete}
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
