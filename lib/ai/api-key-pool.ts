import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiApiKey } from "@/lib/db/schema";
import { getRedisClient } from "@/lib/redis";
import {
  decryptApiKey,
  encryptApiKey,
  fingerprintApiKey,
  maskApiKey,
} from "./api-key-crypto";
import {
  type ApiKeyCategory,
  selectAvailableApiKey,
  sortSelectableApiKeys,
} from "./api-key-selector";
import type { QuotaBlockReason } from "./gemini-rate-limit";

export type { ApiKeyCategory } from "./api-key-selector";

export type AiProvider = "gemini";

export interface AiApiKeyRecord {
  id: string;
  provider: AiProvider;
  label: string;
  maskedKey: string;
  keyFingerprint: string;
  category: ApiKeyCategory;
  priority: number;
  quotaGroup: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiApiKeyRuntimeStatus {
  blockedUntil: string | null;
  blockReason: QuotaBlockReason | null;
  retryAfterSeconds: number | null;
  last429At: string | null;
  lastSuccessAt: string | null;
  lastSelectedAt: string | null;
  lastErrorAt: string | null;
  runtimeAvailable: boolean;
}

export interface AiApiKeyAdminRecord extends AiApiKeyRecord {
  runtimeStatus: AiApiKeyRuntimeStatus;
}

export interface GeminiApiKeyInput {
  label: string;
  apiKey: string;
  category: ApiKeyCategory;
  priority: number;
  quotaGroup: string;
  isActive: boolean;
}

export interface GeminiApiKeyUpdateInput {
  label: string;
  apiKey?: string | null;
  category: ApiKeyCategory;
  priority: number;
  quotaGroup: string;
  isActive: boolean;
}

interface GeminiApiKeyRow {
  id: string;
  provider: AiProvider;
  label: string;
  encryptedKey: string;
  keyFingerprint: string;
  category: ApiKeyCategory;
  priority: number;
  quotaGroup: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeminiRuntimeCandidate extends GeminiApiKeyRow {
  apiKey: string;
}

const PROVIDER: AiProvider = "gemini";

function getProjectSlug() {
  return process.env.AI_KEY_POOL_PROJECT_SLUG?.trim() || "autumnnus-portfolio";
}

function getRedisPrefix() {
  return `${process.env.REDIS_KEY_PREFIX?.trim() || "ai-key-pool"}:v1:${getProjectSlug()}:${PROVIDER}`;
}

function getQuotaGroupStateKey(quotaGroup: string) {
  return `${getRedisPrefix()}:quota-group:${quotaGroup}`;
}

function getCredentialStateKey(id: string) {
  return `${getRedisPrefix()}:credential:${id}`;
}

function normalizeCategory(value: string): ApiKeyCategory {
  if (value !== "free" && value !== "paid") {
    throw new Error("Gemini API key category must be either free or paid.");
  }

  return value;
}

function normalizePriority(value: number) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Gemini API key priority must be a non-negative integer.");
  }

  return value;
}

function normalizeLabel(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Gemini API key label is required.");
  }

  return normalized;
}

function normalizeQuotaGroup(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Gemini API key quota group is required.");
  }

  return normalized;
}

function normalizeApiKey(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Gemini API key value is required.");
  }

  return normalized;
}

