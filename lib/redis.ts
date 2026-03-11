import "server-only";
import Redis from "ioredis";

let redisClient: Redis | null = null;

export async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    throw new Error(
      "REDIS_URL is not configured. Gemini API key runtime state requires Redis.",
    );
  }

  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
  }

  if (redisClient.status === "wait" || redisClient.status === "end") {
    await redisClient.connect();
  }

  return redisClient;
}
