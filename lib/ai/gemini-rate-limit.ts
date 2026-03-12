import type { ErrorDetails } from "@google/generative-ai";

export type QuotaBlockReason = "rpm" | "rpd" | "unknown";

export interface GeminiRateLimitResolution {
  isRateLimited: boolean;
  blockReason: QuotaBlockReason;
  blockedUntil: Date;
  retryAfterSeconds: number;
}

export function isGeminiTemporaryUnavailable(error: unknown) {
  const status = extractStatus(error);
  const details = extractErrorDetails(error);
  const context = getErrorContext(error, details);

  return (
    status === 503 ||
    context.includes("service unavailable") ||
    context.includes("high demand") ||
    context.includes("try again later")
  );
}

function extractStatus(error: unknown) {
  if (typeof error !== "object" || !error) {
    return undefined;
  }

  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function extractErrorDetails(error: unknown): ErrorDetails[] {
  if (typeof error !== "object" || !error) {
    return [];
  }

  const details = (error as { errorDetails?: unknown }).errorDetails;
  return Array.isArray(details) ? (details as ErrorDetails[]) : [];
}

function parseDurationSeconds(value: string) {
  const parsed = Number.parseFloat(value.replace(/s$/, ""));
  return Number.isFinite(parsed) ? Math.max(1, Math.ceil(parsed)) : null;
}

function getRetryInfoSeconds(details: ErrorDetails[]) {
  for (const detail of details) {
    if (!String(detail["@type"] ?? "").includes("RetryInfo")) {
      continue;
    }

    const retryDelay = detail.retryDelay;
    if (typeof retryDelay === "string") {
      const parsed = parseDurationSeconds(retryDelay);
      if (parsed) return parsed;
    }

    if (
      typeof retryDelay === "object" &&
      retryDelay &&
      typeof (retryDelay as { seconds?: unknown }).seconds === "string"
    ) {
      const parsed = parseDurationSeconds(
        `${(retryDelay as { seconds: string }).seconds}s`,
      );
      if (parsed) return parsed;
    }
  }

  return null;
}

function getErrorContext(error: unknown, details: ErrorDetails[]) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const detailText = details
    .flatMap((detail) => {
      const metadata = detail.metadata
        ? Object.values(detail.metadata).map((value) => String(value))
        : [];

      return [
        String(detail["@type"] ?? ""),
        String(detail.reason ?? ""),
        String(detail.domain ?? ""),
        ...metadata,
        JSON.stringify(detail),
      ];
    })
    .join(" ")
    .toLowerCase();

  return `${message} ${detailText}`;
}

export function getNextPacificMidnight(from = new Date()) {
  const pacificDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(from);

  const year = Number(
    pacificDate.find((part) => part.type === "year")?.value ?? "0",
  );
  const month = Number(
    pacificDate.find((part) => part.type === "month")?.value ?? "1",
  );
  const day = Number(
    pacificDate.find((part) => part.type === "day")?.value ?? "1",
  );

  const pacificOffset = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0)))
    .find((part) => part.type === "timeZoneName")
    ?.value;

  const offsetMatch = pacificOffset?.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
  const offsetHours = Number(offsetMatch?.[1] ?? "-8");
  const offsetMinutes = Number(offsetMatch?.[2] ?? "0");
  const offsetMs = (offsetHours * 60 + Math.sign(offsetHours) * offsetMinutes) * 60 * 1000;

  return new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0) - offsetMs);
}

export function resolveGeminiRateLimit(
  error: unknown,
  now: Date = new Date(),
): GeminiRateLimitResolution | null {
  if (isGeminiTemporaryUnavailable(error)) {
    return null;
  }

  const status = extractStatus(error);
  const details = extractErrorDetails(error);
  const context = getErrorContext(error, details);
  const isRateLimited =
    status === 429 ||
    context.includes("rate limit") ||
    context.includes("quota") ||
    context.includes("resource_exhausted");

  if (!isRateLimited) {
    return null;
  }

  const retryInfoSeconds = getRetryInfoSeconds(details);
  const isDailyQuota =
    context.includes("per day") ||
    context.includes("request/day") ||
    context.includes("requests/day") ||
    context.includes("rpd") ||
    context.includes("daily");

  const isMinuteQuota =
    context.includes("per minute") ||
    context.includes("request/minute") ||
    context.includes("requests/minute") ||
    context.includes("rpm") ||
    context.includes("minute");

  let blockReason: QuotaBlockReason = "unknown";
  let blockedUntil: Date;

  if (isDailyQuota) {
    blockReason = "rpd";
    blockedUntil = getNextPacificMidnight(now);
  } else {
    blockReason = isMinuteQuota ? "rpm" : "unknown";
    blockedUntil = new Date(
      now.getTime() + (retryInfoSeconds ?? 60) * 1000,
    );
  }

  return {
    isRateLimited: true,
    blockReason,
    blockedUntil,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000),
    ),
  };
}