function sanitizeAiApiKey(row: GeminiApiKeyRow): AiApiKeyRecord {
  const apiKeyValue = decryptApiKey(row.encryptedKey);

  return {
    id: row.id,
    provider: row.provider,
    label: row.label,
    maskedKey: maskApiKey(apiKeyValue),
    keyFingerprint: row.keyFingerprint,
    category: row.category,
    priority: row.priority,
    quotaGroup: row.quotaGroup,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapRuntimeStatus(
  quotaState: Record<string, string>,
  credentialState: Record<string, string>,
  runtimeAvailable: boolean,
): AiApiKeyRuntimeStatus {
  const blockedUntil =
    quotaState.blockedUntil && new Date(quotaState.blockedUntil) > new Date()
      ? quotaState.blockedUntil
      : null;

  return {
    blockedUntil,
    blockReason:
      blockedUntil && quotaState.blockReason
        ? (quotaState.blockReason as QuotaBlockReason)
        : null,
    retryAfterSeconds:
      blockedUntil && quotaState.blockedUntil
        ? Math.max(
            1,
            Math.ceil(
              (new Date(quotaState.blockedUntil).getTime() - Date.now()) / 1000,
            ),
          )
        : null,
    last429At: quotaState.last429At || null,
    lastSuccessAt: quotaState.lastSuccessAt || credentialState.lastSuccessAt || null,
    lastSelectedAt: credentialState.lastSelectedAt || null,
    lastErrorAt: credentialState.lastErrorAt || null,
    runtimeAvailable,
  };
}

async function getGeminiApiKeyRows() {
  const rows = await db
    .select()
    .from(aiApiKey)
    .where(eq(aiApiKey.provider, PROVIDER))
    .orderBy(
      asc(aiApiKey.category),
      asc(aiApiKey.priority),
      asc(aiApiKey.createdAt),
    );

  return rows as GeminiApiKeyRow[];
}

async function ensureFingerprintUnique(
  fingerprint: string,
  excludeId?: string,
) {
  const existing = excludeId
    ? await db.query.aiApiKey.findFirst({
        where: (table, { and, eq, ne }) =>
          and(
            eq(table.provider, PROVIDER),
            eq(table.keyFingerprint, fingerprint),
            ne(table.id, excludeId),
          ),
      })
    : await db.query.aiApiKey.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.provider, PROVIDER),
            eq(table.keyFingerprint, fingerprint),
          ),
      });

  if (existing) {
    throw new Error(
      `A Gemini API key with fingerprint ${fingerprint} is already stored.`,
    );
  }
}

export async function getGeminiApiKeysAdminSnapshot() {
  const rows = await getGeminiApiKeyRows();
  const sanitized = rows.map(sanitizeAiApiKey);

  try {
    const redis = await getRedisClient();
    const quotaGroups = [...new Set(rows.map((row) => row.quotaGroup))];
    const pipeline = redis.multi();

    for (const quotaGroup of quotaGroups) {
      pipeline.hgetall(getQuotaGroupStateKey(quotaGroup));
    }

    for (const row of rows) {
      pipeline.hgetall(getCredentialStateKey(row.id));
    }

    const responses = await pipeline.exec();
    const safeResponses = responses ?? [];
    const quotaStateCount = quotaGroups.length;

    const quotaStates = new Map<string, Record<string, string>>();
    quotaGroups.forEach((quotaGroup, index) => {
      const payload = safeResponses[index]?.[1];
      quotaStates.set(
        quotaGroup,
        typeof payload === "object" && payload
          ? (payload as Record<string, string>)
          : {},
      );
    });

    const credentialStates = new Map<string, Record<string, string>>();
    rows.forEach((row, index) => {
      const payload = safeResponses[quotaStateCount + index]?.[1];
      credentialStates.set(
        row.id,
        typeof payload === "object" && payload
          ? (payload as Record<string, string>)
          : {},
      );
    });

    return sanitized.map((record) => ({
      ...record,
      runtimeStatus: mapRuntimeStatus(
        quotaStates.get(record.quotaGroup) ?? {},
        credentialStates.get(record.id) ?? {},
        true,
      ),
    }));
  } catch {
    return sanitized.map((record) => ({
      ...record,
      runtimeStatus: mapRuntimeStatus({}, {}, false),
    }));
  }
}

export async function createGeminiApiKey(input: GeminiApiKeyInput) {
  const apiKeyValue = normalizeApiKey(input.apiKey);
  const fingerprint = fingerprintApiKey(apiKeyValue);

  await ensureFingerprintUnique(fingerprint);

  await db.insert(aiApiKey).values({
    provider: PROVIDER,
    label: normalizeLabel(input.label),
    encryptedKey: encryptApiKey(apiKeyValue),
    keyFingerprint: fingerprint,
    category: normalizeCategory(input.category),
    priority: normalizePriority(input.priority),
    quotaGroup: normalizeQuotaGroup(input.quotaGroup),
    isActive: input.isActive,
  });
}

