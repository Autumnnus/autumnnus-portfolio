import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ENCRYPTION_VERSION = "v1";
const IV_LENGTH = 12;

function getEncryptionSecret() {
  const secret = process.env.AI_KEY_ENCRYPTION_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "AI_KEY_ENCRYPTION_SECRET is not configured. Gemini API key pool cannot encrypt credentials.",
    );
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptApiKey(value: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionSecret(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptApiKey(payload: string) {
  const [version, ivValue, authTagValue, encryptedValue] = payload.split(":");
  if (
    version !== ENCRYPTION_VERSION ||
    !ivValue ||
    !authTagValue ||
    !encryptedValue
  ) {
    throw new Error("Stored Gemini API key payload is invalid.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionSecret(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function fingerprintApiKey(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function maskApiKey(value: string) {
  if (value.length <= 8) {
    return `${value.slice(0, 2)}***${value.slice(-2)}`;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
