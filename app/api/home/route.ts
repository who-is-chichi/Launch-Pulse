import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sortBySeverityDesc } from '@/lib/severity';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandCode = searchParams.get('brand') ?? 'ONC-101';
    const timeWindow = searchParams.get('timeWindow') ?? 'Last 7 days';
    const geography = searchParams.get('geography') ?? 'Nation';

    const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const dataRun = await prisma.dataRun.findFirst({
      where: { brandId: brand.id, timeWindow, geography, status: 'complete' },
      orderBy: { runAt: 'desc' },
    });

    if (!dataRun) {
      return NextResponse.json({ error: 'No data run found' }, { status: 404 });
    }

    const [kpiTiles, insightsRaw, actions] = await Promise.all([
      prisma.kpiTile.findMany({
        where: { brandId: brand.id, dataRunId: dataRun.id },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.insight.findMany({
        where: { brandId: brand.id, dataRunId: dataRun.id },
      }),
      prisma.action.findMany({
        where: { brandId: brand.id, status: { not: 'done' } },
        orderBy: { dueDate: 'asc' },
        take: 3,
      }),
    ]);

    const insights = sortBySeverityDesc(insightsRaw).slice(0, 5);

    return NextResponse.json({ kpiTiles, insights, actions, dataRun });
  } catch (err) {
    logger.error('Internal server error', { route: 'GET /api/home', error: err instanceof Error ? err.message : err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
