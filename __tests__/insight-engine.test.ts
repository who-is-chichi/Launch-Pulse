import { describe, it, expect } from 'vitest';
import { deriveConfidence, deriveSeverity, formatPct, formatNum, makeSparkline } from '../lib/insight-engine/utils';

// Minimal Dataset mock — only fields used by deriveConfidence
type DatasetMock = { name: string; freshness: string; [key: string]: unknown };

describe('deriveConfidence', () => {
  it('returns High when all relevant datasets are Fresh', () => {
    const datasets: DatasetMock[] = [
      { name: 'claims', freshness: 'Fresh' },
      { name: 'sp', freshness: 'Fresh' },
    ];
    expect(deriveConfidence(datasets as never, ['claims', 'sp'])).toBe('High');
  });

  it('returns Medium when any relevant dataset is Lag', () => {
    const datasets: DatasetMock[] = [
      { name: 'claims', freshness: 'Fresh' },
      { name: 'sp', freshness: 'Lag' },
    ];
    expect(deriveConfidence(datasets as never, ['claims', 'sp'])).toBe('Medium');
  });

  it('returns Low when any relevant dataset is Stale', () => {
    const datasets: DatasetMock[] = [
      { name: 'claims', freshness: 'Fresh' },
      { name: 'sp', freshness: 'Stale' },
    ];
    expect(deriveConfidence(datasets as never, ['claims', 'sp'])).toBe('Low');
  });

  it('returns High when no relevant datasets match (defaults to High)', () => {
    const datasets: DatasetMock[] = [{ name: 'other', freshness: 'Stale' }];
    expect(deriveConfidence(datasets as never, ['claims'])).toBe('High');
  });

  it('Stale takes priority over Lag', () => {
    const datasets: DatasetMock[] = [
      { name: 'claims', freshness: 'Lag' },
      { name: 'sp', freshness: 'Stale' },
    ];
    expect(deriveConfidence(datasets as never, ['claims', 'sp'])).toBe('Low');
  });
});

describe('deriveSeverity', () => {
  it('returns High when changePct >= 15', () => {
    expect(deriveSeverity(15, 0, 999, 999)).toBe('High');
    expect(deriveSeverity(20, 0, 999, 999)).toBe('High');
  });

  it('returns High when absoluteImpact >= highThreshold', () => {
    expect(deriveSeverity(0, 100, 100, 50)).toBe('High');
  });

  it('returns Medium when changePct >= 8 but < 15', () => {
    expect(deriveSeverity(8, 0, 999, 999)).toBe('Medium');
    expect(deriveSeverity(12, 0, 999, 999)).toBe('Medium');
  });

  it('returns Medium when absoluteImpact >= mediumThreshold', () => {
    expect(deriveSeverity(0, 50, 100, 50)).toBe('Medium');
  });

  it('returns Low below all thresholds', () => {
    expect(deriveSeverity(5, 10, 100, 50)).toBe('Low');
  });
});

describe('formatPct', () => {
  it('prefixes positive values with +', () => {
    expect(formatPct(12.5)).toBe('+12.5%');
  });

  it('returns negative values with - sign', () => {
    expect(formatPct(-5)).toBe('-5.0%');
  });

  it('formats zero as +0.0%', () => {
    expect(formatPct(0)).toBe('+0.0%');
  });
});

describe('formatNum', () => {
  it('prefixes positive with +', () => {
    expect(formatNum(42)).toBe('+42');
  });

  it('returns negative with - sign', () => {
    expect(formatNum(-7)).toBe('-7');
  });
});

describe('makeSparkline', () => {
  it('returns an array of length 7', () => {
    expect(makeSparkline(100, 120)).toHaveLength(7);
  });

  it('returns all values in [20, 100]', () => {
    const result = makeSparkline(100, 120);
    for (const v of result) {
      expect(v).toBeGreaterThanOrEqual(20);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it('last value is anchored to normalized current value', () => {
    const result = makeSparkline(80, 120);
    // The last point is always currentValue, which normalizes to 100 when it's the max
    expect(result[6]).toBe(100);
  });

  it('handles equal prior and current (flat line)', () => {
    const result = makeSparkline(100, 100);
    expect(result).toHaveLength(7);
    for (const v of result) {
      expect(v).toBeGreaterThanOrEqual(20);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
