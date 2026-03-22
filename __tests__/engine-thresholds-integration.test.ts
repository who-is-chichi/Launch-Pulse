/**
 * Integration tests: each template fires AT the threshold boundary and
 * does NOT fire below it. THRESHOLDS values are used directly — no hardcoded numbers.
 */
import { describe, it, expect } from 'vitest';
import { THRESHOLDS } from '../lib/insight-engine/thresholds';
import type { EngineInput } from '../lib/insight-engine/types';

// Lazy-import each template so tree-shaking doesn't bite us in tests
import { run as demandAdoptionInflection } from '../lib/insight-engine/templates/demand-adoption-inflection';
import { run as startopsSpBottleneck } from '../lib/insight-engine/templates/startops-sp-bottleneck';
import { run as executionCoverageShift } from '../lib/insight-engine/templates/execution-coverage-shift';
import { run as structureTerritoryChurn } from '../lib/insight-engine/templates/structure-territory-churn';
import { run as startopsTttShift } from '../lib/insight-engine/templates/startops-ttt-shift';
import { run as demandTopSystemsSwing } from '../lib/insight-engine/templates/demand-top-systems-swing';

// ---------------------------------------------------------------------------
// Shared date fixtures — filterByWeek / findByDate do ISO date-string comparison
// ---------------------------------------------------------------------------
const CURRENT = new Date('2024-01-14T00:00:00.000Z');
const PRIOR   = new Date('2024-01-07T00:00:00.000Z');

// Empty defaults for fields not under test
const BASE_INPUT = {
  brandId: 'brand-1',
  dataRunId: 'run-1',
  claimsFacts: [],
  spFacts: [],
  callsFacts: [],
  structureEvents: [],
  territoryChanges: [],
  datasets: [],
  currentWeekEnding: CURRENT,
  priorWeekEnding: PRIOR,
} satisfies EngineInput;

// ---------------------------------------------------------------------------
// Helper: build a minimal ClaimsMetricsFact row
// ---------------------------------------------------------------------------
function claimsRow(opts: {
  weekEnding: Date;
  nrxCount: number;
  dimension?: string;
  dimensionType?: string;
}) {
  return {
    id: 'cf-1',
    brandId: 'brand-1',
    dataRunId: 'run-1',
    weekEnding: opts.weekEnding,
    nrxCount: opts.nrxCount,
    trxCount: 0,
    dimension: opts.dimension ?? 'nation',
    dimensionType: opts.dimensionType ?? 'nation',
    marketShare: 0,
    createdAt: CURRENT,
  } as unknown as EngineInput['claimsFacts'][number];
}

// ---------------------------------------------------------------------------
// Helper: build a minimal SpMetricsFact row (uses recordDate)
// ---------------------------------------------------------------------------
function spRow(opts: {
  recordDate: Date;
  pendingOutreachCount?: number;
  resolutionTimeMedian?: number;
  tttMedianDays?: number;
}) {
  return {
    id: 'sp-1',
    brandId: 'brand-1',
    dataRunId: 'run-1',
    recordDate: opts.recordDate,
    pendingOutreachCount: opts.pendingOutreachCount ?? 0,
    resolutionTimeMedian: opts.resolutionTimeMedian ?? 0,
    tttMedianDays: opts.tttMedianDays ?? 0,
    newPatientStarts: 0,
    createdAt: CURRENT,
  } as unknown as EngineInput['spFacts'][number];
}

// ---------------------------------------------------------------------------
// Helper: build a minimal CallsMetricsFact row (uses weekEnding)
// ---------------------------------------------------------------------------
function callsRow(opts: {
  weekEnding: Date;
  territory: string;
  compliancePct: number;
}) {
  return {
    id: 'cr-1',
    brandId: 'brand-1',
    dataRunId: 'run-1',
    weekEnding: opts.weekEnding,
    territory: opts.territory,
    compliancePct: opts.compliancePct,
    callCount: 0,
    hcpCount: 0,
    createdAt: CURRENT,
  } as unknown as EngineInput['callsFacts'][number];
}

// ---------------------------------------------------------------------------
// Helper: build a minimal TerritoryChangeLog row
// ---------------------------------------------------------------------------
function territoryChangeRow(opts: {
  changeType: 'vacancy' | 'realignment';
  affectedReps: number;
  territory?: string;
  region?: string;
}) {
  return {
    id: 'tc-1',
    brandId: 'brand-1',
    dataRunId: 'run-1',
    changeType: opts.changeType,
    affectedReps: opts.affectedReps,
    territory: opts.territory ?? 'Territory A',
    region: opts.region ?? 'Northeast',
    effectiveDate: CURRENT,
    createdAt: CURRENT,
  } as unknown as EngineInput['territoryChanges'][number];
}

