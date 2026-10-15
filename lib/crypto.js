import crypto from "crypto";

const algorithm = "aes-256-gcm";

function getKey() {
  const raw = process.env.ENCRYPTION_KEY || "pahaeposter-default-dev-key-change-me";
  return crypto.createHash("sha256").update(String(raw)).digest();
}

export function encryptSecret(plainText) {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptSecret(payload) {
  if (!payload) return "";
  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, 12);
  const authTag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const key = getKey();
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
