/**
 * AES-256-GCM encryption/decryption for uploaded files.
 * Key sourced from ENCRYPTION_KEY env var (32-byte hex string).
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // bytes for AES-256
const IV_LENGTH = 12;  // bytes for GCM
const TAG_LENGTH = 16; // bytes for auth tag

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) {
    // Development fallback: deterministic 32-byte key
    return Buffer.alloc(KEY_LENGTH, "connect-dev-key-placeholder-32b!");
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Got ${key.length} bytes.`);
  }
  return key;
}

/** Encrypt a Buffer. Returns base64-encoded `iv:tag:ciphertext`. */
export function encrypt(plaintext: Buffer): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Compact: base64(iv) + ":" + base64(tag) + ":" + base64(ciphertext)
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

/** Decrypt a base64-encoded `iv:tag:ciphertext` string. Returns original Buffer. */
export function decrypt(encoded: string): Buffer {
  const key = getKey();
  const parts = encoded.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted format.");
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

/** Compute SHA-256 hash of a buffer — used as cache key for parsed content. */
export function sha256(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
