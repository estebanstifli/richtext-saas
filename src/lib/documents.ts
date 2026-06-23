import { ValidationError } from "@/lib/errors";
import { messages } from "@/messages/en";

export const DEFAULT_EDITOR_CONTENT = {
  type: "doc",
  content: [
    {
      type: "paragraph"
    }
  ]
};

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

export function serializeEditorContent(content: unknown) {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw new ValidationError(messages.errors.invalidInput);
  }

  return JSON.stringify(content);
}

export function normalizeDocumentTitle(title: FormDataEntryValue | null, fallback: string = messages.dashboard.untitled) {
  const normalized = String(title || "").trim();
  return normalized || fallback;
}

export function getNextDocumentTitle(documents: Array<{ title: string }>) {
  const nextNumber =
    documents.reduce((max, document) => {
      const match = /^Document(\d+)$/.exec(document.title.trim());
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0) + 1;

  return `Document${nextNumber}`;
}

export function formatDocumentDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}
