import { db } from "@/lib/db";
import { sql, type SQL } from "drizzle-orm";
import { RETRIEVAL, type AssistantLocale } from "../config";
import { judgeRelevance } from "../system-one/judge";
import type { EvaluationTrace } from "../system-one/run";
import type { KnowledgeSourceType } from "./documents";
import { embedQuery, toVectorLiteral } from "./embed";
import { capPerGroup, reciprocalRankFusion, sortByScore } from "./fusion";

/**
 * Hybrid retrieval pipeline
 *
 *   query ─┬─ lexical (Postgres FTS, turkish+english stems, OR-query) ─┐
 *          └─ vector  (pgvector HNSW, cosine, cross-lingual)  ─────────┴─ RRF
 *        → cap 2 chunks / source → Jev relevance judge (P(relevant) per passage)
 *        → RRF(first-stage, judge) → drop P < 0.15 → top-k
 *
 * Every stage degrades gracefully: no embedding key → lexical only; no Jev →
 * first-stage fusion only. The returned trace powers the "how I found this"
 * timeline in the widget and the retrieval eval.
 */

export interface SearchHit {
  chunkId: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
  language: AssistantLocale;
  title: string;
  path: string;
  heading: string | null;
  content: string;
  lexicalRank: number | null;
  vectorRank: number | null;
  similarity: number | null;
  relevance: number | null;
  score: number;
}

export interface SearchTrace {
  query: string;
  lexical: number;
  vector: number;
  pooled: number;
  judged: number;
  kept: number;
  judge: EvaluationTrace | null;
  degraded: string[];
  ms: { embed: number; retrieve: number; judge: number; total: number };
}

export interface SearchOptions {
  query: string;
  /** The visitor's actual question — the judge scores relevance against it. */
  question?: string;
  locale: AssistantLocale;
  types?: KnowledgeSourceType[];
  limit?: number;
  /** Disable the judge (used by the eval harness for ablations). */
  judge?: boolean;
  /** Restrict first-stage retrievers (eval ablations). */
  retrievers?: ("lexical" | "vector")[];
  abortSignal?: AbortSignal;
}

type Row = {
  chunkId: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
  language: AssistantLocale;
  title: string;
  path: string;
  heading: string | null;
  content: string;
  score: number;
};

const MIN_VECTOR_SIMILARITY = 0.3;

function typeFilter(types?: KnowledgeSourceType[]): SQL {
  if (!types?.length) return sql``;
  return sql`AND d."sourceType" IN (${sql.join(
    types.map((type) => sql`${type}::"KnowledgeSourceType"`),
    sql`, `,
  )})`;
}

const SELECT_COLUMNS = sql`
  c.id AS "chunkId", d."sourceType", d."sourceId", d.language, d.title, d.path,
  c.heading, c.content`;

async function lexicalSearch(query: string, types?: KnowledgeSourceType[]) {
  const result = await db.execute<Row>(sql`
    WITH terms AS (
      SELECT DISTINCT lexeme FROM (
        SELECT unnest(tsvector_to_array(to_tsvector('turkish', ${query}))) AS lexeme
        UNION ALL
        SELECT unnest(tsvector_to_array(to_tsvector('english', ${query})))
      ) t
      WHERE length(lexeme) > 1
    ),
    q AS (
      SELECT to_tsquery('simple', string_agg(quote_literal(lexeme), ' | ')) AS query
      FROM terms
    )
    SELECT ${SELECT_COLUMNS}, ts_rank_cd(c."searchVector", q.query, 32)::float8 AS score
    FROM "KnowledgeChunk" c
    JOIN "KnowledgeDocument" d ON d.id = c."documentId"
    CROSS JOIN q
    WHERE q.query IS NOT NULL AND c."searchVector" @@ q.query ${typeFilter(types)}
    ORDER BY score DESC
    LIMIT ${RETRIEVAL.lexicalK}
  `);
  return result.rows;
}

async function vectorSearch(vector: number[], types?: KnowledgeSourceType[]) {
  const literal = toVectorLiteral(vector);
  const result = await db.execute<Row>(sql`
    SELECT ${SELECT_COLUMNS},
      (1 - (c.embedding <=> ${literal}::vector))::float8 AS score
    FROM "KnowledgeChunk" c
    JOIN "KnowledgeDocument" d ON d.id = c."documentId"
    WHERE true ${typeFilter(types)}
    ORDER BY c.embedding <=> ${literal}::vector
    LIMIT ${RETRIEVAL.vectorK}
  `);
  return result.rows.filter((row) => Number(row.score) >= MIN_VECTOR_SIMILARITY);
}

const since = (start: number) => Math.round(performance.now() - start);

