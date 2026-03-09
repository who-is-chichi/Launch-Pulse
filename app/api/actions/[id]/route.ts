import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const VALID_STATUSES = ['new', 'inprogress', 'blocked', 'done'];
const VALID_OUTCOMES = ['Yes', 'Partial', 'No'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status, impactScore, notes, ownerRole } = body;

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  if (impactScore !== undefined) {
    const { metric, before, after, change, outcome, completedDate } = impactScore;
    if (!metric || !before || !after || !change || !outcome || !completedDate) {
      return NextResponse.json({ error: 'impactScore requires metric, before, after, change, outcome, completedDate' }, { status: 400 });
    }
    if (!VALID_OUTCOMES.includes(outcome)) {
      return NextResponse.json({ error: 'outcome must be Yes, Partial, or No' }, { status: 400 });
    }
  }

  try {
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
