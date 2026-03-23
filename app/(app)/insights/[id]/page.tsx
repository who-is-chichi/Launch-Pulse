import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import InsightDetailClient from './InsightDetailClient';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? '';
  const payload = token ? await verifyToken(token) : null;
  const userRole = payload?.role ?? 'sales_rep';

  const insight = await prisma.insight.findUnique({
    where: { id },
    include: {
      brand: true,
      drivers: { orderBy: { sortOrder: 'asc' } },
      metricChanges: true,
      contributors: { orderBy: { sortOrder: 'asc' } },
      risks: { orderBy: { sortOrder: 'asc' } },
      actions: { include: { impactScore: true }, take: 2 },
    },
  });

  if (!insight) {
    notFound();
  }

  return <InsightDetailClient insight={insight} brandCode={insight.brand.code} userRole={userRole} />;
}
