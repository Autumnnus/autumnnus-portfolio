import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Anonymous visitor identity for the assistant.
 *
 * - The browser holds a signed random id (`autumn_vid=<id>.<sig>`), HttpOnly.
 * - The database only ever sees an HMAC of that id (`visitorKey`), so a DB
 *   leak cannot be used to impersonate a visitor and read their threads.
 * - IPs are never stored raw; rate-limit keys use a keyed hash.
 */

export const VISITOR_COOKIE = "autumn_vid";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET is required for the AI assistant.");
    }
    return "dev-only-assistant-secret";
  }
  return value;
}

function hmac(purpose: string, value: string, length = 32) {
  return createHmac("sha256", secret())
    .update(`${purpose}:${value}`)
    .digest("base64url")
    .slice(0, length);
}

/** Key used for HMAC-signed tool approvals, derived from AUTH_SECRET. */
export function toolApprovalSecret() {
  return createHmac("sha256", secret()).update("tool-approval").digest();
}

export function createVisitorCookieValue() {
  const id = randomBytes(18).toString("base64url");
  return `${id}.${hmac("vid-sig", id, 22)}`;
}

/** Returns the visitor id if the cookie is present and correctly signed. */
export function verifyVisitorCookie(value: string | undefined): string | null {
  if (!value) return null;
  const [id, signature] = value.split(".");
  if (!id || !signature || id.length < 16) return null;
  const expected = Buffer.from(hmac("vid-sig", id, 22));
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return null;
  return timingSafeEqual(expected, received) ? id : null;
}

export function visitorKeyFor(visitorId: string) {
  return hmac("visitor", visitorId);
}

/**
 * Client IP behind `TRUSTED_PROXY_HOPS` reverse proxies.
 *
 * Proxies append to X-Forwarded-For, so the only trustworthy entry is the
 * one added by our outermost proxy — counted from the right. Anything to its
 * left was supplied by the client and can be spoofed.
 */
export function clientIp(headers: Headers): string {
  const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS ?? 1) || 1);
  const forwarded = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (forwarded?.length) {
    return forwarded[Math.max(0, forwarded.length - hops)];
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function ipKeyFor(ip: string) {
  return hmac("ip", ip, 24);
}
