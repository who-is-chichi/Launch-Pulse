/**
 * Central configuration for all insight engine alert-firing and severity thresholds.
 * Change values here to tune which insights fire and their severity — no template edits needed.
 */
export const THRESHOLDS = {
  // deriveSeverity() change-percentage triggers (utils.ts)
  severityHighChangePct: 15,     // % change → High severity
  severityMedChangePct: 8,       // % change → Medium severity

  // demand-adoption-inflection
  demandMinChangePct: 10,        // minimum % change to fire
  demandHighImpact: 50,          // absoluteImpact threshold → High
  demandMedImpact: 20,           // absoluteImpact threshold → Medium

  // demand-top-systems-swing
  demandTopN: 3,                 // top N parent orgs to track
  demandSwingMinDelta: 5,        // minimum NRx delta to fire
  demandSwingHighImpact: 50,
  demandSwingMedImpact: 20,

  // startops-ttt-shift
  tttMinDayChange: 1,            // minimum day change to fire
  tttHighImpact: 15,
  tttMedImpact: 8,

  // execution-coverage-shift
  coverageMinDropPct: 5,         // minimum percentage-point drop to fire
  coverageComplianceBaseline: 60, // below-threshold compliance baseline
  coverageHighImpact: 15,
  coverageMedImpact: 5,

  // startops-sp-bottleneck
  spBacklogPct: 0.15,            // backlog fraction (0–1) threshold to fire
  spResolutionDayChange: 2,      // resolution time change (days) to fire
  spHighImpact: 100,
  spMedImpact: 50,

  // structure-territory-churn
  territoryHighReps: 5,          // affected reps count → High severity
  territoryMedReps: 2,           // affected reps count → Medium severity

  // structure-formulary-change
  formularyHighImpact: 50,
  formularyMedImpact: 20,
  formularyLivesUnit: 1000,      // divide covered lives by this for display (K)
} as const;

export type Thresholds = typeof THRESHOLDS;
