import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandCode = searchParams.get('brand') ?? 'ONC-101';

    const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
    if (!brand) return NextResponse.json({ datasets: [] });

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
    console.error({ route: '[data-status GET]', error: err instanceof Error ? err.message : err, ts: new Date().toISOString() });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
