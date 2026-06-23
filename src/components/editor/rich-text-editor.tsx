"use client";

import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import type { JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Code2,
  Heading1,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Save,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Unlink2,
  X
} from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { messages } from "@/messages/en";

type SaveState = "saved" | "dirty" | "saving" | "error";

type RichTextEditorProps = {
  documentId: string;
  initialContent: JSONContent;
};

export function RichTextEditor({ documentId, initialContent }: RichTextEditorProps) {
  const lastSavedContentRef = useRef(JSON.stringify(initialContent));
  const [linkUrl, setLinkUrl] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
        HTMLAttributes: {
          class: "font-medium text-primary underline underline-offset-4"
        }
      })
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-neutral max-w-none"
      }
    },
    onUpdate({ editor: updatedEditor }) {
      const currentContent = JSON.stringify(updatedEditor.getJSON());
      setSaveState(currentContent === lastSavedContentRef.current ? "saved" : "dirty");
    }
  });

  async function saveDocument() {
    if (!editor) {
      return;
    }

    const currentContent = JSON.stringify(editor.getJSON());

    if (currentContent === lastSavedContentRef.current) {
      setSaveState("saved");
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

      lastSavedContentRef.current = currentContent;
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  const canSave = Boolean(editor && (saveState === "dirty" || saveState === "error"));

  function openLinkEditor() {
    if (!editor) {
      return;
    }

    const href = editor.getAttributes("link").href;
    setLinkUrl(typeof href === "string" ? href : "");
    setShowLinkEditor(true);
  }

  function applyLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editor) {
      return;
    }

    const normalizedUrl = normalizeLinkUrl(linkUrl);

    if (!normalizedUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setShowLinkEditor(false);
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: normalizedUrl }).run();
    setLinkUrl(normalizedUrl);
    setShowLinkEditor(false);
  }

  function removeLink() {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkUrl("");
    setShowLinkEditor(false);
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
            active={editor?.isActive("underline")}
            disabled={!editor}
            label={messages.editor.underline}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("highlight")}
            disabled={!editor}
            label={messages.editor.highlight}
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
          >
            <Highlighter aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("link")}
            disabled={!editor}
            label={messages.editor.link}
            onClick={openLinkEditor}
          >
            <Link2 aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive({ textAlign: "left" })}
            disabled={!editor}
            label={messages.editor.alignLeft}
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive({ textAlign: "center" })}
            disabled={!editor}
            label={messages.editor.alignCenter}
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive({ textAlign: "right" })}
            disabled={!editor}
            label={messages.editor.alignRight}
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight aria-hidden="true" className="h-4 w-4" />
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
        {showLinkEditor ? (
          <form className="flex w-full max-w-md items-center gap-2 lg:w-auto" onSubmit={applyLink}>
            <label className="sr-only" htmlFor="editor-link-url">
              {messages.editor.linkUrl}
            </label>
            <Input
              className="h-9 min-w-0"
              id="editor-link-url"
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="https://example.com"
              type="text"
              value={linkUrl}
            />
            <ToolbarButton disabled={!editor} label={messages.editor.applyLink} type="submit">
              <Check aria-hidden="true" className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton disabled={!editor} label={messages.editor.removeLink} onClick={removeLink}>
              <Unlink2 aria-hidden="true" className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              label={messages.dashboard.cancel}
              onClick={() => {
                setShowLinkEditor(false);
                setLinkUrl("");
              }}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </ToolbarButton>
          </form>
        ) : null}
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
          <Button disabled={!canSave || saveState === "saving"} onClick={saveDocument} type="button">
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

function normalizeLinkUrl(rawUrl: string) {
  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) {
    return "";
  }

  if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

function ToolbarButton({
  active,
  children,
  disabled,
  label,
  onClick,
  type = "button"
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
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
      type={type}
    >
      {children}
    </button>
  );
}
