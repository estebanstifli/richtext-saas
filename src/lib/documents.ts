import { ValidationError } from "@/lib/errors";
import { messages } from "@/messages/en";

// Helpers puros de documentos/editor.
// Este fichero evita repetir logica de parseo, titulos y fechas en mil sitios.

// Contenido base del editor cuando un doc nace vacio.
export const DEFAULT_EDITOR_CONTENT = {
  type: "doc",
  content: [
    {
      type: "paragraph"
    }
  ]
};

// Convierte string JSON de DB a objeto para TipTap.
// Si viene roto, devolvemos un doc minimo para que no pete la UI.
export function parseEditorContent(content: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(content);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return DEFAULT_EDITOR_CONTENT;
  }

  return DEFAULT_EDITOR_CONTENT;
}

// Convierte contenido del editor a JSON string para guardar en DB.
export function serializeEditorContent(content: unknown) {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw new ValidationError(messages.errors.invalidInput);
  }

  return JSON.stringify(content);
}

// Normaliza titulo desde formularios (trim + fallback si viene vacio).
export function normalizeDocumentTitle(title: FormDataEntryValue | null, fallback: string = messages.dashboard.untitled) {
  const normalized = String(title || "").trim();
  return normalized || fallback;
}

// Sugiere "DocumentN" segun maximo N actual.
export function getNextDocumentTitle(documents: Array<{ title: string }>) {
  const nextNumber =
    documents.reduce((max, document) => {
      const match = /^Document(\d+)$/.exec(document.title.trim());
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0) + 1;

  return `Document${nextNumber}`;
}

// Formatea fecha para mostrar en dashboard/listados.
export function formatDocumentDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}
