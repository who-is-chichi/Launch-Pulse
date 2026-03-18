import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  if (isPublic) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    // Token present but invalid/expired — clear stale cookie and redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Verify the user still exists and their tokenVersion matches — this invalidates tokens
  // for deleted users or after forced logout (tokenVersion increment).
  // Trade-off: 1 extra DB query per authenticated request; acceptable for a small team.
  // Fail-closed: if the DB is unreachable, deny access rather than allow a potentially invalid session.
  let dbUser: { tokenVersion: number } | null = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tokenVersion: true },
    });
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
  if (!dbUser || dbUser.tokenVersion !== payload.tokenVersion) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Inject user identity into request headers for downstream API routes.
  // Strip any client-supplied identity headers — these must only originate from this middleware.
  // Trust boundary: Next.js middleware runs server-side before route handlers, so headers set
  // here cannot be spoofed by clients. However, deleting first ensures no client value leaks
  // through if a route is ever accessed via an internal path that bypasses this middleware.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-user-email');
  requestHeaders.delete('x-user-role');
  requestHeaders.delete('x-org-id');
  // Then set authenticated values from the verified JWT
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-org-id', payload.orgId);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
