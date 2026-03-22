import { prisma } from '@/lib/prisma';
import { sortBySeverityDesc } from '@/lib/severity';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; timeWindow?: string; geography?: string }>;
}) {
  const { brand: brandCode = 'ONC-101', timeWindow = 'Last 7 days', geography = 'Nation' } = await searchParams;
  const brand = await prisma.brand.findUnique({ where: { code: brandCode } });

  const dataRun = brand
    ? await prisma.dataRun.findFirst({
        where: { brandId: brand.id, status: 'complete', timeWindow, geography },
        orderBy: { runAt: 'desc' },
      })
    : null;

  const fallbackDataRun = (!dataRun && geography !== 'Nation' && brand)
    ? await prisma.dataRun.findFirst({
        where: { brandId: brand.id, status: 'complete', timeWindow, geography: 'Nation' },
        orderBy: { runAt: 'desc' },
      })
    : null;
  const effectiveDataRun = dataRun ?? fallbackDataRun;
  const geographyFallback = fallbackDataRun !== null; // only true when Nation fallback data actually exists

  const [kpiTilesRaw, insightsRaw, actions, datasets, drivers] = await Promise.all([
    effectiveDataRun
      ? prisma.kpiTile.findMany({
          where: { brandId: brand!.id, dataRunId: effectiveDataRun.id },
          orderBy: { sortOrder: 'asc' },
        })
      : [],
    effectiveDataRun
      ? prisma.insight.findMany({
          where: { brandId: brand!.id, dataRunId: effectiveDataRun.id },
        })
      : [],
    brand
      ? prisma.action.findMany({
          where: { brandId: brand.id, status: { not: 'done' } },
          orderBy: { dueDate: 'asc' },
          take: 3,
        })
      : [],
    effectiveDataRun
      ? prisma.dataset.findMany({ where: { dataRunId: effectiveDataRun.id } })
      : [],
    effectiveDataRun
      ? prisma.driver.findMany({
          where: { insight: { dataRunId: effectiveDataRun.id } },
        })
      : [],
  ]);

  // Sort by severity weight (High > Medium > Low), then by most recent
  const insights = sortBySeverityDesc(insightsRaw).slice(0, 5);

  // Fallback: if no KpiTiles found for this dataRun, fetch any for the brand
  const kpiTiles = kpiTilesRaw.length > 0 || !brand
    ? kpiTilesRaw
    : await prisma.kpiTile.findMany({
        where: { brandId: brand.id },
        orderBy: { sortOrder: 'asc' },
        take: 4,
      });

  // Fetch risks from the highest-severity insight (first after correct sort)
  const topInsight = insights[0];
  const risks = topInsight
    ? await prisma.insightRisk.findMany({ where: { insightId: topInsight.id } })
    : [];

  return (
    <HomeClient
      brandCode={brandCode}
      dataRunId={effectiveDataRun?.id ?? ''}
      kpiTiles={kpiTiles}
      insights={insights}
      actions={actions}
      datasets={datasets}
      drivers={drivers}
      topInsightRisks={risks}
      dataRunAt={effectiveDataRun?.runAt?.toISOString() ?? null}
      geographyFallback={geographyFallback}
      selectedGeography={geography}
    />
  );
}
