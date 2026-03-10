import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface RuleInput {
  hubValue: string;
  normalizedValue: string;
  category: string;
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

    const brand = await prisma.brand.findUnique({ where: { code: brandCode } });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    let imported = 0;

    // Upsert each rule by (brandId, ruleType, hubValue)
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (!rule.hubValue || !rule.normalizedValue || !rule.category) continue;

      const existing = await prisma.normalizationRule.findFirst({
        where: { brandId: brand.id, ruleType: 'sp_status', hubValue: rule.hubValue },
      });

      if (existing) {
        await prisma.normalizationRule.update({
          where: { id: existing.id },
          data: { normalizedValue: rule.normalizedValue, category: rule.category, sortOrder: i },
        });
      } else {
        await prisma.normalizationRule.create({
          data: {
            brandId: brand.id,
            ruleType: 'sp_status',
            hubValue: rule.hubValue,
            normalizedValue: rule.normalizedValue,
            category: rule.category,
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
        publishedBy: 'Admin',
        fieldCount: rules.length,
        status: 'Active',
      },
    });

    return NextResponse.json({ ok: true, imported });
  } catch (err) {
    logger.error('Failed to upload mapping', { route: 'data-mapping/upload POST', error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Failed to upload mapping' }, { status: 500 });
  }
}
