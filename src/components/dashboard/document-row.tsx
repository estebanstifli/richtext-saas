"use client";

import { Check, Eye, FilePenLine, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteDocumentAction, renameDocumentAction } from "@/lib/document-actions";
import { cn } from "@/lib/utils";
import { messages } from "@/messages/en";

// Fila individual del listado de documentos.
// Soporta modo lectura y modo gestion (rename/delete).
type DocumentRowProps = {
  canManage: boolean;
  document: {
    id: string;
    title: string;
    updatedAtLabel: string;
  };
};

export function DocumentRow({ canManage, document }: DocumentRowProps) {
  const [isRenaming, setIsRenaming] = useState(false);

  return (
    <div className="grid gap-4 px-4 py-4 md:grid-cols-[1fr_180px_120px] md:items-center" key={document.id}>
      <div className="min-w-0">
        {isRenaming ? (
          // Form server action para renombrar in-place.
          <form action={renameDocumentAction} className="flex gap-2" onSubmit={() => setIsRenaming(false)}>
            <input name="documentId" type="hidden" value={document.id} />
            <Input
              aria-label={messages.dashboard.renameLabel}
              autoFocus
              className="h-9"
              defaultValue={document.title}
              name="title"
            />
            <button
              aria-label={messages.dashboard.saveTitle}
              className={cn(buttonVariants({ size: "icon" }), "h-9 w-9 shrink-0")}
              type="submit"
            >
              <Check aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              aria-label={messages.dashboard.cancel}
              className={cn(buttonVariants({ size: "icon", variant: "outline" }), "h-9 w-9 shrink-0")}
              onClick={() => setIsRenaming(false)}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        ) : (
          // Vista normal: titulo + boton editar nombre al hover.
          <div className="group/title flex min-w-0 items-center gap-2">
            <Link
              className="block truncate font-medium text-foreground hover:text-primary"
              href={`/documents/${document.id}`}
              title={document.title}
            >
              {document.title}
            </Link>
            {canManage ? (
              <button
                aria-label={messages.dashboard.renameDocument}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover/title:opacity-100 focus:opacity-100"
                onClick={() => setIsRenaming(true)}
                title={messages.dashboard.renameDocument}
                type="button"
              >
                <Pencil aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        )}
        <p className="mt-1 text-sm text-muted-foreground md:hidden">{document.updatedAtLabel}</p>
      </div>
      <span className="hidden text-sm text-muted-foreground md:block">{document.updatedAtLabel}</span>
      <div className="flex items-center gap-2 md:justify-end">
        <Link
          aria-label={canManage ? messages.dashboard.editDocument : messages.dashboard.open}
          className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-9 w-9")}
          href={`/documents/${document.id}`}
          title={canManage ? messages.dashboard.editDocument : messages.dashboard.open}
        >
          {canManage ? (
            <FilePenLine aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Eye aria-hidden="true" className="h-4 w-4" />
          )}
        </Link>
        {canManage ? (
          // Delete con confirm browser nativo para evitar borrados accidentales.
          <form
            action={deleteDocumentAction}
            onSubmit={(event) => {
              if (!window.confirm(messages.dashboard.confirmDelete)) {
                event.preventDefault();
              }
            }}
          >
            <input name="documentId" type="hidden" value={document.id} />
            <button
              aria-label={messages.dashboard.deleteDocument}
              className={cn(buttonVariants({ variant: "destructive", size: "icon" }), "h-9 w-9")}
              title={messages.dashboard.deleteDocument}
              type="submit"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
