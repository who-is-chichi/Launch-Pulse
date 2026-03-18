interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const store = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
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
