import { describe, it, expect } from 'vitest';
import { lagToDays, computeVerdict } from '../lib/impact-evaluator';

describe('lagToDays', () => {
  it('returns 0 for Immediate', () => {
    expect(lagToDays('Immediate')).toBe(0);
  });

  it('returns 7 for 1-2 weeks', () => {
    expect(lagToDays('1-2 weeks')).toBe(7);
  });

  it('returns 14 for 2-3 weeks', () => {
    expect(lagToDays('2-3 weeks')).toBe(14);
  });

  it('returns 14 for unknown value', () => {
    expect(lagToDays('unknown')).toBe(14);
  });

  it('returns 14 for empty string', () => {
    expect(lagToDays('')).toBe(14);
  });
});

describe('computeVerdict', () => {
  it('returns Yes for ≥5% improvement on higher-is-better metric', () => {
    expect(computeVerdict(100, 112, 'nrx_count')).toBe('Yes');
  });

  it('returns Partial for small improvement on higher-is-better metric', () => {
    expect(computeVerdict(100, 102, 'nrx_count')).toBe('Partial');
  });

  it('returns No for decline on higher-is-better metric', () => {
    expect(computeVerdict(100, 90, 'nrx_count')).toBe('No');
  });

  it('returns Yes for ≥5% decrease on lower-is-better metric (ttt)', () => {
    expect(computeVerdict(10, 8, 'ttt_median_days')).toBe('Yes');
  });

  it('returns No for increase on lower-is-better metric (resolution)', () => {
    expect(computeVerdict(5, 7, 'resolution_time_median')).toBe('No');
  });

  it('returns Partial for flat result', () => {
    expect(computeVerdict(100, 100, 'nrx_count')).toBe('Partial');
  });

  it('returns Partial for <2% decline', () => {
    expect(computeVerdict(100, 99, 'nrx_count')).toBe('Partial');
  });
});
