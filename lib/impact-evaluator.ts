import { prisma } from '@/lib/prisma';

// ── Pure helper functions (exported for unit testing) ────────────────────────

/**
 * Converts an expectedLag string to a number of days.
 * Values: "Immediate" → 0, "1-2 weeks" → 7, "2-3 weeks" → 14, default → 14
 */
export function lagToDays(expectedLag: string): number {
  const s = (expectedLag ?? '').toLowerCase().trim();
  if (s === 'immediate') return 0;
  if (s.includes('1') && s.includes('2')) return 7;
  if (s.includes('2') && s.includes('3')) return 14;
  return 14;
}

/**
 * Computes the impact verdict based on baseline vs. current metric value.
 * For "lower is better" metrics (ttt, resolution, pending), improvement means delta < 0.
 * Thresholds: ≥5% improvement → Yes, >0% or flat (<2%) → Partial, otherwise → No.
 */
export function computeVerdict(
  baseline: number,
  current: number,
  metricKey: string,
): 'Yes' | 'Partial' | 'No' {
  const delta = current - baseline;
  const pct = baseline !== 0 ? (delta / baseline) * 100 : 0;
  const lowerIsBetter =
    metricKey.includes('ttt') ||
    metricKey.includes('resolution') ||
    metricKey.includes('pending');
  const improved = lowerIsBetter ? delta < 0 : delta > 0;

  if (improved && Math.abs(pct) >= 5) return 'Yes';
  if (improved || Math.abs(pct) < 2) return 'Partial';
  return 'No';
}

// ── Metric label → GoldInputSnapshot key map ────────────────────────────────

interface MetricResolution {
  key: string;
  dimension: string;
  dimensionType: string;
  displayName: string;
}

const METRIC_KEY_MAP: Record<string, MetricResolution> = {
  'NRx Count': { key: 'nrx_count', dimension: 'Nation', dimensionType: 'nation', displayName: 'NRx Count' },
  'National NRx WoW': { key: 'nrx_count', dimension: 'Nation', dimensionType: 'nation', displayName: 'NRx Count' },
  'Time-to-Therapy': { key: 'ttt_median_days', dimension: 'Nation', dimensionType: 'nation', displayName: 'Time to Therapy (days)' },
  'SP Resolution Time': { key: 'resolution_time_median', dimension: 'Nation', dimensionType: 'nation', displayName: 'SP Resolution Time (days)' },
  'Call Compliance': { key: 'call_compliance_pct', dimension: 'Nation', dimensionType: 'nation', displayName: 'Call Compliance (%)' },
};

const DEFAULT_RESOLUTION: MetricResolution = {
  key: 'nrx_count',
  dimension: 'Nation',
  dimensionType: 'nation',
  displayName: 'NRx Count',
};

// ── Main evaluator ───────────────────────────────────────────────────────────

/**
 * Evaluates impact for all eligible actions linked to the brand of `newRunId`.
 *
 * An action is eligible if:
 *   1. insightId is not null (has a linked insight with metric data)
 *   2. status === 'done' OR the lag threshold has been crossed since createdAt
 *
 * For each eligible action, computes pre/post metric comparison using
 * GoldInputSnapshot rows from the baseline DataRun and the new DataRun,
 * then upserts an ImpactScore with autoEvaluated = true.
 */
export async function evaluateActions(
  newRunId: string,
): Promise<{ evaluated: number; skipped: number; errors: number }> {
  let evaluated = 0;
  let skipped = 0;
  let errors = 0;

  const newRun = await prisma.dataRun.findUnique({ where: { id: newRunId } });
  if (!newRun) {
    console.warn(JSON.stringify({ ts: new Date().toISOString(), level: 'warn', message: 'evaluateActions: DataRun not found', runId: newRunId }));
    return { evaluated, skipped, errors };
  }

  // Find all actions for this brand that have an insightId
  const actions = await prisma.action.findMany({
    where: { brandId: newRun.brandId, insightId: { not: null } },
    include: {
      insight: {
        include: { metricChanges: { take: 1 } },
      },
    },
  });

  for (const action of actions) {
    try {
      // Check eligibility: done OR lag threshold crossed
      const lagDays = lagToDays(action.expectedLag);
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysSinceCreated = (newRun.runAt.getTime() - action.createdAt.getTime()) / msPerDay;
      const lagCrossed = daysSinceCreated >= lagDays;

      if (action.status !== 'done' && !lagCrossed) {
        skipped++;
        continue;
      }

      // Find baseline DataRun: most recent completed run at or before action.createdAt
      const baselineRun = await prisma.dataRun.findFirst({
        where: {
          brandId: action.brandId,
          status: 'complete',
          runAt: { lte: action.createdAt },
        },
        orderBy: { runAt: 'desc' },
      });

      if (!baselineRun) {
        // No run existed when action was created — skip (common for demo seed data)
        skipped++;
        continue;
      }

      // Resolve metric from insight's first MetricChange
      const firstMetric = action.insight?.metricChanges?.[0]?.metric ?? '';
      const resolved = METRIC_KEY_MAP[firstMetric] ?? DEFAULT_RESOLUTION;

      // Look up GoldInputSnapshot for baseline and new run
      const [baselineSnap, currentSnap] = await Promise.all([
        prisma.goldInputSnapshot.findFirst({
          where: {
            dataRunId: baselineRun.id,
            metric: resolved.key,
            dimension: resolved.dimension,
            dimensionType: resolved.dimensionType,
          },
        }),
        prisma.goldInputSnapshot.findFirst({
          where: {
            dataRunId: newRunId,
            metric: resolved.key,
            dimension: resolved.dimension,
            dimensionType: resolved.dimensionType,
          },
        }),
      ]);

      if (!baselineSnap || !currentSnap) {
        skipped++;
        continue;
      }

      const baselineValue = baselineSnap.currentValue;
      const currentValue = currentSnap.currentValue;
      const verdict = computeVerdict(baselineValue, currentValue, resolved.key);

      const delta = currentValue - baselineValue;
      const pct = baselineValue !== 0 ? (delta / baselineValue) * 100 : 0;
      const changeStr = `${delta >= 0 ? '+' : ''}${pct.toFixed(1)}%`;

      await prisma.impactScore.upsert({
        where: { actionId: action.id },
        update: {
          baselineDataRunId: baselineRun.id,
          evaluatedDataRunId: newRunId,
          metricKey: resolved.key,
          baselineValue,
          currentValue,
          autoEvaluated: true,
          // Overwrite display strings so existing UI renders correctly
          metric: resolved.displayName,
          before: baselineValue.toFixed(1),
          after: currentValue.toFixed(1),
          change: changeStr,
          outcome: verdict,
          completedDate: new Date(),
        },
        create: {
          actionId: action.id,
          baselineDataRunId: baselineRun.id,
          evaluatedDataRunId: newRunId,
          metricKey: resolved.key,
          baselineValue,
          currentValue,
          autoEvaluated: true,
          metric: resolved.displayName,
          before: baselineValue.toFixed(1),
          after: currentValue.toFixed(1),
          change: changeStr,
          outcome: verdict,
          completedDate: new Date(),
        },
      });

      evaluated++;
    } catch (err) {
      console.error(JSON.stringify({
        ts: new Date().toISOString(),
        level: 'error',
        message: 'evaluateActions: error evaluating action',
        actionId: action.id,
        error: err instanceof Error ? err.message : String(err),
      }));
      errors++;
    }
  }

  return { evaluated, skipped, errors };
}
