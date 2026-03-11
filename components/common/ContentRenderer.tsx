"use client";

import DOMPurify from "isomorphic-dompurify";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";

interface ContentRendererProps {
  content: string;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractLanguageFromTag(tagHtml: string) {
  const languageMatch = tagHtml.match(/language-([a-z0-9_-]+)/i);
  if (languageMatch?.[1]) return languageMatch[1].toLowerCase();
  return "typescript";
}

function renderHtmlWithCodeBlocks(
  html: string,
  sanitizeHtml: (value: string) => string,
) {
  const parts = html.split(/(<pre[^>]*>[\s\S]*?<\/pre>)/gi);

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
        const preMatch = part.match(
          /<pre([^>]*)>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/i,
        );

        if (preMatch) {
          const [, preAttrs = "", codeAttrs = "", rawCode = ""] = preMatch;
          const language = extractLanguageFromTag(`${preAttrs} ${codeAttrs}`);
          const code = decodeHtmlEntities(rawCode).replace(/\n+$/, "");
          return <CodeBlock key={index} code={code} language={language} />;
        }

        if (!part.trim()) return null;

        return (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }}
          />
        );
      })}
    </div>
  );
}

export default function ContentRenderer({ content }: ContentRendererProps) {
  if (!content) return null;

  const decodedContent = decodeHtmlEntities(content);
  const sanitizeHtml = (value: string) => DOMPurify.sanitize(value);
  const isHtml = /<[a-z][\s\S]*>/i.test(decodedContent);

  if (isHtml) {
    return (
      <div className="space-y-4 [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mt-7 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_strong]:font-bold [&_strong]:text-foreground [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline [&_img]:rounded-xl [&_img]:shadow-lg [&_code]:rounded [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-primary">
        {renderHtmlWithCodeBlocks(decodedContent, sanitizeHtml)}
      </div>
    );
  }

  return (
    <div className="space-y-4 [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mt-7 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_strong]:font-bold [&_strong]:text-foreground [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline [&_img]:rounded-xl [&_img]:shadow-lg [&_code]:rounded [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-primary">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => (
            <h2 className="font-pixel uppercase tracking-widest text-primary">
              {children}
            </h2>
          ),
          h3: ({ children }) => <h3>{children}</h3>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          code: ({ className, children, ...props }) => {
            const language =
              className?.replace("language-", "") || "typescript";
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