// ===========================================================================
// 1. demandAdoptionInflection
//    Fires when abs(delta / prior) >= demandMinChangePct / 100 (i.e., 0.10)
// ===========================================================================
describe('demandAdoptionInflection — threshold boundary', () => {
  // prior = 100, curr = 100 + change.  pct = change/100
  const priorCount = 100;
  const minChangeFraction = THRESHOLDS.demandMinChangePct / 100; // 0.10

  it('fires when NRx change is AT the minimum threshold', () => {
    const changeAtThreshold = Math.ceil(priorCount * minChangeFraction); // 10
    const input: EngineInput = {
      ...BASE_INPUT,
      claimsFacts: [
        claimsRow({ weekEnding: PRIOR,   nrxCount: priorCount }),
        claimsRow({ weekEnding: CURRENT, nrxCount: priorCount + changeAtThreshold }),
      ],
    };
    expect(demandAdoptionInflection(input)).not.toBeNull();
  });

  it('does not fire when NRx change is BELOW the minimum threshold', () => {
    // 1 count below threshold: pct = 9/100 = 0.09 < 0.10
    const changeBelowThreshold = Math.ceil(priorCount * minChangeFraction) - 1; // 9
    const input: EngineInput = {
      ...BASE_INPUT,
      claimsFacts: [
        claimsRow({ weekEnding: PRIOR,   nrxCount: priorCount }),
        claimsRow({ weekEnding: CURRENT, nrxCount: priorCount + changeBelowThreshold }),
      ],
    };
    expect(demandAdoptionInflection(input)).toBeNull();
  });
});

// ===========================================================================
// 2. startopsSpBottleneck
//    Fires when backlogPct = abs(curr - prior) / prior >= spBacklogPct (0.15)
//    backlogPct is computed from pendingOutreachCount
// ===========================================================================
describe('startopsSpBottleneck — threshold boundary', () => {
  // prior = 100 cases; need curr such that abs(curr-100)/100 >= 0.15 => curr >= 115
  const priorCases = 100;

  it('fires when backlog pct is AT the threshold', () => {
    // backlogPct = (115 - 100) / 100 = 0.15 = spBacklogPct exactly
    const currCases = Math.ceil(priorCases * (1 + THRESHOLDS.spBacklogPct)); // 115
    const input: EngineInput = {
      ...BASE_INPUT,
      spFacts: [
        spRow({ recordDate: PRIOR,   pendingOutreachCount: priorCases, resolutionTimeMedian: 5, tttMedianDays: 10 }),
        spRow({ recordDate: CURRENT, pendingOutreachCount: currCases,  resolutionTimeMedian: 5, tttMedianDays: 10 }),
      ],
    };
    expect(startopsSpBottleneck(input)).not.toBeNull();
  });

  it('does not fire when backlog pct is BELOW the threshold (and resolution unchanged)', () => {
    // backlogPct = (114 - 100) / 100 = 0.14 < 0.15  AND resolutionChange = 0
    const currCases = Math.ceil(priorCases * (1 + THRESHOLDS.spBacklogPct)) - 1; // 114
    const input: EngineInput = {
      ...BASE_INPUT,
      spFacts: [
        spRow({ recordDate: PRIOR,   pendingOutreachCount: priorCases, resolutionTimeMedian: 5, tttMedianDays: 10 }),
        spRow({ recordDate: CURRENT, pendingOutreachCount: currCases,  resolutionTimeMedian: 5, tttMedianDays: 10 }),
      ],
    };
    expect(startopsSpBottleneck(input)).toBeNull();
  });
});

// ===========================================================================
// 3. executionCoverageShift
//    Fires when drop = priorPct - currPct >= coverageMinDropPct (5)
// ===========================================================================
describe('executionCoverageShift — threshold boundary', () => {
  const priorCompliance = 80;

  it('fires when compliance drop is AT the minimum threshold', () => {
    const currCompliance = priorCompliance - THRESHOLDS.coverageMinDropPct; // 75 — drop = 5
    const input: EngineInput = {
      ...BASE_INPUT,
      callsFacts: [
        callsRow({ weekEnding: PRIOR,   territory: 'NE-01', compliancePct: priorCompliance }),
        callsRow({ weekEnding: CURRENT, territory: 'NE-01', compliancePct: currCompliance }),
      ],
    };
    expect(executionCoverageShift(input)).not.toBeNull();
  });

  it('does not fire when compliance drop is BELOW the minimum threshold', () => {
    // drop = 4 < 5
    const currCompliance = priorCompliance - (THRESHOLDS.coverageMinDropPct - 1); // 76
    const input: EngineInput = {
      ...BASE_INPUT,
      callsFacts: [
        callsRow({ weekEnding: PRIOR,   territory: 'NE-01', compliancePct: priorCompliance }),
        callsRow({ weekEnding: CURRENT, territory: 'NE-01', compliancePct: currCompliance }),
      ],
    };
    expect(executionCoverageShift(input)).toBeNull();
  });
});

