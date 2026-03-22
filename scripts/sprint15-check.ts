import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
let passed = 0;
let failed = 0;

function check(label: string, pass: boolean) {
  if (pass) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}`); failed++; }
}

function readFile(rel: string): string {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
}

// File existence checks
check('app/api/ingest/facts/route.ts exists', fs.existsSync(path.join(ROOT, 'app/api/ingest/facts/route.ts')));
check('lib/ingest-helpers.ts exists', fs.existsSync(path.join(ROOT, 'lib/ingest-helpers.ts')));
check('__tests__/ingest-helpers.test.ts exists', fs.existsSync(path.join(ROOT, '__tests__/ingest-helpers.test.ts')));

// Route content checks
const route = readFile('app/api/ingest/facts/route.ts');
check('Ingest route imports getOrgId', route.includes('getOrgId'));
check('Ingest route imports assertBrandAccess', route.includes('assertBrandAccess'));
check('Ingest route imports logger', route.includes('logger'));
check('Ingest route imports runInsightEngine', route.includes('runInsightEngine'));
check('Ingest route imports computeRowHash', route.includes('computeRowHash'));
check('Ingest route creates BronzeCtlIngestionRun', route.includes('bronzeCtlIngestionRun'));
check('Ingest route creates BronzeCtlFileManifest', route.includes('bronzeCtlFileManifest'));
check('Ingest route creates BronzeCtlRowRejection on error', route.includes('bronzeCtlRowRejection'));
const rawTables = [
  'bronzeClaimsRaw', 'bronzeSpCasesRaw', 'bronzeSpStatusHistoryRaw',
  'bronzeDispenseRaw', 'bronzeShipmentsRaw', 'bronzeCallsRaw',
  'bronzeHcpMasterRaw', 'bronzeHcoMasterRaw', 'bronzeAffiliationsRaw',
  'bronzeTerritoryAlignmentRaw', 'bronzeRepRosterRaw',
];
for (const table of rawTables) {
  check(`Ingest route inserts ${table}`, route.includes(table));
}
check('Ingest route triggers engine (runInsightEngine)', route.includes('runInsightEngine'));

// Schema check
const schema = readFile('prisma/schema.prisma');
check('schema has BronzeCtlIngestionRun', schema.includes('BronzeCtlIngestionRun'));
check('schema has BronzeClaimsRaw', schema.includes('BronzeClaimsRaw'));
check('schema has BronzeRepRosterRaw', schema.includes('BronzeRepRosterRaw'));
check('schema has BronzeCtlFileManifest', schema.includes('BronzeCtlFileManifest'));
check('schema has BronzeCtlRowRejection', schema.includes('BronzeCtlRowRejection'));

// helpers check
const helpers = readFile('lib/ingest-helpers.ts');
check('ingest-helpers exports computeRowHash', helpers.includes('computeRowHash'));
check('ingest-helpers uses sha256', helpers.includes('sha256'));

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
