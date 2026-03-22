import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Brand } from '@prisma/client';
import { getOrgId, assertBrandAccess } from '@/lib/request-context';
import { runInsightEngine } from '@/lib/insight-engine';
import { evaluateActions } from '@/lib/impact-evaluator';
import { computeRowHash } from '@/lib/ingest-helpers';

// ─── Field extractors ────────────────────────────────────────────────────────
// Bronze stores everything — no validation rejections here (that's Silver's job).
// All extractors just attempt type coercion and return null for missing/invalid fields.

function str(v: unknown): string | null {
  return typeof v === 'string' ? v : v != null ? String(v) : null;
}
function dt(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}
function num(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = Number(v); return isNaN(n) ? null : n; }
  return null;
}
function bool(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === 1) return true;
  if (v === 'false' || v === 0) return false;
  return null;
}
function flt(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = parseFloat(v); return isNaN(n) ? null : n; }
  return null;
}

function extractClaimsFields(row: Record<string, unknown>) {
  return {
    claimId: str(row.claimId),
    claimLineId: str(row.claimLineId),
    patientToken: str(row.patientToken),
    patientAgeBand: str(row.patientAgeBand),
    patientGender: str(row.patientGender),
    payerChannel: str(row.payerChannel),
    payerNameRaw: str(row.payerNameRaw),
    planNameRaw: str(row.planNameRaw),
    planIdRaw: str(row.planIdRaw),
    pbmNameRaw: str(row.pbmNameRaw),
    drugNameRaw: str(row.drugNameRaw),
    brandNameRaw: str(row.brandNameRaw),
    ndc11: str(row.ndc11),
    trxNrxFlag: str(row.trxNrxFlag),
    rxFillNumber: num(row.rxFillNumber),
    quantity: flt(row.quantity),
    daysSupply: num(row.daysSupply),
    writtenDate: dt(row.writtenDate),
    fillDate: dt(row.fillDate),
    serviceDate: dt(row.serviceDate),
    prescriberNpiRaw: str(row.prescriberNpiRaw),
    prescriberIdRaw: str(row.prescriberIdRaw),
    hcpNameRaw: str(row.hcpNameRaw),
    hcoIdRaw: str(row.hcoIdRaw),
    hcoNameRaw: str(row.hcoNameRaw),
    specialtyRaw: str(row.specialtyRaw),
    zip3: str(row.zip3),
    zip5: str(row.zip5),
    stateCode: str(row.stateCode),
    territoryCodeRaw: str(row.territoryCodeRaw),
    claimStatusRaw: str(row.claimStatusRaw),
    rejectionCodeRaw: str(row.rejectionCodeRaw),
    rejectionReasonRaw: str(row.rejectionReasonRaw),
    paidAmountRaw: flt(row.paidAmountRaw),
    copayAmountRaw: flt(row.copayAmountRaw),
    sourceLastUpdatedTs: dt(row.sourceLastUpdatedTs),
  };
}

