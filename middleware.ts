import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/verify-session'];

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

  // Verify the user still exists and their tokenVersion matches via an internal API route.
  // PrismaClient cannot run in the Edge Runtime (middleware), so we delegate the DB check
  // to a Node.js API route protected by INTERNAL_SECRET.
  // Fail-closed: non-200 response → deny access.
  try {
    const verifyUrl = new URL('/api/auth/verify-session', request.url);
    const verifyRes = await fetch(verifyUrl.toString(), {
      headers: {
        'x-internal-secret': process.env.INTERNAL_SECRET ?? '',
        'x-user-id': payload.userId,
        'x-token-version': String(payload.tokenVersion),
      },
    });
    if (!verifyRes.ok) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  } catch {
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
