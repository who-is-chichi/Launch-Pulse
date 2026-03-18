import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, COOKIE_NAME, JWT_MAX_AGE_SECONDS } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Rate limit check
  const rateLimit = checkRateLimit(normalizedEmail);
  if (!rateLimit.allowed) {
    logger.warn('Login rate limited', { route: 'POST /api/auth/login', email: normalizedEmail });
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.` },
      { status: 429 },
    );
  }

  // User lookup
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    logger.warn('Login failed: user not found', { route: 'POST /api/auth/login', email: normalizedEmail });
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    logger.warn('Login failed: wrong password', { route: 'POST /api/auth/login', userId: user.id });
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Success — reset rate limit and issue JWT
  resetRateLimit(normalizedEmail);

  const token = await signToken({
    userId: user.id,
    email: user.email,
    orgId: user.orgId,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: JWT_MAX_AGE_SECONDS,
  });

  logger.info('Login successful', { route: 'POST /api/auth/login', userId: user.id });
  return NextResponse.json({ ok: true });
}
