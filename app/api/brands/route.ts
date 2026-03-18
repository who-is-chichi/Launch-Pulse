import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });
    return NextResponse.json({ brands });
  } catch (err) {
    logger.error('brands', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
