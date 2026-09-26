import { embed, embedMany } from "ai";
import type { GoogleEmbeddingModelOptions } from "@ai-sdk/google";
import { EMBEDDING_DIMENSIONS } from "@/lib/db/schema";
import { AI_MODELS } from "../config";
import { embeddingModel } from "../providers";

/**
 * Asymmetric embeddings: documents and queries use different task types,
 * and Matryoshka truncation keeps vectors at 1536 dims so pgvector can
 * serve them from an HNSW index (the old 3072-dim column could not be
 * indexed at all).
 */

function options(taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY") {
  return {
    google: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
      taskType,
    } satisfies GoogleEmbeddingModelOptions,
  };
}

export const EMBEDDING_MODEL_ID = `${AI_MODELS.embedding}@${EMBEDDING_DIMENSIONS}`;

export async function embedDocuments(values: string[]): Promise<number[][]> {
  if (!values.length) return [];
  const { embeddings } = await embedMany({
    model: embeddingModel(),
    values,
    maxParallelCalls: 2,
    providerOptions: options("RETRIEVAL_DOCUMENT"),
  });
  return embeddings;
}

const QUERY_CACHE_SIZE = 256;
const queryCache = new Map<string, number[]>();

export async function embedQuery(
  text: string,
  abortSignal?: AbortSignal,
): Promise<number[]> {
  const key = text.trim().toLowerCase();
  const cached = queryCache.get(key);
  if (cached) {
    // refresh LRU position
    queryCache.delete(key);
    queryCache.set(key, cached);
    return cached;
  }

  const { embedding } = await embed({
    model: embeddingModel(),
    value: text,
    abortSignal,
    providerOptions: options("RETRIEVAL_QUERY"),
  });

  queryCache.set(key, embedding);
  if (queryCache.size > QUERY_CACHE_SIZE) {
    queryCache.delete(queryCache.keys().next().value as string);
  }
  return embedding;
}

export function toVectorLiteral(vector: number[]) {
  return `[${vector.join(",")}]`;
}
