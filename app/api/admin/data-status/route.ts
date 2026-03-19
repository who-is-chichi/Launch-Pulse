import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Brand } from '@prisma/client';
import { getOrgId, getUserRole, assertBrandAccess } from '@/lib/request-context';

export async function GET(request: NextRequest) {
  try {
    const role = getUserRole(request);
    if (role !== 'admin' && role !== 'analytics_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const brandCode = searchParams.get('brand') ?? 'ONC-101';

    let orgId: string;
    let brand: Brand;
    try {
      orgId = getOrgId(request);
      brand = await assertBrandAccess(orgId, brandCode, 'GET /api/admin/data-status');
    } catch (err) {
      const httpStatus = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
    }

    const dataRun = await prisma.dataRun.findFirst({
      where: { brandId: brand.id, status: 'complete' },
      orderBy: { runAt: 'desc' },
    });

    if (!dataRun) return NextResponse.json({ datasets: [] });

    const datasets = await prisma.dataset.findMany({
      where: { dataRunId: dataRun.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ datasets, dataRun });
  } catch (err) {
    logger.error('Failed to fetch admin data status', { route: 'GET /api/admin/data-status', error: err instanceof Error ? err.message : err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
