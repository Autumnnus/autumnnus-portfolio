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
  // Convert embedding array to string format for vector type: '[0.1, 0.2, ...]'
  const embeddingString = `[${embedding.join(",")}]`;

  // Use raw query for vector insertion
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
  threshold: number = 0.5, // Similarity threshold (0 to 1, lower distance means higher similarity)
): Promise<EmbeddingResult[]> {
  const embeddingString = `[${queryEmbedding.join(",")}]`;

  // Fallback to English if not Turkish
  const targetLanguage = language === "tr" ? "tr" : "en";

  // Using cosine distance operator <=> from pgvector
  // We order by distance ascending (closest first)
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
    similarity: 1 - r.distance, // Convert distance to similarity
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
