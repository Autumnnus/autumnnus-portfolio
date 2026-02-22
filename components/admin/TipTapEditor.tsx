"use client";

import { uploadImageAction } from "@/app/[locale]/admin/actions";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  uploadPath?: string;
}

export default function TipTapEditor({
  content,
  onChange,
  placeholder = "İçeriğinizi buraya yazın...",
  uploadPath = "blog/images",
}: TipTapEditorProps) {
  const t = useTranslations("Admin.Editor");
  const tForm = useTranslations("Admin.Form");
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", uploadPath);
        const result = await uploadImageAction(formData);
        editor.chain().focus().setImage({ src: result.url }).run();
      } catch (error) {
        alert(
          "Resim yükleme başarısız: " +
            (error instanceof Error ? error.message : ""),
        );
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL giriniz:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) {
    return (
      <div className="p-4 text-muted-foreground">{tForm("loadingEditor")}</div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/30">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive("bold") ? "bg-muted" : ""}`}
          title={t("bold")}
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive("italic") ? "bg-muted" : ""}`}
          title={t("italic")}
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive("underline") ? "bg-muted" : ""}`}
          title={t("underline")}
        >
          <UnderlineIcon size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive("strike") ? "bg-muted" : ""}`}
          title={t("strikethrough")}
        >
          <Strikethrough size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive("code") ? "bg-muted" : ""}`}
          title={t("code")}
        >
          <Code size={18} />
        </button>

        <div className="w-px h-6 bg-border my-auto mx-1" />

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`p-2 rounded hover:bg-muted ${editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}`}
          title={t("heading1")}
        >
          <Heading1 size={18} />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`p-2 rounded hover:bg-muted ${editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}`}
          title={t("heading2")}
        >
          <Heading2 size={18} />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`p-2 rounded hover:bg-muted ${editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""}`}
          title={t("heading3")}
        >
          <Heading3 size={18} />
        </button>

        <div className="w-px h-6 bg-border my-auto mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive("bulletList") ? "bg-muted" : ""}`}
          title={t("bulletList")}
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive("orderedList") ? "bg-muted" : ""}`}
          title={t("orderedList")}
        >
          <ListOrdered size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive("blockquote") ? "bg-muted" : ""}`}
          title={t("blockquote")}
        >
          <Quote size={18} />
        </button>

        <div className="w-px h-6 bg-border my-auto mx-1" />

        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded hover:bg-muted ${editor.isActive("link") ? "bg-muted" : ""}`}
          title={t("addLink")}
        >
          <LinkIcon size={18} />
        </button>
        <button
          type="button"
          onClick={handleImageUpload}
          disabled={uploading}
          className="p-2 rounded hover:bg-muted disabled:opacity-50"
          title={t("addImage")}
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ImageIcon size={18} />
          )}
        </button>

        <div className="w-px h-6 bg-border my-auto mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-muted disabled:opacity-50"
          title={t("undo")}
        >
          <Undo size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-muted disabled:opacity-50"
          title={t("redo")}
        >
          <Redo size={18} />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
