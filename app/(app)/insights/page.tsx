import { prisma } from '@/lib/prisma';
import { sortBySeverityDesc } from '@/lib/severity';
import InsightsClient from './InsightsClient';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 10;

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; brand?: string; timeWindow?: string; geography?: string }>;
}) {
  const { page: pageParam, brand: brandCode = 'ONC-101', timeWindow = 'Last 7 days', geography = 'Nation' } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));

  const brand = await prisma.brand.findUnique({ where: { code: brandCode } });

  const dataRun = brand
    ? await prisma.dataRun.findFirst({
        where: { brandId: brand.id, status: 'complete', timeWindow, geography },
        orderBy: { runAt: 'desc' },
      })
    : null;

  const where = dataRun ? { brandId: brand!.id, dataRunId: dataRun.id } : null;

  const [insightsRaw, totalCount] = where
    ? await Promise.all([
        prisma.insight.findMany({
          where,
          orderBy: { generatedDate: 'desc' },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        prisma.insight.count({ where }),
      ])
    : [[], 0];

  const insights = sortBySeverityDesc(insightsRaw);

  return (
    <InsightsClient
      initialInsights={insights}
      totalCount={totalCount}
      page={page}
      pageSize={PAGE_SIZE}
    />
  );
}
