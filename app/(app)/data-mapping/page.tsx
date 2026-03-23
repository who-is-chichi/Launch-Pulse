import { prisma } from '@/lib/prisma';
import DataMappingClient from './DataMappingClient';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasMinRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export default async function DataMappingPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; timeWindow?: string; geography?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const session = token ? await verifyToken(token).catch(() => null) : null;
  if (!session || !hasMinRole(session.role, 'analytics_manager')) redirect('/home');

  const { brand: brandCode = 'ONC-101', timeWindow = 'Last 7 days', geography = 'Nation' } = await searchParams;
  const brand = await prisma.brand.findUnique({ where: { code: brandCode } });

  const dataRun = brand
    ? await prisma.dataRun.findFirst({
        where: { brandId: brand.id, status: 'complete', timeWindow, geography },
        orderBy: { runAt: 'desc' },
      })
    : null;

  const [datasets, mappingConfigs, normalizationRules, publishedMappings, crosswalkStats, ingestionRuns] = await Promise.all([
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
    prisma.bronzeCtlIngestionRun.findMany({
      where: brand ? { brandId: brand.id } : { brandId: 'none' },
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: {
        fileManifests: {
          orderBy: { receivedTs: 'desc' },
          take: 3,
        },
      },
    }),
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
      ingestionRuns={JSON.parse(JSON.stringify(ingestionRuns.map(run => ({
        id: run.id,
        sourceSystem: run.sourceSystem,
        sourceFeedName: run.sourceFeedName,
        status: run.status,
        startedAt: run.startedAt,
        endedAt: run.endedAt,
        recordsLoaded: run.recordsLoaded !== null ? Number(run.recordsLoaded) : null,
        recordsRejected: run.recordsRejected !== null ? Number(run.recordsRejected) : null,
        triggerType: run.triggerType,
        fileManifests: run.fileManifests.map(f => ({
          id: f.id,
          sourceFileName: f.sourceFileName,
          rowCountLoaded: f.rowCountLoaded !== null ? Number(f.rowCountLoaded) : null,
          rowCountRejected: f.rowCountRejected !== null ? Number(f.rowCountRejected) : null,
          status: f.status,
        })),
      }))))}
    />
  );
}
