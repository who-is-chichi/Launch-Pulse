import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const DEFAULT_PREFS = {
  notifyHighSeverity: true,
  notifyActionsDue: true,
  notifyWeeklySummary: false,
  notifyDataFreshness: true,
  defaultBrand: 'ONC-101',
  defaultTimeWindow: 'Last 7 days',
  defaultGeography: 'Nation',
};

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const prefs = await prisma.userPreference.findUnique({ where: { userId } });
    return NextResponse.json(prefs ?? { userId, ...DEFAULT_PREFS });
  } catch (err) {
    logger.error('Failed to fetch preferences', { route: 'GET /api/settings/preferences', userId, error: err instanceof Error ? err.message : err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Partial<typeof DEFAULT_PREFS>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Only allow known preference keys
  const allowedKeys = new Set(Object.keys(DEFAULT_PREFS));
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (allowedKeys.has(k)) data[k] = v;
  }

  try {
    const prefs = await prisma.userPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...DEFAULT_PREFS, ...data },
    });
    logger.info('Preferences updated', { route: 'PATCH /api/settings/preferences', userId });
    return NextResponse.json({ ok: true, prefs });
  } catch (err) {
    logger.error('Failed to update preferences', { route: 'PATCH /api/settings/preferences', userId, error: err instanceof Error ? err.message : err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
