import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Brand } from '@prisma/client';
import { getOrgId, assertBrandAccess } from '@/lib/request-context';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandCode = searchParams.get('brand') ?? 'ONC-101';

    let orgId: string;
    let brand: Brand;
    try {
      orgId = getOrgId(request);
      brand = await assertBrandAccess(orgId, brandCode, 'GET /api/runs');
    } catch (err) {
      const httpStatus = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
    }

    const runs = await prisma.dataRun.findMany({
      where: { brandId: brand.id },
      orderBy: { runAt: 'desc' },
      select: { id: true, runAt: true, status: true, timeWindow: true, geography: true },
    });

    return NextResponse.json({ runs });
  } catch (err) {
    logger.error('Failed to fetch runs', { route: 'GET /api/runs', error: err instanceof Error ? err.message : err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
