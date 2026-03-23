import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getOrgId, getUserId, getUserRole } from '@/lib/request-context';

export async function GET(request: NextRequest) {
  let orgId: string;
  try {
    orgId = getOrgId(request);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }
  try {
    const role = getUserRole(request);
    let brands;
    if (role === 'admin') {
      brands = await prisma.brand.findMany({
        where: { orgId },
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
      });
    } else {
      const userId = getUserId(request);
      const assignments = await prisma.userBrandRole.findMany({
        where: { userId },
        select: { brand: { select: { id: true, code: true, name: true, orgId: true } } },
      });
      brands = assignments
        .map(a => a.brand)
        .filter(b => b.orgId === orgId)
        .map(({ orgId: _o, ...rest }) => rest)
        .sort((a, b) => a.code.localeCompare(b.code));
    }
    return NextResponse.json({ brands });
  } catch (err) {
    logger.error('Failed to fetch brands', { route: 'GET /api/brands', error: err instanceof Error ? err.message : err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
