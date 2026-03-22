import type { EngineInput, InsightOutput } from '../types';
import { deriveConfidence, deriveSeverity } from '../utils';
import { THRESHOLDS } from '../thresholds';

export function run(input: EngineInput): InsightOutput | null {
  const wins = input.structureEvents.filter(e => e.eventType === 'formulary_win');
  const losses = input.structureEvents.filter(e => e.eventType === 'formulary_loss');

  if (wins.length === 0 && losses.length === 0) return null;

  const confidence = deriveConfidence(input.datasets, ['territory_alignment']);

  const totalWinLives = wins.reduce((sum, e) => sum + e.coveredLives, 0);
  const totalLossLives = losses.reduce((sum, e) => sum + e.coveredLives, 0);
  const primaryRegion = wins[0]?.region ?? losses[0]?.region ?? 'Nation';

  const isWin = wins.length > 0;
  const livesK = Math.round(totalWinLives / THRESHOLDS.formularyLivesUnit);
  const headline = isWin
    ? `Formulary win in ${wins.length} regional payer${wins.length > 1 ? 's' : ''} covering ~${livesK}K covered lives in ${primaryRegion}`
    : `Formulary loss in ${losses.length} regional payer${losses.length > 1 ? 's' : ''} in ${primaryRegion}`;

  const metricChanges = [];
  if (wins.length > 0) {
    metricChanges.push({
      metric: 'Formulary Wins',
      before: '0',
      after: String(wins.length),
      change: `+${wins.length}`,
      changePercent: '+100.0%',
      direction: 'up' as const,
    });
    metricChanges.push({
      metric: 'Estimated Covered Lives Added',
      before: '0',
      after: `~${totalWinLives.toLocaleString()}`,
      change: `+~${totalWinLives.toLocaleString()}`,
      changePercent: '+100.0%',
      direction: 'up' as const,
    });
  }
  if (losses.length > 0) {
    metricChanges.push({
      metric: 'Formulary Losses',
      before: '0',
      after: String(losses.length),
      change: `+${losses.length}`,
      changePercent: '+100.0%',
      direction: 'down' as const,
    });
  }

  // Losses are high-impact; wins are informational (Low)
  const lossLivesK = totalLossLives / THRESHOLDS.formularyLivesUnit;
  const severity = losses.length > 0
    ? deriveSeverity(losses.length * 10, lossLivesK, THRESHOLDS.formularyHighImpact, THRESHOLDS.formularyMedImpact)
    : 'Low';

  return {
    headline,
    pillar: 'Structure',
    severity,
    confidence,
    impact: isWin ? `~${livesK}K lives` : `${losses.length} payer loss`,
    region: primaryRegion,
    drivers: [
      { label: 'Payer Coverage Expansion', confidence: 90, description: 'New formulary placement expands eligible patient population', sortOrder: 0 },
      { label: 'Commercial Access Improvement', confidence: 75, description: 'Improved tier positioning may reduce patient out-of-pocket burden and increase adherence', sortOrder: 1 },
    ],
    metricChanges,
    contributors: [],
    risks: [
      { risk: 'Covered lives estimate is based on plan enrollment data — actual accessible population may differ', sortOrder: 0 },
      { risk: 'Formulary effective date may lag communication date — prescriber awareness may take 4–6 weeks', sortOrder: 1 },
    ],
  };
}
