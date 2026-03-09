import type { Dataset } from '@prisma/client';

export function deriveConfidence(
  datasets: Dataset[],
  relevantNames: string[],
): 'High' | 'Medium' | 'Low' {
  const relevant = datasets.filter(d => relevantNames.includes(d.name));
  if (relevant.some(d => d.freshness === 'Stale')) return 'Low';
  if (relevant.some(d => d.freshness === 'Lag')) return 'Medium';
  return 'High';
}

export function deriveSeverity(
  changePct: number,
  absoluteImpact: number,
  highThreshold: number,
  mediumThreshold: number,
): 'High' | 'Medium' | 'Low' {
  if (changePct >= 15 || absoluteImpact >= highThreshold) return 'High';
  if (changePct >= 8 || absoluteImpact >= mediumThreshold) return 'Medium';
  return 'Low';
}

export function formatPct(val: number): string {
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
}

export function formatNum(val: number): string {
  return `${val >= 0 ? '+' : ''}${Math.round(val)}`;
}

export function makeSparkline(priorValue: number, currentValue: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const base = priorValue + (currentValue - priorValue) * t;
    const jitter = (Math.sin(i * 2.3) * Math.abs(currentValue - priorValue)) * 0.08;
    points.push(base + jitter);
  }
  points[6] = currentValue;

  // Normalize to 20–100 range so bars are always visible and never overflow the container
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  return points.map(v => Math.round(20 + ((v - min) / range) * 80));
}

function sameDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

export function filterByWeek<T extends { weekEnding: Date }>(rows: T[], d: Date): T[] {
  return rows.filter(r => sameDay(r.weekEnding, d));
}

export function findByDate<T extends { recordDate: Date }>(rows: T[], d: Date): T | undefined {
  return rows.find(r => sameDay(r.recordDate, d));
}
