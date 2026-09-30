import crypto from "crypto";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function generateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function getCachedAIResult<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCachedAIResult<T>(key: string, data: T, ttlSeconds = 3600): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}
