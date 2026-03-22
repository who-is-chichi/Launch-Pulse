import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Brand } from '@prisma/client';
import { getOrgId, assertBrandAccess, getUserId } from '@/lib/request-context';

interface RuleInput {
  sourceField: string;
  targetField: string;
}

export async function POST(request: NextRequest) {
  try {
    const { brandCode, dataset, name, rules = [] } = await request.json() as {
      brandCode: string;
      dataset: string;
      name: string;
      rules: RuleInput[];
    };

    if (!brandCode || !dataset) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (name && name.length > 200) {
      return NextResponse.json({ error: 'Name too long (max 200 characters)' }, { status: 400 });
    }

    let orgId: string;
    let brand: Brand;
    try {
      orgId = getOrgId(request);
      brand = await assertBrandAccess(orgId, brandCode, 'POST /api/data-mapping/upload');
    } catch (err) {
      const httpStatus = (err as { status?: number }).status ?? 401;
      return NextResponse.json({ error: (err as Error).message }, { status: httpStatus });
    }

    let imported = 0;

    // Upsert each field mapping rule by (brandId, ruleType, hubValue)
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (!rule.sourceField || !rule.targetField) continue;

      const existing = await prisma.normalizationRule.findFirst({
        where: { brandId: brand.id, ruleType: 'field_mapping', hubValue: rule.sourceField },
      });

      if (existing) {
        await prisma.normalizationRule.update({
          where: { id: existing.id },
          data: { normalizedValue: rule.targetField, category: dataset, sortOrder: i },
        });
      } else {
        await prisma.normalizationRule.create({
          data: {
            brandId: brand.id,
            ruleType: 'field_mapping',
            hubValue: rule.sourceField,
            normalizedValue: rule.targetField,
            category: dataset,
            sortOrder: i,
          },
        });
      }
      imported++;
    }

    // Mark prior active mappings for same dataset as Superseded
    await prisma.publishedMapping.updateMany({
      where: { brandId: brand.id, dataset, status: 'Active' },
      data: { status: 'Superseded' },
    });

    // Create new PublishedMapping record
    await prisma.publishedMapping.create({
      data: {
        brandId: brand.id,
        name: name || `${dataset} Mapping`,
        dataset,
        publishedBy: getUserId(request) || 'unknown',
        fieldCount: rules.length,
        status: 'Active',
      },
    });

    return NextResponse.json({ ok: true, imported });
  } catch (err) {
    logger.error('Failed to upload mapping', { route: 'POST /api/data-mapping/upload', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Failed to upload mapping' }, { status: 500 });
  }
}
