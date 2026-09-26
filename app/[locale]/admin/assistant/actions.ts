"use server";

import { auth } from "@/auth";
import {
  updateAssistantSettings,
  type EditableAssistantSettings,
} from "@/lib/ai/chat/settings";
import { deleteVisitor } from "@/lib/ai/chat/visitors";
import { runKnowledgeSyncNow } from "@/lib/ai/knowledge/sync";
import { isKnownModel } from "@/lib/ai/models";
import { searchKnowledge } from "@/lib/ai/knowledge/search";
import { db } from "@/lib/db";
import { assistantThread } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasGeminiKey } from "@/lib/ai/gemini-keys";

async function assertAdmin() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }
}

const modelId = z.string().refine(isKnownModel, "Unknown model");

const settingsSchema = z.object({
  enabled: z.boolean(),
  modelFast: modelId,
  modelDeep: modelId,
  visitorDailyLimit: z.number().int().min(1).max(1_000),
  globalDailyLimit: z.number().int().min(1).max(100_000),
  retentionDays: z.number().int().min(1).max(730),
  autoDelete: z.boolean(),
});

export async function saveAssistantSettingsAction(values: EditableAssistantSettings) {
  await assertAdmin();
  const parsed = settingsSchema.parse(values);
  await updateAssistantSettings(parsed);
  revalidatePath("/[locale]/admin/assistant", "page");
  return { success: true };
}

export async function runIndexSyncAction(force: boolean) {
  await assertAdmin();
  if (!hasGeminiKey()) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured.");
  }
  const report = await runKnowledgeSyncNow("all", force);
  revalidatePath("/[locale]/admin/assistant", "page");
  return report;
}

export async function runRetrievalLabAction(query: string, judge: boolean, locale: "tr" | "en") {
  await assertAdmin();
  const q = z.string().trim().min(2).max(200).parse(query);
  const { hits, trace } = await searchKnowledge({
    query: q,
    question: q,
    locale,
    judge,
    limit: 8,
  });
  return {
    trace,
    hits: hits.map((hit) => ({
      chunkId: hit.chunkId,
      sourceType: hit.sourceType,
      language: hit.language,
      title: hit.title,
      path: hit.path,
      heading: hit.heading,
      snippet: hit.content.slice(0, 320),
      lexicalRank: hit.lexicalRank,
      vectorRank: hit.vectorRank,
      similarity: hit.similarity,
      relevance: hit.relevance,
    })),
  };
}

export async function deleteAssistantThreadAction(id: string) {
  await assertAdmin();
  await db.delete(assistantThread).where(eq(assistantThread.id, id));
  revalidatePath("/[locale]/admin/assistant", "page");
}

export async function deleteAssistantVisitorAction(by: "visitor" | "ip", key: string) {
  await assertAdmin();
  await deleteVisitor(by === "ip" ? "ip" : "visitor", z.string().min(8).parse(key));
  revalidatePath("/[locale]/admin/assistant", "page");
}
