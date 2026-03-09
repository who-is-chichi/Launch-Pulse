import type { EngineInput, InsightOutput } from '../types';
import { deriveConfidence, deriveSeverity, formatPct, findByDate } from '../utils';

export function run(input: EngineInput): InsightOutput | null {
  const curr = findByDate(input.spFacts, input.currentWeekEnding);
  const prior = findByDate(input.spFacts, input.priorWeekEnding);

  if (!curr || !prior) return null;

  const dayChange = curr.tttMedianDays - prior.tttMedianDays;
  if (Math.abs(dayChange) < 1) return null;

  const direction = dayChange > 0 ? 'up' : 'down';
  const absPct = prior.tttMedianDays > 0 ? Math.abs(dayChange / prior.tttMedianDays) * 100 : 0;
  const severity = deriveSeverity(absPct, 0, 15, 8);
  const confidence = deriveConfidence(input.datasets, ['sp_cases', 'claims_weekly']);

  const verb = direction === 'up' ? 'increased' : 'decreased';

  return {
    headline: `Median time-to-therapy ${verb} ${Math.abs(dayChange).toFixed(1)} days WoW (approval to first dispense)`,
    pillar: 'Start Ops',
    severity,
    confidence,
    impact: `${Math.abs(dayChange).toFixed(1)} day shift`,
    region: 'Nation',
    drivers: [
      { label: 'SP Dispense Delay', confidence: 70, description: 'Increased time between approval and first fill at specialty pharmacy', sortOrder: 0 },
      { label: 'Prior Auth Processing Time', confidence: 50, description: 'PA approval delays may be upstream contributor to TTT shift', sortOrder: 1 },
    ],
    metricChanges: [
      {
        metric: 'Median Days Approval to First Dispense',
        before: `${prior.tttMedianDays.toFixed(1)}d`,
        after: `${curr.tttMedianDays.toFixed(1)}d`,
        change: `${dayChange >= 0 ? '+' : ''}${dayChange.toFixed(1)}d`,
        changePercent: formatPct((dayChange / prior.tttMedianDays) * 100),
        direction,
      },
    ],
    contributors: [],
    risks: [
      { risk: 'TTT calculation depends on matching approval and dispense dates — incomplete SP data may skew median', sortOrder: 0 },
    ],
  };
}
