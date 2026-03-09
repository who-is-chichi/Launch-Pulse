import { PrismaClient } from '@prisma/client';
import { runInsightEngine } from '../lib/insight-engine';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`); failed++; }
}

const VALID_SEVERITIES = new Set(['High', 'Medium', 'Low']);
const VALID_CONFIDENCES = new Set(['High', 'Medium', 'Low']);

async function main() {
  // ── Section 1: Stable counts (idempotency) ──────────────────────────────────
  console.log('\n[Idempotency]');
  const brand = await prisma.brand.findUnique({ where: { code: 'ONC-101' } });
  if (!brand) { console.error('ONC-101 not found — run: npm run demo:reset'); process.exit(1); }

  const dataRun = await prisma.dataRun.findFirst({
    where: { brandId: brand.id, status: 'complete' },
    orderBy: { runAt: 'desc' },
  });
  if (!dataRun) { console.error('No completed DataRun found'); process.exit(1); }
  console.log(`  Using DataRun: ${dataRun.id} (${dataRun.runAt.toISOString()})`);

  const first = await runInsightEngine(dataRun.id);
  assert(first.insightsCreated >= 1, `First run generates at least 1 insight`, `got ${first.insightsCreated}`);

  const second = await runInsightEngine(dataRun.id);
  assert(
    second.insightsCreated === first.insightsCreated,
    `Rerun produces identical count (${first.insightsCreated})`,
    `got ${second.insightsCreated} on second run`,
  );

  // ── Section 2: Severity / confidence sanity ─────────────────────────────────
  console.log('\n[Severity / Confidence]');
  const insights = await prisma.insight.findMany({ where: { dataRunId: dataRun.id } });
  assert(insights.length >= 1, `Insights present after rerun`, `got ${insights.length}`);
  for (const ins of insights) {
    assert(
      VALID_SEVERITIES.has(ins.severity),
      `Severity valid: "${ins.headline.slice(0, 40)}"`,
      `got "${ins.severity}"`,
    );
    assert(
      VALID_CONFIDENCES.has(ins.confidence),
      `Confidence valid: "${ins.headline.slice(0, 40)}"`,
      `got "${ins.confidence}"`,
    );
  }

  // ── Section 3: GoldInputSnapshot populated ──────────────────────────────────
  console.log('\n[GoldInputSnapshot]');
  const snapCount = await prisma.goldInputSnapshot.count({ where: { dataRunId: dataRun.id } });
  assert(snapCount > 0, `GoldInputSnapshot rows written`, `got ${snapCount}`);

  // ── Section 4: Missing-data graceful handling ───────────────────────────────
  console.log('\n[Missing Data Handling]');
  // Create a minimal test brand with only claims + SP data (no calls, no structure)
  // to verify the engine doesn't crash when optional fact tables are empty.
  const testBrand = await prisma.brand.create({ data: { code: 'ONC-TEST', name: 'Regression Test Brand' } });
  const testRun = await prisma.dataRun.create({
    data: {
      brandId: testBrand.id,
      runAt: new Date(),
      timeWindow: 'Last 7 days',
      geography: 'Nation',
      status: 'complete',
    },
  });
  const w1 = new Date('2026-03-01T00:00:00Z');
  const w2 = new Date('2026-02-22T00:00:00Z');
  await prisma.claimsMetricsFact.createMany({
    data: [
      { brandId: testBrand.id, weekEnding: w1, dimension: 'Nation', dimensionType: 'nation', nrxCount: 100 },
      { brandId: testBrand.id, weekEnding: w2, dimension: 'Nation', dimensionType: 'nation', nrxCount: 120 },
    ],
  });
  await prisma.spMetricsFact.createMany({
    data: [
      { brandId: testBrand.id, recordDate: w1, pendingOutreachCount: 50, resolutionTimeMedian: 5, tttMedianDays: 8 },
      { brandId: testBrand.id, recordDate: w2, pendingOutreachCount: 40, resolutionTimeMedian: 4, tttMedianDays: 7 },
    ],
  });

  let crashed = false;
  let testInsightsCreated = -1;
  try {
    const result = await runInsightEngine(testRun.id);
    testInsightsCreated = result.insightsCreated;
  } catch {
    crashed = true;
  }
  assert(!crashed, 'Engine does not crash with missing calls/structure data');
  assert(testInsightsCreated >= 0, `Engine returns valid count with partial data`, `got ${testInsightsCreated}`);

  // Cleanup test brand (cascade order: children first)
  const testInsightIds = (await prisma.insight.findMany({ where: { dataRunId: testRun.id }, select: { id: true } })).map(i => i.id);
  if (testInsightIds.length > 0) {
    await prisma.driver.deleteMany({ where: { insightId: { in: testInsightIds } } });
    await prisma.metricChange.deleteMany({ where: { insightId: { in: testInsightIds } } });
    await prisma.contributor.deleteMany({ where: { insightId: { in: testInsightIds } } });
    await prisma.insightRisk.deleteMany({ where: { insightId: { in: testInsightIds } } });
    await prisma.insight.deleteMany({ where: { dataRunId: testRun.id } });
  }
  await prisma.goldInputSnapshot.deleteMany({ where: { dataRunId: testRun.id } });
  await prisma.kpiTile.deleteMany({ where: { dataRunId: testRun.id } });
  await prisma.dataRun.delete({ where: { id: testRun.id } });
  await prisma.claimsMetricsFact.deleteMany({ where: { brandId: testBrand.id } });
  await prisma.spMetricsFact.deleteMany({ where: { brandId: testBrand.id } });
  await prisma.brand.delete({ where: { id: testBrand.id } });

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`  Passed: ${passed}   Failed: ${failed}`);
  if (failed > 0) {
    console.error('\nREGRESSION FAILED');
    process.exit(1);
  } else {
    console.log('\nREGRESSION PASSED');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
