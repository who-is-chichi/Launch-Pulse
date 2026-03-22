import { createHash } from 'crypto';

/**
 * Computes a deterministic SHA-256 hash of a row for deduplication / change tracking.
 * Stable: same input always produces same output.
 */
export function computeRowHash(row: unknown): string {
  return createHash('sha256').update(JSON.stringify(row)).digest('hex');
}
