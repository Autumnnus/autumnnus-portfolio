"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  LanguageType as Language,
  liveChatConfig,
  liveChatGreeting,
  liveChatGreetingTranslation,
} from "@/lib/db/schema";
import { uploadFile } from "@/lib/minio";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface GreetingTranslationInput {
  language: Language;
  text: string;
  quickAnswers?: string[];
}

export interface LiveChatGreetingInput {
  pathname: string;
  translations: GreetingTranslationInput[];
}

export interface LiveChatConfigData {
  isEnabled: boolean;
  allowedPaths: string[];
  excludedPaths: string[];
  pingSoundUrl: string | null;
  notificationSoundUrl: string | null;
  greetings: LiveChatGreetingInput[];
}

async function checkAdmin() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }
}

export async function getLiveChatConfigAction() {
  await checkAdmin();

  let config = await db.query.liveChatConfig.findFirst({
    with: {
      greetings: {
        with: {
          translations: true,
        },
      },
    },
  });

  if (!config) {
    const [newConfig] = await db
      .insert(liveChatConfig)
      .values({
        isEnabled: true,
        allowedPaths: [],
      })
      .returning();

    return { ...newConfig, greetings: [] };
  }

  return config;
}

export async function updateLiveChatConfigAction(data: {
  isEnabled: boolean;
  allowedPaths: string[];
  excludedPaths: string[];
  pingSoundUrl?: string | null;
  notificationSoundUrl?: string | null;
}) {
  await checkAdmin();

  const config = await db.query.liveChatConfig.findFirst();

  if (config) {
    await db
      .update(liveChatConfig)
      .set({
        isEnabled: data.isEnabled,
        allowedPaths: data.allowedPaths,
        excludedPaths: data.excludedPaths,
        pingSoundUrl:
          data.pingSoundUrl !== undefined ? data.pingSoundUrl : undefined,
        notificationSoundUrl:
          data.notificationSoundUrl !== undefined
            ? data.notificationSoundUrl
            : undefined,
      })
      .where(eq(liveChatConfig.id, config.id));
  } else {
    await db.insert(liveChatConfig).values({
      isEnabled: data.isEnabled,
      allowedPaths: data.allowedPaths,
      excludedPaths: data.excludedPaths,
      pingSoundUrl: data.pingSoundUrl,
      notificationSoundUrl: data.notificationSoundUrl,
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function uploadLiveChatSoundAction(formData: FormData) {
  await checkAdmin();

  const file = formData.get("file") as File;
  const type = formData.get("type") as "ping" | "notification";

  if (!file || !type) throw new Error("File and type are required");

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `sounds/livechat-${type}-${Date.now()}.mp3`;
  const url = await uploadFile(filename, buffer, file.type);

  const config = await db.query.liveChatConfig.findFirst();
  if (config) {
    await db
      .update(liveChatConfig)
      .set({
        [type === "ping" ? "pingSoundUrl" : "notificationSoundUrl"]: url,
      })
      .where(eq(liveChatConfig.id, config.id));
  }

  revalidatePath("/", "layout");
  return { success: true, url };
}

export async function resetLiveChatSoundAction(type: "ping" | "notification") {
  await checkAdmin();

  const config = await db.query.liveChatConfig.findFirst();
  if (config) {
    await db
      .update(liveChatConfig)
      .set({
        [type === "ping" ? "pingSoundUrl" : "notificationSoundUrl"]: null,
      })
      .where(eq(liveChatConfig.id, config.id));
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function upsertLiveChatGreetingAction(
  data: LiveChatGreetingInput,
) {
  await checkAdmin();

  const config = await db.query.liveChatConfig.findFirst();
  if (!config) throw new Error("Live chat config not found");

  const existingGreeting = await db.query.liveChatGreeting.findFirst({
    where: (g, { eq }) => eq(g.pathname, data.pathname),
  });

  if (existingGreeting) {
    await db.transaction(async (tx) => {
      await tx
        .delete(liveChatGreetingTranslation)
        .where(eq(liveChatGreetingTranslation.greetingId, existingGreeting.id));
      await tx.insert(liveChatGreetingTranslation).values(
        data.translations.map((t) => ({
          ...t,
          greetingId: existingGreeting.id,
          quickAnswers: t.quickAnswers || [],
        })),
      );
    });
  } else {
    await db.transaction(async (tx) => {
      const [newGreeting] = await tx
        .insert(liveChatGreeting)
        .values({
          pathname: data.pathname,
          configId: config.id,
        })
        .returning();

      await tx.insert(liveChatGreetingTranslation).values(
        data.translations.map((t) => ({
          ...t,
          greetingId: newGreeting.id,
          quickAnswers: t.quickAnswers || [],
        })),
      );
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteLiveChatGreetingAction(id: string) {
  await checkAdmin();

  await db.delete(liveChatGreeting).where(eq(liveChatGreeting.id, id));

  revalidatePath("/", "layout");
  return { success: true };
}
