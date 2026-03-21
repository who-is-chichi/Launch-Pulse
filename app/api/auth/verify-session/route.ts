import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Internal-only endpoint called by middleware to verify tokenVersion against the DB.
// Protected by INTERNAL_SECRET header — must not be reachable from the public internet
// without that secret, and is not listed in PUBLIC_PATHS so JWT auth still applies.
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret');
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const userId = request.headers.get('x-user-id');
  const tokenVersion = request.headers.get('x-token-version');

  if (!userId || tokenVersion === null) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });

    if (!user || user.tokenVersion !== Number(tokenVersion)) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false }, { status: 503 });
  }
}
