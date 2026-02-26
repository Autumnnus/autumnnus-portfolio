import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export type EmbeddingSourceType = "blog" | "project" | "profile" | "experience";

export interface EmbeddingResult {
  id: string;
  sourceType: string;
  sourceId: string;
  language: string;
  chunkText: string;
  similarity: number;
}

export async function upsertEmbedding(
  sourceType: EmbeddingSourceType,
  sourceId: string,
  language: string,
  chunkIndex: number,
  chunkText: string,
  embeddingData: number[],
) {
  const embeddingString = `[${embeddingData.join(",")}]`;

  await db.execute(sql`
    INSERT INTO "Embedding" ("id", "sourceType", "sourceId", "language", "chunkText", "chunkIndex", "embedding", "updatedAt")
    VALUES (gen_random_uuid(), ${sourceType}, ${sourceId}, ${language}, ${chunkText}, ${chunkIndex}, ${embeddingString}::vector, NOW())
    ON CONFLICT ("sourceType", "sourceId", "language", "chunkIndex")
    DO UPDATE SET
      "chunkText" = ${chunkText},
      "embedding" = ${embeddingString}::vector,
      "updatedAt" = NOW()
  `);
}

export async function searchSimilar(
  queryEmbedding: number[],
  language: string,
  limit: number = 5,
  threshold: number = 0.5,
): Promise<EmbeddingResult[]> {
  const embeddingString = `[${queryEmbedding.join(",")}]`;

  const targetLanguage = language === "tr" ? "tr" : "en";

  const results = await db.execute(sql`
    SELECT
      id,
      "sourceType",
      "sourceId",
      "language",
      "chunkText",
      "chunkIndex",
      embedding <=> ${embeddingString}::vector as distance
    FROM "Embedding"
    WHERE "language" = ${targetLanguage}
    AND (embedding <=> ${embeddingString}::vector) < ${threshold}
    ORDER BY distance ASC
    LIMIT ${limit}
  `);

  type RawResult = {
    id: string;
    sourceType: string;
    sourceId: string;
    language: string;
    chunkText: string;
    chunkIndex: number;
    distance: number;
  };

  return (results.rows as unknown as RawResult[]).map((r) => ({
    id: r.id,
    sourceType: r.sourceType,
    sourceId: r.sourceId,
    language: r.language,
    chunkText: r.chunkText,
    similarity: 1 - r.distance,
  }));
}

export async function deleteEmbeddingsBySource(
  sourceType: string,
  sourceId: string,
) {
  await db.execute(sql`
    DELETE FROM "Embedding"
    WHERE "sourceType" = ${sourceType} AND "sourceId" = ${sourceId}
  `);
}

export async function deleteAllEmbeddings() {
  await db.execute(sql`DELETE FROM "Embedding"`);
}
