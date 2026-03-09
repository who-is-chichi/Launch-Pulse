/**
 * Pure factory functions returning typed objects for use in both mock-based
 * and integration tests. No database calls — compose these in test setup.
 */

export function makeBrand(overrides: Partial<{ id: string; code: string; name: string }> = {}) {
  return {
    id: 'brand-test-id',
    code: 'ONC-101',
    name: 'ONC-101 (Oncology)',
    orgId: null,
    ...overrides,
  };
}

export function makeDataRun(overrides: Partial<{
  id: string; brandId: string; timeWindow: string; geography: string; status: string; runAt: Date;
}> = {}) {
  return {
    id: 'run-test-id',
    brandId: 'brand-test-id',
    runAt: new Date('2026-03-05T00:00:00.000Z'),
    timeWindow: 'Last 7 days',
    geography: 'Nation',
    status: 'complete',
    ...overrides,
  };
}

export function makeDataset(overrides: Partial<{
  id: string; dataRunId: string; name: string; displayName: string;
  freshness: string; coverage: number; notes: string; lastRun: Date;
}> = {}) {
  return {
    id: 'dataset-test-id',
    dataRunId: 'run-test-id',
    name: 'claims_weekly',
    displayName: 'Weekly Claims',
    freshness: 'Fresh',
    coverage: 98.5,
    notes: 'Updated weekly',
    lastRun: new Date('2026-03-05T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeKpiTile(overrides: Partial<{
  id: string; brandId: string; dataRunId: string; title: string;
  value: string; delta: string; deltaType: string; sparkline: number[]; sortOrder: number;
}> = {}) {
  return {
    id: 'kpi-test-id',
    brandId: 'brand-test-id',
    dataRunId: 'run-test-id',
    title: 'Demand Momentum',
    value: '+12.5%',
    delta: '+12.5%',
    deltaType: 'up',
    sparkline: [20, 35, 50, 60, 72, 85, 100],
    sortOrder: 0,
    ...overrides,
  };
}

export function makeInsight(overrides: Partial<{
  id: string; brandId: string; dataRunId: string; headline: string;
  pillar: string; severity: string; confidence: string; impact: string;
  region: string; status: string; notes: string | null; generatedDate: Date; createdBy: string | null;
}> = {}) {
  return {
    id: 'insight-test-id',
    brandId: 'brand-test-id',
    dataRunId: 'run-test-id',
    headline: 'NRx down 15% WoW in Nation',
    pillar: 'Demand',
    severity: 'High',
    confidence: 'High',
    impact: '150 NRx',
    region: 'Nation',
    status: 'New',
    notes: null,
    generatedDate: new Date('2026-03-05T00:00:00.000Z'),
    createdBy: null,
    ...overrides,
  };
}

export function makeDriver(overrides: Partial<{
  id: string; insightId: string; label: string; confidence: number; description: string; sortOrder: number;
}> = {}) {
  return {
    id: 'driver-test-id',
    insightId: 'insight-test-id',
    label: 'Execution (Coverage Drop)',
    confidence: 72,
    description: 'Call coverage drop in affected accounts',
    sortOrder: 0,
    ...overrides,
  };
}

export function makeAction(overrides: Partial<{
  id: string; brandId: string; insightId: string | null; title: string;
  linkedInsight: string; owner: string; ownerRole: string | null;
  dueDate: Date; severity: string; expectedLag: string; status: string;
  notes: string | null; createdAt: Date; createdBy: string | null;
}> = {}) {
  return {
    id: 'action-test-id',
    brandId: 'brand-test-id',
    insightId: null,
    title: 'Investigate coverage drop in Northeast',
    linkedInsight: 'NRx down 15% WoW in Nation',
    owner: 'Jane Smith',
    ownerRole: null,
    dueDate: new Date('2026-03-15T00:00:00.000Z'),
    severity: 'High',
    expectedLag: '1-2 weeks',
    status: 'new',
    notes: null,
    createdAt: new Date('2026-03-05T00:00:00.000Z'),
    createdBy: null,
    impactScore: null,
    ...overrides,
  };
}

export function makeImpactScore(overrides: Partial<{
  id: string; actionId: string; metric: string; before: string; after: string;
  change: string; outcome: string; completedDate: Date;
  baselineDataRunId: string | null; evaluatedDataRunId: string | null;
  metricKey: string | null; baselineValue: number | null; currentValue: number | null;
  autoEvaluated: boolean;
}> = {}) {
  return {
    id: 'impact-test-id',
    actionId: 'action-test-id',
    metric: 'NRx Count',
    before: '1000',
    after: '1120',
    change: '+120',
    outcome: 'Yes',
    completedDate: new Date('2026-03-10T00:00:00.000Z'),
    baselineDataRunId: null,
    evaluatedDataRunId: null,
    metricKey: null,
    baselineValue: null,
    currentValue: null,
    autoEvaluated: false,
    ...overrides,
  };
}

export function makeInsightSummaryInput(overrides: Partial<{
  id: string; headline: string; pillar: string; severity: string;
  confidence: string; impact: string; region: string; status: string;
}> = {}) {
  return {
    id: 'insight-test-id',
    headline: 'NRx down 15% WoW in Nation',
    pillar: 'Demand',
    severity: 'High' as const,
    confidence: 'High' as const,
    impact: '150 NRx',
    region: 'Nation',
    status: 'New',
    ...overrides,
  };
}