function extractSpCasesFields(row: Record<string, unknown>) {
  return {
    spCaseId: str(row.spCaseId),
    referralId: str(row.referralId),
    patientToken: str(row.patientToken),
    prescriberNpiRaw: str(row.prescriberNpiRaw),
    prescriberIdRaw: str(row.prescriberIdRaw),
    hcpNameRaw: str(row.hcpNameRaw),
    hcoIdRaw: str(row.hcoIdRaw),
    hcoNameRaw: str(row.hcoNameRaw),
    brandNameRaw: str(row.brandNameRaw),
    drugNameRaw: str(row.drugNameRaw),
    caseStatusRaw: str(row.caseStatusRaw),
    caseSubstatusRaw: str(row.caseSubstatusRaw),
    casePriorityRaw: str(row.casePriorityRaw),
    referralDate: dt(row.referralDate),
    intakeDate: dt(row.intakeDate),
    bvStartDate: dt(row.bvStartDate),
    bvCompleteDate: dt(row.bvCompleteDate),
    paStartDate: dt(row.paStartDate),
    paOutcomeDate: dt(row.paOutcomeDate),
    patientOutreachDate: dt(row.patientOutreachDate),
    approvalDate: dt(row.approvalDate),
    firstDispenseDateRaw: dt(row.firstDispenseDateRaw),
    shipmentDateRaw: dt(row.shipmentDateRaw),
    abandonmentDate: dt(row.abandonmentDate),
    closureDate: dt(row.closureDate),
    hubVendorRaw: str(row.hubVendorRaw),
    pharmacyNameRaw: str(row.pharmacyNameRaw),
    pharmacyIdRaw: str(row.pharmacyIdRaw),
    payerNameRaw: str(row.payerNameRaw),
    planNameRaw: str(row.planNameRaw),
    planIdRaw: str(row.planIdRaw),
    rejectionReasonRaw: str(row.rejectionReasonRaw),
    supportProgramRaw: str(row.supportProgramRaw),
    sourceLastUpdatedTs: dt(row.sourceLastUpdatedTs),
  };
}

function extractSpStatusHistoryFields(row: Record<string, unknown>) {
  return {
    spStatusEventId: str(row.spStatusEventId),
    spCaseId: str(row.spCaseId),
    statusRaw: str(row.statusRaw),
    substatusRaw: str(row.substatusRaw),
    statusEffectiveTs: dt(row.statusEffectiveTs),
    statusEndTs: dt(row.statusEndTs),
    changedByRaw: str(row.changedByRaw),
    changeReasonRaw: str(row.changeReasonRaw),
    eventSequence: num(row.eventSequence),
    sourceLastUpdatedTs: dt(row.sourceLastUpdatedTs),
  };
}

function extractDispenseFields(row: Record<string, unknown>) {
  return {
    dispenseId: str(row.dispenseId),
    spCaseId: str(row.spCaseId),
    patientToken: str(row.patientToken),
    prescriberNpiRaw: str(row.prescriberNpiRaw),
    ndc11: str(row.ndc11),
    brandNameRaw: str(row.brandNameRaw),
    dispenseDate: dt(row.dispenseDate),
    shipDate: dt(row.shipDate),
    fillNumber: num(row.fillNumber),
    quantity: flt(row.quantity),
    daysSupply: num(row.daysSupply),
    dispensingPharmacyIdRaw: str(row.dispensingPharmacyIdRaw),
    dispensingPharmacyNameRaw: str(row.dispensingPharmacyNameRaw),
    dispenseStatusRaw: str(row.dispenseStatusRaw),
    dispenseChannelRaw: str(row.dispenseChannelRaw),
    sourceLastUpdatedTs: dt(row.sourceLastUpdatedTs),
  };
}

function extractShipmentsFields(row: Record<string, unknown>) {
  return {
    shipmentId: str(row.shipmentId),
    spCaseId: str(row.spCaseId),
    orderIdRaw: str(row.orderIdRaw),
    patientToken: str(row.patientToken),
    brandNameRaw: str(row.brandNameRaw),
    ndc11: str(row.ndc11),
    shipmentDate: dt(row.shipmentDate),
    deliveryDateRaw: dt(row.deliveryDateRaw),
    shipmentStatusRaw: str(row.shipmentStatusRaw),
    shipmentQuantity: flt(row.shipmentQuantity),
    daysSupplyRaw: num(row.daysSupplyRaw),
    shippingPharmacyIdRaw: str(row.shippingPharmacyIdRaw),
    shippingPharmacyNameRaw: str(row.shippingPharmacyNameRaw),
    carrierRaw: str(row.carrierRaw),
    trackingNumberRaw: str(row.trackingNumberRaw),
    sourceLastUpdatedTs: dt(row.sourceLastUpdatedTs),
  };
}

