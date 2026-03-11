"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { seedDatabase } from "@/lib/db/seed";
import { getBucketName, minioClient } from "@/lib/minio";
import { getRedisClient } from "@/lib/redis";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSystemStatus() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  const status = {
    db: {
      connected: false,
      tables: [] as string[],
    },
    minio: {
      connected: false,
      bucketExists: false,
    },
    umami: {
      connected: false,
    },
    redis: {
      connected: false,
    },
  };

  // Check DB
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);
    status.db.connected = true;
    status.db.tables = result.rows.map((row) => row.table_name as string);
  } catch (error) {
    console.error("DB Status Check Error:", error);
  }

  // Check Minio
  try {
    const bucketName = getBucketName();
    // We try a listBuckets to check connectivity
    await minioClient.listBuckets();
    status.minio.connected = true;

    // Then check if our specific bucket exists
    const exists = await minioClient.bucketExists(bucketName);
    status.minio.bucketExists = exists;
  } catch (error) {
    console.error("Minio Status Check Error:", error);
    status.minio.connected = false;
  }

  // Check Redis
  try {
    const redis = await getRedisClient();
    const pong = await redis.ping();
    status.redis.connected = pong === "PONG";
  } catch (error) {
    console.error("Redis Status Check Error:", error);
  }

  // Check Umami
  try {
    const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
    if (umamiUrl) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${umamiUrl}/api/heartbeat`, {
        method: "GET",
        signal: controller.signal,
      }).catch(() =>
        fetch(umamiUrl, { method: "HEAD", signal: controller.signal }),
      );
      clearTimeout(timeoutId);
      if (res && res.ok) {
        status.umami.connected = true;
      }
    }
  } catch (error) {
    console.error("Umami Status Check Error:", error);
  }

  return status;
}

export async function seedDatabaseAction() {
  const session = await auth();
  if (
    !session?.user?.email ||
    session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL
  ) {
    throw new Error("Unauthorized");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Seeding is disabled in production.");
  }

  try {
    await seedDatabase(db);
    revalidatePath("/[locale]", "layout");
    return { success: true };
  } catch (error) {
    console.error("Seed Action Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
