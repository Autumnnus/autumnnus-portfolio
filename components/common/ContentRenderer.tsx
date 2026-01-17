"use client";

import CodeBlock from "./CodeBlock";

interface ContentRendererProps {
  content: string;
}

export default function ContentRenderer({ content }: ContentRendererProps) {
  if (!content) return null;

  // Simple regex to find markdown-style code blocks: ```lang\ncode\n```
  // It also matches optional headers like "## Title"
  const parts = content.split(/(```[\s\S]*?```|## .*?\n)/g);

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        // Handle Code Blocks
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

        // Handle Headers
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

        // Handle Normal Text
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
