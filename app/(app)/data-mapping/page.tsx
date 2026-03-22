import { prisma } from '@/lib/prisma';
import DataMappingClient from './DataMappingClient';

export const dynamic = 'force-dynamic';

export default async function DataMappingPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; timeWindow?: string; geography?: string }>;
}) {
  const { brand: brandCode = 'ONC-101', timeWindow = 'Last 7 days', geography = 'Nation' } = await searchParams;
  const brand = await prisma.brand.findUnique({ where: { code: brandCode } });

  const dataRun = brand
    ? await prisma.dataRun.findFirst({
        where: { brandId: brand.id, status: 'complete', timeWindow, geography },
        orderBy: { runAt: 'desc' },
      })
    : null;

  const [datasets, mappingConfigs, normalizationRules, publishedMappings, crosswalkStats] = await Promise.all([
    dataRun
      ? prisma.dataset.findMany({ where: { dataRunId: dataRun.id }, orderBy: { name: 'asc' } })
      : Promise.resolve([]),
    brand
      ? prisma.mappingConfig.findMany({ where: { brandId: brand.id }, orderBy: { dataset: 'asc' } })
      : Promise.resolve([]),
    brand
      ? prisma.normalizationRule.findMany({ where: { brandId: brand.id }, orderBy: { sortOrder: 'asc' } })
      : Promise.resolve([]),
    brand
      ? prisma.publishedMapping.findMany({
          where: { brandId: brand.id },
          orderBy: { publishedAt: 'desc' },
          take: 10,
        })
      : Promise.resolve([]),
    brand
      ? prisma.crosswalkStat.findMany({ where: { brandId: brand.id }, orderBy: { statType: 'asc' } })
      : Promise.resolve([]),
  ]);

  return (
    <DataMappingClient
      datasets={datasets}
      mappingConfigs={mappingConfigs.map((c) => ({
        id: c.id,
        dataset: c.dataset,
        status: c.status,
        lastUpdated: c.lastUpdated.toISOString(),
      }))}
      normalizationRules={normalizationRules.map((r) => ({
        id: r.id,
        hubValue: r.hubValue,
        normalizedValue: r.normalizedValue,
        category: r.category,
      }))}
      publishedMappings={publishedMappings.map((m) => ({
        id: m.id,
        name: m.name,
        dataset: m.dataset,
        publishedBy: m.publishedBy,
        publishedAt: m.publishedAt.toISOString(),
        fieldCount: m.fieldCount,
        status: m.status,
      }))}
      dataRun={
        dataRun
          ? { timeWindow: dataRun.timeWindow, geography: dataRun.geography, runAt: dataRun.runAt.toISOString() }
          : null
      }
      brandCode={brandCode}
      crosswalkStats={crosswalkStats.map(s => ({
        id: s.id,
        statType: s.statType,
        label: s.label,
        matchRate: s.matchRate,
        unmatchedCount: s.unmatchedCount,
        entityType: s.entityType,
      }))}
    />
  );
}
