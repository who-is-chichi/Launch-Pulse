import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name } = body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (name.trim().length > 100) {
    return NextResponse.json({ error: 'Name must be 100 characters or fewer' }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: { id: true, email: true, name: true, role: true, orgId: true },
    });
    logger.info('User profile updated', { route: 'PATCH /api/auth/me', userId });
    return NextResponse.json(user);
  } catch (err) {
    logger.error('Failed to update user profile', { route: 'PATCH /api/auth/me', userId, error: err instanceof Error ? err.message : err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, orgId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    logger.error('Failed to fetch current user', {
      route: 'GET /api/auth/me',
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
