import { prisma } from '@/lib/prisma';
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
        where: { brandId: brand.id, status: 'complete' },
        orderBy: { runAt: 'desc' },
      })
    : null;

  const [kpiTilesRaw, insights, actions, datasets, drivers, topInsightRisks] = await Promise.all([
    dataRun
      ? prisma.kpiTile.findMany({
          where: { brandId: brand!.id, dataRunId: dataRun.id },
          orderBy: { sortOrder: 'asc' },
        })
      : [],
    dataRun
      ? prisma.insight.findMany({
          where: { brandId: brand!.id, dataRunId: dataRun.id },
          orderBy: [{ severity: 'asc' }, { generatedDate: 'desc' }],
          take: 5,
        })
      : [],
    brand
      ? prisma.action.findMany({
          where: { brandId: brand.id, status: { not: 'done' } },
          orderBy: { dueDate: 'asc' },
          take: 3,
        })
      : [],
    dataRun
      ? prisma.dataset.findMany({ where: { dataRunId: dataRun.id } })
      : [],
    dataRun
      ? prisma.driver.findMany({
          where: { insight: { dataRunId: dataRun.id } },
        })
      : [],
    Promise.resolve([] as { risk: string }[]),
  ]);

  // Fallback: if no KpiTiles found for this dataRun, fetch any for the brand
  const kpiTiles = kpiTilesRaw.length > 0 || !brand
    ? kpiTilesRaw
    : await prisma.kpiTile.findMany({
        where: { brandId: brand.id },
        orderBy: { sortOrder: 'asc' },
        take: 4,
      });

  // Fetch risks from the highest-severity insight of this run
  const topInsight = insights[0];
  const risks = topInsight
    ? await prisma.insightRisk.findMany({ where: { insightId: topInsight.id } })
    : [];

  return (
    <HomeClient
      brandCode={brandCode}
      kpiTiles={kpiTiles}
      insights={insights}
      actions={actions}
      datasets={datasets}
      drivers={drivers}
      topInsightRisks={risks}
      dataRunAt={dataRun?.runAt?.toISOString() ?? null}
    />
  );
}
