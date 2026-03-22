import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  logger.info('User logged out', { route: 'POST /api/auth/logout' });
  return NextResponse.json({ ok: true });
}
