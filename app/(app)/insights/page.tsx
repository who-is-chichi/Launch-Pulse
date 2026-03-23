import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sortBySeverityDesc } from '@/lib/severity';
import InsightsClient from './InsightsClient';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 10;

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; brand?: string; timeWindow?: string; geography?: string; pillar?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? '';
  const payload = token ? await verifyToken(token).catch(() => null) : null;
  const userRole = payload?.role ?? 'sales_rep';

  const VALID_PILLARS = ['Demand', 'Start Ops', 'Execution', 'Structure'] as const;
  const { page: pageParam, brand: brandCode = 'ONC-101', timeWindow = 'Last 7 days', geography = 'Nation', pillar: pillarParam } = await searchParams;
  const pillar = VALID_PILLARS.includes(pillarParam as typeof VALID_PILLARS[number])
    ? pillarParam
    : undefined;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));

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
  const geographyFallback = fallbackDataRun !== null;

  const where = effectiveDataRun ? {
    brandId: brand!.id,
    dataRunId: effectiveDataRun.id,
    ...(pillar ? { pillar } : {}),
  } : null;

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
      pillar={pillar ?? ''}
      geographyFallback={geographyFallback}
      geography={geography}
      userRole={userRole}
    />
  );
}
