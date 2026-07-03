"use client";

// Editor rico principal (TipTap) de la app.
// Aqui vive casi toda la UX: toolbar, autosave, links, colores e imagenes.

import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import ImageExtension from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import type { Editor, JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Brush,
  Check,
  Code2,
  Heading1,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  Minimize2,
  PanelLeft,
  PanelRight,
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
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { messages } from "@/messages/en";

type SaveState = "saved" | "dirty" | "saving" | "error";
type ImageUploadState = "idle" | "uploading" | "error";
type EditorStats = {
  characters: number;
  words: number;
};

type RichTextEditorProps = {
  documentId: string;
  editable?: boolean;
  initialContent: JSONContent;
};

// Presets de ancho para imagenes del editor.
const imageWidthOptions = [
  { label: "Small image", value: "35%" },
  { label: "Medium image", value: "55%" },
  { label: "Large image", value: "75%" },
  { label: "Full width image", value: "100%" }
] as const;

const textColorOptions = [
  { label: "Slate text", value: "#0f172a" },
  { label: "Red text", value: "#dc2626" },
  { label: "Amber text", value: "#d97706" },
  { label: "Emerald text", value: "#059669" },
  { label: "Blue text", value: "#2563eb" },
  { label: "Violet text", value: "#7c3aed" }
] as const;

const highlightColorOptions = [
  { label: "Yellow highlight", value: "#fef08a" },
  { label: "Green highlight", value: "#bbf7d0" },
  { label: "Blue highlight", value: "#bfdbfe" },
  { label: "Pink highlight", value: "#fbcfe8" }
] as const;

const RichImageExtension = ImageExtension.extend({
  // Extendemos Image para guardar align/width como atributos controlados.
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({
          "data-align": sanitizeImageAlign(attributes.align)
        })
      },
      width: {
        default: "100%",
        parseHTML: (element) => element.getAttribute("data-width") || element.style.width || "100%",
        renderHTML: (attributes) => ({
          "data-width": sanitizeImageWidth(attributes.width),
          style: getImageStyle(attributes.width, attributes.align)
        })
      }
    };
  }
});

