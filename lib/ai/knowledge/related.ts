import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { toAssistantLocale } from "../config";
import type { KnowledgeSourceType } from "./documents";

/**
 * "Related projects / posts" from document-level vectors (HNSW-indexed).
 * Returns an empty list when the index has not been built yet, so callers
 * keep their "latest items" fallback.
 */
export async function findRelatedSources({
  sourceType,
  sourceId,
  language,
  limit,
}: {
  sourceType: Extract<KnowledgeSourceType, "project" | "blog">;
  sourceId: string;
  language: string;
  limit: number;
}): Promise<{ sourceId: string; distance: number }[]> {
  const locale = toAssistantLocale(language);
  try {
    const result = await db.execute<{ sourceId: string; distance: number }>(sql`
      SELECT d."sourceId", (d.embedding <=> src.embedding)::float8 AS distance
      FROM "KnowledgeDocument" d
      JOIN LATERAL (
        SELECT s.embedding
        FROM "KnowledgeDocument" s
        WHERE s."sourceType" = ${sourceType}::"KnowledgeSourceType"
          AND s."sourceId" = ${sourceId}
        ORDER BY (s.language = ${locale}::"Language") DESC
        LIMIT 1
      ) src ON true
      WHERE d."sourceType" = ${sourceType}::"KnowledgeSourceType"
        AND d.language = ${locale}::"Language"
        AND d."sourceId" <> ${sourceId}
      ORDER BY distance ASC
      LIMIT ${limit}
    `);
    return result.rows.map((row) => ({
      sourceId: String(row.sourceId),
      distance: Number(row.distance),
    }));
  } catch (error) {
    console.error("[knowledge] related lookup failed:", error);
    return [];
  }
}
