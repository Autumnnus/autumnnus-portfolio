"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";

interface ContentRendererProps {
  content: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function ContentRenderer({ content }: ContentRendererProps) {
  const [sanitizeHtml, setSanitizeHtml] = useState<(value: string) => string>(
    () => (value: string): string => escapeHtml(value),
  );

  useEffect(() => {
    let isMounted = true;

    import("isomorphic-dompurify")
      .then((mod) => {
        if (!isMounted) return;
        setSanitizeHtml(
          () => (value: string): string => mod.default.sanitize(value),
        );
      })
      .catch((error) => {
        console.error("DOMPurify dynamic import failed:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!content) return null;

  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    return (
      <div
        className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-muted-foreground prose-headings:text-foreground prose-headings:font-bold prose-strong:text-foreground prose-strong:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-lg prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <ReactMarkdown
        components={{
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold mt-8 mb-4 font-pixel uppercase tracking-widest text-primary">
            {children}
          </h2>
        ),
        p: ({ children }) => (
          <p className="leading-relaxed text-muted-foreground">{children}</p>
        ),
        ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 space-y-1">{children}</ol>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        code: ({ className, children, ...props }) => {
          const language = className?.replace("language-", "") || "typescript";
          const codeValue = String(children).replace(/\n$/, "");
          const isInline = !className && !String(children).includes("\n");

          if (isInline) {
            return (
              <code
                className="text-primary bg-primary/10 px-1 py-0.5 rounded"
                {...props}
              >
                {children}
              </code>
            );
          }

          return <CodeBlock code={codeValue} language={language} />;
        },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
