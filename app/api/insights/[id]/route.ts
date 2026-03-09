import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const insight = await prisma.insight.findUnique({
    where: { id },
    include: {
      drivers: { orderBy: { sortOrder: 'asc' } },
      metricChanges: true,
      contributors: { orderBy: { sortOrder: 'asc' } },
      risks: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!insight) {
    return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
  }

  return NextResponse.json({ insight });
}

const VALID_STATUSES = ['New', 'Investigating', 'Actioned', 'Monitoring'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status, notes } = await request.json();

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
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
    logger.error('Failed to update insight status', { route: '[insights/[id] PATCH]', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 },
    );
  }
}
