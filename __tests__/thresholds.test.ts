import { describe, it, expect } from 'vitest';
import { THRESHOLDS } from '../lib/insight-engine/thresholds';

describe('THRESHOLDS config', () => {
  it('exports all expected keys', () => {
    const keys = [
      'severityHighChangePct', 'severityMedChangePct',
      'demandMinChangePct', 'demandHighImpact', 'demandMedImpact',
      'demandTopN', 'demandSwingMinDelta', 'demandSwingHighImpact', 'demandSwingMedImpact',
      'tttMinDayChange', 'tttHighImpact', 'tttMedImpact',
      'coverageMinDropPct', 'coverageComplianceBaseline', 'coverageHighImpact', 'coverageMedImpact',
      'spBacklogPct', 'spResolutionDayChange', 'spHighImpact', 'spMedImpact',
      'territoryHighReps', 'territoryMedReps',
      'formularyHighImpact', 'formularyMedImpact', 'formularyLivesUnit',
    ] as const;
    for (const key of keys) {
      expect(typeof THRESHOLDS[key]).toBe('number');
      expect(THRESHOLDS[key]).toBeGreaterThan(0);
    }
  });

  it('severity high > medium (change pct)', () => {
    expect(THRESHOLDS.severityHighChangePct).toBeGreaterThan(THRESHOLDS.severityMedChangePct);
  });

  it('demand impact high > medium', () => {
    expect(THRESHOLDS.demandHighImpact).toBeGreaterThan(THRESHOLDS.demandMedImpact);
    expect(THRESHOLDS.demandSwingHighImpact).toBeGreaterThan(THRESHOLDS.demandSwingMedImpact);
  });

  it('sp impact high > medium', () => {
    expect(THRESHOLDS.spHighImpact).toBeGreaterThan(THRESHOLDS.spMedImpact);
  });

  it('formulary impact high > medium', () => {
    expect(THRESHOLDS.formularyHighImpact).toBeGreaterThan(THRESHOLDS.formularyMedImpact);
  });

  it('spBacklogPct is a fraction between 0 and 1', () => {
    expect(THRESHOLDS.spBacklogPct).toBeGreaterThan(0);
    expect(THRESHOLDS.spBacklogPct).toBeLessThan(1);
  });

  it('territory high reps > medium reps', () => {
    expect(THRESHOLDS.territoryHighReps).toBeGreaterThan(THRESHOLDS.territoryMedReps);
  });
});
