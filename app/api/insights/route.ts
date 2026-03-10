import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { sortBySeverityDesc } from '@/lib/severity';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandCode = searchParams.get('brand') ?? 'ONC-101';
    const pillar = searchParams.get('pillar');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
    if (!brand) {
      return NextResponse.json({ insights: [] });
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
    console.error({ route: '[insights GET]', error: err instanceof Error ? err.message : err, ts: new Date().toISOString() });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
