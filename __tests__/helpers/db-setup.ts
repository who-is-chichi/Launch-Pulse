/**
 * Integration test DB helpers. Creates and tears down isolated test brands
 * so integration tests don't touch seed data.
 */
import { prisma } from '@/lib/prisma';

export async function createTestBrand(code: string, name?: string) {
  return prisma.brand.create({
    data: { code, name: name ?? `Test Brand ${code}` },
  });
}

export async function deleteTestBrand(code: string) {
  const brand = await prisma.brand.findUnique({ where: { code } });
  if (!brand) return;

  // Delete in dependency order (children first)
  const runs = await prisma.dataRun.findMany({ where: { brandId: brand.id }, select: { id: true } });
  const runIds = runs.map(r => r.id);

  if (runIds.length > 0) {
    const insightIds = (await prisma.insight.findMany({ where: { dataRunId: { in: runIds } }, select: { id: true } })).map(i => i.id);
    if (insightIds.length > 0) {
      await prisma.driver.deleteMany({ where: { insightId: { in: insightIds } } });
      await prisma.metricChange.deleteMany({ where: { insightId: { in: insightIds } } });
      await prisma.contributor.deleteMany({ where: { insightId: { in: insightIds } } });
      await prisma.insightRisk.deleteMany({ where: { insightId: { in: insightIds } } });
    }
    const actionIds = (await prisma.action.findMany({ where: { brandId: brand.id }, select: { id: true } })).map(a => a.id);
    if (actionIds.length > 0) {
      await prisma.impactScore.deleteMany({ where: { actionId: { in: actionIds } } });
    }
    await prisma.insight.deleteMany({ where: { dataRunId: { in: runIds } } });
    await prisma.action.deleteMany({ where: { brandId: brand.id } });
    await prisma.kpiTile.deleteMany({ where: { brandId: brand.id } });
    await prisma.goldInputSnapshot.deleteMany({ where: { brandId: brand.id } });
    await prisma.dataset.deleteMany({ where: { dataRunId: { in: runIds } } });
    await prisma.dataRun.deleteMany({ where: { brandId: brand.id } });
  }

  await prisma.claimsMetricsFact.deleteMany({ where: { brandId: brand.id } });
  await prisma.spMetricsFact.deleteMany({ where: { brandId: brand.id } });
  await prisma.callsMetricsFact.deleteMany({ where: { brandId: brand.id } });
  await prisma.structureChangeLog.deleteMany({ where: { brandId: brand.id } });

  await prisma.brand.delete({ where: { id: brand.id } });
}

/**
 * Seed deterministic fact data for engine integration tests.
 * Returns brandId, dataRunId, and the week dates used.
 */
