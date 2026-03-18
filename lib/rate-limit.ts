/**
 * In-memory rate limiter for login attempts.
 *
 * Known limitations (acceptable for single-instance small-team deployment):
 *   1. NOT SHARED: Each server process has its own store. In a multi-instance or
 *      serverless environment, an attacker can bypass limits by hitting different instances.
 *   2. NOT DURABLE: Store is lost on process restart/redeploy. A locked-out attacker
 *      can bypass their lockout by waiting for a server restart.
 *   3. BOUNDED by passive cleanup only: Old entries are pruned when checkRateLimit is
 *      called, not on a background timer. Under heavy unique-email spam, the Map can
 *      grow until pruning runs. For production at scale, replace with Redis.
 */

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const store = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

function pruneExpiredEntries(now: number): void {
  for (const [key, record] of store.entries()) {
    const windowExpired = now - record.firstAttemptAt > WINDOW_MS;
    const lockoutExpired = !record.lockedUntil || now > record.lockedUntil;
    if (windowExpired && lockoutExpired) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  pruneExpiredEntries(now);
  const record = store.get(key);

  if (record?.lockedUntil && now < record.lockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    store.set(key, { count: 1, firstAttemptAt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  const newCount = record.count + 1;
  if (newCount >= MAX_ATTEMPTS) {
    store.set(key, { ...record, count: newCount, lockedUntil: now + LOCKOUT_MS });
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds: LOCKOUT_MS / 1000 };
  }

  store.set(key, { ...record, count: newCount });
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - newCount };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
