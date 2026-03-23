import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, Brand } from '@prisma/client';
import { logger } from '@/lib/logger';
import { validateActionBody } from '@/lib/actions-validation';
import { getOrgId, assertBrandAccess, requireRole, getUserId, assertUserBrandAccess } from '@/lib/request-context';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brandCode = searchParams.get('brand') ?? 'ONC-101';
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '25', 10)));
  const skip = (page - 1) * pageSize;

  let orgId: string;
  let brand: Brand;
  try {
    orgId = getOrgId(request);
    brand = await assertBrandAccess(orgId, brandCode, 'GET /api/actions');
    await assertUserBrandAccess(getUserId(request), brand.id, request, 'GET /api/actions');
  } catch (err) {
    const httpStatus = (err as { status?: number }).status ?? 401;
    return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
  }

  const where: Prisma.ActionWhereInput = { brandId: brand.id, isActive: true };
  if (status) where.status = status;

  const [actions, total] = await prisma.$transaction([
    prisma.action.findMany({ where, include: { impactScore: true }, orderBy: { dueDate: 'asc' }, skip, take: pageSize }),
    prisma.action.count({ where }),
  ]);

  return NextResponse.json({
    actions,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateActionBody(body);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const { brandCode = 'ONC-101', title, linkedInsight, owner, ownerRole, dueDate, severity, expectedLag, insightId, notes } = body;

    let orgId: string;
    let brand: Brand;
    try {
      requireRole(request, 'regional_director');
      orgId = getOrgId(request);
      brand = await assertBrandAccess(orgId, brandCode, 'POST /api/actions');
    } catch (err) {
      const httpStatus = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
    }

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
    logger.error('Failed to create action', { route: 'POST /api/actions', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create action' },
      { status: 500 },
    );
  }
}
