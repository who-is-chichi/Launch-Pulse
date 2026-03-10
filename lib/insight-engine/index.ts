import { subDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import type { EngineInput, InsightOutput, KpiTileOutput } from './types';
import { makeSparkline, formatPct, filterByWeek, findByDate } from './utils';
import { run as demandAdoptionInflection } from './templates/demand-adoption-inflection';
import { run as demandTopSystemsSwing } from './templates/demand-top-systems-swing';
import { run as startopsSPBottleneck } from './templates/startops-sp-bottleneck';
import { run as startopsTTTShift } from './templates/startops-ttt-shift';
import { run as executionCoverageShift } from './templates/execution-coverage-shift';
import { run as structureTerritoryChurn } from './templates/structure-territory-churn';

function computeKpiTiles(input: EngineInput): KpiTileOutput[] {
  const tiles: KpiTileOutput[] = [];

  const currClaims = filterByWeek(input.claimsFacts, input.currentWeekEnding);
  const priorClaims = filterByWeek(input.claimsFacts, input.priorWeekEnding);

  // Demand Momentum — nation-level NRx count as value, WoW % as delta
  const nrxCurr = currClaims.find(r => r.dimensionType === 'nation');
  const nrxPrior = priorClaims.find(r => r.dimensionType === 'nation');
  if (nrxCurr && nrxPrior && nrxPrior.nrxCount > 0) {
    const pct = ((nrxCurr.nrxCount - nrxPrior.nrxCount) / nrxPrior.nrxCount) * 100;
    tiles.push({
      title: 'Demand Momentum',
      value: nrxCurr.nrxCount.toLocaleString(),
      delta: formatPct(pct),
      deltaType: pct >= 0 ? 'up' : 'down',
      sparkline: makeSparkline(nrxPrior.nrxCount, nrxCurr.nrxCount),
      sortOrder: 0,
    });
  }

  // Time-to-Therapy — tttMedianDays WoW from spFacts
  const spCurr = findByDate(input.spFacts, input.currentWeekEnding);
  const spPrior = findByDate(input.spFacts, input.priorWeekEnding);
  if (spCurr && spPrior) {
    const delta = spCurr.tttMedianDays - spPrior.tttMedianDays;
    tiles.push({
      title: 'Time-to-Therapy',
      value: `${spCurr.tttMedianDays.toFixed(1)}d`,
      delta: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}d`,
      deltaType: delta <= 0 ? 'up' : 'down', // lower TTT = better = up
      sparkline: makeSparkline(spPrior.tttMedianDays, spCurr.tttMedianDays),
      sortOrder: 1,
    });
  }

  // Execution Coverage — avg compliancePct current week from callsFacts
  const currCalls = filterByWeek(input.callsFacts, input.currentWeekEnding);
  const priorCalls = filterByWeek(input.callsFacts, input.priorWeekEnding);
  if (currCalls.length > 0) {
    const avgCurrent = currCalls.reduce((sum, r) => sum + r.compliancePct, 0) / currCalls.length;
    const avgPrior = priorCalls.length > 0
      ? priorCalls.reduce((sum, r) => sum + r.compliancePct, 0) / priorCalls.length
      : avgCurrent;
    const delta = avgCurrent - avgPrior;
    tiles.push({
      title: 'Execution Coverage',
      value: `${Math.round(avgCurrent)}%`,
      delta: `${delta >= 0 ? '+' : ''}${Math.round(delta)}%`,
      deltaType: delta >= 0 ? 'up' : 'down',
      sparkline: makeSparkline(avgPrior, avgCurrent),
      sortOrder: 2,
    });
  }

  // Structure Integrity — territory vacancy/realignment based (not formulary)
  const vacancies    = input.territoryChanges.filter(e => e.changeType === 'vacancy');
  const realignments = input.territoryChanges.filter(e => e.changeType === 'realignment');
  const newHires     = input.territoryChanges.filter(e => e.changeType === 'new_hire');
  const integrityScore = Math.min(100, Math.max(0, 100 - vacancies.length * 5 - realignments.length * 2 + newHires.length));
  const priorScore     = Math.min(100, Math.max(0, integrityScore + vacancies.length * 5 + realignments.length * 2 - newHires.length));
  const netChange      = newHires.length - vacancies.length - realignments.length;
  const integrityDelta = netChange >= 0 ? `+${netChange}` : `${netChange}`;
  tiles.push({
    title: 'Structure Integrity',
    value: `${integrityScore}%`,
    delta: `${integrityDelta}%`,
    deltaType: vacancies.length > 0 || realignments.length > newHires.length ? 'down' : 'up',
    sparkline: makeSparkline(priorScore, integrityScore),
    sortOrder: 3,
  });

  return tiles;
}

export async function runInsightEngine(
  dataRunId: string,
): Promise<{ insightsCreated: number }> {
  const dataRun = await prisma.dataRun.findUnique({
    where: { id: dataRunId },
    include: { datasets: true },
  });

  if (!dataRun) throw new Error(`DataRun ${dataRunId} not found`);

  // Derive week endings from the most recent ClaimsMetricsFact row for this brand,
  // so the engine always aligns with the actual data regardless of when runAt is.
  // Use UTC midnight to avoid timezone-shift bugs with date-fns startOfDay.
  const latestClaimsRow = await prisma.claimsMetricsFact.findFirst({
    where: { brandId: dataRun.brandId },
    orderBy: { weekEnding: 'desc' },
  });
  const toUtcMidnight = (d: Date) => {
    const s = d.toISOString().slice(0, 10);
    return new Date(`${s}T00:00:00.000Z`);
  };
  const currentWeekEnding = toUtcMidnight(latestClaimsRow ? latestClaimsRow.weekEnding : dataRun.runAt);
  const priorWeekEnding = toUtcMidnight(subDays(currentWeekEnding, 7));

  const [claimsFacts, spFacts, callsFacts, territoryChanges] = await Promise.all([
    prisma.claimsMetricsFact.findMany({ where: { brandId: dataRun.brandId } }),
    prisma.spMetricsFact.findMany({ where: { brandId: dataRun.brandId } }),
    prisma.callsMetricsFact.findMany({ where: { brandId: dataRun.brandId } }),
    prisma.territoryChangeLog.findMany({
      where: { brandId: dataRun.brandId, changeDate: { gte: priorWeekEnding } },
    }),
  ]);

  // Idempotent: clear existing insights for this run before regenerating
  const existingInsights = await prisma.insight.findMany({
    where: { dataRunId },
    select: { id: true },
  });
  const existingIds = existingInsights.map(i => i.id);
  if (existingIds.length > 0) {
    await prisma.driver.deleteMany({ where: { insightId: { in: existingIds } } });
    await prisma.metricChange.deleteMany({ where: { insightId: { in: existingIds } } });
    await prisma.contributor.deleteMany({ where: { insightId: { in: existingIds } } });
    await prisma.insightRisk.deleteMany({ where: { insightId: { in: existingIds } } });
    await prisma.insight.deleteMany({ where: { dataRunId } });
  }
  await prisma.goldInputSnapshot.deleteMany({ where: { dataRunId } });

  const input: EngineInput = {
    brandId: dataRun.brandId,
    dataRunId,
    claimsFacts,
    spFacts,
    callsFacts,
    structureEvents: [],
    territoryChanges,
    datasets: dataRun.datasets,
    currentWeekEnding,
    priorWeekEnding,
  };

  const templates = [
    demandAdoptionInflection,
    demandTopSystemsSwing,
    startopsSPBottleneck,
    startopsTTTShift,
    executionCoverageShift,
    structureTerritoryChurn,
  ];

  const outputs = templates
    .map(fn => fn(input))
    .filter((o): o is InsightOutput => o !== null);

  let insightsCreated = 0;
  for (const output of outputs) {
    await prisma.insight.create({
      data: {
        brandId: dataRun.brandId,
        dataRunId,
        headline: output.headline,
        pillar: output.pillar,
        severity: output.severity,
        confidence: output.confidence,
        impact: output.impact,
        region: output.region,
        status: 'New',
        drivers: { create: output.drivers },
        metricChanges: { create: output.metricChanges },
        contributors: { create: output.contributors },
        risks: { create: output.risks },
      },
    });
    insightsCreated++;
  }

  // Write GoldInputSnapshot evidence rows
  const spCurr = findByDate(input.spFacts, input.currentWeekEnding);
  const spPrior = findByDate(input.spFacts, input.priorWeekEnding);
  const snapshots: {
    brandId: string;
    dataRunId: string;
    snapshotDate: Date;
    metric: string;
    dimension: string;
    dimensionType: string;
    currentValue: number;
    priorValue: number;
    unit: string;
  }[] = [];

  for (const curr of filterByWeek(input.claimsFacts, input.currentWeekEnding)) {
    const prior = filterByWeek(input.claimsFacts, input.priorWeekEnding)
      .find(r => r.dimension === curr.dimension);
    if (prior) {
      snapshots.push({
        brandId: input.brandId,
        dataRunId,
        snapshotDate: input.currentWeekEnding,
        metric: 'nrx_count',
        dimension: curr.dimension,
        dimensionType: curr.dimensionType,
        currentValue: curr.nrxCount,
        priorValue: prior.nrxCount,
        unit: 'NRx',
      });
    }
  }

  if (spCurr && spPrior) {
    snapshots.push(
      { brandId: input.brandId, dataRunId, snapshotDate: input.currentWeekEnding, metric: 'ttt_median_days', dimension: 'Nation', dimensionType: 'nation', currentValue: spCurr.tttMedianDays, priorValue: spPrior.tttMedianDays, unit: 'days' },
      { brandId: input.brandId, dataRunId, snapshotDate: input.currentWeekEnding, metric: 'pending_outreach_count', dimension: 'Nation', dimensionType: 'nation', currentValue: spCurr.pendingOutreachCount, priorValue: spPrior.pendingOutreachCount, unit: 'cases' },
      { brandId: input.brandId, dataRunId, snapshotDate: input.currentWeekEnding, metric: 'resolution_time_median', dimension: 'Nation', dimensionType: 'nation', currentValue: spCurr.resolutionTimeMedian, priorValue: spPrior.resolutionTimeMedian, unit: 'days' },
    );
  }

  for (const curr of filterByWeek(input.callsFacts, input.currentWeekEnding)) {
    const prior = filterByWeek(input.callsFacts, input.priorWeekEnding)
      .find(r => r.territory === curr.territory);
    snapshots.push({
      brandId: input.brandId,
      dataRunId,
      snapshotDate: input.currentWeekEnding,
      metric: 'call_compliance_pct',
      dimension: curr.territory,
      dimensionType: 'territory',
      currentValue: curr.compliancePct,
      priorValue: prior?.compliancePct ?? curr.compliancePct,
      unit: '%',
    });
  }

  if (snapshots.length > 0) {
    await prisma.goldInputSnapshot.createMany({ data: snapshots });
  }

  // Recompute KPI tiles — write fresh rows linked to this DataRun
  const kpiOutputs = computeKpiTiles(input);
  await prisma.kpiTile.deleteMany({ where: { dataRunId } });
  await prisma.kpiTile.createMany({
    data: kpiOutputs.map(kpi => ({
      brandId: dataRun.brandId,
      dataRunId,
      title: kpi.title,
      value: kpi.value,
      delta: kpi.delta,
      deltaType: kpi.deltaType,
      sparkline: kpi.sparkline,
      sortOrder: kpi.sortOrder,
    })),
  });

  return { insightsCreated };
}
