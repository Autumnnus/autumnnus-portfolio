import { db } from "@/lib/db";
import {
  assistantSettings,
  knowledgeChunk,
  knowledgeDocument,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { chunkBlocks } from "./chunker";
import {
  loadKnowledgeSources,
  type KnowledgeSource,
  type SyncTarget,
} from "./documents";
import { EMBEDDING_MODEL_ID, embedDocuments } from "./embed";
import { estimateTokens, stableHash, truncate } from "./text";

/**
 * Incremental, idempotent indexer.
 *
 * Each source is hashed (content + chunker version + embedding model); only
 * changed sources are re-embedded. Sources that disappeared (deleted entity,
 * unpublished post, removed translation) are removed from the index. Writes
 * per document happen in a transaction guarded by an advisory lock so the
 * admin UI, save hooks and the CLI can run concurrently.
 */

/** Bump when chunking / formatting changes so every source is re-embedded. */
const INDEX_VERSION = 2;

const FTS_CONFIG = { tr: "turkish", en: "english" } as const;

export interface IndexFailure {
  sourceType: string;
  sourceId: string;
  language: string;
  error: string;
}

export interface IndexReport {
  target: string;
  startedAt: string;
  ms: number;
  scanned: number;
  indexed: number;
  unchanged: number;
  removed: number;
  chunks: number;
  failed: IndexFailure[];
}

interface PreparedChunk {
  heading: string | null;
  content: string;
  tokenCount: number;
  embeddingInput: string;
}

/**
 * Chunk 0 is a synthetic "overview" (summary + structured facts) so that
 * attribute questions hit even when the prose never mentions the fact.
 */
function prepareChunks(source: KnowledgeSource) {
  const overview = [source.summary, ...source.facts].filter(Boolean).join("\n");
  const body = chunkBlocks(source.blocks);
  const raw = [
    ...(overview ? [{ heading: null, content: overview }] : []),
    ...body.map(({ heading, content }) => ({ heading, content })),
  ];

  const chunks: PreparedChunk[] = raw.map(({ heading, content }) => ({
    heading,
    content,
    tokenCount: estimateTokens(content),
    embeddingInput: `${source.title}${heading ? ` — ${heading}` : ""}\n\n${content}`,
  }));
  return { chunks, firstBody: body[0]?.content ?? "" };
}

/** Document-level vector input — drives "related projects / posts". */
function documentEmbeddingInput(source: KnowledgeSource, firstBody: string) {
  return [source.title, source.summary, ...source.facts, truncate(firstBody, 600)]
    .filter(Boolean)
    .join("\n");
}

function sourceHash(source: KnowledgeSource) {
  return stableHash({
    v: INDEX_VERSION,
    model: EMBEDDING_MODEL_ID,
    title: source.title,
    path: source.path,
    summary: source.summary,
    facts: source.facts,
    blocks: source.blocks,
  });
}

const keyOf = (s: { sourceType: string; sourceId: string; language: string }) =>
  `${s.sourceType}:${s.sourceId}:${s.language}`;

async function writeSource(
  source: KnowledgeSource,
  hash: string,
  chunks: PreparedChunk[],
  vectors: number[][],
) {
  const [documentVector, ...chunkVectors] = vectors;
  const config = FTS_CONFIG[source.language];

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('knowledge-index'))`);

    const [document] = await tx
      .insert(knowledgeDocument)
      .values({
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        language: source.language,
        title: source.title,
        path: source.path,
        summary: source.summary,
        contentHash: hash,
        embeddingModel: EMBEDDING_MODEL_ID,
        embedding: documentVector,
        chunkCount: chunks.length,
        indexedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          knowledgeDocument.sourceType,
          knowledgeDocument.sourceId,
          knowledgeDocument.language,
        ],
        set: {
          title: source.title,
          path: source.path,
          summary: source.summary,
          contentHash: hash,
          embeddingModel: EMBEDDING_MODEL_ID,
          embedding: documentVector,
          chunkCount: chunks.length,
          indexedAt: new Date(),
        },
      })
      .returning({ id: knowledgeDocument.id });

    await tx.delete(knowledgeChunk).where(eq(knowledgeChunk.documentId, document.id));

    if (chunks.length) {
      await tx.insert(knowledgeChunk).values(
        chunks.map((chunk, ordinal) => {
          const label = [source.title, chunk.heading].filter(Boolean).join(" ");
          return {
            documentId: document.id,
            ordinal,
            heading: chunk.heading,
            content: chunk.content,
            tokenCount: chunk.tokenCount,
            embedding: chunkVectors[ordinal],
            searchVector: sql`setweight(to_tsvector(${config}::regconfig, ${label}), 'A')
              || setweight(to_tsvector(${config}::regconfig, ${chunk.content}), 'B')
              || setweight(to_tsvector('simple', ${label}), 'C')`,
          };
        }),
      );
    }
  });
}

function scopeWhere(target: SyncTarget) {
  if (target === "all") return undefined;
  if (target.sourceId && target.sourceType !== "profile") {
    return and(
      eq(knowledgeDocument.sourceType, target.sourceType),
      eq(knowledgeDocument.sourceId, target.sourceId),
    );
  }
  return eq(knowledgeDocument.sourceType, target.sourceType);
}

export function describeTarget(target: SyncTarget) {
  if (target === "all") return "all";
  return target.sourceId ? `${target.sourceType}:${target.sourceId}` : target.sourceType;
}

export async function syncKnowledge(
  target: SyncTarget,
  { force = false }: { force?: boolean } = {},
): Promise<IndexReport> {
  const startedAt = new Date();
  const report: IndexReport = {
    target: describeTarget(target),
    startedAt: startedAt.toISOString(),
    ms: 0,
    scanned: 0,
    indexed: 0,
    unchanged: 0,
    removed: 0,
    chunks: 0,
    failed: [],
  };

  const [sources, existing] = await Promise.all([
    loadKnowledgeSources(target),
    db
      .select({
        id: knowledgeDocument.id,
        sourceType: knowledgeDocument.sourceType,
        sourceId: knowledgeDocument.sourceId,
        language: knowledgeDocument.language,
        contentHash: knowledgeDocument.contentHash,
      })
      .from(knowledgeDocument)
      .where(scopeWhere(target)),
  ]);

  report.scanned = sources.length;
  const existingByKey = new Map(existing.map((row) => [keyOf(row), row]));
  const seen = new Set<string>();

  for (const source of sources) {
    const key = keyOf(source);
    seen.add(key);
    const hash = sourceHash(source);

    if (!force && existingByKey.get(key)?.contentHash === hash) {
      report.unchanged++;
      continue;
    }

    try {
      const { chunks, firstBody } = prepareChunks(source);
      const vectors = await embedDocuments([
        documentEmbeddingInput(source, firstBody),
        ...chunks.map((chunk) => chunk.embeddingInput),
      ]);
      await writeSource(source, hash, chunks, vectors);
      report.indexed++;
      report.chunks += chunks.length;
    } catch (error) {
      report.failed.push({
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        language: source.language,
        error: (error instanceof Error ? error.message : String(error)).slice(0, 300),
      });
    }
  }

  const stale = existing.filter((row) => !seen.has(keyOf(row)));
  for (const row of stale) {
    await db.delete(knowledgeDocument).where(eq(knowledgeDocument.id, row.id));
    report.removed++;
  }

  report.ms = Date.now() - startedAt.getTime();
  await saveReport(report);
  return report;
}

async function saveReport(report: IndexReport) {
  try {
    await db
      .insert(assistantSettings)
      .values({ id: 1, lastIndexReport: report })
      .onConflictDoUpdate({
        target: assistantSettings.id,
        set: { lastIndexReport: report },
      });
  } catch (error) {
    console.error("[knowledge] failed to store index report:", error);
  }
}

export type IndexEntryStatus = "fresh" | "stale" | "missing" | "orphan";

export interface IndexStatusEntry {
  sourceType: string;
  sourceId: string;
  language: string;
  title: string;
  path: string;
  status: IndexEntryStatus;
  chunkCount: number;
  indexedAt: Date | null;
}

/** Compares current content hashes with the index — powers the admin table. */
export async function getKnowledgeIndexStatus(): Promise<IndexStatusEntry[]> {
  const [sources, documents] = await Promise.all([
    loadKnowledgeSources("all"),
    db
      .select({
        sourceType: knowledgeDocument.sourceType,
        sourceId: knowledgeDocument.sourceId,
        language: knowledgeDocument.language,
        title: knowledgeDocument.title,
        path: knowledgeDocument.path,
        contentHash: knowledgeDocument.contentHash,
        chunkCount: knowledgeDocument.chunkCount,
        indexedAt: knowledgeDocument.indexedAt,
      })
      .from(knowledgeDocument),
  ]);

  const byKey = new Map(documents.map((doc) => [keyOf(doc), doc]));
  const entries: IndexStatusEntry[] = sources.map((source) => {
    const doc = byKey.get(keyOf(source));
    byKey.delete(keyOf(source));
    return {
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      language: source.language,
      title: source.title,
      path: source.path,
      status: !doc ? "missing" : doc.contentHash === sourceHash(source) ? "fresh" : "stale",
      chunkCount: doc?.chunkCount ?? 0,
      indexedAt: doc?.indexedAt ?? null,
    };
  });
  for (const doc of byKey.values()) {
    entries.push({ ...doc, status: "orphan" });
  }
  const order: Record<IndexEntryStatus, number> = { missing: 0, stale: 1, orphan: 2, fresh: 3 };
  return entries.sort(
    (a, b) => order[a.status] - order[b.status] || a.sourceType.localeCompare(b.sourceType),
  );
}
