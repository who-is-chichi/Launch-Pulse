import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgId, assertBrandAccess } from '@/lib/request-context';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // 1. Validate brandCode
    const brandCode = searchParams.get('brandCode');
    if (!brandCode) {
      return NextResponse.json({ error: 'brandCode required' }, { status: 400 });
    }

    // 2. Parse limit (default 5, max 20)
    const limitParam = searchParams.get('limit');
    const limit = Math.min(limitParam ? parseInt(limitParam, 10) || 5 : 5, 20);

    // 3. Authenticate — getOrgId throws with status 401 if header missing
    let orgId: string;
    try {
      orgId = getOrgId(request);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4 + 5. Look up brand and assert access.
    // assertBrandAccess does both: findUnique + orgId check.
    // It throws with status 404 if not found or org mismatch.
    let brand: Awaited<ReturnType<typeof assertBrandAccess>>;
    try {
      brand = await assertBrandAccess(orgId, brandCode, 'GET /api/ingest/runs');
    } catch (err) {
      const status = (err as { status?: number }).status ?? 403;
      const message = (err as Error).message ?? 'Forbidden';
      return NextResponse.json({ error: message }, { status });
    }

    // 6. Query ingestion runs with recent file manifests
    const runs = await prisma.bronzeCtlIngestionRun.findMany({
      where: { brandId: brand.id },
      orderBy: { startedAt: 'desc' },
      take: Math.min(limit, 20),
      include: {
        fileManifests: {
          orderBy: { receivedTs: 'desc' },
          take: 3,
        },
      },
    });

    logger.info('Ingest runs fetched', {
      route: 'GET /api/ingest/runs',
      orgId,
      brandCode,
      count: runs.length,
    });

    // 7. Return runs — serialize BigInt fields to Number
    const serialized = runs.map((run) => ({
      ...run,
      recordsLoaded: run.recordsLoaded !== null ? Number(run.recordsLoaded) : null,
      recordsRejected: run.recordsRejected !== null ? Number(run.recordsRejected) : null,
      fileManifests: run.fileManifests.map((fm) => ({
        ...fm,
        rowCountLoaded: fm.rowCountLoaded !== null ? Number(fm.rowCountLoaded) : null,
        rowCountRejected: fm.rowCountRejected !== null ? Number(fm.rowCountRejected) : null,
      })),
    }));
    return NextResponse.json({ runs: serialized });
  } catch (err) {
    logger.error('Ingest runs fetch failed', {
      route: 'GET /api/ingest/runs',
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
