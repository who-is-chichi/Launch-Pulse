import { PrismaClient } from '@prisma/client';
import { runInsightEngine } from '../lib/insight-engine';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Brand
  const brand = await prisma.brand.upsert({
    where: { code: 'ONC-101' },
    update: {},
    create: { code: 'ONC-101', name: 'ONC-101 Oncology' },
  });

  // Idempotent: clear all existing data for this brand before re-seeding
  const existingRuns = await prisma.dataRun.findMany({ where: { brandId: brand.id }, select: { id: true } });
  const runIds = existingRuns.map(r => r.id);
  const existingInsights = runIds.length > 0
    ? await prisma.insight.findMany({ where: { dataRunId: { in: runIds } }, select: { id: true } })
    : [];
  const insightIds = existingInsights.map(i => i.id);

  if (insightIds.length > 0) {
    await prisma.driver.deleteMany({ where: { insightId: { in: insightIds } } });
    await prisma.metricChange.deleteMany({ where: { insightId: { in: insightIds } } });
    await prisma.contributor.deleteMany({ where: { insightId: { in: insightIds } } });
    await prisma.insightRisk.deleteMany({ where: { insightId: { in: insightIds } } });
  }
  await prisma.impactScore.deleteMany({ where: { action: { brandId: brand.id } } });
  await prisma.action.deleteMany({ where: { brandId: brand.id } });
  if (runIds.length > 0) {
    await prisma.dataset.deleteMany({ where: { dataRunId: { in: runIds } } });
    await prisma.kpiTile.deleteMany({ where: { dataRunId: { in: runIds } } });
    await prisma.goldInputSnapshot.deleteMany({ where: { dataRunId: { in: runIds } } });
    await prisma.insight.deleteMany({ where: { dataRunId: { in: runIds } } });
  }
  await prisma.dataRun.deleteMany({ where: { brandId: brand.id } });
  await prisma.claimsMetricsFact.deleteMany({ where: { brandId: brand.id } });
  await prisma.spMetricsFact.deleteMany({ where: { brandId: brand.id } });
  await prisma.callsMetricsFact.deleteMany({ where: { brandId: brand.id } });
  await prisma.structureChangeLog.deleteMany({ where: { brandId: brand.id } });
  await prisma.territoryChangeLog.deleteMany({ where: { brandId: brand.id } });
  await prisma.mappingConfig.deleteMany({ where: { brandId: brand.id } });
  await prisma.normalizationRule.deleteMany({ where: { brandId: brand.id } });
  await prisma.publishedMapping.deleteMany({ where: { brandId: brand.id } });

  // ─── 4 DataRuns spaced across 3 weeks ───────────────────────────────────────

  const run1 = await prisma.dataRun.create({
    data: {
      brandId: brand.id,
      runAt: new Date('2026-02-12T06:00:00Z'),
      timeWindow: 'Last 7 days',
      geography: 'Nation',
      status: 'complete',
    },
  });

  const run2 = await prisma.dataRun.create({
    data: {
      brandId: brand.id,
      runAt: new Date('2026-02-19T06:00:00Z'),
      timeWindow: 'Last 7 days',
      geography: 'Nation',
      status: 'complete',
    },
  });

  const run3 = await prisma.dataRun.create({
    data: {
      brandId: brand.id,
      runAt: new Date('2026-02-26T06:00:00Z'),
      timeWindow: 'Last 7 days',
      geography: 'Nation',
      status: 'complete',
    },
  });

  // Latest run — this is what home/insights pages show
  const dataRun = await prisma.dataRun.create({
    data: {
      brandId: brand.id,
      runAt: new Date('2026-03-05T06:00:00Z'),
      timeWindow: 'Last 7 days',
      geography: 'Nation',
      status: 'complete',
    },
  });

  // ─── KPI Tiles per run (trending progressively) ──────────────────────────────

  // Run 1 (week 1) — baseline. Demand value = NRx count; delta = WoW %
  await prisma.kpiTile.createMany({
    data: [
      { brandId: brand.id, dataRunId: run1.id, title: 'Demand Momentum', value: '438', delta: '-2.0%', deltaType: 'down', sparkline: [98, 97, 95, 94, 92, 90, 88], sortOrder: 0 },
      { brandId: brand.id, dataRunId: run1.id, title: 'Time-to-Therapy', value: '9.4d', delta: '+0.4d', deltaType: 'down', sparkline: [30, 35, 40, 45, 50, 55, 60], sortOrder: 1 },
      { brandId: brand.id, dataRunId: run1.id, title: 'Execution Coverage', value: '83%', delta: '-1%', deltaType: 'down', sparkline: [90, 88, 87, 86, 85, 84, 83], sortOrder: 2 },
      { brandId: brand.id, dataRunId: run1.id, title: 'Structure Integrity', value: '100%', delta: '+0%', deltaType: 'up', sparkline: [95, 95, 96, 96, 97, 97, 100], sortOrder: 3 },
    ],
  });

  // Run 2 (week 2)
  await prisma.kpiTile.createMany({
    data: [
      { brandId: brand.id, dataRunId: run2.id, title: 'Demand Momentum', value: '420', delta: '-5.5%', deltaType: 'down', sparkline: [88, 86, 82, 78, 74, 70, 65], sortOrder: 0 },
      { brandId: brand.id, dataRunId: run2.id, title: 'Time-to-Therapy', value: '10.8d', delta: '+1.4d', deltaType: 'down', sparkline: [60, 62, 65, 68, 72, 76, 80], sortOrder: 1 },
      { brandId: brand.id, dataRunId: run2.id, title: 'Execution Coverage', value: '79%', delta: '-4%', deltaType: 'down', sparkline: [83, 82, 81, 80, 79, 78, 79], sortOrder: 2 },
      { brandId: brand.id, dataRunId: run2.id, title: 'Structure Integrity', value: '100%', delta: '+0%', deltaType: 'up', sparkline: [97, 97, 97, 98, 98, 98, 100], sortOrder: 3 },
    ],
  });

  // Run 3 (week 3)
  await prisma.kpiTile.createMany({
    data: [
      { brandId: brand.id, dataRunId: run3.id, title: 'Demand Momentum', value: '392', delta: '-9.0%', deltaType: 'down', sparkline: [65, 60, 55, 50, 45, 40, 35], sortOrder: 0 },
      { brandId: brand.id, dataRunId: run3.id, title: 'Time-to-Therapy', value: '11.8d', delta: '+1.0d', deltaType: 'down', sparkline: [80, 82, 84, 86, 88, 90, 92], sortOrder: 1 },
      { brandId: brand.id, dataRunId: run3.id, title: 'Execution Coverage', value: '75%', delta: '-4%', deltaType: 'down', sparkline: [79, 78, 77, 76, 75, 74, 75], sortOrder: 2 },
      { brandId: brand.id, dataRunId: run3.id, title: 'Structure Integrity', value: '91%', delta: '-2%', deltaType: 'down', sparkline: [98, 98, 96, 95, 94, 93, 91], sortOrder: 3 },
    ],
  });

  // Latest run (run4) — current state
  await prisma.kpiTile.createMany({
    data: [
      { brandId: brand.id, dataRunId: dataRun.id, title: 'Demand Momentum', value: '345', delta: '-12.0%', deltaType: 'down', sparkline: [100, 90, 80, 70, 60, 50, 20], sortOrder: 0 },
      { brandId: brand.id, dataRunId: dataRun.id, title: 'Time-to-Therapy', value: '12.4d', delta: '+0.6d', deltaType: 'down', sparkline: [20, 33, 47, 60, 73, 87, 100], sortOrder: 1 },
      { brandId: brand.id, dataRunId: dataRun.id, title: 'Execution Coverage', value: '73%', delta: '-2%', deltaType: 'down', sparkline: [100, 88, 76, 64, 52, 36, 20], sortOrder: 2 },
      { brandId: brand.id, dataRunId: dataRun.id, title: 'Structure Integrity', value: '89%', delta: '-2%', deltaType: 'down', sparkline: [91, 91, 90, 90, 89, 89, 89], sortOrder: 3 },
    ],
  });

  // ─── Datasets per run ─────────────────────────────────────────────────────────

  for (const [run, freshClaims, freshSp] of [
    [run1, 'Fresh', 'Fresh'],
    [run2, 'Fresh', 'Lag'],
    [run3, 'Fresh', 'Lag'],
    [dataRun, 'Fresh', 'Lag'],
  ] as [typeof run1, string, string][]) {
    await prisma.dataset.createMany({
      data: [
        {
          dataRunId: run.id,
          name: 'claims_weekly',
          displayName: 'Claims (Weekly)',
          lastRun: new Date(run.runAt.getTime() + 10 * 60 * 1000), // runAt + 10min
          freshness: freshClaims,
          coverage: 99.2,
          notes: 'All claims processed via PharMetrics',
        },
        {
          dataRunId: run.id,
          name: 'sp_cases',
          displayName: 'SP Cases',
          lastRun: new Date(run.runAt.getTime() - 48 * 60 * 60 * 1000), // 48h before
          freshness: freshSp,
          coverage: 94.5,
          notes: '48h lag from hub partner feed',
        },
        {
          dataRunId: run.id,
          name: 'territory_alignment',
          displayName: 'Territory Alignment',
          lastRun: new Date('2026-03-01T00:00:00Z'),
          freshness: 'Stale',
          coverage: 100.0,
          notes: 'Quarterly update pending Q2 cycle',
        },
      ],
    });
  }

  // ─── Actions ──────────────────────────────────────────────────────────────────

  const action1 = await prisma.action.create({
    data: {
      brandId: brand.id,
      title: "Deep-dive SP 'Pending Outreach' backlog with hub partner",
      linkedInsight: 'SP backlog up 18%', owner: 'Sarah Johnson',
      dueDate: new Date('2026-03-08'), severity: 'High', expectedLag: '1-2 weeks', status: 'inprogress',
    },
  });

  const action2 = await prisma.action.create({
    data: {
      brandId: brand.id,
      title: 'Review T12 call plans and Account prioritization with RSD',
      linkedInsight: 'NRx down 12% Northeast', owner: 'Michael Chen',
      dueDate: new Date('2026-03-10'), severity: 'High', expectedLag: '2-3 weeks', status: 'new',
    },
  });

  const action3 = await prisma.action.create({
    data: {
      brandId: brand.id,
      title: 'Validate Northeast parent system drops are not data artifacts',
      linkedInsight: 'NRx down 12% Northeast', owner: 'Analytics Lead',
      dueDate: new Date('2026-03-06'), severity: 'Medium', expectedLag: 'Immediate', status: 'done',
    },
  });

  const action4 = await prisma.action.create({
    data: {
      brandId: brand.id,
      title: 'Hub partner meeting — waiting on scheduling from Midwest SP',
      linkedInsight: 'Dispense lag in Midwest', owner: 'David Kim',
      dueDate: new Date('2026-03-07'), severity: 'Medium', expectedLag: '1 week', status: 'blocked',
    },
  });

  await prisma.action.create({
    data: {
      brandId: brand.id,
      title: 'Coaching session with 6 reps below 60% compliance threshold',
      linkedInsight: 'T12 call compliance 71%', owner: 'Regional Director',
      dueDate: new Date('2026-03-12'), severity: 'Medium', expectedLag: '1-2 weeks', status: 'new',
    },
  });

  await prisma.action.create({
    data: {
      brandId: brand.id,
      title: 'Backfill T12 territory vacancy with interim rep coverage',
      linkedInsight: 'Territory vacancy detected in Northeast', owner: 'Sales Ops',
      dueDate: new Date('2026-03-11'), severity: 'High', expectedLag: '1-2 weeks', status: 'inprogress',
    },
  });

  // Impact score for action3 (done)
  await prisma.impactScore.create({
    data: {
      actionId: action3.id, metric: 'Data Validation Rate',
      before: '78%', after: '100%', change: '+22%',
      outcome: 'Yes', completedDate: new Date('2026-03-06'),
    },
  });

  // Historical completed actions with impact scores
  const actionCompleted = await prisma.action.create({
    data: {
      brandId: brand.id,
      title: 'Implemented improved SP triage process',
      linkedInsight: 'SP backlog up 11%', owner: 'Sarah Johnson',
      dueDate: new Date('2026-02-28'), severity: 'High', expectedLag: '1-2 weeks', status: 'done',
    },
  });

  await prisma.impactScore.create({
    data: {
      actionId: actionCompleted.id, metric: 'Median SP Resolution Time',
      before: '14.2 days', after: '11.8 days', change: '-2.4 days',
      outcome: 'Yes', completedDate: new Date('2026-02-28'),
    },
  });

  const actionCompleted2 = await prisma.action.create({
    data: {
      brandId: brand.id,
      title: 'Updated call targeting for high-value accounts',
      linkedInsight: 'NRx down 9% Northeast', owner: 'Regional Director',
      dueDate: new Date('2026-02-20'), severity: 'Medium', expectedLag: '2-3 weeks', status: 'done',
    },
  });

  await prisma.impactScore.create({
    data: {
      actionId: actionCompleted2.id, metric: 'HCP Coverage Rate',
      before: '64%', after: '71%', change: '+7%',
      outcome: 'Partial', completedDate: new Date('2026-02-20'),
    },
  });

  // ─── Fact tables ──────────────────────────────────────────────────────────────

  const currentWeekEnding = new Date('2026-03-01T00:00:00Z');
  const priorWeekEnding = new Date('2026-02-22T00:00:00Z');
  const week3Ending = new Date('2026-02-15T00:00:00Z');
  const week4Ending = new Date('2026-02-08T00:00:00Z');

  await prisma.claimsMetricsFact.createMany({
    data: [
      // Current week
      { brandId: brand.id, weekEnding: currentWeekEnding, dimension: 'Nation', dimensionType: 'nation', nrxCount: 345 },
      { brandId: brand.id, weekEnding: currentWeekEnding, dimension: 'Northeast', dimensionType: 'region', nrxCount: 183 },
      { brandId: brand.id, weekEnding: currentWeekEnding, dimension: 'Midwest', dimensionType: 'region', nrxCount: 92 },
      { brandId: brand.id, weekEnding: currentWeekEnding, dimension: 'Southwest', dimensionType: 'region', nrxCount: 70 },
      { brandId: brand.id, weekEnding: currentWeekEnding, dimension: 'Memorial Health System', dimensionType: 'parent_org', nrxCount: 48 },
      { brandId: brand.id, weekEnding: currentWeekEnding, dimension: 'Northeast Health Partners', dimensionType: 'parent_org', nrxCount: 52 },
      { brandId: brand.id, weekEnding: currentWeekEnding, dimension: 'Regional Medical Group', dimensionType: 'parent_org', nrxCount: 83 },
      // Prior week
      { brandId: brand.id, weekEnding: priorWeekEnding, dimension: 'Nation', dimensionType: 'nation', nrxCount: 392 },
      { brandId: brand.id, weekEnding: priorWeekEnding, dimension: 'Northeast', dimensionType: 'region', nrxCount: 208 },
      { brandId: brand.id, weekEnding: priorWeekEnding, dimension: 'Midwest', dimensionType: 'region', nrxCount: 95 },
      { brandId: brand.id, weekEnding: priorWeekEnding, dimension: 'Southwest', dimensionType: 'region', nrxCount: 89 },
      { brandId: brand.id, weekEnding: priorWeekEnding, dimension: 'Memorial Health System', dimensionType: 'parent_org', nrxCount: 66 },
      { brandId: brand.id, weekEnding: priorWeekEnding, dimension: 'Northeast Health Partners', dimensionType: 'parent_org', nrxCount: 66 },
      { brandId: brand.id, weekEnding: priorWeekEnding, dimension: 'Regional Medical Group', dimensionType: 'parent_org', nrxCount: 76 },
      // Week 3
      { brandId: brand.id, weekEnding: week3Ending, dimension: 'Nation', dimensionType: 'nation', nrxCount: 420 },
      { brandId: brand.id, weekEnding: week3Ending, dimension: 'Northeast', dimensionType: 'region', nrxCount: 225 },
      { brandId: brand.id, weekEnding: week3Ending, dimension: 'Midwest', dimensionType: 'region', nrxCount: 98 },
      { brandId: brand.id, weekEnding: week3Ending, dimension: 'Southwest', dimensionType: 'region', nrxCount: 97 },
      { brandId: brand.id, weekEnding: week3Ending, dimension: 'Memorial Health System', dimensionType: 'parent_org', nrxCount: 72 },
      { brandId: brand.id, weekEnding: week3Ending, dimension: 'Northeast Health Partners', dimensionType: 'parent_org', nrxCount: 70 },
      { brandId: brand.id, weekEnding: week3Ending, dimension: 'Regional Medical Group', dimensionType: 'parent_org', nrxCount: 78 },
      // Week 4
      { brandId: brand.id, weekEnding: week4Ending, dimension: 'Nation', dimensionType: 'nation', nrxCount: 438 },
      { brandId: brand.id, weekEnding: week4Ending, dimension: 'Northeast', dimensionType: 'region', nrxCount: 231 },
      { brandId: brand.id, weekEnding: week4Ending, dimension: 'Midwest', dimensionType: 'region', nrxCount: 103 },
      { brandId: brand.id, weekEnding: week4Ending, dimension: 'Southwest', dimensionType: 'region', nrxCount: 104 },
      { brandId: brand.id, weekEnding: week4Ending, dimension: 'Memorial Health System', dimensionType: 'parent_org', nrxCount: 78 },
      { brandId: brand.id, weekEnding: week4Ending, dimension: 'Northeast Health Partners', dimensionType: 'parent_org', nrxCount: 74 },
      { brandId: brand.id, weekEnding: week4Ending, dimension: 'Regional Medical Group', dimensionType: 'parent_org', nrxCount: 72 },
    ],
  });

  await prisma.spMetricsFact.createMany({
    data: [
      { brandId: brand.id, recordDate: currentWeekEnding, pendingOutreachCount: 234, resolutionTimeMedian: 14.2, tttMedianDays: 12.4 },
      { brandId: brand.id, recordDate: priorWeekEnding, pendingOutreachCount: 198, resolutionTimeMedian: 11.8, tttMedianDays: 11.8 },
      { brandId: brand.id, recordDate: week3Ending, pendingOutreachCount: 178, resolutionTimeMedian: 10.4, tttMedianDays: 10.8 },
      { brandId: brand.id, recordDate: week4Ending, pendingOutreachCount: 162, resolutionTimeMedian: 9.2, tttMedianDays: 9.4 },
    ],
  });

  await prisma.callsMetricsFact.createMany({
    data: [
      { brandId: brand.id, weekEnding: currentWeekEnding, territory: 'T12', compliancePct: 71, repsTotal: 12, repsBelowThreshold: 6 },
      { brandId: brand.id, weekEnding: currentWeekEnding, territory: 'T08', compliancePct: 81, repsTotal: 10, repsBelowThreshold: 1 },
      { brandId: brand.id, weekEnding: currentWeekEnding, territory: 'T15', compliancePct: 68, repsTotal: 8, repsBelowThreshold: 3 },
      { brandId: brand.id, weekEnding: priorWeekEnding, territory: 'T12', compliancePct: 76, repsTotal: 12, repsBelowThreshold: 3 },
      { brandId: brand.id, weekEnding: priorWeekEnding, territory: 'T08', compliancePct: 83, repsTotal: 10, repsBelowThreshold: 1 },
      { brandId: brand.id, weekEnding: priorWeekEnding, territory: 'T15', compliancePct: 75, repsTotal: 8, repsBelowThreshold: 2 },
      { brandId: brand.id, weekEnding: week3Ending, territory: 'T12', compliancePct: 82, repsTotal: 12, repsBelowThreshold: 2 },
      { brandId: brand.id, weekEnding: week3Ending, territory: 'T08', compliancePct: 87, repsTotal: 10, repsBelowThreshold: 1 },
      { brandId: brand.id, weekEnding: week3Ending, territory: 'T15', compliancePct: 80, repsTotal: 8, repsBelowThreshold: 1 },
      { brandId: brand.id, weekEnding: week4Ending, territory: 'T12', compliancePct: 88, repsTotal: 12, repsBelowThreshold: 1 },
      { brandId: brand.id, weekEnding: week4Ending, territory: 'T08', compliancePct: 90, repsTotal: 10, repsBelowThreshold: 0 },
      { brandId: brand.id, weekEnding: week4Ending, territory: 'T15', compliancePct: 85, repsTotal: 8, repsBelowThreshold: 1 },
    ],
  });

  await prisma.territoryChangeLog.createMany({
    data: [
      { brandId: brand.id, changeDate: new Date('2026-02-28T00:00:00Z'), territory: 'T12', changeType: 'vacancy', affectedReps: 2, region: 'Northeast' },
      { brandId: brand.id, changeDate: new Date('2026-02-28T00:00:00Z'), territory: 'T15', changeType: 'realignment', affectedReps: 3, region: 'Midwest' },
      { brandId: brand.id, changeDate: new Date('2026-03-01T00:00:00Z'), territory: 'T08', changeType: 'new_hire', affectedReps: 1, region: 'Southwest' },
    ],
  });

  // ─── Mapping configs, normalization rules, published mappings ────────────────

  await prisma.mappingConfig.createMany({
    data: [
      { brandId: brand.id, dataset: 'Claims',   status: 'Configured',   lastUpdated: new Date('2025-12-15') },
      { brandId: brand.id, dataset: 'Dispense',  status: 'Configured',   lastUpdated: new Date('2025-12-15') },
      { brandId: brand.id, dataset: 'SP Cases',  status: 'Needs review', lastUpdated: new Date('2025-11-20') },
      { brandId: brand.id, dataset: 'Calls',     status: 'Configured',   lastUpdated: new Date('2026-01-10') },
    ],
  });

  await prisma.normalizationRule.createMany({
    data: [
      { brandId: brand.id, hubValue: 'Pending Benefit Investigation', normalizedValue: 'Pending BI',       category: 'Investigation', sortOrder: 0 },
      { brandId: brand.id, hubValue: 'Pending PA',                    normalizedValue: 'Pending PA',       category: 'Access',        sortOrder: 1 },
      { brandId: brand.id, hubValue: 'Pending Patient Outreach',      normalizedValue: 'Pending Outreach', category: 'Engagement',    sortOrder: 2 },
      { brandId: brand.id, hubValue: 'Approved - Pending Shipment',   normalizedValue: 'Approved',         category: 'Fulfillment',   sortOrder: 3 },
      { brandId: brand.id, hubValue: 'Shipped',                       normalizedValue: 'Shipped',          category: 'Fulfillment',   sortOrder: 4 },
      { brandId: brand.id, hubValue: 'Completed',                     normalizedValue: 'Completed',        category: 'Closed',        sortOrder: 5 },
      { brandId: brand.id, hubValue: 'Abandoned',                     normalizedValue: 'Abandoned',        category: 'Closed',        sortOrder: 6 },
    ],
  });

  await prisma.publishedMapping.createMany({
    data: [
      { brandId: brand.id, name: 'Claims Weekly v2.0',   dataset: 'Claims',   publishedBy: 'Sarah Chen',  publishedAt: new Date('2026-03-05'), fieldCount: 24, status: 'Active' },
      { brandId: brand.id, name: 'Dispense Weekly v1.3', dataset: 'Dispense', publishedBy: 'Mike Torres', publishedAt: new Date('2026-02-28'), fieldCount: 18, status: 'Active' },
      { brandId: brand.id, name: 'Calls Activity v1.1',  dataset: 'Calls',    publishedBy: 'Sarah Chen',  publishedAt: new Date('2026-01-10'), fieldCount: 15, status: 'Active' },
      { brandId: brand.id, name: 'Claims Weekly v1.9',   dataset: 'Claims',   publishedBy: 'Sarah Chen',  publishedAt: new Date('2025-12-15'), fieldCount: 24, status: 'Superseded' },
    ],
  });

  // ─── Engine run on all DataRuns (generates insights for each) ────────────────

  // Run engine on historical runs so total insights across all runs ≥ 12
  for (const historicalRun of [run1, run2, run3, dataRun]) {
    await runInsightEngine(historicalRun.id);
  }

  // ─── Engine run on a new DataRun (for computed insights) ──────────────────────

  const seedDatasets = await prisma.dataset.findMany({ where: { dataRunId: dataRun.id } });
  const engineDataRun = await prisma.dataRun.create({
    data: {
      brandId: brand.id,
      runAt: new Date('2026-03-05T08:00:00Z'),
      timeWindow: dataRun.timeWindow,
      geography: dataRun.geography,
      status: 'complete',
    },
  });

  await prisma.dataset.createMany({
    data: seedDatasets.map(d => ({
      dataRunId: engineDataRun.id,
      name: d.name,
      displayName: d.displayName,
      lastRun: d.lastRun,
      freshness: d.freshness,
      coverage: d.coverage,
      notes: d.notes,
    })),
  });

  // Copy KpiTiles to engineDataRun so home page (which picks latest run) shows them
  const seedKpiTiles = await prisma.kpiTile.findMany({ where: { dataRunId: dataRun.id } });
  await prisma.kpiTile.createMany({
    data: seedKpiTiles.map(t => ({
      brandId: t.brandId,
      dataRunId: engineDataRun.id,
      title: t.title,
      value: t.value,
      delta: t.delta,
      deltaType: t.deltaType,
      sparkline: t.sparkline as number[],
      sortOrder: t.sortOrder,
    })),
  });

  const { insightsCreated } = await runInsightEngine(engineDataRun.id);

  console.log('\n✅ Seeding complete.');
  console.log(`  Brand:         ${brand.code}`);
  console.log(`  DataRuns:      4 historical + 1 engine (${engineDataRun.id})`);
  console.log(`  Insights:      0 seeded + ${insightsCreated} engine-generated on latest run (${insightsCreated} × 5 runs = ${insightsCreated * 5} total)`);
  console.log(`  Actions:       8 seeded (4 active, 2 historical with impact scores)`);
  console.log(`  Datasets:      3 per run × 5 runs = 15 rows`);
  console.log(`  ClaimsFact:    27 rows (4 weeks × 7 dimensions for current/prior, 4 for weeks 3–4 regions + 6 parent_org)`);
  console.log(`  SpFact:        4 rows`);
  console.log(`  CallsFact:     12 rows (4 weeks × 3 territories)`);
  console.log(`  TerritoryLog:  3 rows (1 vacancy, 1 realignment, 1 new_hire)`);
  console.log(`  MappingConfig: 4 rows`);
  console.log(`  NormRules:     7 rows`);
  console.log(`  PubMappings:   4 rows (3 active, 1 superseded)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
