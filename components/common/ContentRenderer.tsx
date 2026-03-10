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

function htmlToText(value: string) {
  let normalized = value.replace(
    /<pre([^>]*)>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_, preAttrs = "", codeAttrs = "", rawCode = "") => {
      const language = extractLanguageFromTag(`${preAttrs} ${codeAttrs}`);
      const code = decodeHtmlEntities(rawCode).replace(/\n+$/, "");
      return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    },
  );

  normalized = normalized
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<\/li>\s*<li[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/?(ul|ol|p|div|span|section|article)[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "");

  return normalized.trim();
}

function extractLanguageFromTag(tagHtml: string) {
  const languageMatch = tagHtml.match(/language-([a-z0-9_-]+)/i);
  if (languageMatch?.[1]) return languageMatch[1].toLowerCase();
  return "typescript";
}

function renderHtmlWithCodeBlocks(html: string, sanitizeHtml: (value: string) => string) {
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
            className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-muted-foreground prose-headings:text-foreground prose-headings:font-bold prose-strong:text-foreground prose-strong:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-lg prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5"
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
  const markdownPattern = /(^|\n)\s{0,3}#{1,6}\s|\[[^\]]+\]\[[^\]]+\]|```|(^|\n)\s*[-*]\s+/m;
  const hasMarkdownSyntax = markdownPattern.test(decodedContent);
  const htmlWrappedMarkdown =
    isHtml && hasMarkdownSyntax && /<(p|div|span|br|ul|ol|li|section|article)[^>]*>/i.test(decodedContent);

  if (isHtml && !htmlWrappedMarkdown) {
    return renderHtmlWithCodeBlocks(decodedContent, sanitizeHtml);
  }

  const markdownContent = htmlWrappedMarkdown ? htmlToText(decodedContent) : content;

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
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1">{children}</ul>
          ),
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
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
}
