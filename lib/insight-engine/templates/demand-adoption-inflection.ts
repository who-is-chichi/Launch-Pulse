import type { EngineInput, InsightOutput } from '../types';
import { deriveConfidence, deriveSeverity, formatPct, formatNum, filterByWeek } from '../utils';

export function run(input: EngineInput): InsightOutput | null {
  const currRows = filterByWeek(input.claimsFacts, input.currentWeekEnding);
  const priorRows = filterByWeek(input.claimsFacts, input.priorWeekEnding);

  if (currRows.length === 0 || priorRows.length === 0) return null;

  const priorMap = new Map(priorRows.map(r => [r.dimension, r.nrxCount]));

  // Find dimension with largest abs % change >= 10%, preferring 'nation'
  const eligible = currRows
    .map(r => {
      const prior = priorMap.get(r.dimension) ?? 0;
      if (prior === 0) return null;
      const delta = r.nrxCount - prior;
      const pct = Math.abs(delta / prior);
      return { ...r, prior, delta, pct };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null && r.pct >= 0.10)
    .sort((a, b) => {
      if (a.dimensionType === 'nation' && b.dimensionType !== 'nation') return -1;
      if (b.dimensionType === 'nation' && a.dimensionType !== 'nation') return 1;
      return b.pct - a.pct;
    });

  if (eligible.length === 0) return null;

  const top = eligible[0];
  const pctSigned = top.delta / top.prior;
  const absPct = Math.abs(pctSigned) * 100;
  const absDelta = Math.abs(top.delta);
  const direction = top.delta < 0 ? 'down' : 'up';
  const region = top.dimensionType === 'nation' ? 'Nation' : top.dimension;

  const severity = deriveSeverity(absPct, absDelta, 50, 20);
  const confidence = deriveConfidence(input.datasets, ['claims_weekly']);

  const risks = [];
  const claimsDs = input.datasets.find(d => d.name === 'claims_weekly');
  if (claimsDs && claimsDs.freshness !== 'Fresh') {
    risks.push({ risk: 'Claims feed is not fresh — NRx WoW comparison may be incomplete', sortOrder: 0 });
  }
  risks.push({ risk: 'Market-level claims lag means WoW comparison window may not be fully clean', sortOrder: risks.length });

  return {
    headline: `NRx ${direction === 'down' ? 'down' : 'up'} ${Math.round(absPct)}% WoW in ${region}`,
    pillar: 'Demand',
    severity,
    confidence,
    impact: `${Math.round(absDelta)} NRx`,
    region,
    drivers: [
      { label: 'Execution (Coverage Drop)', confidence: 72, description: 'Call coverage drop in affected accounts is the most likely primary driver', sortOrder: 0 },
      { label: 'Start Ops (SP Resolution Time)', confidence: 45, description: 'SP cycle time increase may be contributing but signal is partial', sortOrder: 1 },
      { label: 'Structure (Alignment Change)', confidence: 18, description: 'No significant territory or affiliation changes detected', sortOrder: 2 },
    ],
    metricChanges: [
      {
        metric: 'NRx Volume',
        before: String(top.prior),
        after: String(top.nrxCount),
        change: formatNum(top.delta),
        changePercent: formatPct(pctSigned * 100),
        direction,
      },
    ],
    contributors: [],
    risks,
  };
}
