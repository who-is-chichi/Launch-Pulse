import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgId } from '@/lib/request-context';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const orgId = getOrgId(request);
    const users = await prisma.user.findMany({
      where: { orgId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ users });
  } catch (err) {
    logger.error('GET /api/users failed', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