function extractCallsFields(row: Record<string, unknown>) {
  return {
    callId: str(row.callId),
    interactionIdRaw: str(row.interactionIdRaw),
    repIdRaw: str(row.repIdRaw),
    repEmailRaw: str(row.repEmailRaw),
    repNameRaw: str(row.repNameRaw),
    managerIdRaw: str(row.managerIdRaw),
    territoryCodeRaw: str(row.territoryCodeRaw),
    territoryNameRaw: str(row.territoryNameRaw),
    prescriberNpiRaw: str(row.prescriberNpiRaw),
    hcpIdRaw: str(row.hcpIdRaw),
    hcoIdRaw: str(row.hcoIdRaw),
    callDate: dt(row.callDate),
    callTs: dt(row.callTs),
    callTypeRaw: str(row.callTypeRaw),
    channelRaw: str(row.channelRaw),
    callStatusRaw: str(row.callStatusRaw),
    callPlanFlagRaw: bool(row.callPlanFlagRaw),
    callDurationMinutesRaw: flt(row.callDurationMinutesRaw),
    productDiscussedRaw: str(row.productDiscussedRaw),
    detailPriorityRaw: str(row.detailPriorityRaw),
    sampleFlagRaw: bool(row.sampleFlagRaw),
    speakerProgramFlagRaw: bool(row.speakerProgramFlagRaw),
    sourceLastUpdatedTs: dt(row.sourceLastUpdatedTs),
  };
}

function extractHcpMasterFields(row: Record<string, unknown>) {
  return {
    hcpSourceId: str(row.hcpSourceId),
    npi: str(row.npi),
    firstNameRaw: str(row.firstNameRaw),
    lastNameRaw: str(row.lastNameRaw),
    middleNameRaw: str(row.middleNameRaw),
    fullNameRaw: str(row.fullNameRaw),
    specialtyRaw: str(row.specialtyRaw),
    specialtyGroupRaw: str(row.specialtyGroupRaw),
    designationRaw: str(row.designationRaw),
    emailRaw: str(row.emailRaw),
    phoneRaw: str(row.phoneRaw),
    addressLine1Raw: str(row.addressLine1Raw),
    addressLine2Raw: str(row.addressLine2Raw),
    cityRaw: str(row.cityRaw),
    stateCodeRaw: str(row.stateCodeRaw),
    zip5Raw: str(row.zip5Raw),
    zip3Raw: str(row.zip3Raw),
    countryRaw: str(row.countryRaw),
    statusRaw: str(row.statusRaw),
    deceasedFlagRaw: bool(row.deceasedFlagRaw),
    sourceLastUpdatedTs: dt(row.sourceLastUpdatedTs),
  };
}

function extractHcoMasterFields(row: Record<string, unknown>) {
  return {
    hcoSourceId: str(row.hcoSourceId),
    accountIdRaw: str(row.accountIdRaw),
    accountNameRaw: str(row.accountNameRaw),
    accountTypeRaw: str(row.accountTypeRaw),
    siteOfCareRaw: str(row.siteOfCareRaw),
    hospitalFlagRaw: bool(row.hospitalFlagRaw),
    idnFlagRaw: bool(row.idnFlagRaw),
    addressLine1Raw: str(row.addressLine1Raw),
    addressLine2Raw: str(row.addressLine2Raw),
    cityRaw: str(row.cityRaw),
    stateCodeRaw: str(row.stateCodeRaw),
    zip5Raw: str(row.zip5Raw),
    zip3Raw: str(row.zip3Raw),
    countryRaw: str(row.countryRaw),
    statusRaw: str(row.statusRaw),
    sourceLastUpdatedTs: dt(row.sourceLastUpdatedTs),
  };
}

function extractAffiliationsFields(row: Record<string, unknown>) {
  return {
    affiliationRecordId: str(row.affiliationRecordId),
    childEntityIdRaw: str(row.childEntityIdRaw),
    childEntityTypeRaw: str(row.childEntityTypeRaw),
    parentEntityIdRaw: str(row.parentEntityIdRaw),
    parentEntityTypeRaw: str(row.parentEntityTypeRaw),
    relationshipTypeRaw: str(row.relationshipTypeRaw),
    primaryAffiliationFlagRaw: bool(row.primaryAffiliationFlagRaw),
    ownershipPctRaw: flt(row.ownershipPctRaw),
    effectiveStartDate: dt(row.effectiveStartDate),
    effectiveEndDate: dt(row.effectiveEndDate),
    activeFlagRaw: bool(row.activeFlagRaw),
    sourceLastUpdatedTs: dt(row.sourceLastUpdatedTs),
  };
}

