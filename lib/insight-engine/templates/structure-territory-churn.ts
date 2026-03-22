import type { EngineInput, InsightOutput } from '../types';
import { deriveConfidence } from '../utils';
import { THRESHOLDS } from '../thresholds';

export function run(input: EngineInput): InsightOutput | null {
  const vacancies    = input.territoryChanges.filter(e => e.changeType === 'vacancy');
  const realignments = input.territoryChanges.filter(e => e.changeType === 'realignment');

  if (vacancies.length === 0 && realignments.length === 0) return null;

  const confidence = deriveConfidence(input.datasets, ['territory_alignment']);

  const totalAffectedVacancy    = vacancies.reduce((s, e) => s + e.affectedReps, 0);
  const totalAffectedRealignment = realignments.reduce((s, e) => s + e.affectedReps, 0);
  const totalAffected = totalAffectedVacancy + totalAffectedRealignment;

  const primaryRegion = vacancies[0]?.region ?? realignments[0]?.region ?? 'Nation';

  const headline = vacancies.length > 0
    ? `${vacancies.length} territory vacanc${vacancies.length > 1 ? 'ies' : 'y'} detected — ${totalAffectedVacancy} reps affected in ${primaryRegion}`
    : `Territory realignment affecting ${totalAffectedRealignment} reps in ${primaryRegion}`;

  // Severity based on total affected reps
  const severity: 'High' | 'Medium' | 'Low' =
    totalAffected >= THRESHOLDS.territoryHighReps ? 'High' : totalAffected >= THRESHOLDS.territoryMedReps ? 'Medium' : 'Low';

  const metricChanges = [];
  if (vacancies.length > 0) {
    metricChanges.push({
      metric: 'Territory Vacancies',
      before: '0',
      after: String(vacancies.length),
      change: `+${vacancies.length}`,
      changePercent: '+100.0%',
      direction: 'down' as const,
    });
  }
  if (realignments.length > 0) {
    metricChanges.push({
      metric: 'Rep Realignments',
      before: '0',
      after: String(realignments.length),
      change: `+${realignments.length}`,
      changePercent: '+100.0%',
      direction: 'down' as const,
    });
  }

  const contributors = [
    ...vacancies.map((e, i) => ({
      entity: e.territory,
      type: 'Territory',
      impact: `${e.affectedReps} rep${e.affectedReps > 1 ? 's' : ''} uncovered`,
      percent: 'Vacancy',
      sortOrder: i,
    })),
    ...realignments.map((e, i) => ({
      entity: e.territory,
      type: 'Territory',
      impact: `${e.affectedReps} rep${e.affectedReps > 1 ? 's' : ''} realigned`,
      percent: 'Realignment',
      sortOrder: vacancies.length + i,
    })),
  ];

  return {
    headline,
    pillar: 'Structure',
    severity,
    confidence,
    impact: `${totalAffected} rep${totalAffected !== 1 ? 's' : ''} affected`,
    region: primaryRegion,
    drivers: [
      { label: 'Territory Vacancy', confidence: 85, description: 'Open territory positions reduce HCP coverage and may suppress NRx in affected geographies', sortOrder: 0 },
      { label: 'Alignment Churn', confidence: 65, description: 'Recent realignment may disrupt existing HCP relationships and call plan continuity', sortOrder: 1 },
    ],
    metricChanges,
    contributors,
    risks: [
      { risk: 'Territory alignment data is updated quarterly — recent changes within the last 30 days may not be fully reflected', sortOrder: 0 },
      { risk: 'Impact on NRx may take 2–4 weeks to materialize depending on rep onboarding speed', sortOrder: 1 },
    ],
  };
}