export async function updateGeminiApiKey(
  id: string,
  input: GeminiApiKeyUpdateInput,
) {
  const existing = await db.query.aiApiKey.findFirst({
    where: and(eq(aiApiKey.id, id), eq(aiApiKey.provider, PROVIDER)),
  });

  if (!existing) {
    throw new Error("Gemini API key record was not found.");
  }

  let encryptedKey = existing.encryptedKey;
  let keyFingerprint = existing.keyFingerprint;

  const nextApiKey = input.apiKey?.trim();
  if (nextApiKey) {
    keyFingerprint = fingerprintApiKey(nextApiKey);
    await ensureFingerprintUnique(keyFingerprint, id);
    encryptedKey = encryptApiKey(nextApiKey);
  }

  await db
    .update(aiApiKey)
    .set({
      label: normalizeLabel(input.label),
      encryptedKey,
      keyFingerprint,
      category: normalizeCategory(input.category),
      priority: normalizePriority(input.priority),
      quotaGroup: normalizeQuotaGroup(input.quotaGroup),
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(and(eq(aiApiKey.id, id), eq(aiApiKey.provider, PROVIDER)));
}

export async function deleteGeminiApiKey(id: string) {
  const deleted = await db
    .delete(aiApiKey)
    .where(and(eq(aiApiKey.id, id), eq(aiApiKey.provider, PROVIDER)))
    .returning({ id: aiApiKey.id });

  if (deleted.length === 0) {
    throw new Error("Gemini API key record was not found.");
  }

  try {
    const redis = await getRedisClient();
    await redis.del(getCredentialStateKey(id));
  } catch {
    // Ignore Redis cleanup errors; runtime state is ephemeral.
  }
}

export async function getActiveGeminiRuntimeCandidates() {
  const rows = (await getGeminiApiKeyRows()).filter((row) => row.isActive);

  return sortSelectableApiKeys(
    rows.map((row) => ({
      ...row,
      apiKey: decryptApiKey(row.encryptedKey),
    })),
  ) as GeminiRuntimeCandidate[];
}

export async function getQuotaGroupBlockMap(
  keys: Pick<GeminiRuntimeCandidate, "quotaGroup">[],
) {
  const blockedUntilByQuotaGroup = new Map<string, Date | null>();
  const quotaGroups = [...new Set(keys.map((key) => key.quotaGroup))];

  try {
    const redis = await getRedisClient();
    const pipeline = redis.multi();
    for (const quotaGroup of quotaGroups) {
      pipeline.hget(getQuotaGroupStateKey(quotaGroup), "blockedUntil");
    }

    const responses = await pipeline.exec();
    quotaGroups.forEach((quotaGroup, index) => {
      const value = responses?.[index]?.[1];
      blockedUntilByQuotaGroup.set(
        quotaGroup,
        typeof value === "string" && value ? new Date(value) : null,
      );
    });
  } catch {
    quotaGroups.forEach((quotaGroup) => {
      blockedUntilByQuotaGroup.set(quotaGroup, null);
    });
  }

  return blockedUntilByQuotaGroup;
}

export async function markGeminiCredentialSelected(id: string) {
  const redis = await getRedisClient();
  await redis.hset(
    getCredentialStateKey(id),
    "lastSelectedAt",
    new Date().toISOString(),
  );
}

export async function markGeminiCredentialSuccess(
  id: string,
  quotaGroup: string,
) {
  const now = new Date().toISOString();
  const redis = await getRedisClient();
  const pipeline = redis.multi();
  pipeline.hset(getCredentialStateKey(id), "lastSuccessAt", now);
  pipeline.hset(getQuotaGroupStateKey(quotaGroup), "lastSuccessAt", now);
  pipeline.hdel(
    getQuotaGroupStateKey(quotaGroup),
    "blockedUntil",
    "blockReason",
    "retryAfterSeconds",
    "last429At",
  );
  await pipeline.exec();
}

export async function markGeminiCredentialError(id: string) {
  const redis = await getRedisClient();
  await redis.hset(
    getCredentialStateKey(id),
    "lastErrorAt",
    new Date().toISOString(),
  );
}

export async function blockGeminiQuotaGroup(input: {
  quotaGroup: string;
  blockReason: QuotaBlockReason;
  blockedUntil: Date;
  retryAfterSeconds: number;
}) {
  const now = new Date().toISOString();
  const redis = await getRedisClient();
  await redis.hset(getQuotaGroupStateKey(input.quotaGroup), {
    blockedUntil: input.blockedUntil.toISOString(),
    blockReason: input.blockReason,
    retryAfterSeconds: String(input.retryAfterSeconds),
    last429At: now,
  });
}

export function selectGeminiRuntimeCandidate(
  keys: GeminiRuntimeCandidate[],
  blockedUntilByQuotaGroup: Map<string, Date | null>,
  excludedQuotaGroups?: Set<string>,
) {
  return selectAvailableApiKey(keys, {
    blockedUntilByQuotaGroup,
    excludedQuotaGroups,
  });
}
