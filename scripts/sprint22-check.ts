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

console.log('\n[Sprint 22 — Insights Page Features]');

// 1. CreateActionModal component exists and exports a default
const createActionPath = path.join(ROOT, 'components/CreateActionModal.tsx');
check('CreateActionModal.tsx exists', fs.existsSync(createActionPath));
const createActionSrc = readFile('components/CreateActionModal.tsx');
check('CreateActionModal has default export', createActionSrc.includes('export default function CreateActionModal'));

// 2. BulkAssignModal component exists and exports a default
const bulkAssignPath = path.join(ROOT, 'components/BulkAssignModal.tsx');
check('BulkAssignModal.tsx exists', fs.existsSync(bulkAssignPath));
const bulkAssignSrc = readFile('components/BulkAssignModal.tsx');
check('BulkAssignModal has default export', bulkAssignSrc.includes('export default function BulkAssignModal'));

// 3. AISummaryPanel has onCreateAction prop in its interface
const aiSummaryPanelSrc = readFile('components/AISummaryPanel.tsx');
check('AISummaryPanel.tsx exists', fs.existsSync(path.join(ROOT, 'components/AISummaryPanel.tsx')));
check('AISummaryPanel interface has onCreateAction prop', aiSummaryPanelSrc.includes('onCreateAction?'));
check('AISummaryPanel button calls onCreateAction', aiSummaryPanelSrc.includes('onCreateAction?.({'));

// 4. CreateActionModal prefill useEffect runs when open
check('CreateActionModal prefill useEffect depends on open', createActionSrc.includes('useEffect') && createActionSrc.includes('if (open)') && createActionSrc.includes('prefill?.title'));

// 5. CreateActionModal POSTs to /api/actions
check('CreateActionModal POSTs to /api/actions', createActionSrc.includes("fetch('/api/actions'") && createActionSrc.includes("method: 'POST'"));

// 6. BulkAssignModal sequential POST loop with progress tracking
check('BulkAssignModal has sequential for loop over insights', bulkAssignSrc.includes('for (let i = 0; i < insights.length; i++)'));
check('BulkAssignModal tracks progress state', bulkAssignSrc.includes('setProgress({ current:') || bulkAssignSrc.includes('setProgress({ current :'));
check('BulkAssignModal POSTs to /api/actions', bulkAssignSrc.includes("fetch('/api/actions'") && bulkAssignSrc.includes("method: 'POST'"));
check('BulkAssignModal shows success count in toast', bulkAssignSrc.includes('successCount') && bulkAssignSrc.includes('toast.success'));
check('BulkAssignModal handles partial errors', bulkAssignSrc.includes('firstError'));

// 7. InsightsClient wires AISummaryPanel with onCreateAction
const insightsClientSrc = readFile('app/(app)/insights/InsightsClient.tsx');
check('InsightsClient.tsx exists', fs.existsSync(path.join(ROOT, 'app/(app)/insights/InsightsClient.tsx')));
check('InsightsClient imports AISummaryPanel', insightsClientSrc.includes("import AISummaryPanel from '@/components/AISummaryPanel'"));
check('InsightsClient imports CreateActionModal', insightsClientSrc.includes("import CreateActionModal from '@/components/CreateActionModal'"));
check('InsightsClient imports BulkAssignModal', insightsClientSrc.includes("import BulkAssignModal from '@/components/BulkAssignModal'"));
check('InsightsClient has showActionModal state', insightsClientSrc.includes('showActionModal'));
check('InsightsClient has showBulkModal state', insightsClientSrc.includes('showBulkModal'));
check('InsightsClient passes onCreateAction to AISummaryPanel', insightsClientSrc.includes('onCreateAction={(prefill)'));
check('InsightsClient Bulk Assign button opens BulkAssignModal', insightsClientSrc.includes('setShowBulkModal(true)'));

// 8. InsightDetailClient — AI Summary section appears before What Changed
const detailClientSrc = readFile('app/(app)/insights/[id]/InsightDetailClient.tsx');
check('InsightDetailClient.tsx exists', fs.existsSync(path.join(ROOT, 'app/(app)/insights/[id]/InsightDetailClient.tsx')));
const aiSummaryPos = detailClientSrc.indexOf('AI Summary');
const whatChangedPos = detailClientSrc.indexOf('What Changed');
check('AI Summary section appears before What Changed section', aiSummaryPos > -1 && whatChangedPos > -1 && aiSummaryPos < whatChangedPos);

// 9. InsightDetailClient has no Discussion tab
check('InsightDetailClient has no Discussion tab', !detailClientSrc.toLowerCase().includes('discussion'));

// 10. Evidence section in InsightDetailClient has recharts LineChart import
check('InsightDetailClient imports LineChart from recharts', detailClientSrc.includes("import { LineChart") && detailClientSrc.includes('recharts'));
check('InsightDetailClient renders LineChart in Evidence section', detailClientSrc.includes('<LineChart'));
check('InsightDetailClient Evidence uses seeded sparkline data', detailClientSrc.includes('generateSparklineData'));

// 11. InsightDetailClient Assign button is regional_director-gated
check('InsightDetailClient Assign button gated by hasMinRole regional_director', detailClientSrc.includes("hasMinRole(userRole, 'regional_director')") && detailClientSrc.includes('setShowActionModal(true)'));

// 12. InsightDetailClient Export Slide button generates HTML client-side
check('InsightDetailClient Export Slide button exists', detailClientSrc.includes('Export Slide'));
check('InsightDetailClient exportInsightSlide generates Blob', detailClientSrc.includes("new Blob([html], { type: 'text/html' })"));
check('InsightDetailClient exportInsightSlide triggers download', detailClientSrc.includes('a.download') && detailClientSrc.includes('a.click()'));

// 13. PATCH /api/data-mapping/configs requires analytics_manager role
const configsRouteSrc = readFile('app/api/data-mapping/configs/route.ts');
check('data-mapping/configs/route.ts exists', fs.existsSync(path.join(ROOT, 'app/api/data-mapping/configs/route.ts')));
// Verify requireRole appears in the PATCH handler body (after the PATCH function declaration)
const configsPatchIdx = configsRouteSrc.indexOf('export async function PATCH');
const configsPatchBody = configsPatchIdx > -1 ? configsRouteSrc.slice(configsPatchIdx) : '';
check('PATCH /api/data-mapping/configs calls requireRole', configsPatchBody.includes("requireRole(request, 'analytics_manager')"));

// 14. PATCH /api/data-mapping/rules requires analytics_manager role
const rulesRouteSrc = readFile('app/api/data-mapping/rules/route.ts');
check('data-mapping/rules/route.ts exists', fs.existsSync(path.join(ROOT, 'app/api/data-mapping/rules/route.ts')));
const rulesPatchIdx = rulesRouteSrc.indexOf('export async function PATCH');
const rulesPatchBody = rulesPatchIdx > -1 ? rulesRouteSrc.slice(rulesPatchIdx) : '';
check('PATCH /api/data-mapping/rules calls requireRole', rulesPatchBody.includes("requireRole(request, 'analytics_manager')"));

console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
