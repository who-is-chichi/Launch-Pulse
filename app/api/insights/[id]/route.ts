import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { INSIGHT_STATUSES } from '@/lib/severity';
import { Brand } from '@prisma/client';
import { getOrgId, assertBrandAccess } from '@/lib/request-context';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const brandCode = searchParams.get('brand');

  if (!brandCode) {
    return NextResponse.json({ error: 'brand query param is required' }, { status: 400 });
  }

  let orgId: string;
  let brand: Brand;
  try {
    orgId = getOrgId(request);
    brand = await assertBrandAccess(orgId, brandCode, 'GET /api/insights/[id]');
  } catch (err) {
    const status = (err as { status?: number }).status ?? 401;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }

  const insight = await prisma.insight.findUnique({
    where: { id },
    include: {
      drivers: { orderBy: { sortOrder: 'asc' } },
      metricChanges: true,
      contributors: { orderBy: { sortOrder: 'asc' } },
      risks: { orderBy: { sortOrder: 'asc' } },
      actions: {
        select: {
          id: true,
          title: true,
          owner: true,
          ownerRole: true,
          dueDate: true,
          severity: true,
          status: true,
          expectedLag: true,
          linkedInsight: true,
        },
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  if (!insight) {
    return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
  }

  if (insight.brandId !== brand.id) {
    logger.error('Insight brand mismatch', { route: 'GET /api/insights/[id]', id, brandCode });
    return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
  }

  return NextResponse.json({ insight });
}

const VALID_STATUSES: readonly string[] = INSIGHT_STATUSES;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status, notes, brandCode } = await request.json();

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (!brandCode) {
      return NextResponse.json({ error: 'brandCode is required' }, { status: 400 });
    }

    let orgId: string;
    let brand: Brand;
    try {
      orgId = getOrgId(request);
      brand = await assertBrandAccess(orgId, brandCode, 'PATCH /api/insights/[id]');
    } catch (err) {
      const httpStatus = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
    }

    const existing = await prisma.insight.findUnique({ where: { id }, select: { brandId: true } });
    if (!existing || existing.brandId !== brand.id) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    const updateData: Record<string, string> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const insight = await prisma.insight.update({
      where: { id },
      data: updateData,
      select: { id: true, status: true, notes: true },
    });

    return NextResponse.json({ ok: true, status: insight.status, notes: insight.notes });
  } catch (err) {
    logger.error('Failed to update insight status', { route: 'PATCH /api/insights/[id]', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 },
    );
  }
}
