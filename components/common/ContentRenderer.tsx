"use client";

import CodeBlock from "./CodeBlock";

interface ContentRendererProps {
  content: string;
}

export default function ContentRenderer({ content }: ContentRendererProps) {
  if (!content) return null;

  // Check if content is HTML (TipTap returns HTML)
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    return (
      <div
        className="prose prose-invert max-w-none 
          prose-p:leading-relaxed prose-p:text-muted-foreground 
          prose-headings:text-foreground prose-headings:font-bold
          prose-strong:text-foreground prose-strong:font-bold
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-xl prose-img:shadow-lg
          prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-ul:list-disc prose-ul:pl-5
          prose-ol:list-decimal prose-ol:pl-5
          space-y-4"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  const parts = content.split(/(```[\s\S]*?```|## .*?\n)/g);

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          if (match) {
            const [, language, code] = match;
            return (
              <CodeBlock
                key={index}
                code={code.trim()}
                language={language || "typescript"}
              />
            );
          }
        }

        if (part.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="text-2xl font-bold mt-8 mb-4 font-pixel uppercase tracking-widest text-primary"
            >
              {part.replace("## ", "").trim()}
            </h2>
          );
        }

        if (part.trim()) {
          return (
            <p
              key={index}
              className="leading-relaxed text-muted-foreground whitespace-pre-line"
            >
              {part.trim()}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
