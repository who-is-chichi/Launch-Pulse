import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Brand } from '@prisma/client';
import { getOrgId, assertBrandAccess, requireRole } from '@/lib/request-context';

export async function GET(request: NextRequest) {
  try {
    const brandCode = new URL(request.url).searchParams.get('brand') ?? 'ONC-101';

    let orgId: string;
    let brand: Brand;
    try {
      requireRole(request, 'analytics_manager');
      orgId = getOrgId(request);
      brand = await assertBrandAccess(orgId, brandCode, 'GET /api/data-mapping/configs');
    } catch (err) {
      const httpStatus = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
    }

    const configs = await prisma.mappingConfig.findMany({
      where: { brandId: brand.id },
      orderBy: { dataset: 'asc' },
    });
    return NextResponse.json({ configs });
  } catch (err) {
    logger.error('Failed to fetch mapping configs', { route: 'GET /api/data-mapping/configs', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Failed to fetch mapping configs' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, brandCode } = await request.json();

    if (!id || !status || !brandCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let orgId: string;
    let brand: Brand;
    try {
      orgId = getOrgId(request);
      brand = await assertBrandAccess(orgId, brandCode, 'PATCH /api/data-mapping/configs');
    } catch (err) {
      const httpStatus = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
    }

    const existing = await prisma.mappingConfig.findUnique({ where: { id }, select: { brandId: true } });
    if (!existing || existing.brandId !== brand.id) {
      return NextResponse.json({ error: 'Mapping config not found' }, { status: 404 });
    }

    const config = await prisma.mappingConfig.update({
      where: { id },
      data: { status, lastUpdated: new Date() },
    });

    return NextResponse.json({ ok: true, config });
  } catch (err) {
    logger.error('Failed to update mapping config', { route: 'PATCH /api/data-mapping/configs', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Failed to update mapping config' }, { status: 500 });
  }
}
