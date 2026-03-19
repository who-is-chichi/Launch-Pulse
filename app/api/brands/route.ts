import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getOrgId } from '@/lib/request-context';

export async function GET(request: NextRequest) {
  let orgId: string;
  try {
    orgId = getOrgId(request);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }
  try {
    const brands = await prisma.brand.findMany({
      where: { orgId },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });
    return NextResponse.json({ brands });
  } catch (err) {
    logger.error('Failed to fetch brands', { route: 'GET /api/brands', error: err instanceof Error ? err.message : err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
