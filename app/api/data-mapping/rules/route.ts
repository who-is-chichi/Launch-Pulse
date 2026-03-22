import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Brand } from '@prisma/client';
import { getOrgId, assertBrandAccess } from '@/lib/request-context';

export async function GET(request: NextRequest) {
  try {
    const brandCode = new URL(request.url).searchParams.get('brand') ?? 'ONC-101';

    let orgId: string;
    let brand: Brand;
    try {
      orgId = getOrgId(request);
      brand = await assertBrandAccess(orgId, brandCode, 'GET /api/data-mapping/rules');
    } catch (err) {
      const httpStatus = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
    }

    const rules = await prisma.normalizationRule.findMany({
      where: { brandId: brand.id },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ rules });
  } catch (err) {
    logger.error('Failed to fetch normalization rules', { route: 'GET /api/data-mapping/rules', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Failed to fetch normalization rules' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, normalizedValue, category, brandCode } = await request.json();

    if (!id || !normalizedValue || !category || !brandCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let orgId: string;
    let brand: Brand;
    try {
      orgId = getOrgId(request);
      brand = await assertBrandAccess(orgId, brandCode, 'PATCH /api/data-mapping/rules');
    } catch (err) {
      const httpStatus = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
    }

    const existing = await prisma.normalizationRule.findUnique({ where: { id }, select: { brandId: true } });
    if (!existing || existing.brandId !== brand.id) {
      return NextResponse.json({ error: 'Normalization rule not found' }, { status: 404 });
    }

    const rule = await prisma.normalizationRule.update({
      where: { id },
      data: { normalizedValue, category },
    });

    return NextResponse.json({ ok: true, rule });
  } catch (err) {
    logger.error('Failed to update normalization rule', { route: 'PATCH /api/data-mapping/rules', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Failed to update normalization rule' }, { status: 500 });
  }
}
