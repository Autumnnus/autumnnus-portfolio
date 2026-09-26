/**
 * Several Gemini API keys with automatic failover.
 *
 * Put one or more keys in GOOGLE_GENERATIVE_AI_API_KEY (comma, space or
 * newline separated) and/or GOOGLE_GENERATIVE_AI_API_KEYS. Requests use the
 * current key; when Google answers "quota exhausted" (429) or "bad key"
 * (400/401/403 about the key), that key rests for a while and the same
 * request is replayed with the next one. The error only surfaces when every
 * key is resting.
 */

const DAY_QUOTA_REST_MS = 6 * 60 * 60 * 1000;
const RATE_REST_MS = 60 * 1000;
const BAD_KEY_REST_MS = 60 * 60 * 1000;

export function geminiKeys(): string[] {
  const raw = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEYS,
  ]
    .filter(Boolean)
    .join(",");
  return Array.from(new Set(raw.split(/[\s,;]+/).map((key) => key.trim()).filter(Boolean)));
}

export function hasGeminiKey() {
  return geminiKeys().length > 0;
}

const restingUntil = new Map<string, number>();
let current = 0;

async function restFor(response: Response): Promise<number | null> {
  if (response.ok) return null;
  const { status } = response;
  if (status !== 429 && status !== 400 && status !== 401 && status !== 403) return null;
  const body = await response.clone().text().catch(() => "");
  if (status === 429) return /per ?day|PerDay|daily/i.test(body) ? DAY_QUOTA_REST_MS : RATE_REST_MS;
  // 400/401/403 only count when Google blames the key itself.
  return /api[_ ]?key|API_KEY_INVALID|PERMISSION_DENIED|quota|billing/i.test(body)
    ? BAD_KEY_REST_MS
    : null;
}

export const rotatingGeminiFetch: typeof fetch = async (input, init) => {
  const keys = geminiKeys();
  if (keys.length <= 1) return fetch(input, init);

  let last: Response | null = null;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const index = (current + attempt) % keys.length;
    const key = keys[index];
    const isLast = attempt === keys.length - 1;
    if ((restingUntil.get(key) ?? 0) > Date.now() && !isLast) continue;

    const headers = new Headers(init?.headers);
    headers.set("x-goog-api-key", key);
    const response = await fetch(input, { ...init, headers });
    const rest = await restFor(response);
    if (rest === null) {
      current = index;
      return response;
    }
    restingUntil.set(key, Date.now() + rest);
    console.warn(
      `[assistant] Gemini key #${index + 1} unavailable (HTTP ${response.status}), trying the next one`,
    );
    last = response;
  }
  return last!;
};
