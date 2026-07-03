"use client";

// Boton/form de crear documento en dashboard.
// Tiene 3 estados simples: bloqueado por plan, boton cerrado, formulario abierto.

import { Check, FilePlus2, LockKeyhole, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDocumentAction } from "@/lib/document-actions";
import { cn } from "@/lib/utils";
import { messages } from "@/messages/en";

type NewDocumentFormProps = {
  canCreate: boolean;
  suggestedTitle: string;
};

// Componente de alta de documento con UX compacta.
export function NewDocumentForm({ canCreate, suggestedTitle }: NewDocumentFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Si no puede crear por plan, mostramos CTA directo a upgrade.
  if (!canCreate) {
    return (
      <Link className={buttonVariants({ variant: "outline" })} href="/upgrade">
        <LockKeyhole aria-hidden="true" className="h-4 w-4" />
        {messages.dashboard.createRequiresUpgrade}
      </Link>
    );
  }

  // Estado inicial: solo boton "New document".
  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} type="button">
        <FilePlus2 aria-hidden="true" className="h-4 w-4" />
        {messages.dashboard.newDocument}
      </Button>
    );
  }

  // Estado abierto: input + acciones crear/cancelar.
  return (
    <form action={createDocumentAction} className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Input
        aria-label={messages.dashboard.newDocumentNameLabel}
        autoFocus
        className="h-10 sm:w-56"
        defaultValue={suggestedTitle}
        name="title"
      />
      <div className="flex gap-2">
        {/* Submit a server action de createDocumentAction. */}
        <Button className="flex-1 sm:flex-none" type="submit">
          <Check aria-hidden="true" className="h-4 w-4" />
          {messages.dashboard.create}
        </Button>
        {/* Cerrar formulario sin enviar nada. */}
        <Button
          aria-label={messages.dashboard.cancel}
          className={cn("flex-1 sm:flex-none")}
          onClick={() => setIsOpen(false)}
          type="button"
          variant="outline"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
