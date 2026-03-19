import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runInsightEngine } from '@/lib/insight-engine';
import { logger } from '@/lib/logger';
import { getOrgId, assertBrandAccess } from '@/lib/request-context';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: dataRunId } = await params;

    const dataRun = await prisma.dataRun.findUnique({
      where: { id: dataRunId },
      include: { brand: { select: { code: true } } },
    });
    if (!dataRun) {
      return NextResponse.json({ error: 'DataRun not found' }, { status: 404 });
    }

    const brandCode = dataRun.brand.code;

    let orgId: string;
    try {
      orgId = getOrgId(request);
      await assertBrandAccess(orgId, brandCode, 'POST /api/runs/[id]/generate-insights');
    } catch (err) {
      const httpStatus = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
    }

    if (dataRun.status !== 'complete') {
      return NextResponse.json({ error: 'DataRun is not complete' }, { status: 400 });
    }

    const { insightsCreated } = await runInsightEngine(dataRunId);

    return NextResponse.json({ ok: true, dataRunId, insightsCreated });
  } catch (err) {
    logger.error('Generate insights failed', { route: 'POST /api/runs/[id]/generate-insights', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Engine run failed' },
      { status: 500 },
    );
  }
}
