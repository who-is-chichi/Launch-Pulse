import type { ClaimsMetricsFact, SpMetricsFact, CallsMetricsFact, StructureChangeLog, TerritoryChangeLog, Dataset } from '@prisma/client';

export interface EngineInput {
  brandId: string;
  dataRunId: string;
  claimsFacts: ClaimsMetricsFact[];
  spFacts: SpMetricsFact[];
  callsFacts: CallsMetricsFact[];
  structureEvents: StructureChangeLog[];
  territoryChanges: TerritoryChangeLog[];
  datasets: Dataset[];
  currentWeekEnding: Date;
  priorWeekEnding: Date;
}

export interface MetricChangeOutput {
  metric: string;
  before: string;
  after: string;
  change: string;
  changePercent: string;
  direction: 'up' | 'down';
}

export interface DriverOutput {
  label: string;
  confidence: number;
  description: string;
  sortOrder: number;
}

export interface ContributorOutput {
  entity: string;
  type: string;
  impact: string;
  percent: string;
  sortOrder: number;
}

export interface RiskOutput {
  risk: string;
  sortOrder: number;
}

export interface InsightOutput {
  headline: string;
  pillar: 'Demand' | 'Start Ops' | 'Execution' | 'Structure';
  severity: 'High' | 'Medium' | 'Low';
  confidence: 'High' | 'Medium' | 'Low';
  impact: string;
  region: string;
  drivers: DriverOutput[];
  metricChanges: MetricChangeOutput[];
  contributors: ContributorOutput[];
  risks: RiskOutput[];
}

export interface KpiTileOutput {
  title: string;
  value: string;
  delta: string;
  deltaType: 'up' | 'down';
  sparkline: number[];
  sortOrder: number;
}
