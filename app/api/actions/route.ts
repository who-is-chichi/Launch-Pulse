import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

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

const VALID_SEVERITIES = ['High', 'Medium', 'Low'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandCode = 'ONC-101', title, linkedInsight, owner, ownerRole, dueDate, severity, expectedLag, insightId, notes } = body;

    if (!title || typeof title !== 'string') return NextResponse.json({ error: 'title is required' }, { status: 400 });
    if (!linkedInsight || typeof linkedInsight !== 'string') return NextResponse.json({ error: 'linkedInsight is required' }, { status: 400 });
    if (!owner || typeof owner !== 'string') return NextResponse.json({ error: 'owner is required' }, { status: 400 });
    if (!dueDate) return NextResponse.json({ error: 'dueDate is required' }, { status: 400 });
    if (!severity || !VALID_SEVERITIES.includes(severity)) return NextResponse.json({ error: 'severity must be High, Medium, or Low' }, { status: 400 });

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
