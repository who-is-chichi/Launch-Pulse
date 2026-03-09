import type { EngineInput, InsightOutput } from '../types';
import { deriveConfidence, deriveSeverity, formatPct, formatNum, filterByWeek } from '../utils';

export function run(input: EngineInput): InsightOutput | null {
  const currOrgs = filterByWeek(input.claimsFacts, input.currentWeekEnding).filter(
    r => r.dimensionType === 'parent_org',
  );
  const priorOrgs = filterByWeek(input.claimsFacts, input.priorWeekEnding).filter(
    r => r.dimensionType === 'parent_org',
  );

  if (currOrgs.length === 0 || priorOrgs.length === 0) return null;

  const priorMap = new Map(priorOrgs.map(r => [r.dimension, r.nrxCount]));

  const ranked = currOrgs
    .map(r => {
      const prior = priorMap.get(r.dimension) ?? 0;
      const delta = r.nrxCount - prior;
      return { ...r, prior, delta };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  if (Math.abs(ranked[0].delta) < 5) return null;

  const totalAbsDelta = ranked.reduce((sum, r) => sum + Math.abs(r.delta), 0);
  const topDirection = ranked[0].delta < 0 ? 'declining' : 'growing';
  const severity = deriveSeverity(0, Math.abs(ranked[0].delta), 50, 20);
  const confidence = deriveConfidence(input.datasets, ['claims_weekly']);

  const contributors = ranked.map((r, i) => ({
    entity: r.dimension,
    type: 'Parent Org',
    impact: `${formatNum(r.delta)} NRx`,
    percent: `${Math.round((Math.abs(r.delta) / totalAbsDelta) * 100)}%`,
    sortOrder: i,
  }));

  const metricChanges = ranked.map(r => ({
    metric: r.dimension,
    before: String(r.prior),
    after: String(r.nrxCount),
    change: formatNum(r.delta),
    changePercent: r.prior > 0 ? formatPct((r.delta / r.prior) * 100) : '+0.0%',
    direction: (r.delta < 0 ? 'down' : 'up') as 'up' | 'down',
  }));

  const orgNames = ranked.map(r => r.dimension).join(', ');

  return {
    headline: `Top ${ranked.length} parent systems drove ${Math.round(totalAbsDelta)} NRx ${topDirection} WoW: ${orgNames}`,
    pillar: 'Demand',
    severity,
    confidence,
    impact: `${Math.round(totalAbsDelta)} NRx`,
    region: 'Nation',
    drivers: [
      { label: 'HCP Prescribing Pattern', confidence: 80, description: 'Concentrated volume shifts in top parent systems indicate HCP-level behavior change', sortOrder: 0 },
      { label: 'Execution (Call Coverage Decline)', confidence: 60, description: 'Rep call coverage to these parent systems may have dropped', sortOrder: 1 },
    ],
    metricChanges,
    contributors,
    risks: [
      { risk: 'Attribution to parent org systems depends on HCP-to-system mapping accuracy', sortOrder: 0 },
    ],
  };
}
