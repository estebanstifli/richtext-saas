import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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

  if (!hasPaidAccess(user.subscription)) {
    redirect("/upgrade");
  }

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
            <h1 className="mt-3 truncate text-3xl font-bold tracking-normal">{document.title}</h1>
          </div>
        </div>
        <RichTextEditor documentId={document.id} initialContent={parseEditorContent(document.content)} />
      </main>
    </div>
  );
}
