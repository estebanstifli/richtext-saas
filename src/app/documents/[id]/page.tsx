import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentTitleEditor } from "@/components/documents/document-title-editor";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { AppHeader } from "@/components/layout/app-header";
import { buttonVariants } from "@/components/ui/button";
import { hasPaidAccess } from "@/lib/billing";
import { parseEditorContent } from "@/lib/documents";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messages } from "@/messages/en";

type DocumentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DocumentPage({ params }: DocumentPageProps) {
  const user = await requireUser();
  // Non-subscribers keep read access to their own documents; editing is gated below and on every write API.
  const canEdit = hasPaidAccess(user.subscription);

  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: user.id
    }
  });

  if (!document) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-muted/35">
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link className={buttonVariants({ variant: "ghost", size: "sm" })} href="/app/dashboard">
              {messages.editor.backToDashboard}
            </Link>
            <DocumentTitleEditor canEdit={canEdit} documentId={document.id} title={document.title} />
          </div>
        </div>
        {!canEdit ? (
          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold">{messages.editor.readOnlyTitle}</p>
              <p className="text-sm text-muted-foreground">{messages.editor.readOnlyNotice}</p>
            </div>
            <Link className={buttonVariants({ size: "sm" })} href="/upgrade">
              {messages.editor.upgradeToEdit}
            </Link>
          </div>
        ) : null}
        <RichTextEditor documentId={document.id} editable={canEdit} initialContent={parseEditorContent(document.content)} />
      </main>
    </div>
  );
}