export async function searchKnowledge(options: SearchOptions): Promise<{
  hits: SearchHit[];
  trace: SearchTrace;
}> {
  const started = performance.now();
  const limit = options.limit ?? RETRIEVAL.defaultLimit;
  const retrievers = options.retrievers ?? ["lexical", "vector"];
  const degraded: string[] = [];
  const ms = { embed: 0, retrieve: 0, judge: 0, total: 0 };

  const lexicalPromise = retrievers.includes("lexical")
    ? lexicalSearch(options.query, options.types).catch((error) => {
        degraded.push(`lexical: ${(error as Error).message}`);
        return [] as Row[];
      })
    : Promise.resolve([] as Row[]);

  const vectorPromise = retrievers.includes("vector")
    ? (async () => {
        const embedStart = performance.now();
        try {
          const vector = await embedQuery(options.query, options.abortSignal);
          ms.embed = since(embedStart);
          return await vectorSearch(vector, options.types);
        } catch (error) {
          ms.embed = since(embedStart);
          degraded.push(`vector: ${(error as Error).message}`);
          return [] as Row[];
        }
      })()
    : Promise.resolve([] as Row[]);

  const [lexical, vector] = await Promise.all([lexicalPromise, vectorPromise]);
  ms.retrieve = since(started);

  // ── first-stage fusion ────────────────────────────────────────────────
  const rows = new Map<string, Row>();
  for (const row of [...lexical, ...vector]) rows.set(row.chunkId, row);
  const lexicalIds = lexical.map((row) => row.chunkId);
  const vectorIds = vector.map((row) => row.chunkId);

  const fused = reciprocalRankFusion([lexicalIds, vectorIds], { k: RETRIEVAL.rrfK });
  // Small nudge towards the visitor's language when both translations match.
  for (const [id, score] of fused) {
    if (rows.get(id)?.language === options.locale) fused.set(id, score * 1.1);
  }

  const pooled = capPerGroup(
    sortByScore(fused),
    (id) => {
      const row = rows.get(id)!;
      return `${row.sourceType}:${row.sourceId}`;
    },
    RETRIEVAL.maxChunksPerDocument,
  ).slice(0, RETRIEVAL.judgePoolSize);

  // ── Jev relevance judge + second fusion ─────────────────────────────────
  let judgeTrace: EvaluationTrace | null = null;
  let relevance: Map<string, number> | null = null;
  let finalIds = pooled;

  if (options.judge !== false && pooled.length) {
    const judgeStart = performance.now();
    const judged = await judgeRelevance({
      question: options.question || options.query,
      query: options.query,
      candidates: pooled.map((id) => {
        const row = rows.get(id)!;
        return { id, title: row.title, heading: row.heading, content: row.content };
      }),
      abortSignal: options.abortSignal,
    });
    ms.judge = since(judgeStart);
    judgeTrace = judged.trace.provider === "off" ? null : judged.trace;
    relevance = judged.probabilities;

    if (relevance) {
      const byRelevance = [...pooled].sort(
        (a, b) => (relevance!.get(b) ?? 0) - (relevance!.get(a) ?? 0),
      );
      const refined = reciprocalRankFusion([pooled, byRelevance], { k: RETRIEVAL.rrfK });
      const ordered = sortByScore(refined);
      const confident = ordered.filter(
        (id) => (relevance!.get(id) ?? 0) >= RETRIEVAL.judgeDropBelow,
      );
      finalIds =
        confident.length >= RETRIEVAL.minKeep
          ? confident
          : ordered.slice(0, RETRIEVAL.minKeep);
    }
  }

  const lexicalRank = new Map(lexicalIds.map((id, index) => [id, index + 1]));
  const vectorRank = new Map(vectorIds.map((id, index) => [id, index + 1]));
  const vectorScore = new Map(vector.map((row) => [row.chunkId, Number(row.score)]));

  const hits: SearchHit[] = finalIds.slice(0, limit).map((id, index) => {
    const row = rows.get(id)!;
    return {
      chunkId: id,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      language: row.language,
      title: row.title,
      path: row.path,
      heading: row.heading,
      content: row.content,
      lexicalRank: lexicalRank.get(id) ?? null,
      vectorRank: vectorRank.get(id) ?? null,
      similarity: vectorScore.get(id) ?? null,
      relevance: relevance?.get(id) ?? null,
      score: 1 / (index + 1),
    };
  });

  ms.total = since(started);
  return {
    hits,
    trace: {
      query: options.query,
      lexical: lexical.length,
      vector: vector.length,
      pooled: pooled.length,
      judged: relevance ? relevance.size : 0,
      kept: hits.length,
      judge: judgeTrace,
      degraded,
      ms,
    },
  };
}
