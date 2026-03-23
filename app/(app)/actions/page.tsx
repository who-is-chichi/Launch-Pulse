import { prisma } from '@/lib/prisma';
import ActionsClient from './ActionsClient';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const session = token ? await verifyToken(token).catch(() => null) : null;
  const userRole = session?.role ?? 'sales_rep';

  const { brand: brandCode = 'ONC-101' } = await searchParams;
  const brand = await prisma.brand.findUnique({ where: { code: brandCode } });

  const actions = brand
    ? await prisma.action.findMany({
        where: { brandId: brand.id, isActive: true },
        include: { impactScore: true },
        orderBy: { dueDate: 'asc' },
      })
    : [];

  return <ActionsClient actions={actions} userRole={userRole} />;
}
