import { CHUNKING } from "../config";
import { estimateTokens, type TextBlock } from "./text";

/**
 * Structure-aware chunking.
 *
 * - Sections (h1/h2) start a new chunk unless the running chunk is tiny.
 * - Chunks grow to ~`targetTokens`; a block that would push past `maxTokens`
 *   closes the chunk and the next one starts with a short sentence-level
 *   overlap so facts that straddle the boundary stay retrievable.
 * - Every chunk remembers its heading breadcrumb (`Architecture › Caching`),
 *   which is prepended to the text we embed ("contextual chunk headers").
 */

export interface Chunk {
  heading: string | null;
  content: string;
  tokenCount: number;
}

interface ChunkOptions {
  targetTokens?: number;
  maxTokens?: number;
  overlapTokens?: number;
}

const MIN_SECTION_TOKENS = 80;

export function chunkBlocks(
  blocks: TextBlock[],
  options: ChunkOptions = {},
): Chunk[] {
  const target = options.targetTokens ?? CHUNKING.targetTokens;
  const max = options.maxTokens ?? CHUNKING.maxTokens;
  const overlap = options.overlapTokens ?? CHUNKING.overlapTokens;

  const chunks: Chunk[] = [];
  const headingPath: { level: number; text: string }[] = [];
  let current: string[] = [];
  let currentTokens = 0;
  let currentHeading: string | null = null;

  const breadcrumb = () =>
    headingPath.length ? headingPath.map((h) => h.text).join(" › ") : null;

  const flush = (withOverlap: boolean) => {
    const content = current.join("\n").trim();
    if (!content) return;
    chunks.push({
      heading: currentHeading,
      content,
      tokenCount: estimateTokens(content),
    });
    if (withOverlap && overlap > 0) {
      const tail = takeTail(content, overlap);
      current = tail ? [tail] : [];
      currentTokens = tail ? estimateTokens(tail) : 0;
    } else {
      current = [];
      currentTokens = 0;
    }
  };

  for (const block of blocks) {
    if (block.kind === "heading") {
      if (block.level <= 2 && currentTokens >= MIN_SECTION_TOKENS) flush(false);
      while (
        headingPath.length &&
        headingPath[headingPath.length - 1].level >= block.level
      ) {
        headingPath.pop();
      }
      headingPath.push({ level: block.level, text: block.text });
      if (!current.length) currentHeading = breadcrumb();
      else current.push(block.text);
      continue;
    }

    const pieces =
      estimateTokens(block.text) > max ? splitLongText(block.text, target) : [block.text];

    for (const piece of pieces) {
      const pieceTokens = estimateTokens(piece);
      if (currentTokens > 0 && currentTokens + pieceTokens > max) {
        flush(true);
      }
      if (!current.length) currentHeading = breadcrumb();
      current.push(piece);
      currentTokens += pieceTokens;
      if (currentTokens >= target) flush(true);
    }
  }
  flush(false);

  return dedupeOverlapOnlyChunks(chunks, overlap);
}

/** Splits an oversized paragraph on sentence boundaries. */
function splitLongText(text: string, targetTokens: number): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]+["')\]]*\s*|[^.!?…]+$/g) ?? [text];
  const pieces: string[] = [];
  let buffer = "";
  for (const sentence of sentences) {
    if (buffer && estimateTokens(buffer + sentence) > targetTokens) {
      pieces.push(buffer.trim());
      buffer = "";
    }
    buffer += sentence;
  }
  if (buffer.trim()) pieces.push(buffer.trim());

  // A single "sentence" can still be huge (e.g. minified text): hard-split it.
  const maxChars = Math.round(targetTokens * 3.6);
  return pieces.flatMap((piece) => {
    if (piece.length <= maxChars * 1.5) return [piece];
    const parts: string[] = [];
    for (let i = 0; i < piece.length; i += maxChars) {
      parts.push(piece.slice(i, i + maxChars));
    }
    return parts;
  });
}

/** Last whole sentences of `text` that fit into `tokens`. */
function takeTail(text: string, tokens: number): string {
  const sentences = text.match(/[^.!?…\n]+[.!?…]*\s*/g) ?? [];
  let tail = "";
  for (let i = sentences.length - 1; i >= 0; i--) {
    const next = sentences[i] + tail;
    if (estimateTokens(next) > tokens) break;
    tail = next;
  }
  return tail.trim();
}

/** Drops a trailing chunk that only contains the overlap of its predecessor. */
function dedupeOverlapOnlyChunks(chunks: Chunk[], overlap: number): Chunk[] {
  return chunks.filter((chunk, index) => {
    if (index === 0) return true;
    const previous = chunks[index - 1];
    return !(
      chunk.tokenCount <= overlap && previous.content.endsWith(chunk.content)
    );
  });
}
