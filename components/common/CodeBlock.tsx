"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  wrap?: boolean;
}

export default function CodeBlock({
  code,
  language,
  filename,
  wrap = false,
}: CodeBlockProps) {
  const t = useTranslations("Common");
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function highlight() {
      try {
        const html = await codeToHtml(code, {
          lang: language || "typescript",
          theme: "vitesse-dark",
        });
        setHighlightedCode(html);
      } catch (error) {
        console.error("Shiki highlight error:", error);
        setHighlightedCode(`<pre><code>${code}</code></pre>`);
      }
    }
    highlight();
  }, [code, language]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 group/code relative">
      {/* Header / Filename */}
      <div className="flex items-center justify-between bg-zinc-900 border border-white/10 rounded-t-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
          </div>
          {filename ? (
            <span className="ml-2 text-xs font-mono text-zinc-400">
              {filename}
            </span>
          ) : (
            <span className="ml-2 text-xs font-mono text-zinc-500 uppercase tracking-wider">
              {language || "code"}
            </span>
          )}
        </div>

        <button
          onClick={copyToClipboard}
          className="p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white transition-all active:scale-95"
          title={t("copyCode")}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Code Content */}
      <div
        className="relative border border-t-0 border-white/10 rounded-b-lg overflow-hidden bg-[#121212] transition-all duration-300"
        dangerouslySetInnerHTML={{
          __html: highlightedCode || `<pre><code>${code}</code></pre>`,
        }}
      />

      {!highlightedCode && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm animate-pulse rounded-lg">
          <span className="text-xs font-mono text-zinc-500">
            {t("loadingCode")}
          </span>
        </div>
      )}

      {/* CSS Overrides for Shiki */}
      <style jsx global>{`
        .shiki {
          background-color: transparent !important;
          padding: 1.5rem !important;
          margin: 0 !important;
          font-family:
            var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco,
            Consolas, "Liberation Mono", "Courier New", monospace !important;
          font-size: 0.875rem !important;
          line-height: 1.7 !important;
          overflow-x: auto !important;
          white-space: ${wrap ? "pre-wrap" : "pre"} !important;
          word-break: ${wrap ? "break-word" : "normal"} !important;
        }
        .dark .shiki {
          background-color: transparent !important;
        }
      `}</style>
    </div>
  );
}
