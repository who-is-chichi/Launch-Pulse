/**
 * Sliding window rate limiter for API endpoints.
 * Separate from lib/rate-limit.ts (which is for login attempts).
 *
 * Limitations (same as lib/rate-limit.ts):
 * - In-memory only — not shared across multiple server instances
 * - Resets on server restart
 * - Passive cleanup on read (no background timer)
 */

interface WindowRecord {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowRecord>();

const LIMITS: Record<string, { maxReqs: number; windowMs: number }> = {
  ai:     { maxReqs: 20, windowMs: 60_000 }, // 20 req/min per user
  engine: { maxReqs: 5,  windowMs: 60_000 }, // 5 req/min per user
};

function pruneExpiredEntries(now: number): void {
  for (const [key, record] of store.entries()) {
    const category = key.split(':')[1] as keyof typeof LIMITS;
    const limit = LIMITS[category];
    if (limit && now - record.windowStart > limit.windowMs) {
      store.delete(key);
    }
  }
}

export function checkApiRateLimit(
  userId: string,
  category: 'ai' | 'engine',
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  pruneExpiredEntries(now);

  const key = `${userId}:${category}`;
  const limit = LIMITS[category];
  const record = store.get(key);

  if (!record || now - record.windowStart > limit.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (record.count >= limit.maxReqs) {
    const retryAfterSeconds = Math.ceil((record.windowStart + limit.windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  store.set(key, { ...record, count: record.count + 1 });
  return { allowed: true };
}
