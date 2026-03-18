import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, COOKIE_NAME, JWT_MAX_AGE_SECONDS } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Pre-generated bcrypt hash (cost 12) of a fixed dummy string.
// Used to ensure bcrypt.compare() always runs regardless of whether the user exists,
// preventing timing-based user enumeration attacks.
const DUMMY_HASH = '$2b$12$iqJUOx2nb6UoC/bKrQiMiuNqFm5Y7NZBFpxv4R0.h8ZiN0c5KaJSW';

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

  // User lookup — always run bcrypt regardless of whether the user exists to prevent
  // timing-based user enumeration attacks.
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  const passwordValid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordValid) {
    if (!user) {
      logger.warn('Login failed: user not found', { route: 'POST /api/auth/login', email: normalizedEmail });
    } else {
      logger.warn('Login failed: wrong password', { route: 'POST /api/auth/login', userId: user.id });
    }
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Success — reset rate limit and issue JWT
  resetRateLimit(normalizedEmail);

  const token = await signToken({
    userId: user.id,
    email: user.email,
    orgId: user.orgId,
    role: user.role,
    tokenVersion: user.tokenVersion,
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
