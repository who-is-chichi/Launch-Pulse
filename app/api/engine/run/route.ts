import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runInsightEngine } from '@/lib/insight-engine';
import { evaluateActions } from '@/lib/impact-evaluator';
import { logger } from '@/lib/logger';
import { Brand } from '@prisma/client';
import { getOrgId, assertBrandAccess, requireRole } from '@/lib/request-context';
import { checkApiRateLimit } from '@/lib/api-rate-limit';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') ?? 'anonymous';
    const rl = checkApiRateLimit(userId, 'engine');
    if (!rl.allowed) {
      logger.warn('Engine rate limit exceeded', { route: 'POST /api/engine/run', userId });
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429, headers: rl.retryAfterSeconds ? { 'Retry-After': String(rl.retryAfterSeconds) } : undefined },
      );
    }

    const body = await request.json().catch(() => ({}));
    const brandCode: string = body.brandCode ?? 'ONC-101';

    let orgId: string;
    let brand: Brand;
    try {
      requireRole(request, 'analytics_manager');
      orgId = getOrgId(request);
      brand = await assertBrandAccess(orgId, brandCode, 'POST /api/engine/run');
    } catch (err) {
      const httpStatus = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
    }

    // Find latest completed DataRun for timeWindow/geography context
    const latestRun = await prisma.dataRun.findFirst({
      where: { brandId: brand.id, status: 'complete' },
      orderBy: { runAt: 'desc' },
      include: { datasets: true },
    });

    if (!latestRun) {
      return NextResponse.json({ error: 'No completed DataRun found for brand' }, { status: 404 });
    }

    // Create a new DataRun for this engine execution
    const newRun = await prisma.dataRun.create({
      data: {
        brandId: brand.id,
        runAt: new Date(),
        timeWindow: latestRun.timeWindow,
        geography: latestRun.geography,
        status: 'complete',
      },
    });

    // Copy Datasets from latest run to new run (fact tables are brand-scoped, no copy needed)
    if (latestRun.datasets.length > 0) {
      await prisma.dataset.createMany({
        data: latestRun.datasets.map(d => ({
          dataRunId: newRun.id,
          name: d.name,
          displayName: d.displayName,
          lastRun: d.lastRun,
          freshness: d.freshness,
          coverage: d.coverage,
          notes: d.notes,
        })),
      });
    }

    const { insightsCreated } = await runInsightEngine(newRun.id);

    // Evaluate action impacts — wrapped so engine run still succeeds even if evaluation fails
    let actionsEvaluated = 0;
    try {
      const evalResult = await evaluateActions(newRun.id);
      actionsEvaluated = evalResult.evaluated;
    } catch (evalErr) {
      logger.error('evaluateActions failed', { route: 'POST /api/engine/run', error: evalErr instanceof Error ? evalErr.message : String(evalErr) });
    }

    return NextResponse.json({
      ok: true,
      dataRunId: newRun.id,
      insightsCreated,
      actionsEvaluated,
    });
  } catch (err) {
    logger.error('Engine run failed', { route: 'POST /api/engine/run', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Engine run failed' },
      { status: 500 },
    );
  }
}