// ===========================================================================
// 4. structureTerritoryChurn
//    Medium when totalAffected >= territoryMedReps (2)
//    High   when totalAffected >= territoryHighReps (5)
// ===========================================================================
describe('structureTerritoryChurn — severity thresholds', () => {
  it('fires as Medium when affectedReps equals territoryMedReps', () => {
    const input: EngineInput = {
      ...BASE_INPUT,
      territoryChanges: [
        territoryChangeRow({ changeType: 'vacancy', affectedReps: THRESHOLDS.territoryMedReps }),
      ],
    };
    const result = structureTerritoryChurn(input);
    expect(result).not.toBeNull();
    expect(result?.severity).toBe('Medium');
  });

  it('fires as High when affectedReps equals territoryHighReps', () => {
    const input: EngineInput = {
      ...BASE_INPUT,
      territoryChanges: [
        territoryChangeRow({ changeType: 'vacancy', affectedReps: THRESHOLDS.territoryHighReps }),
      ],
    };
    const result = structureTerritoryChurn(input);
    expect(result).not.toBeNull();
    expect(result?.severity).toBe('High');
  });

  it('fires as Low when affectedReps is below territoryMedReps', () => {
    const input: EngineInput = {
      ...BASE_INPUT,
      territoryChanges: [
        territoryChangeRow({ changeType: 'vacancy', affectedReps: THRESHOLDS.territoryMedReps - 1 }),
      ],
    };
    const result = structureTerritoryChurn(input);
    expect(result).not.toBeNull();
    expect(result?.severity).toBe('Low');
  });
});

// ===========================================================================
// 5. startopsTttShift
//    Fires when Math.abs(dayChange) >= tttMinDayChange (1)
//    i.e., does NOT fire when Math.abs(dayChange) < 1
// ===========================================================================
describe('startopsTttShift — threshold boundary', () => {
  it('fires when TTT day change is AT the minimum threshold', () => {
    // dayChange = tttMinDayChange = 1 exactly
    const input: EngineInput = {
      ...BASE_INPUT,
      spFacts: [
        spRow({ recordDate: PRIOR,   tttMedianDays: 10, pendingOutreachCount: 0, resolutionTimeMedian: 5 }),
        spRow({ recordDate: CURRENT, tttMedianDays: 10 + THRESHOLDS.tttMinDayChange, pendingOutreachCount: 0, resolutionTimeMedian: 5 }),
      ],
    };
    expect(startopsTttShift(input)).not.toBeNull();
  });

  it('does not fire when TTT day change is BELOW the minimum threshold', () => {
    // dayChange = 0 < 1 — abs(0) < 1 so template returns null
    const input: EngineInput = {
      ...BASE_INPUT,
      spFacts: [
        spRow({ recordDate: PRIOR,   tttMedianDays: 10, pendingOutreachCount: 0, resolutionTimeMedian: 5 }),
        spRow({ recordDate: CURRENT, tttMedianDays: 10, pendingOutreachCount: 0, resolutionTimeMedian: 5 }),
      ],
    };
    expect(startopsTttShift(input)).toBeNull();
  });
});

// ===========================================================================
// 6. demandTopSystemsSwing
//    Fires when Math.abs(ranked[0].delta) >= demandSwingMinDelta (5)
// ===========================================================================
describe('demandTopSystemsSwing — threshold boundary', () => {
  it('fires when top-system NRx delta is AT the minimum threshold', () => {
    // delta = demandSwingMinDelta = 5
    const delta = THRESHOLDS.demandSwingMinDelta;
    const input: EngineInput = {
      ...BASE_INPUT,
      claimsFacts: [
        claimsRow({ weekEnding: PRIOR,   nrxCount: 100, dimension: 'OrgA', dimensionType: 'parent_org' }),
        claimsRow({ weekEnding: CURRENT, nrxCount: 100 + delta, dimension: 'OrgA', dimensionType: 'parent_org' }),
      ],
    };
    expect(demandTopSystemsSwing(input)).not.toBeNull();
  });

  it('does not fire when top-system NRx delta is BELOW the minimum threshold', () => {
    // delta = demandSwingMinDelta - 1 = 4
    const delta = THRESHOLDS.demandSwingMinDelta - 1;
    const input: EngineInput = {
      ...BASE_INPUT,
      claimsFacts: [
        claimsRow({ weekEnding: PRIOR,   nrxCount: 100, dimension: 'OrgA', dimensionType: 'parent_org' }),
        claimsRow({ weekEnding: CURRENT, nrxCount: 100 + delta, dimension: 'OrgA', dimensionType: 'parent_org' }),
      ],
    };
    expect(demandTopSystemsSwing(input)).toBeNull();
  });
});
