import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { validateActionBody } from '@/lib/actions-validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brandCode = searchParams.get('brand') ?? 'ONC-101';
  const status = searchParams.get('status');

  const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
  if (!brand) return NextResponse.json({ actions: [], impactScores: [] });

  const where: Prisma.ActionWhereInput = { brandId: brand.id };
  if (status) where.status = status;

  const actions = await prisma.action.findMany({
    where,
    include: { impactScore: true },
    orderBy: { dueDate: 'asc' },
  });

  return NextResponse.json({ actions });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateActionBody(body);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const { brandCode = 'ONC-101', title, linkedInsight, owner, ownerRole, dueDate, severity, expectedLag, insightId, notes } = body;

    const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    const action = await prisma.action.create({
      data: {
        brandId: brand.id,
        insightId: insightId ?? null,
        title,
        linkedInsight,
        owner,
        ownerRole: ownerRole ?? null,
        dueDate: new Date(dueDate),
        severity,
        expectedLag: expectedLag ?? '',
        status: 'new',
        notes: notes ?? null,
      },
    });

    return NextResponse.json({ action }, { status: 201 });
  } catch (err) {
    logger.error('Failed to create action', { route: '[actions POST]', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create action' },
      { status: 500 },
    );
  }
}
