export const SEVERITY_WEIGHT: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

export function sortBySeverityDesc<T extends { severity: string; generatedDate: Date | string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const w = (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0);
    return w !== 0 ? w : new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime();
  });
}

export const INSIGHT_STATUSES = ['New', 'Investigating', 'Actioned', 'Monitoring'] as const;
export type InsightStatus = typeof INSIGHT_STATUSES[number];
