import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getApplicationEncryptionKey } from "@/lib/supabase/config";

const IV_LENGTH = 12;

function normalizeKey(secret: string) {
  if (!secret) {
    throw new Error("APP_ENCRYPTION_KEY is required for tenant connector secrets");
  }

  return createHash("sha256").update(secret).digest();
}

function getCipherKey() {
  return normalizeKey(getApplicationEncryptionKey());
}

export function encryptText(plaintext: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getCipherKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64url"), authTag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptText(ciphertext: string) {
  const [ivPart, tagPart, payloadPart] = ciphertext.split(".");

  if (!ivPart || !tagPart || !payloadPart) {
    throw new Error("Connector secret payload is malformed");
  }

  const decipher = createDecipheriv("aes-256-gcm", getCipherKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadPart, "base64url")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function encryptJson(value: unknown) {
  return encryptText(JSON.stringify(value));
}

export function decryptJson<T>(ciphertext: string) {
  return JSON.parse(decryptText(ciphertext)) as T;
}
