import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, Brand } from '@prisma/client';
import { sortBySeverityDesc } from '@/lib/severity';
import { logger } from '@/lib/logger';
import { getOrgId, assertBrandAccess } from '@/lib/request-context';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandCode = searchParams.get('brand') ?? 'ONC-101';
    const pillar = searchParams.get('pillar');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let orgId: string;
    let brand: Brand;
    try {
      orgId = getOrgId(request);
      brand = await assertBrandAccess(orgId, brandCode, 'GET /api/insights');
    } catch (err) {
      const status = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status });
    }

    // Scope to the latest completed DataRun so historical runs don't bleed through
    const latestRun = await prisma.dataRun.findFirst({
      where: { brandId: brand.id, status: 'complete' },
      orderBy: { runAt: 'desc' },
    });

    const where: Prisma.InsightWhereInput = {
      brandId: brand.id,
      ...(latestRun ? { dataRunId: latestRun.id } : {}),
    };

    if (pillar) where.pillar = pillar;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (search) {
      where.headline = { contains: search, mode: 'insensitive' };
    }

    const insightsRaw = await prisma.insight.findMany({
      where,
      orderBy: { generatedDate: 'desc' },
    });

    const insights = sortBySeverityDesc(insightsRaw);

    return NextResponse.json({ insights });
  } catch (err) {
    logger.error('Failed to fetch insights', { route: 'GET /api/insights', error: err instanceof Error ? err.message : err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
