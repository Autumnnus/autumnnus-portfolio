"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
}

export default function CodeBlock({
  code,
  language,
  filename,
}: CodeBlockProps) {
  const t = useTranslations("Common");
  const [highlightedCode, setHighlightedCode] = useState<string>("");

  useEffect(() => {
    async function highlight() {
      try {
        const html = await codeToHtml(code, {
          lang: language,
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

  return (
    <div className="my-6 group">
      {filename && (
        <div className="bg-muted/50 border-x-4 border-t-4 border-border px-4 py-2 font-pixel text-[10px] uppercase tracking-widest text-muted-foreground">
          {filename}
        </div>
      )}
      <div
        className={`pixel-border-sm overflow-hidden bg-[#121212] transition-all duration-300 ${filename ? "border-t-0" : ""}`}
        dangerouslySetInnerHTML={{
          __html: highlightedCode || `<pre><code>${code}</code></pre>`,
        }}
      />
      {!highlightedCode && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm animate-pulse">
          <span className="font-pixel text-[10px]">{t("loadingCode")}</span>
        </div>
      )}
    </div>
  );
}
