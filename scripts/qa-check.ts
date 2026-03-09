import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_SEVERITIES = new Set(['High', 'Medium', 'Low']);
const VALID_CONFIDENCES = new Set(['High', 'Medium', 'Low']);

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function main() {
  // --- Brand ---
  console.log('\n[Brand]');
  const brand = await prisma.brand.findUnique({ where: { code: 'ONC-101' } });
  if (!brand) {
    console.error('Brand ONC-101 not found — run: npm run demo:reset');
    process.exit(1);
  }
  assert(!!brand, 'Brand ONC-101 exists');

  // --- DataRuns ---
  console.log('\n[DataRuns]');
  const allRuns = await prisma.dataRun.findMany({
    where: { brandId: brand.id, status: 'complete' },
    orderBy: { runAt: 'desc' },
  });
  assert(allRuns.length >= 5, `At least 5 completed DataRuns (4 seeded + 1 engine)`, `got ${allRuns.length}`);

  const dataRun = allRuns[0]; // latest
  if (!dataRun) {
    console.error('No completed DataRun found');
    process.exit(1);
  }
  console.log(`  Latest run: ${dataRun.id} (runAt: ${dataRun.runAt.toISOString()})`);

  // Run dates should span at least 3 weeks
  if (allRuns.length >= 2) {
    const oldest = allRuns[allRuns.length - 1];
    const spanDays = (dataRun.runAt.getTime() - oldest.runAt.getTime()) / (1000 * 60 * 60 * 24);
    assert(spanDays >= 14, `DataRuns span at least 2 weeks`, `got ${Math.round(spanDays)} days`);
  }

  // --- KPI Tiles (latest run) ---
  console.log('\n[KPI Tiles]');
  const kpiTiles = await prisma.kpiTile.findMany({
    where: { brandId: brand.id, dataRunId: dataRun.id },
    orderBy: { sortOrder: 'asc' },
  });

  assert(kpiTiles.length === 4, `Latest run has exactly 4 KPI tiles`, `got ${kpiTiles.length}`);
  const expectedTitles = ['Demand Momentum', 'Time-to-Therapy', 'Execution Coverage', 'Structure Integrity'];
  for (const tile of kpiTiles) {
    assert(expectedTitles.includes(tile.title), `KPI title valid: ${tile.title}`);
    assert(tile.value.length > 0, `KPI "${tile.title}" has value`);
    assert(tile.delta.length > 0, `KPI "${tile.title}" has delta`);
    assert(['up', 'down'].includes(tile.deltaType), `KPI "${tile.title}" deltaType valid`, `got "${tile.deltaType}"`);
    assert((tile.sparkline as number[]).length === 7, `KPI "${tile.title}" sparkline has 7 points`, `got ${(tile.sparkline as number[]).length}`);
  }

  // --- Datasets (latest run) ---
  console.log('\n[Datasets]');
  const datasets = await prisma.dataset.findMany({ where: { dataRunId: dataRun.id } });
  assert(datasets.length >= 3, `Latest run has at least 3 datasets`, `got ${datasets.length}`);
  const VALID_FRESHNESS = new Set(['Fresh', 'Lag', 'Stale']);
  for (const ds of datasets) {
    assert(ds.name.length > 0, `Dataset "${ds.displayName}" has name`);
    assert(VALID_FRESHNESS.has(ds.freshness), `Dataset "${ds.displayName}" freshness valid`, `got "${ds.freshness}"`);
    assert(ds.coverage >= 0 && ds.coverage <= 100, `Dataset "${ds.displayName}" coverage in [0,100]`, `got ${ds.coverage}`);
  }

  // --- Insights ---
  console.log('\n[Insights]');
  const latestInsights = await prisma.insight.findMany({
    where: { brandId: brand.id, dataRunId: dataRun.id },
  });
  assert(latestInsights.length >= 4, `Latest run has at least 4 insights`, `got ${latestInsights.length}`);

  for (const ins of latestInsights) {
    assert(ins.headline.length > 0, `Insight "${ins.id.slice(0, 8)}" has headline`);
    assert(VALID_SEVERITIES.has(ins.severity), `Insight severity valid`, `got "${ins.severity}"`);
    assert(VALID_CONFIDENCES.has(ins.confidence), `Insight confidence valid`, `got "${ins.confidence}"`);
    assert(ins.impact.length > 0, `Insight impact non-empty`);
  }

  const allPillars = new Set(latestInsights.map(i => i.pillar));
  assert(allPillars.size >= 3, `Latest run covers at least 3 pillars`, `got ${[...allPillars].join(', ')}`);

  const allInsights = await prisma.insight.findMany({ where: { brandId: brand.id } });
  assert(allInsights.length >= 12, `At least 12 total insights across all runs`, `got ${allInsights.length}`);

  // --- GoldInputSnapshot ---
  console.log('\n[GoldInputSnapshot]');
  const snapCount = await prisma.goldInputSnapshot.count({ where: { dataRunId: dataRun.id } });
  assert(snapCount > 0, `GoldInputSnapshot rows populated for latest run`, `got ${snapCount}`);

  // --- Drivers ---
  console.log('\n[Drivers]');
  const drivers = await prisma.driver.findMany({
    where: { insight: { dataRunId: dataRun.id } },
  });
  assert(drivers.length > 0, `At least one driver in latest run`, `got ${drivers.length}`);
  for (const d of drivers) {
    assert(d.confidence >= 0 && d.confidence <= 100, `Driver confidence in [0,100]`, `got ${d.confidence}`);
    assert(d.label.length > 0, `Driver label non-empty`);
  }

  // --- Actions ---
  console.log('\n[Actions]');
  const actions = await prisma.action.findMany({ where: { brandId: brand.id } });
  assert(actions.length >= 6, `At least 6 actions total`, `got ${actions.length}`);

  const VALID_STATUSES = new Set(['new', 'inprogress', 'done', 'blocked']);
  for (const a of actions) {
    assert(VALID_STATUSES.has(a.status), `Action "${a.title.slice(0, 30)}" status valid`, `got "${a.status}"`);
    assert(a.title.length > 0, `Action has non-empty title`);
    assert(a.owner.length > 0, `Action has non-empty owner`);
  }

  // Has multiple status types (Kanban has data in multiple columns)
  const statusSet = new Set(actions.map(a => a.status));
  assert(statusSet.size >= 3, `Actions span at least 3 Kanban columns`, `got ${[...statusSet].join(', ')}`);

  // --- Impact Scores ---
  console.log('\n[Impact Scores]');
  const impactScores = await prisma.impactScore.findMany({
    where: { action: { brandId: brand.id } },
  });
  assert(impactScores.length >= 2, `At least 2 impact scores recorded`, `got ${impactScores.length}`);
  const VALID_OUTCOMES = new Set(['Yes', 'Partial', 'No']);
  for (const score of impactScores) {
    assert(VALID_OUTCOMES.has(score.outcome), `ImpactScore outcome valid`, `got "${score.outcome}"`);
    assert(score.metric.length > 0, `ImpactScore has metric`);
  }

  // --- Summary ---
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`  DataRuns:     ${allRuns.length}`);
  console.log(`  Insights:     ${allInsights.length} total, ${latestInsights.length} on latest run`);
  console.log(`  KPI Tiles:    ${kpiTiles.length} on latest run`);
  console.log(`  Actions:      ${actions.length} total`);
  console.log(`  ImpactScores: ${impactScores.length}`);
  console.log(`${'─'.repeat(40)}`);
  console.log(`  Passed: ${passed}   Failed: ${failed}`);
  if (failed > 0) {
    console.error(`\nQA FAILED — ${failed} assertion(s) failed`);
    process.exit(1);
  } else {
    console.log(`\nQA PASSED`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
