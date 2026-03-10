import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const brandCode = new URL(request.url).searchParams.get('brand') ?? 'ONC-101';
    const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
    if (!brand) return NextResponse.json({ rules: [] });

    const rules = await prisma.normalizationRule.findMany({
      where: { brandId: brand.id },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ rules });
  } catch (err) {
    logger.error('Failed to fetch normalization rules', { route: 'data-mapping/rules GET', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Failed to fetch normalization rules' }, { status: 500 });
  }
}
