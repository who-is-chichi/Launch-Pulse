import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const b = await p.brand.findUnique({ where: { code: 'ONC-101' } });
  console.log('Brand:', b ? b.id : 'NOT FOUND');
  // Check if notes column exists on Insight
  const insight = await p.insight.findFirst({ where: { brand: { code: 'ONC-101' } } });
  console.log('Insight notes field:', insight ? JSON.stringify(insight.notes) : 'no insights found');
} catch (e) {
  console.error('DB ERROR:', e.message);
  process.exit(1);
} finally {
  await p.$disconnect();
}
