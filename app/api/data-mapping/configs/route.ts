import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const brandCode = new URL(request.url).searchParams.get('brand') ?? 'ONC-101';
    const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
    if (!brand) return NextResponse.json({ configs: [] });

    const configs = await prisma.mappingConfig.findMany({
      where: { brandId: brand.id },
      orderBy: { dataset: 'asc' },
    });
    return NextResponse.json({ configs });
  } catch (err) {
    logger.error('Failed to fetch mapping configs', { route: 'data-mapping/configs GET', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Failed to fetch mapping configs' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, brandCode } = await request.json();

    if (!id || !status || !brandCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
    const existing = brand
      ? await prisma.mappingConfig.findUnique({ where: { id }, select: { brandId: true } })
      : null;
    if (!brand || !existing || existing.brandId !== brand.id) {
      return NextResponse.json({ error: 'Mapping config not found' }, { status: 404 });
    }

    const config = await prisma.mappingConfig.update({
      where: { id },
      data: { status, lastUpdated: new Date() },
    });

    return NextResponse.json({ ok: true, config });
  } catch (err) {
    logger.error('Failed to update mapping config', { route: 'data-mapping/configs PATCH', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Failed to update mapping config' }, { status: 500 });
  }
}
