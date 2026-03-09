import { prisma } from '@/lib/prisma';
import ActionsClient from './ActionsClient';

export const dynamic = 'force-dynamic';

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand: brandCode = 'ONC-101' } = await searchParams;
  const brand = await prisma.brand.findUnique({ where: { code: brandCode } });

  const actions = brand
    ? await prisma.action.findMany({
        where: { brandId: brand.id },
        include: { impactScore: true },
        orderBy: { dueDate: 'asc' },
      })
    : [];

  return <ActionsClient actions={actions} />;
}
