import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
let passed = 0;
let failed = 0;

function check(label: string, pass: boolean) {
  if (pass) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    failed++;
  }
}

// Check 1: logout route has logger.info
const logoutRoute = fs.readFileSync(path.join(ROOT, 'app/api/auth/logout/route.ts'), 'utf-8');
check('Logout route uses logger.info', logoutRoute.includes('logger.info'));

// Check 2: thresholds.ts exists and exports THRESHOLDS
const thresholdsFile = path.join(ROOT, 'lib/insight-engine/thresholds.ts');
check('thresholds.ts file exists', fs.existsSync(thresholdsFile));
const thresholdsContent = fs.existsSync(thresholdsFile) ? fs.readFileSync(thresholdsFile, 'utf-8') : '';
check('thresholds.ts exports THRESHOLDS', thresholdsContent.includes('export const THRESHOLDS'));

// Check 3: all 7 engine files import from thresholds
const engineFiles = [
  'lib/insight-engine/utils.ts',
  'lib/insight-engine/templates/demand-adoption-inflection.ts',
  'lib/insight-engine/templates/demand-top-systems-swing.ts',
  'lib/insight-engine/templates/startops-ttt-shift.ts',
  'lib/insight-engine/templates/execution-coverage-shift.ts',
  'lib/insight-engine/templates/startops-sp-bottleneck.ts',
  'lib/insight-engine/templates/structure-territory-churn.ts',
  'lib/insight-engine/templates/structure-formulary-change.ts',
];
for (const f of engineFiles) {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf-8');
  check(`${path.basename(f)} imports THRESHOLDS`, content.includes('THRESHOLDS'));
}

// Check 4: no replaced inline literals remain in template files
const spFile = fs.readFileSync(path.join(ROOT, 'lib/insight-engine/templates/startops-sp-bottleneck.ts'), 'utf-8');
check('sp-bottleneck: no raw 0.15 threshold', !spFile.match(/>=\s*0\.15/));
check('sp-bottleneck: no raw 100 in deriveSeverity call', !spFile.match(/deriveSeverity\([^)]*,\s*100\s*,/));

const utilsFile = fs.readFileSync(path.join(ROOT, 'lib/insight-engine/utils.ts'), 'utf-8');
check('utils.ts: no raw 15 severity threshold', !utilsFile.match(/changePct\s*>=\s*15/));
check('utils.ts: no raw 8 severity threshold', !utilsFile.match(/changePct\s*>=\s*8/));

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
