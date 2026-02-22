"use client";

import { uploadImageAction } from "@/app/[locale]/admin/actions";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Code as CodeIcon,
  CodeXml,
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const lowlight = createLowlight(common);

const languages = [
  { label: "Typescript", value: "typescript" },
  { label: "Javascript", value: "javascript" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "Python", value: "python" },
  { label: "JSON", value: "json" },
  { label: "Bash", value: "bash" },
  { label: "SQL", value: "sql" },
  { label: "C++", value: "cpp" },
  { label: "C#", value: "csharp" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "PHP", value: "php" },
  { label: "Markdown", value: "markdown" },
];

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
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "typescript",
        HTMLAttributes: {
          class: "bg-[#121212] p-4 rounded-lg font-mono text-sm my-4 hljs",
        },
      }),
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
    onTransaction: () => {
      // Force a re-render to update toolbar state on every single change
      setSelectionCounter((s) => s + 1);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  const setSelectionCounter = useState(0)[1];

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
        toast.error(
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
          <CodeIcon size={18} />
        </button>

        <div className="flex items-center gap-1 bg-muted/20 rounded-md px-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-muted ${editor.isActive("codeBlock") ? "bg-muted" : ""}`}
            title={t("codeBlock")}
          >
            <CodeXml size={18} />
          </button>

          {editor.isActive("codeBlock") && (
            <div className="flex items-center border-l border-border pl-1 py-1">
              <Select
                value={
                  editor.getAttributes("codeBlock").language || "typescript"
                }
                onValueChange={(value) => {
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("codeBlock", { language: value })
                    .run();
                  // Force immediate UI update for the select input
                  setSelectionCounter((s) => s + 1);
                }}
              >
                <SelectTrigger className="h-7 w-[110px] text-[10px] bg-transparent border-none ring-offset-0 focus:ring-0 px-2 uppercase font-bold tracking-tighter">
                  <SelectValue placeholder="Lang" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {languages.map((lang) => (
                    <SelectItem
                      key={lang.value}
                      value={lang.value}
                      className="text-xs"
                    >
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

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

      <style jsx global>{`
        .hljs-comment,
        .hljs-quote {
          color: #6a737d;
        }

        .hljs-variable,
        .hljs-template-variable,
        .hljs-attribute,
        .hljs-tag,
        .hljs-name,
        .hljs-regexp,
        .hljs-link,
        .hljs-selector-id,
        .hljs-selector-class {
          color: #f97583;
        }

        .hljs-number,
        .hljs-meta,
        .hljs-built_in,
        .hljs-builtin-name,
        .hljs-literal,
        .hljs-type,
        .hljs-params {
          color: #ffab70;
        }

        .hljs-string,
        .hljs-symbol,
        .hljs-bullet {
          color: #85e89d;
        }

        .hljs-title,
        .hljs-section {
          color: #ffea7f;
        }

        .hljs-keyword,
        .hljs-selector-tag {
          color: #79c0ff;
        }

        .hljs-emphasis {
          font-style: italic;
        }

        .hljs-strong {
          font-weight: 700;
        }

        .hljs-addition {
          color: #22863a;
          background-color: #f0fff4;
        }

        .hljs-deletion {
          color: #b31d28;
          background-color: #ffeef0;
        }

        .ProseMirror pre {
          background: #121212 !important;
          color: #e1e4e8 !important;
          padding: 1.25rem !important;
          border-radius: 0.5rem !important;
          font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace !important;
        }

        .ProseMirror code {
          color: inherit;
          padding: 0;
          background: none;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
