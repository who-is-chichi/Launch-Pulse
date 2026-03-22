import type { EngineInput, InsightOutput } from '../types';
import { deriveConfidence, deriveSeverity, formatPct, formatNum, findByDate } from '../utils';
import { THRESHOLDS } from '../thresholds';

export function run(input: EngineInput): InsightOutput | null {
  const curr = findByDate(input.spFacts, input.currentWeekEnding);
  const prior = findByDate(input.spFacts, input.priorWeekEnding);

  if (!curr) return null;

  const backlogPct = prior && prior.pendingOutreachCount > 0
    ? Math.abs((curr.pendingOutreachCount - prior.pendingOutreachCount) / prior.pendingOutreachCount)
    : 0;
  const resolutionChange = prior
    ? curr.resolutionTimeMedian - prior.resolutionTimeMedian
    : 0;

  const fireOnBacklog = backlogPct >= THRESHOLDS.spBacklogPct;
  const fireOnResolution = resolutionChange >= THRESHOLDS.spResolutionDayChange;
  if (!fireOnBacklog && !fireOnResolution) return null;

  const metricChanges = [];
  if (prior) {
    const backlogDelta = curr.pendingOutreachCount - prior.pendingOutreachCount;
    metricChanges.push({
      metric: 'SP Pending Backlog (Cases)',
      before: String(prior.pendingOutreachCount),
      after: String(curr.pendingOutreachCount),
      change: formatNum(backlogDelta),
      changePercent: prior.pendingOutreachCount > 0
        ? formatPct((backlogDelta / prior.pendingOutreachCount) * 100)
        : '+0.0%',
      direction: (backlogDelta > 0 ? 'down' : 'up') as 'up' | 'down',
    });
    metricChanges.push({
      metric: 'Median SP Resolution Time',
      before: `${prior.resolutionTimeMedian.toFixed(1)}d`,
      after: `${curr.resolutionTimeMedian.toFixed(1)}d`,
      change: `${resolutionChange >= 0 ? '+' : ''}${resolutionChange.toFixed(1)}d`,
      changePercent: prior.resolutionTimeMedian > 0
        ? formatPct((resolutionChange / prior.resolutionTimeMedian) * 100)
        : '+0.0%',
      direction: (resolutionChange > 0 ? 'down' : 'up') as 'up' | 'down',
    });
  }

  const absBacklogCases = prior ? Math.abs(curr.pendingOutreachCount - prior.pendingOutreachCount) : 0;
  const severity = deriveSeverity(backlogPct * 100, absBacklogCases, THRESHOLDS.spHighImpact, THRESHOLDS.spMedImpact);
  const confidence = deriveConfidence(input.datasets, ['sp_cases']);

  const parts: string[] = [];
  if (fireOnBacklog) {
    parts.push(`SP 'Pending Outreach' backlog up ${Math.round(backlogPct * 100)}%`);
  }
  if (fireOnResolution) {
    parts.push(`median time-to-first-dispense +${Math.round(resolutionChange)} days`);
  }

  const impactStr = prior
    ? `${curr.pendingOutreachCount} cases`
    : `${Math.round(resolutionChange)} day shift`;

  return {
    headline: parts.join('; '),
    pillar: 'Start Ops',
    severity,
    confidence,
    impact: impactStr,
    region: 'Nation',
    drivers: [
      { label: 'Hub Partner Processing Delays', confidence: 75, description: 'SP partner outreach queues have grown, suggesting operational delays', sortOrder: 0 },
      { label: 'Case Volume Surge', confidence: 55, description: 'Underlying case volume increase may be stressing SP network capacity', sortOrder: 1 },
    ],
    metricChanges,
    contributors: [],
    risks: [
      { risk: 'SP case data is 48h delayed — start ops metrics may be understated', sortOrder: 0 },
    ],
  };
}
