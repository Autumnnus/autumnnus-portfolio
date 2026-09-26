"use client";

import { cn } from "@/lib/utils";
import NextLink from "next/link";
import { memo } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { localizeHref, type ClientSource } from "./lib";

/**
 * Chat markdown: GFM (tables, lists), no raw HTML, locale-aware internal
 * links, and `cite:` links rendered as numbered source chips.
 */

function urlTransform(url: string) {
  if (url.startsWith("cite:")) return url;
  return defaultUrlTransform(url);
}

function MarkdownImpl({
  text,
  locale,
  sources,
  streaming,
}: {
  text: string;
  locale: string;
  sources: Map<string, ClientSource>;
  streaming?: boolean;
}) {
  return (
    <div
      className={cn(
        "assistant-prose text-[0.925rem] leading-relaxed text-foreground/90",
        "[&_p]:my-2 first:[&_p]:mt-0 last:[&_p]:mb-0",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_code]:rounded [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.8em] [&_code]:text-primary",
        "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-foreground",
        "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs [&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic",
        "[&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:font-semibold",
        streaming && "assistant-caret",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={urlTransform}
        components={{
          a: ({ href = "", children }) => {
            if (href.startsWith("cite:")) {
              const key = href.slice("cite:".length);
              const source = sources.get(key);
              if (!source) return null;
              return (
                <NextLink
                  href={localizeHref(source.path, locale)}
                  title={source.title}
                  className="relative -top-1 mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-sm border border-primary/40 bg-primary/10 px-1 font-mono text-[0.6rem] font-bold leading-none text-primary no-underline transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {children}
                </NextLink>
              );
            }
            const localized = localizeHref(href, locale);
            if (localized.startsWith("/")) {
              return (
                <NextLink href={localized} className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
                  {children}
                </NextLink>
              );
            }
            return (
              <a
                href={localized}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

const Markdown = memo(MarkdownImpl);
export default Markdown;
