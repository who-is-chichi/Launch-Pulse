import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { validateActionPatchBody } from '@/lib/actions-validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const validationError = validateActionPatchBody(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { status, impactScore, notes, ownerRole, brandCode } = body;

  try {
    if (brandCode) {
      const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
      const existing = brand
        ? await prisma.action.findUnique({ where: { id }, select: { brandId: true } })
        : null;
      if (!brand || !existing || existing.brandId !== brand.id) {
        logger.error('Action brand mismatch', { route: '[actions PATCH]', id, brandCode });
        return NextResponse.json({ error: 'Action not found' }, { status: 404 });
      }
    }

    const updateData: Record<string, string | null> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (ownerRole !== undefined) updateData.ownerRole = ownerRole;

    const [action] = await prisma.$transaction(async (tx) => {
      const updatedAction = Object.keys(updateData).length > 0
        ? await tx.action.update({ where: { id }, data: updateData })
        : await tx.action.findUniqueOrThrow({ where: { id } });

      if (impactScore) {
        const { metric, before, after, change, outcome, completedDate } = impactScore;
        await tx.impactScore.upsert({
          where: { actionId: id },
          update: { metric, before, after, change, outcome, completedDate: new Date(completedDate) },
          create: { actionId: id, metric, before, after, change, outcome, completedDate: new Date(completedDate) },
        });
      }

      return [updatedAction];
    });

    return NextResponse.json({ action });
  } catch (err) {
    logger.error('Failed to update action', { route: '[actions PATCH]', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update action' },
      { status: 500 },
    );
  }
}