function extractTerritoryAlignmentFields(row: Record<string, unknown>) {
  return {
    alignmentRecordId: str(row.alignmentRecordId),
    entityIdRaw: str(row.entityIdRaw),
    entityTypeRaw: str(row.entityTypeRaw),
    territoryCodeRaw: str(row.territoryCodeRaw),
    territoryNameRaw: str(row.territoryNameRaw),
    regionCodeRaw: str(row.regionCodeRaw),
    regionNameRaw: str(row.regionNameRaw),
    districtCodeRaw: str(row.districtCodeRaw),
    districtNameRaw: str(row.districtNameRaw),
    repIdRaw: str(row.repIdRaw),
    repNameRaw: str(row.repNameRaw),
    managerIdRaw: str(row.managerIdRaw),
    alignmentStartDate: dt(row.alignmentStartDate),
    alignmentEndDate: dt(row.alignmentEndDate),
    activeFlagRaw: bool(row.activeFlagRaw),
    primaryFlagRaw: bool(row.primaryFlagRaw),
    sourceLastUpdatedTs: dt(row.sourceLastUpdatedTs),
  };
}

function extractRepRosterFields(row: Record<string, unknown>) {
  return {
    repSourceId: str(row.repSourceId),
    employeeIdRaw: str(row.employeeIdRaw),
    repNameRaw: str(row.repNameRaw),
    repEmailRaw: str(row.repEmailRaw),
    roleRaw: str(row.roleRaw),
    teamRaw: str(row.teamRaw),
    territoryCodeRaw: str(row.territoryCodeRaw),
    territoryNameRaw: str(row.territoryNameRaw),
    districtCodeRaw: str(row.districtCodeRaw),
    regionCodeRaw: str(row.regionCodeRaw),
    managerIdRaw: str(row.managerIdRaw),
    managerNameRaw: str(row.managerNameRaw),
    employmentStatusRaw: str(row.employmentStatusRaw),
    hireDateRaw: dt(row.hireDateRaw),
    terminationDateRaw: dt(row.terminationDateRaw),
    sourceLastUpdatedTs: dt(row.sourceLastUpdatedTs),
  };
}

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let ingestionRunId: string | undefined;
  let orgId: string | undefined;

  try {
    const body = await request.json();
    const {
      brandCode,
      sourceSystem,
      sourceFeedName,
      fileName,
      filePath,
      fileDate,
      fileType,
      claims,
      spCases,
      spStatusHistory,
      dispense,
      shipments,
      calls,
      hcpMaster,
      hcoMaster,
      affiliations,
      territoryAlignment,
      repRoster,
    } = body as {
      brandCode?: string;
      sourceSystem?: string;
      sourceFeedName?: string;
      fileName?: string;
      filePath?: string;
      fileDate?: string;
      fileType?: string;
      claims?: Record<string, unknown>[];
      spCases?: Record<string, unknown>[];
      spStatusHistory?: Record<string, unknown>[];
      dispense?: Record<string, unknown>[];
      shipments?: Record<string, unknown>[];
      calls?: Record<string, unknown>[];
      hcpMaster?: Record<string, unknown>[];
      hcoMaster?: Record<string, unknown>[];
      affiliations?: Record<string, unknown>[];
      territoryAlignment?: Record<string, unknown>[];
      repRoster?: Record<string, unknown>[];
    };

    // 1. Validate required fields
    if (!brandCode || !sourceSystem || !sourceFeedName) {
      return NextResponse.json(
        { error: 'Missing required fields: brandCode, sourceSystem, sourceFeedName' },
        { status: 400 },
      );
    }
    // Narrow to string after validation guard
    const safeSourceSystem: string = sourceSystem;
    const safeSourceFeedName: string = sourceFeedName;

    const allArrays = [claims, spCases, spStatusHistory, dispense, shipments, calls, hcpMaster, hcoMaster, affiliations, territoryAlignment, repRoster];
    const totalRows = allArrays.reduce((sum, arr) => sum + (arr?.length ?? 0), 0);

    if (totalRows === 0) {
      return NextResponse.json(
        { error: 'At least one dataset array must be non-empty' },
        { status: 400 },
      );
    }

    // 2. RBAC
    let brand: Brand;
    try {
      orgId = getOrgId(request);
      brand = await assertBrandAccess(orgId, brandCode, 'POST /api/ingest/facts');
    } catch (err) {
      const httpStatus = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
    }

    // 3. Create BronzeCtlIngestionRun
    const ingestionRun = await prisma.bronzeCtlIngestionRun.create({
      data: {
        clientId: orgId,
        brandId: brand.id,
        sourceSystem: safeSourceSystem,
        sourceFeedName: safeSourceFeedName,
        triggerType: 'api',
        status: 'running',
        recordsRead: BigInt(totalRows),
      },
    });
    ingestionRunId = ingestionRun.id;

    // 4. Create BronzeCtlFileManifest
    const manifest = await prisma.bronzeCtlFileManifest.create({
      data: {
        ingestionRunId: ingestionRun.id,
        clientId: orgId,
        brandId: brand.id,
        sourceSystem: safeSourceSystem,
        sourceFeedName: safeSourceFeedName,
        sourceFileName: fileName ?? 'api_payload',
        sourceFilePath: filePath ?? '',
        fileType: fileType ?? 'json',
        sourceFileDate: fileDate ? new Date(fileDate) : null,
        receivedTs: new Date(),
        rowCountRaw: BigInt(totalRows),
        status: 'received',
      },
    });

    // 5. Insert rows into each Bronze table
    let accepted = 0;
    let rejected = 0;

    // Helper: insert one row and track accept/reject
    async function insertRow<T extends Record<string, unknown>>(
      datasetName: string,
      rows: T[] | undefined,
      inserter: (row: T, hash: string) => Promise<void>,
    ) {
      if (!rows?.length) return;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const hash = computeRowHash(row);
        try {
          await inserter(row, hash);
          accepted++;
        } catch (err) {
          try {
            await prisma.bronzeCtlRowRejection.create({
              data: {
                ingestionRunId: ingestionRun.id,
                fileManifestId: manifest.id,
                clientId: orgId!,
                brandId: brand.id,
                sourceSystem: safeSourceSystem,
                sourceFeedName: safeSourceFeedName,
                datasetName,
                sourceRowNumber: BigInt(i),
                rejectionStage: 'parse',
                rejectionCode: 'INSERT_FAILED',
                rejectionReason: err instanceof Error ? err.message : String(err),
                rawPayload: row as object,
              },
            });
          } catch {
            // best-effort rejection logging
          }
          rejected++;
        }
      }
    }

    await insertRow('claims', claims, async (row, hash) => {
      await prisma.bronzeClaimsRaw.create({
        data: {
          clientId: orgId!,
          brandId: brand.id,
          sourceSystem: safeSourceSystem,
          sourceFeedName: safeSourceFeedName,
          ingestionRunId: ingestionRun.id,
          fileManifestId: manifest.id,
          recordHash: hash,
          rawPayload: row as object,
          ...extractClaimsFields(row),
        },
      });
    });

    await insertRow('sp_cases', spCases, async (row, hash) => {
      await prisma.bronzeSpCasesRaw.create({
        data: {
          clientId: orgId!,
          brandId: brand.id,
          sourceSystem: safeSourceSystem,
          sourceFeedName: safeSourceFeedName,
          ingestionRunId: ingestionRun.id,
          fileManifestId: manifest.id,
          recordHash: hash,
          rawPayload: row as object,
          ...extractSpCasesFields(row),
        },
      });
    });

    await insertRow('sp_status_history', spStatusHistory, async (row, hash) => {
      await prisma.bronzeSpStatusHistoryRaw.create({
        data: {
          clientId: orgId!,
          brandId: brand.id,
          sourceSystem: safeSourceSystem,
          sourceFeedName: safeSourceFeedName,
          ingestionRunId: ingestionRun.id,
          fileManifestId: manifest.id,
          recordHash: hash,
          rawPayload: row as object,
          ...extractSpStatusHistoryFields(row),
        },
      });
    });

    await insertRow('dispense', dispense, async (row, hash) => {
      await prisma.bronzeDispenseRaw.create({
        data: {
          clientId: orgId!,
          brandId: brand.id,
          sourceSystem: safeSourceSystem,
          sourceFeedName: safeSourceFeedName,
          ingestionRunId: ingestionRun.id,
          fileManifestId: manifest.id,
          recordHash: hash,
          rawPayload: row as object,
          ...extractDispenseFields(row),
        },
      });
    });

    await insertRow('shipments', shipments, async (row, hash) => {
      await prisma.bronzeShipmentsRaw.create({
        data: {
          clientId: orgId!,
          brandId: brand.id,
          sourceSystem: safeSourceSystem,
          sourceFeedName: safeSourceFeedName,
          ingestionRunId: ingestionRun.id,
          fileManifestId: manifest.id,
          recordHash: hash,
          rawPayload: row as object,
          ...extractShipmentsFields(row),
        },
      });
    });

    await insertRow('calls', calls, async (row, hash) => {
      await prisma.bronzeCallsRaw.create({
        data: {
          clientId: orgId!,
          brandId: brand.id,
          sourceSystem: safeSourceSystem,
          sourceFeedName: safeSourceFeedName,
          ingestionRunId: ingestionRun.id,
          fileManifestId: manifest.id,
          recordHash: hash,
          rawPayload: row as object,
          ...extractCallsFields(row),
        },
      });
    });

    await insertRow('hcp_master', hcpMaster, async (row, hash) => {
      await prisma.bronzeHcpMasterRaw.create({
        data: {
          clientId: orgId!,
          brandId: brand.id,
          sourceSystem: safeSourceSystem,
          sourceFeedName: safeSourceFeedName,
          ingestionRunId: ingestionRun.id,
          fileManifestId: manifest.id,
          recordHash: hash,
          rawPayload: row as object,
          ...extractHcpMasterFields(row),
        },
      });
    });

    await insertRow('hco_master', hcoMaster, async (row, hash) => {
      await prisma.bronzeHcoMasterRaw.create({
        data: {
          clientId: orgId!,
          brandId: brand.id,
          sourceSystem: safeSourceSystem,
          sourceFeedName: safeSourceFeedName,
          ingestionRunId: ingestionRun.id,
          fileManifestId: manifest.id,
          recordHash: hash,
          rawPayload: row as object,
          ...extractHcoMasterFields(row),
        },
      });
    });

    await insertRow('affiliations', affiliations, async (row, hash) => {
      await prisma.bronzeAffiliationsRaw.create({
        data: {
          clientId: orgId!,
          brandId: brand.id,
          sourceSystem: safeSourceSystem,
          sourceFeedName: safeSourceFeedName,
          ingestionRunId: ingestionRun.id,
          fileManifestId: manifest.id,
          recordHash: hash,
          rawPayload: row as object,
          ...extractAffiliationsFields(row),
        },
      });
    });

    await insertRow('territory_alignment', territoryAlignment, async (row, hash) => {
      await prisma.bronzeTerritoryAlignmentRaw.create({
        data: {
          clientId: orgId!,
          brandId: brand.id,
          sourceSystem: safeSourceSystem,
          sourceFeedName: safeSourceFeedName,
          ingestionRunId: ingestionRun.id,
          fileManifestId: manifest.id,
          recordHash: hash,
          rawPayload: row as object,
          ...extractTerritoryAlignmentFields(row),
        },
      });
    });

    await insertRow('rep_roster', repRoster, async (row, hash) => {
      await prisma.bronzeRepRosterRaw.create({
        data: {
          clientId: orgId!,
          brandId: brand.id,
          sourceSystem: safeSourceSystem,
          sourceFeedName: safeSourceFeedName,
          ingestionRunId: ingestionRun.id,
          fileManifestId: manifest.id,
          recordHash: hash,
          rawPayload: row as object,
          ...extractRepRosterFields(row),
        },
      });
    });

    // 6. Update BronzeCtlIngestionRun
    await prisma.bronzeCtlIngestionRun.update({
      where: { id: ingestionRun.id },
      data: {
        status: rejected > 0 ? 'partial_success' : 'success',
        recordsLoaded: BigInt(accepted),
        recordsRejected: BigInt(rejected),
        endedAt: new Date(),
      },
    });

    // 7. Update BronzeCtlFileManifest
    await prisma.bronzeCtlFileManifest.update({
      where: { id: manifest.id },
      data: {
        status: rejected > 0 ? 'partial' : 'loaded',
        rowCountLoaded: BigInt(accepted),
        rowCountRejected: BigInt(rejected),
      },
    });

    // 8. DataRun creation + engine trigger (exact pattern from app/api/engine/run/route.ts)
    const latestRun = await prisma.dataRun.findFirst({
      where: { brandId: brand.id, status: 'complete' },
      orderBy: { runAt: 'desc' },
      include: { datasets: true },
    });

    let dataRunId: string | null = null;
    let insightsCreated = 0;
    let actionsEvaluated = 0;

    if (latestRun) {
      const newRun = await prisma.dataRun.create({
        data: {
          brandId: brand.id,
          runAt: new Date(),
          timeWindow: latestRun.timeWindow,
          geography: latestRun.geography,
          status: 'complete',
        },
      });
      dataRunId = newRun.id;

      if (latestRun.datasets.length > 0) {
        await prisma.dataset.createMany({
          data: latestRun.datasets.map(d => ({
            dataRunId: newRun.id,
            name: d.name,
            displayName: d.displayName,
            lastRun: d.lastRun,
            freshness: d.freshness,
            coverage: d.coverage,
            notes: d.notes,
          })),
        });
      }

      const engineResult = await runInsightEngine(newRun.id);
      insightsCreated = engineResult.insightsCreated;

      try {
        const evalResult = await evaluateActions(newRun.id);
        actionsEvaluated = evalResult.evaluated;
      } catch (evalErr) {
        logger.error('evaluateActions failed', {
          route: 'POST /api/ingest/facts',
          error: evalErr instanceof Error ? evalErr.message : String(evalErr),
        });
      }
    } else {
      logger.warn('No completed DataRun found for brand — skipping engine trigger', {
        route: 'POST /api/ingest/facts',
        brandCode,
      });
    }

    logger.info('Ingest facts completed', {
      route: 'POST /api/ingest/facts',
      ingestionRunId: ingestionRun.id,
      dataRunId,
      accepted,
      rejected,
      insightsCreated,
      actionsEvaluated,
    });

    return NextResponse.json({
      ok: true,
      ingestionRunId: ingestionRun.id,
      dataRunId,
      accepted,
      rejected,
      insightsCreated,
      actionsEvaluated,
    });
  } catch (err) {
    logger.error('Ingest facts failed', {
      route: 'POST /api/ingest/facts',
      error: err instanceof Error ? err.message : String(err),
    });

    // Best-effort: mark ingestion run as failed
    if (ingestionRunId) {
      try {
        await prisma.bronzeCtlIngestionRun.update({
          where: { id: ingestionRunId },
          data: { status: 'failed', endedAt: new Date() },
        });
      } catch {
        // ignore secondary failure
      }
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ingest failed' },
      { status: 500 },
    );
  }
}