export async function seedEngineTestData(brandCode: string, scenario: 'all-signals' | 'below-threshold' | 'sp-backlog-only' | 'formulary-loss-only') {
  const brand = await prisma.brand.findUniqueOrThrow({ where: { code: brandCode } });

  const currentWeek = new Date('2026-03-05T00:00:00.000Z');
  const priorWeek = new Date('2026-02-26T00:00:00.000Z');

  const dataRun = await prisma.dataRun.create({
    data: {
      brandId: brand.id,
      runAt: currentWeek,
      timeWindow: 'Last 7 days',
      geography: 'Nation',
      status: 'complete',
    },
  });

  await prisma.dataset.createMany({
    data: [
      { dataRunId: dataRun.id, name: 'claims_weekly', displayName: 'Weekly Claims', freshness: 'Fresh', coverage: 99, notes: '', lastRun: currentWeek },
      { dataRunId: dataRun.id, name: 'sp_cases', displayName: 'SP Cases', freshness: 'Fresh', coverage: 97, notes: '', lastRun: currentWeek },
      { dataRunId: dataRun.id, name: 'territory_alignment', displayName: 'Territory Alignment', freshness: 'Fresh', coverage: 100, notes: '', lastRun: currentWeek },
    ],
  });

  if (scenario === 'all-signals') {
    // NRx: −15% WoW (triggers demand-adoption-inflection at High severity)
    await prisma.claimsMetricsFact.createMany({
      data: [
        { brandId: brand.id, weekEnding: currentWeek, dimension: 'Nation', dimensionType: 'nation', nrxCount: 850, marketSharePct: 12.1, activePrescribers: 420 },
        { brandId: brand.id, weekEnding: priorWeek, dimension: 'Nation', dimensionType: 'nation', nrxCount: 1000, marketSharePct: 13.5, activePrescribers: 450 },
      ],
    });
    // TTT: +2.5d WoW (triggers startops-ttt-shift)
    await prisma.spMetricsFact.createMany({
      data: [
        { brandId: brand.id, recordDate: currentWeek, pendingOutreachCount: 22, resolutionTimeMedian: 5.5, tttMedianDays: 14.5 },
        { brandId: brand.id, recordDate: priorWeek, pendingOutreachCount: 18, resolutionTimeMedian: 4.8, tttMedianDays: 12.0 },
      ],
    });
    // Compliance: −12pp WoW (triggers execution-coverage-shift)
    await prisma.callsMetricsFact.createMany({
      data: [
        { brandId: brand.id, weekEnding: currentWeek, territory: 'T01-Northeast', compliancePct: 68, repsTotal: 10, repsBelowThreshold: 3 },
        { brandId: brand.id, weekEnding: priorWeek, territory: 'T01-Northeast', compliancePct: 80, repsTotal: 10, repsBelowThreshold: 1 },
      ],
    });
    // 1 formulary win (triggers structure-formulary-change)
    await prisma.structureChangeLog.create({
      data: { brandId: brand.id, eventDate: currentWeek, eventType: 'formulary_win', payerName: 'BlueCross', region: 'Northeast', coveredLives: 250000 },
    });

  } else if (scenario === 'below-threshold') {
    // NRx: −5% WoW (below 10% threshold — no demand insight)
    await prisma.claimsMetricsFact.createMany({
      data: [
        { brandId: brand.id, weekEnding: currentWeek, dimension: 'Nation', dimensionType: 'nation', nrxCount: 950, marketSharePct: 13.0, activePrescribers: 448 },
        { brandId: brand.id, weekEnding: priorWeek, dimension: 'Nation', dimensionType: 'nation', nrxCount: 1000, marketSharePct: 13.5, activePrescribers: 450 },
      ],
    });
    // No SP, calls, or structure data

  } else if (scenario === 'sp-backlog-only') {
    // NRx: flat
    await prisma.claimsMetricsFact.createMany({
      data: [
        { brandId: brand.id, weekEnding: currentWeek, dimension: 'Nation', dimensionType: 'nation', nrxCount: 1000, marketSharePct: 13.5, activePrescribers: 450 },
        { brandId: brand.id, weekEnding: priorWeek, dimension: 'Nation', dimensionType: 'nation', nrxCount: 1000, marketSharePct: 13.5, activePrescribers: 450 },
      ],
    });
    // SP backlog: +150% (triggers startops-sp-bottleneck)
    await prisma.spMetricsFact.createMany({
      data: [
        { brandId: brand.id, recordDate: currentWeek, pendingOutreachCount: 25, resolutionTimeMedian: 5.5, tttMedianDays: 13.0 },
        { brandId: brand.id, recordDate: priorWeek, pendingOutreachCount: 10, resolutionTimeMedian: 5.0, tttMedianDays: 12.5 },
      ],
    });

  } else if (scenario === 'formulary-loss-only') {
    // NRx: flat, TTT: flat
    await prisma.claimsMetricsFact.createMany({
      data: [
        { brandId: brand.id, weekEnding: currentWeek, dimension: 'Nation', dimensionType: 'nation', nrxCount: 1000, marketSharePct: 13.5, activePrescribers: 450 },
        { brandId: brand.id, weekEnding: priorWeek, dimension: 'Nation', dimensionType: 'nation', nrxCount: 1000, marketSharePct: 13.5, activePrescribers: 450 },
      ],
    });
    await prisma.spMetricsFact.createMany({
      data: [
        { brandId: brand.id, recordDate: currentWeek, pendingOutreachCount: 15, resolutionTimeMedian: 5.0, tttMedianDays: 12.5 },
        { brandId: brand.id, recordDate: priorWeek, pendingOutreachCount: 15, resolutionTimeMedian: 5.0, tttMedianDays: 12.5 },
      ],
    });
    // 1 formulary loss
    await prisma.structureChangeLog.create({
      data: { brandId: brand.id, eventDate: currentWeek, eventType: 'formulary_loss', payerName: 'Aetna', region: 'Southeast', coveredLives: 180000 },
    });
  }

  return { brandId: brand.id, dataRunId: dataRun.id, currentWeek, priorWeek };
}
