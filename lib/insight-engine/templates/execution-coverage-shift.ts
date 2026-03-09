import type { EngineInput, InsightOutput } from '../types';
import { deriveConfidence, deriveSeverity, formatPct, formatNum, filterByWeek } from '../utils';

export function run(input: EngineInput): InsightOutput | null {
  const currRows = filterByWeek(input.callsFacts, input.currentWeekEnding);
  const priorRows = filterByWeek(input.callsFacts, input.priorWeekEnding);

  if (currRows.length === 0) return null;

  const priorMap = new Map(priorRows.map(r => [r.territory, r.compliancePct]));

  // Only fire on territories that dropped >= 5pp
  const dropped = currRows
    .map(r => {
      const priorPct = priorMap.get(r.territory) ?? r.compliancePct;
      const drop = priorPct - r.compliancePct;
      return { ...r, priorPct, drop };
    })
    .filter(r => r.drop >= 5)
    .sort((a, b) => a.compliancePct - b.compliancePct); // worst compliance first

  if (dropped.length === 0) return null;

  const worst = dropped[0];
  const avgCompliance = Math.round(
    currRows.reduce((sum, r) => sum + r.compliancePct, 0) / currRows.length,
  );
  const belowThreshold = currRows.filter(r => r.compliancePct < 60).length;

  const severity = deriveSeverity(worst.drop, 0, 15, 5);
  const confidence = deriveConfidence(input.datasets, ['territory_alignment']);

  const metricChanges = dropped.map(r => ({
    metric: `Call Compliance — ${r.territory}`,
    before: `${r.priorPct.toFixed(0)}%`,
    after: `${r.compliancePct.toFixed(0)}%`,
    change: formatNum(-r.drop) + 'pp',
    changePercent: r.priorPct > 0
      ? formatPct(((r.compliancePct - r.priorPct) / r.priorPct) * 100)
      : '+0.0%',
    direction: 'down' as const,
  }));

  const belowStr = belowThreshold > 0 ? `; ${belowThreshold} reps below 60% threshold` : '';
  const headline = `${worst.territory} call plan compliance at ${Math.round(worst.compliancePct)}%${belowStr}`;

  return {
    headline,
    pillar: 'Execution',
    severity,
    confidence,
    impact: `${dropped.length} territories affected`,
    region: 'Nation',
    drivers: [
      { label: 'Rep Activity Decline', confidence: 80, description: 'Call volume and HCP visit frequency dropped in affected territories', sortOrder: 0 },
      { label: 'Account Prioritization Gap', confidence: 55, description: 'High-value accounts may have been deprioritised in recent call planning cycle', sortOrder: 1 },
    ],
    metricChanges,
    contributors: dropped.map((r, i) => ({
      entity: r.territory,
      type: 'Territory',
      impact: `${Math.round(r.compliancePct)}% compliance`,
      percent: `${Math.round(r.drop)}pp drop`,
      sortOrder: i,
    })),
    risks: [
      { risk: 'Territory alignment data may be stale — rep-to-territory mapping changes in the last 30 days may not be reflected', sortOrder: 0 },
    ],
  };
}
