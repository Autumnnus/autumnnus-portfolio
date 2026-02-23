"use client";

import CodeBlock from "./CodeBlock";

interface ContentRendererProps {
  content: string;
}

export default function ContentRenderer({ content }: ContentRendererProps) {
  if (!content) return null;

  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    const parts = content.split(
      /(<pre[^>]*><code[^>]*>[\s\S]*?<\/code><\/pre>)/g,
    );

    return (
      <div className="space-y-4">
        {parts.map((part, index) => {
          const match = part.match(
            /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/,
          );
          if (match) {
            const code = match[1]
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&amp;/g, "&")
              .replace(/&quot;/g, '"')
              .replace(/&#039;/g, "'");

            const langMatch =
              part.match(/<code[^>]*class="language-(\w+)"/) ||
              part.match(/<pre[^>]*class="language-(\w+)"/);
            const language = langMatch ? langMatch[1] : "typescript";

            return <CodeBlock key={index} code={code} language={language} />;
          }

          if (!part.trim()) return null;

          return (
            <div
              key={index}
              className="prose prose-invert max-w-none 
                prose-p:leading-relaxed prose-p:text-muted-foreground 
                prose-headings:text-foreground prose-headings:font-bold
                prose-strong:text-foreground prose-strong:font-bold
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-lg
                prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-ul:list-disc prose-ul:pl-5
                prose-ol:list-decimal prose-ol:pl-5"
              dangerouslySetInnerHTML={{ __html: part }}
            />
          );
        })}
      </div>
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