export function RichTextEditor({ documentId, editable = true, initialContent }: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const lastSavedContentRef = useRef(JSON.stringify(initialContent));
  const savingRef = useRef(false);
  const [editorStats, setEditorStats] = useState<EditorStats>({ characters: 0, words: 0 });
  const [imageUploadState, setImageUploadState] = useState<ImageUploadState>("idle");
  const [linkUrl, setLinkUrl] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [showLinkEditor, setShowLinkEditor] = useState(false);

  // Instancia del editor con extensiones y callbacks de estado.
  const editor = useEditor({
    editable,
    extensions: [
      StarterKit,
      CharacterCount,
      TextStyle,
      Color,
      Underline,
      Highlight.configure({
        multicolor: true
      }),
      RichImageExtension.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "max-h-[520px] rounded-md border border-border object-contain"
        }
      }),
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
      setEditorStats(getEditorStats(updatedEditor));
      setSaveState(currentContent === lastSavedContentRef.current ? "saved" : "dirty");
    }
  });

  const saveDocument = useCallback(async () => {
    if (!editor) {
      return;
    }

    // Solo guardamos si hay cambios reales contra lo ultimo persistido.
    const currentContent = JSON.stringify(editor.getJSON());

    if (currentContent === lastSavedContentRef.current) {
      setSaveState("saved");
      return;
    }

    if (savingRef.current) {
      return;
    }

    savingRef.current = true;
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
      setSaveState(JSON.stringify(editor.getJSON()) === currentContent ? "saved" : "dirty");
    } catch {
      setSaveState("error");
    } finally {
      savingRef.current = false;
    }
  }, [documentId, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    setEditorStats(getEditorStats(editor));
  }, [editor]);

  useEffect(() => {
    if (!editor || saveState !== "dirty") {
      return;
    }

    // Autosave con debounce de 2s para no spamear la API.
    const timeout = window.setTimeout(() => {
      void saveDocument();
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [editor, saveDocument, saveState]);

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

  function setTextColor(color: string) {
    editor?.chain().focus().setColor(color).run();
  }

  function clearTextColor() {
    editor?.chain().focus().unsetColor().run();
  }

  function setHighlightColor(color: string) {
    editor?.chain().focus().toggleHighlight({ color }).run();
  }

  function clearHighlightColor() {
    editor?.chain().focus().unsetHighlight().run();
  }

  function updateSelectedImage(attributes: { align?: "left" | "center" | "right"; width?: string }) {
    editor?.chain().focus().updateAttributes("image", attributes).run();
  }

  async function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!editor || !file) {
      return;
    }

    const formData = new FormData();
    formData.set("image", file);
    setImageUploadState("uploading");

    try {
      // Subida al endpoint del documento; luego insertamos la URL en TipTap.
      const response = await fetch(`/api/documents/${documentId}/assets`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const body = (await response.json()) as {
        asset?: {
          alt?: string;
          url?: string;
        };
      };

      if (!body.asset?.url) {
        throw new Error("Image upload response is invalid");
      }

      editor.chain().focus().setImage({ alt: body.asset.alt || "", src: body.asset.url }).run();
      setImageUploadState("idle");
    } catch {
      setImageUploadState("error");
    } finally {
      event.target.value = "";
    }
  }

  const statusText =
    saveState === "saving"
      ? messages.editor.saving
      : saveState === "dirty"
        ? messages.editor.autosaving
        : saveState === "error"
          ? messages.editor.saveFailed
          : messages.editor.saved;
  const selectedImageAttributes = editor?.isActive("image") ? editor.getAttributes("image") : null;

  // Read-only mode renders just the content with no toolbar or save controls.
  // The PATCH and asset upload APIs still enforce paid access server-side, so this is a UI affordance, not the security boundary.
  if (!editable) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        <div className="p-5 sm:p-8">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      {/* Toolbar superior: formato, color, links, imagen y acciones de guardado. */}
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
            onClick={() => setHighlightColor(highlightColorOptions[0].value)}
          >
            <Highlighter aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          {textColorOptions.map((colorOption) => (
            <ColorSwatchButton
              active={editor?.isActive("textStyle", { color: colorOption.value })}
              color={colorOption.value}
              disabled={!editor}
              key={colorOption.value}
              label={colorOption.label}
              onClick={() => setTextColor(colorOption.value)}
            />
          ))}
          <ToolbarButton disabled={!editor} label={messages.editor.clearTextColor} onClick={clearTextColor}>
            <Brush aria-hidden="true" className="h-4 w-4" />
          </ToolbarButton>
          {highlightColorOptions.map((colorOption) => (
            <ColorSwatchButton
              active={editor?.isActive("highlight", { color: colorOption.value })}
              color={colorOption.value}
              disabled={!editor}
              key={colorOption.value}
              label={colorOption.label}
              onClick={() => setHighlightColor(colorOption.value)}
              variant="highlight"
            />
          ))}
          <ToolbarButton disabled={!editor} label={messages.editor.clearHighlight} onClick={clearHighlightColor}>
            <X aria-hidden="true" className="h-4 w-4" />
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
            disabled={!editor || imageUploadState === "uploading"}
            label={messages.editor.image}
            onClick={() => imageInputRef.current?.click()}
          >
            {imageUploadState === "uploading" ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon aria-hidden="true" className="h-4 w-4" />
            )}
          </ToolbarButton>
          <input
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={uploadImage}
            ref={imageInputRef}
            type="file"
          />
          {selectedImageAttributes ? (
            <>
              <ToolbarButton
                active={selectedImageAttributes.width === imageWidthOptions[0].value}
                disabled={!editor}
                label={messages.editor.imageSmall}
                onClick={() => updateSelectedImage({ width: imageWidthOptions[0].value })}
              >
                <Minimize2 aria-hidden="true" className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                active={selectedImageAttributes.width === imageWidthOptions[1].value}
                disabled={!editor}
                label={messages.editor.imageMedium}
                onClick={() => updateSelectedImage({ width: imageWidthOptions[1].value })}
              >
                <ImageIcon aria-hidden="true" className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                active={selectedImageAttributes.width === imageWidthOptions[2].value}
                disabled={!editor}
                label={messages.editor.imageLarge}
                onClick={() => updateSelectedImage({ width: imageWidthOptions[2].value })}
              >
                <ImageIcon aria-hidden="true" className="h-5 w-5" />
              </ToolbarButton>
              <ToolbarButton
                active={selectedImageAttributes.width === imageWidthOptions[3].value}
                disabled={!editor}
                label={messages.editor.imageFull}
                onClick={() => updateSelectedImage({ width: imageWidthOptions[3].value })}
              >
                <Maximize2 aria-hidden="true" className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                active={selectedImageAttributes.align === "left"}
                disabled={!editor}
                label={messages.editor.imageAlignLeft}
                onClick={() => updateSelectedImage({ align: "left" })}
              >
                <PanelLeft aria-hidden="true" className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                active={selectedImageAttributes.align === "center"}
                disabled={!editor}
                label={messages.editor.imageAlignCenter}
                onClick={() => updateSelectedImage({ align: "center" })}
              >
                <AlignCenter aria-hidden="true" className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                active={selectedImageAttributes.align === "right"}
                disabled={!editor}
                label={messages.editor.imageAlignRight}
                onClick={() => updateSelectedImage({ align: "right" })}
              >
                <PanelRight aria-hidden="true" className="h-4 w-4" />
              </ToolbarButton>
            </>
          ) : null}
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
        <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
          <span className="text-sm text-muted-foreground">
            {messages.editor.words}: {editorStats.words}
          </span>
          <span className="text-sm text-muted-foreground">
            {messages.editor.characters}: {editorStats.characters}
          </span>
          {imageUploadState !== "idle" ? (
            <span className={cn("text-sm", imageUploadState === "error" ? "text-destructive" : "text-muted-foreground")}>
              {imageUploadState === "uploading" ? messages.editor.imageUploading : messages.editor.imageUploadFailed}
            </span>
          ) : null}
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
          {canSave || saveState === "saving" ? (
            <Button disabled={!canSave || saveState === "saving"} onClick={saveDocument} type="button">
              <Save aria-hidden="true" className="h-4 w-4" />
              {saveState === "saving" ? messages.editor.saving : messages.editor.saveNow}
            </Button>
          ) : null}
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

function getEditorStats(editor: Editor): EditorStats {
  return {
    characters: editor.storage.characterCount.characters(),
    words: editor.storage.characterCount.words()
  };
}

function sanitizeImageWidth(width: unknown) {
  return imageWidthOptions.some((option) => option.value === width) ? String(width) : "100%";
}

function sanitizeImageAlign(align: unknown) {
  return align === "left" || align === "right" || align === "center" ? align : "center";
}

function getImageStyle(width: unknown, align: unknown) {
  const safeWidth = sanitizeImageWidth(width);
  const safeAlign = sanitizeImageAlign(align);
  const margin =
    safeAlign === "left" ? "1.5rem auto 1.5rem 0" : safeAlign === "right" ? "1.5rem 0 1.5rem auto" : "1.5rem auto";

  return `display: block; width: ${safeWidth}; margin: ${margin};`;
}

function ColorSwatchButton({
  active,
  color,
  disabled,
  label,
  onClick,
  variant = "text"
}: {
  active?: boolean;
  color: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  variant?: "highlight" | "text";
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-40",
        active ? "border-border bg-background shadow-sm" : ""
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-4 w-4 rounded-full border border-border",
          variant === "highlight" ? "rounded-sm" : ""
        )}
        style={{ backgroundColor: color }}
      />
    </button>
  );
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
