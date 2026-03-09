import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import InsightDetailClient from './InsightDetailClient';

export const dynamic = 'force-dynamic';

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const insight = await prisma.insight.findUnique({
    where: { id },
    include: {
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

  return <InsightDetailClient insight={insight} />;
}
