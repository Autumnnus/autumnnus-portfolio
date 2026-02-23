"use server";

import { auth } from "@/auth";
import { uploadFile } from "@/lib/minio";
import { prisma } from "@/lib/prisma";
import { Language } from "@prisma/client";
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

  let config = await prisma.liveChatConfig.findFirst({
    include: {
      greetings: {
        include: {
          translations: true,
        },
      },
    },
  });

  if (!config) {
    config = await prisma.liveChatConfig.create({
      data: {
        isEnabled: true,
        allowedPaths: [],
      },
      include: {
        greetings: {
          include: {
            translations: true,
          },
        },
      },
    });
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

  const config = await prisma.liveChatConfig.findFirst();

  if (config) {
    await prisma.liveChatConfig.update({
      where: { id: config.id },
      data: {
        isEnabled: data.isEnabled,
        allowedPaths: data.allowedPaths,
        excludedPaths: data.excludedPaths,
        pingSoundUrl:
          data.pingSoundUrl !== undefined ? data.pingSoundUrl : undefined,
        notificationSoundUrl:
          data.notificationSoundUrl !== undefined
            ? data.notificationSoundUrl
            : undefined,
      },
    });
  } else {
    await prisma.liveChatConfig.create({
      data: {
        isEnabled: data.isEnabled,
        allowedPaths: data.allowedPaths,
        excludedPaths: data.excludedPaths,
        pingSoundUrl: data.pingSoundUrl,
        notificationSoundUrl: data.notificationSoundUrl,
      },
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

  const config = await prisma.liveChatConfig.findFirst();
  if (config) {
    await prisma.liveChatConfig.update({
      where: { id: config.id },
      data: {
        [type === "ping" ? "pingSoundUrl" : "notificationSoundUrl"]: url,
      },
    });
  }

  revalidatePath("/", "layout");
  return { success: true, url };
}

export async function resetLiveChatSoundAction(type: "ping" | "notification") {
  await checkAdmin();

  const config = await prisma.liveChatConfig.findFirst();
  if (config) {
    await prisma.liveChatConfig.update({
      where: { id: config.id },
      data: {
        [type === "ping" ? "pingSoundUrl" : "notificationSoundUrl"]: null,
      },
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function upsertLiveChatGreetingAction(
  data: LiveChatGreetingInput,
) {
  await checkAdmin();

  const config = await prisma.liveChatConfig.findFirst();
  if (!config) throw new Error("Live chat config not found");

  const existingGreeting = await prisma.liveChatGreeting.findUnique({
    where: { pathname: data.pathname },
  });

  if (existingGreeting) {
    await prisma.$transaction([
      prisma.liveChatGreetingTranslation.deleteMany({
        where: { greetingId: existingGreeting.id },
      }),
      prisma.liveChatGreeting.update({
        where: { id: existingGreeting.id },
        data: {
          translations: {
            create: data.translations,
          },
        },
      }),
    ]);
  } else {
    await prisma.liveChatGreeting.create({
      data: {
        pathname: data.pathname,
        configId: config.id,
        translations: {
          create: data.translations,
        },
      },
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteLiveChatGreetingAction(id: string) {
  await checkAdmin();

  await prisma.liveChatGreeting.delete({
    where: { id },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
