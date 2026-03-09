import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SEVERITY_COLOR: Record<string, string> = {
  High: '#991B1B',
  Medium: '#92400E',
  Low: '#1E3A8A',
};

const SEVERITY_BG: Record<string, string> = {
  High: '#FEF2F2',
  Medium: '#FFFBEB',
  Low: '#EFF6FF',
};

const PILLAR_COLOR: Record<string, string> = {
  Demand: '#1D4ED8',
  'Start Ops': '#16A34A',
  Execution: '#D97706',
  Structure: '#7C3AED',
};

const OUTCOME_COLOR: Record<string, string> = {
  Yes: '#166534',
  Partial: '#92400E',
  No: '#991B1B',
};

const OUTCOME_BG: Record<string, string> = {
  Yes: '#F0FDF4',
  Partial: '#FFFBEB',
  No: '#FEF2F2',
};

const OUTCOME_LABEL: Record<string, string> = {
  Yes: 'Worked as Expected',
  Partial: 'Partial Impact',
  No: 'No Measurable Impact',
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function deltaArrow(deltaType: string) {
  if (deltaType === 'up') return '▲';
  if (deltaType === 'down') return '▼';
  return '–';
}

function deltaColor(deltaType: string) {
  if (deltaType === 'up') return '#16A34A';
  if (deltaType === 'down') return '#DC2626';
  return '#64748B';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandCode = searchParams.get('brand') ?? 'ONC-101';

    const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const dataRun = await prisma.dataRun.findFirst({
      where: { brandId: brand.id, status: 'complete' },
      orderBy: { runAt: 'desc' },
    });

    const [kpiTiles, insights, openActions, completedActions, datasets] = await Promise.all([
      dataRun
        ? prisma.kpiTile.findMany({ where: { brandId: brand.id, dataRunId: dataRun.id }, orderBy: { sortOrder: 'asc' } })
        : prisma.kpiTile.findMany({ where: { brandId: brand.id }, orderBy: { sortOrder: 'asc' }, take: 4 }),
      dataRun
        ? prisma.insight.findMany({
            where: { brandId: brand.id, dataRunId: dataRun.id },
            orderBy: [{ severity: 'asc' }, { generatedDate: 'desc' }],
            take: 5,
          })
        : [],
      prisma.action.findMany({
        where: { brandId: brand.id, status: { not: 'done' } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      prisma.action.findMany({
        where: { brandId: brand.id, status: 'done' },
        include: { impactScore: true },
        orderBy: { dueDate: 'desc' },
        take: 5,
      }),
      dataRun ? prisma.dataset.findMany({ where: { dataRunId: dataRun.id } }) : [],
    ]);

    const runDate = dataRun ? formatDate(dataRun.runAt) : formatDate(new Date());
    const scorecards = completedActions.filter((a) => a.impactScore);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Exec Pack — ${brand.name} — ${runDate}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F8FAFC; color: #0F172A; font-size: 14px; line-height: 1.5; }
  .page { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #E2E8F0; margin-bottom: 28px; }
  .brand-name { font-size: 22px; font-weight: 700; color: #0F172A; }
  .brand-sub { font-size: 12px; color: #94A3B8; margin-top: 2px; }
  .confidential { font-size: 11px; font-weight: 700; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.08em; text-transform: uppercase; }
  /* Section */
  .section { margin-bottom: 28px; }
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; margin-bottom: 12px; }
  /* KPI tiles */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .kpi-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; }
  .kpi-label { font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
  .kpi-value { font-size: 24px; font-weight: 700; color: #0F172A; font-variant-numeric: tabular-nums; }
  .kpi-delta { font-size: 12px; font-weight: 600; margin-top: 4px; }
  /* Insights */
  .insight-row { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 16px; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 12px; }
  .insight-headline { font-size: 13px; font-weight: 500; color: #0F172A; flex: 1; }
  .badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 20px; border: 1px solid; white-space: nowrap; }
  .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .meta-chips { display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
  .chip { font-size: 11px; font-weight: 500; background: #F1F5F9; color: #334155; padding: 2px 8px; border-radius: 6px; }
  .impact-label { font-size: 11px; color: #94A3B8; }
  /* Actions table */
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; }
  th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #94A3B8; padding: 10px 14px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; }
  td { padding: 11px 14px; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #334155; }
  tr:last-child td { border-bottom: none; }
  /* Scorecards */
  .scorecard { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 10px; }
  .scorecard-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .scorecard-title { font-size: 13px; font-weight: 600; color: #0F172A; }
  .scorecard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .scorecard-cell { background: #F8FAFC; border: 1px solid #F1F5F9; border-radius: 8px; padding: 10px 12px; }
  .scorecard-cell-label { font-size: 10px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .scorecard-cell-value { font-size: 18px; font-weight: 700; color: #0F172A; font-variant-numeric: tabular-nums; }
  .change-cell { background: #F0FDF4; border-color: #BBF7D0; }
  .change-value { color: #16A34A; }
  /* Footer */
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .footer-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #94A3B8; margin-bottom: 6px; }
  .freshness-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .freshness-chip { font-size: 11px; padding: 2px 8px; border-radius: 6px; background: #F1F5F9; color: #334155; font-weight: 500; }
  .footer-date { font-size: 11px; color: #94A3B8; text-align: right; }
  @media print { body { background: #fff; } .page { padding: 16px; } }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand-name">${brand.name}</div>
      <div class="brand-sub">Executive Intelligence Pack · ${runDate}</div>
    </div>
    <span class="confidential">Confidential</span>
  </div>

  <!-- KPI Snapshot -->
  ${kpiTiles.length > 0 ? `
  <div class="section">
    <div class="section-title">KPI Snapshot</div>
    <div class="kpi-grid">
      ${kpiTiles.map((k) => `
      <div class="kpi-card">
        <div class="kpi-label">${k.title}</div>
        <div class="kpi-value">${k.value}</div>
        <div class="kpi-delta" style="color:${deltaColor(k.deltaType)}">${deltaArrow(k.deltaType)} ${k.delta}</div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  <!-- Top Insights -->
  ${insights.length > 0 ? `
  <div class="section">
    <div class="section-title">Top Insights</div>
    ${insights.map((ins) => `
    <div class="insight-row">
      <div style="flex:1">
        <div class="insight-headline">${ins.headline}</div>
        <div class="meta-chips">
          <span class="badge" style="background:${SEVERITY_BG[ins.severity] ?? '#F8FAFC'};color:${SEVERITY_COLOR[ins.severity] ?? '#334155'};border-color:transparent">
            <span class="dot" style="background:${SEVERITY_COLOR[ins.severity] ?? '#94A3B8'}"></span>
            ${ins.severity}
          </span>
          <span class="chip">${ins.region}</span>
          <span class="impact-label">Impact: <strong>${ins.impact}</strong></span>
        </div>
      </div>
      <span class="badge" style="background:${PILLAR_COLOR[ins.pillar] ?? '#64748B'}22;color:${PILLAR_COLOR[ins.pillar] ?? '#64748B'};border-color:${PILLAR_COLOR[ins.pillar] ?? '#64748B'}44">${ins.pillar}</span>
    </div>`).join('')}
  </div>` : ''}

  <!-- Open Actions -->
  ${openActions.length > 0 ? `
  <div class="section">
    <div class="section-title">Open Actions</div>
    <table>
      <thead>
        <tr>
          <th>Action</th>
          <th>Owner</th>
          <th>Due Date</th>
          <th>Severity</th>
          <th>Expected Lag</th>
        </tr>
      </thead>
      <tbody>
        ${openActions.map((a) => `
        <tr>
          <td style="font-weight:500;color:#0F172A">${a.title}</td>
          <td>${a.owner}</td>
          <td>${formatDate(a.dueDate)}</td>
          <td><span class="badge" style="background:${SEVERITY_BG[a.severity] ?? '#F8FAFC'};color:${SEVERITY_COLOR[a.severity] ?? '#334155'};border-color:transparent;font-size:10px">${a.severity}</span></td>
          <td style="color:#D97706;font-weight:600">${a.expectedLag ?? '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- Impact Scorecards -->
  ${scorecards.length > 0 ? `
  <div class="section">
    <div class="section-title">Impact Scorecards</div>
    ${scorecards.map((a) => {
      const s = a.impactScore!;
      return `
    <div class="scorecard">
      <div class="scorecard-header">
        <div class="scorecard-title">${a.title}</div>
        <span class="badge" style="background:${OUTCOME_BG[s.outcome] ?? '#F8FAFC'};color:${OUTCOME_COLOR[s.outcome] ?? '#334155'};border-color:transparent">
          ${OUTCOME_LABEL[s.outcome] ?? s.outcome}
        </span>
      </div>
      <div class="scorecard-grid">
        <div class="scorecard-cell">
          <div class="scorecard-cell-label">${s.metric} — Before</div>
          <div class="scorecard-cell-value">${s.before}</div>
        </div>
        <div class="scorecard-cell">
          <div class="scorecard-cell-label">After</div>
          <div class="scorecard-cell-value">${s.after}</div>
        </div>
        <div class="scorecard-cell change-cell">
          <div class="scorecard-cell-label">Change</div>
          <div class="scorecard-cell-value change-value">${s.change}</div>
        </div>
      </div>
    </div>`;
    }).join('')}
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <div>
      <div class="footer-label">Data Sources</div>
      <div class="freshness-chips">
        ${datasets.length > 0
          ? datasets.map((d) => `<span class="freshness-chip">${d.displayName ?? d.name} · ${d.freshness}</span>`).join('')
          : '<span class="freshness-chip">No dataset metadata available</span>'
        }
      </div>
    </div>
    <div class="footer-date">
      Generated ${formatDate(new Date())}<br/>
      <span style="color:#CBD5E1">Commercial Insights Platform</span>
    </div>
  </div>

</div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="exec-pack-${brandCode}-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });
  } catch (err) {
    console.error({ route: '[export/exec-pack]', error: err instanceof Error ? err.message : err, ts: new Date().toISOString() });
    return NextResponse.json({ error: 'Failed to generate exec pack' }, { status: 500 });
  }
}
