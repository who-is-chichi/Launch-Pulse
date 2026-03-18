import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runInsightEngine } from '@/lib/insight-engine';
import { logger } from '@/lib/logger';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: dataRunId } = await params;
    const body = await _request.json().catch(() => ({}));
    const { brandCode } = body as { brandCode?: string };

    const dataRun = await prisma.dataRun.findUnique({ where: { id: dataRunId } });
    if (!dataRun) {
      return NextResponse.json({ error: 'DataRun not found' }, { status: 404 });
    }

    if (brandCode) {
      const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
      if (!brand || dataRun.brandId !== brand.id) {
        logger.error('DataRun brand mismatch', { route: '[runs/[id]/generate-insights POST]', id: dataRunId, brandCode });
        return NextResponse.json({ error: 'DataRun not found' }, { status: 404 });
      }
    }

    if (dataRun.status !== 'complete') {
      return NextResponse.json({ error: 'DataRun is not complete' }, { status: 400 });
    }

    const { insightsCreated } = await runInsightEngine(dataRunId);

    return NextResponse.json({ ok: true, dataRunId, insightsCreated });
  } catch (err) {
    logger.error('Generate insights failed', { route: '[runs/[id]/generate-insights POST]', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Engine run failed' },
      { status: 500 },
    );
  }
}
