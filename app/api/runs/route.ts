import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandCode = searchParams.get('brand') ?? 'ONC-101';

    const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
    if (!brand) return NextResponse.json({ runs: [] });

    const runs = await prisma.dataRun.findMany({
      where: { brandId: brand.id },
      orderBy: { runAt: 'desc' },
      select: { id: true, runAt: true, status: true, timeWindow: true, geography: true },
    });

    return NextResponse.json({ runs });
  } catch (err) {
    console.error({ route: '[runs GET]', error: err instanceof Error ? err.message : err, ts: new Date().toISOString() });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
