export type PublicActionErrorCode =
  | "UNAUTHORIZED"
  | "MISCONFIGURED"
  | "AI_RATE_LIMITED"
  | "AI_UNAVAILABLE"
  | "AI_TIMEOUT"
  | "INVALID_AI_RESPONSE"
  | "INTERNAL";

export interface PublicActionError {
  code: PublicActionErrorCode;
  message: string;
  status?: number;
  retryable: boolean;
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || !error) {
    return undefined;
  }

  const maybeStatus = (error as { status?: unknown }).status;
  if (typeof maybeStatus === "number") {
    return maybeStatus;
  }

  const maybeCause = (error as { cause?: { status?: unknown } }).cause;
  if (maybeCause && typeof maybeCause.status === "number") {
    return maybeCause.status;
  }

  return undefined;
}

function detectErrorCode(
  error: unknown,
  status: number | undefined,
): PublicActionErrorCode {
  const rawMessage = error instanceof Error ? error.message : "";
  const message = rawMessage.toLowerCase();

  if (status === 401 || message.includes("unauthorized")) {
    return "UNAUTHORIZED";
  }

  if (message.includes("gemini_api_key")) {
    return "MISCONFIGURED";
  }

  if (
    status === 429 ||
    message.includes("rate limit") ||
    message.includes("quota")
  ) {
    return "AI_RATE_LIMITED";
  }

  if (
    status === 503 ||
    message.includes("service unavailable") ||
    message.includes("high demand")
  ) {
    return "AI_UNAVAILABLE";
  }

  if (message.includes("timeout") || message.includes("timed out")) {
    return "AI_TIMEOUT";
  }

  if (error instanceof SyntaxError) {
    return "INVALID_AI_RESPONSE";
  }

  return "INTERNAL";
}

function messageForCode(code: PublicActionErrorCode, language: string) {
  const isTurkish = language === "tr";

  const trMessages: Record<PublicActionErrorCode, string> = {
    UNAUTHORIZED: "Bu işlem için yetkiniz yok.",
    MISCONFIGURED: "AI servisi yapılandırması eksik. Lütfen sistem yöneticisine bildirin.",
    AI_RATE_LIMITED:
      "AI servis kotası aşıldı. Birkaç dakika sonra tekrar deneyin.",
    AI_UNAVAILABLE:
      "AI servisi şu anda yoğun veya geçici olarak kullanılamıyor. Lütfen tekrar deneyin.",
    AI_TIMEOUT: "AI servisi zaman aşımına uğradı. Lütfen tekrar deneyin.",
    INVALID_AI_RESPONSE:
      "AI servisinden beklenmeyen formatta yanıt alındı. Lütfen tekrar deneyin.",
    INTERNAL: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
  };

  const enMessages: Record<PublicActionErrorCode, string> = {
    UNAUTHORIZED: "You are not authorized to perform this action.",
    MISCONFIGURED:
      "AI service configuration is missing. Please contact the administrator.",
    AI_RATE_LIMITED:
      "AI service quota is exceeded. Please try again in a few minutes.",
    AI_UNAVAILABLE:
      "AI service is currently busy or temporarily unavailable. Please try again.",
    AI_TIMEOUT: "AI service request timed out. Please try again.",
    INVALID_AI_RESPONSE:
      "Received an unexpected response format from AI service. Please retry.",
    INTERNAL: "An unexpected error occurred. Please try again.",
  };

  return isTurkish ? trMessages[code] : enMessages[code];
}

export function toPublicActionError(
  error: unknown,
  language: string,
): PublicActionError {
  const status = getErrorStatus(error);
  const code = detectErrorCode(error, status);
  return {
    code,
    message: messageForCode(code, language),
    status,
    retryable: code !== "UNAUTHORIZED" && code !== "MISCONFIGURED",
  };
}
