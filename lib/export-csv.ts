type InsightRow = {
  id: string;
  headline: string;
  pillar: string;
  severity: string;
  confidence: string;
  impact: string;
  region: string;
  status: string;
  generatedDate: string | Date;
};

export function exportInsightsToCsv(insights: InsightRow[]): void {
  const headers = ['Headline', 'Pillar', 'Severity', 'Confidence', 'Impact', 'Region', 'Status', 'Date'];
  const rows = insights.map(i => [
    `"${i.headline.replace(/"/g, '""')}"`,
    i.pillar,
    i.severity,
    i.confidence,
    i.impact,
    i.region,
    i.status,
    new Date(i.generatedDate).toISOString().split('T')[0],
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `insights-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
