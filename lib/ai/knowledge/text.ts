import { createHash } from "node:crypto";
import { Parser } from "htmlparser2";

/**
 * Content normalisation for the knowledge index.
 *
 * Blog posts and project descriptions are TipTap HTML, experience/profile
 * texts are plain textareas that may contain Markdown. Both are converted to
 * a flat list of blocks that keeps the heading structure, so the chunker can
 * split on sections and prefix every chunk with its breadcrumb.
 */

export type TextBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "text"; text: string }
  | { kind: "code"; text: string };

const MAX_CODE_BLOCK_CHARS = 1_200;

const BLOCK_TAGS = new Set([
  "p",
  "div",
  "section",
  "article",
  "blockquote",
  "li",
  "tr",
  "figcaption",
  "dt",
  "dd",
]);
const HEADING_TAGS: Record<string, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};
const SKIP_TAGS = new Set(["script", "style", "noscript", "svg", "iframe"]);

export function collapseWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function looksLikeHtml(content: string) {
  return /<\/?[a-z][a-z0-9]*(\s[^>]*)?>/i.test(content);
}

export function htmlToBlocks(html: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  let buffer = "";
  let heading: number | null = null;
  let inPre = 0;
  let skipDepth = 0;
  let cellCount = 0;

  const flush = () => {
    if (inPre) return;
    const text = collapseWhitespace(buffer);
    buffer = "";
    if (!text) return;
    if (heading) blocks.push({ kind: "heading", level: heading, text });
    else blocks.push({ kind: "text", text });
  };

  const parser = new Parser(
    {
      onopentag(name) {
        if (SKIP_TAGS.has(name)) {
          skipDepth++;
          return;
        }
        if (name === "pre") {
          flush();
          inPre++;
          return;
        }
        if (name in HEADING_TAGS) {
          flush();
          heading = HEADING_TAGS[name];
          return;
        }
        if (name === "tr") cellCount = 0;
        if (name === "td" || name === "th") {
          if (cellCount++ > 0) buffer += " | ";
          return;
        }
        if (BLOCK_TAGS.has(name)) {
          flush();
          if (name === "li") buffer += "- ";
        }
        if (name === "br") buffer += inPre ? "\n" : " ";
      },
      ontext(text) {
        if (skipDepth) return;
        buffer += text;
      },
      onclosetag(name) {
        if (SKIP_TAGS.has(name)) {
          skipDepth = Math.max(0, skipDepth - 1);
          return;
        }
        if (name === "pre") {
          inPre = Math.max(0, inPre - 1);
          const code = buffer.replace(/\n{3,}/g, "\n\n").trim();
          buffer = "";
          if (code) {
            blocks.push({
              kind: "code",
              text:
                code.length > MAX_CODE_BLOCK_CHARS
                  ? `${code.slice(0, MAX_CODE_BLOCK_CHARS)}\n…`
                  : code,
            });
          }
          return;
        }
        if (name in HEADING_TAGS) {
          flush();
          heading = null;
          return;
        }
        if (BLOCK_TAGS.has(name)) flush();
      },
    },
    { decodeEntities: true, lowerCaseTags: true },
  );

  parser.write(html);
  parser.end();
  flush();
  return blocks;
}

export function markdownToBlocks(markdown: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let paragraph: string[] = [];
  let code: string[] | null = null;

  const flushParagraph = () => {
    const text = collapseWhitespace(stripInlineMarkdown(paragraph.join(" ")));
    paragraph = [];
    if (text) blocks.push({ kind: "text", text });
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (code) {
        const text = code.join("\n").trim();
        if (text) {
          blocks.push({ kind: "code", text: text.slice(0, MAX_CODE_BLOCK_CHARS) });
        }
        code = null;
      } else {
        flushParagraph();
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (headingMatch) {
      flushParagraph();
      const text = collapseWhitespace(stripInlineMarkdown(headingMatch[2]));
      if (text) {
        blocks.push({ kind: "heading", level: headingMatch[1].length, text });
      }
      continue;
    }

    const listMatch = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (listMatch) {
      flushParagraph();
      const text = collapseWhitespace(stripInlineMarkdown(listMatch[1]));
      if (text) blocks.push({ kind: "text", text: `- ${text}` });
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  return blocks;
}

function stripInlineMarkdown(text: string) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s?/, "");
}

export function contentToBlocks(content: string | null | undefined): TextBlock[] {
  if (!content?.trim()) return [];
  return looksLikeHtml(content) ? htmlToBlocks(content) : markdownToBlocks(content);
}

export function blocksToText(blocks: TextBlock[]) {
  return blocks
    .map((block) => (block.kind === "heading" ? `## ${block.text}` : block.text))
    .join("\n");
}

export function contentToPlainText(content: string | null | undefined) {
  return contentToBlocks(content)
    .map((block) => block.text)
    .join("\n");
}

/**
 * Cheap token estimate. Gemini's tokenizer averages ~4 chars/token for
 * English and ~3.3 for Turkish; 3.6 keeps chunk sizes safe for both.
 */
export function estimateTokens(text: string) {
  return Math.ceil(text.length / 3.6);
}

export function truncate(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > maxChars * 0.6 ? lastSpace : maxChars)}…`;
}

export function stableHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
