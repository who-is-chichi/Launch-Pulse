import { prisma } from '@/lib/prisma';
import DataMappingClient from './DataMappingClient';

export const dynamic = 'force-dynamic';

export default async function DataMappingPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand: brandCode = 'ONC-101' } = await searchParams;
  const brand = await prisma.brand.findUnique({ where: { code: brandCode } });

  const dataRun = brand
    ? await prisma.dataRun.findFirst({
        where: { brandId: brand.id, status: 'complete' },
        orderBy: { runAt: 'desc' },
      })
    : null;

  const datasets = dataRun
    ? await prisma.dataset.findMany({
        where: { dataRunId: dataRun.id },
        orderBy: { name: 'asc' },
      })
    : [];

  return <DataMappingClient datasets={datasets} />;
}
