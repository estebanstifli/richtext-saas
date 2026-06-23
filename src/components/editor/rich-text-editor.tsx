"use client";

import type { JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading1,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Save,
  Strikethrough,
  Undo2
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { messages } from "@/messages/en";

type SaveState = "saved" | "dirty" | "saving" | "error";

type RichTextEditorProps = {
  documentId: string;
  initialContent: JSONContent;
};

export function RichTextEditor({ documentId, initialContent }: RichTextEditorProps) {
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-neutral max-w-none"
      }
    },
    onUpdate() {
      setSaveState("dirty");
    }
  });

  async function saveDocument() {
    if (!editor) {
      return;
    }

    setSaveState("saving");

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: editor.getJSON()
        })
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  const statusText =
    saveState === "saving"
      ? messages.editor.saving
      : saveState === "dirty"
        ? messages.editor.dirty
        : saveState === "error"
          ? messages.editor.saveFailed
          : messages.editor.saved;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border bg-muted/50 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1">
          <ToolbarButton
            active={editor?.isActive("paragraph")}
            disabled={!editor}
            label={messages.editor.paragraph}
            onClick={() => editor?.chain().focus().setParagraph().run()}
          >
            <Pilcrow aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("heading", { level: 1 })}
            disabled={!editor}
            label={messages.editor.heading}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("bold")}
            disabled={!editor}
            label={messages.editor.bold}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("italic")}
            disabled={!editor}
            label={messages.editor.italic}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("strike")}
            disabled={!editor}
            label={messages.editor.strike}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <Strikethrough aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("bulletList")}
            disabled={!editor}
            label={messages.editor.bulletList}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("orderedList")}
            disabled={!editor}
            label={messages.editor.orderedList}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("blockquote")}
            disabled={!editor}
            label={messages.editor.quote}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("codeBlock")}
            disabled={!editor}
            label={messages.editor.codeBlock}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editor}
            label={messages.editor.undo}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editor}
            label={messages.editor.redo}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <span
            className={cn(
              "text-sm",
              saveState === "error"
                ? "text-destructive"
                : saveState === "dirty"
                  ? "text-amber-700"
                  : "text-muted-foreground"
            )}
          >
            {statusText}
          </span>
          <Button disabled={!editor || saveState === "saving"} onClick={saveDocument} type="button">
            <Save aria-hidden="true" className="h-4 w-4" />
            {saveState === "saving" ? messages.editor.saving : messages.editor.save}
          </Button>
        </div>
      </div>
      <div className="p-5 sm:p-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  children,
  disabled,
  label,
  onClick
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        active ? "border-border bg-background text-foreground shadow-sm" : ""
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}
