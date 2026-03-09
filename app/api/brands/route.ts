import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });
    return NextResponse.json({ brands });
  } catch (err) {
    console.error({ route: '[brands GET]', error: err instanceof Error ? err.message : err, ts: new Date().toISOString() });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
