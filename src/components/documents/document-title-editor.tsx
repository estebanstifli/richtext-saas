"use client";

import { Check, LockKeyhole, Pencil, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameDocumentAction } from "@/lib/document-actions";
import { cn } from "@/lib/utils";
import { messages } from "@/messages/en";

type DocumentTitleEditorProps = {
  canEdit: boolean;
  documentId: string;
  title: string;
};

export function DocumentTitleEditor({ canEdit, documentId, title }: DocumentTitleEditorProps) {
  const [currentTitle, setCurrentTitle] = useState(title);
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    setCurrentTitle(title);
  }, [title]);

  function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const nextTitle = String(formData.get("title") || "").trim();

    if (nextTitle) {
      setCurrentTitle(nextTitle);
    }

    setIsRenaming(false);
  }

  if (canEdit && isRenaming) {
    return (
      <form action={renameDocumentAction} className="mt-3 flex max-w-2xl gap-2" onSubmit={handleRenameSubmit}>
        <input name="documentId" type="hidden" value={documentId} />
        <Input
          aria-label={messages.dashboard.renameLabel}
          autoFocus
          className="h-11 text-lg font-semibold"
          defaultValue={currentTitle}
          name="title"
        />
        <button
          aria-label={messages.dashboard.saveTitle}
          className={cn(buttonVariants({ size: "icon" }), "h-11 w-11 shrink-0")}
          type="submit"
        >
          <Check aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          aria-label={messages.dashboard.cancel}
          className={cn(buttonVariants({ size: "icon", variant: "outline" }), "h-11 w-11 shrink-0")}
          onClick={() => setIsRenaming(false)}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </form>
    );
  }

  return (
    <div className="group/title mt-3 flex min-w-0 items-center gap-3">
      <h1 className="min-w-0 truncate text-3xl font-bold tracking-normal">{currentTitle}</h1>
      {canEdit ? (
        <button
          aria-label={messages.dashboard.renameDocument}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-background hover:text-foreground group-hover/title:opacity-100 focus:opacity-100"
          onClick={() => setIsRenaming(true)}
          title={messages.dashboard.renameDocument}
          type="button"
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" />
          {messages.editor.readOnlyBadge}
        </span>
      )}
    </div>
  );
}