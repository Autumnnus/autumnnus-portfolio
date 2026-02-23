import { prisma } from "@/lib/prisma";

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
  embedding: number[],
) {
  const embeddingString = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO "Embedding" ("id", "sourceType", "sourceId", "language", "chunkText", "chunkIndex", "embedding", "updatedAt")
    VALUES (gen_random_uuid(), ${sourceType}, ${sourceId}, ${language}, ${chunkText}, ${chunkIndex}, ${embeddingString}::vector, NOW())
    ON CONFLICT ("sourceType", "sourceId", "language", "chunkIndex")
    DO UPDATE SET
      "chunkText" = ${chunkText},
      "embedding" = ${embeddingString}::vector,
      "updatedAt" = NOW()
  `;
}

export async function searchSimilar(
  queryEmbedding: number[],
  language: string,
  limit: number = 5,
  threshold: number = 0.5,
): Promise<EmbeddingResult[]> {
  const embeddingString = `[${queryEmbedding.join(",")}]`;

  const targetLanguage = language === "tr" ? "tr" : "en";

  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      sourceType: string;
      sourceId: string;
      language: string;
      chunkText: string;
      chunkIndex: number;
      distance: number;
    }>
  >`
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
  `;

  return results.map((r) => ({
    id: r.id,
    sourceType: r.sourceType,
    sourceId: r.sourceId,
    language: r.language,
    chunkText: r.chunkText,
    similarity: 1 - r.distance,
  }));
}

export async function deleteEmbeddingsBySource(
  sourceType: EmbeddingSourceType,
  sourceId: string,
) {
  await prisma.embedding.deleteMany({
    where: {
      sourceType,
      sourceId,
    },
  });
}

export async function deleteAllEmbeddings() {
  await prisma.embedding.deleteMany({});
}
