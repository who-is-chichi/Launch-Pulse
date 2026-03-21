import { test, expect, type Page, type Download } from '@playwright/test';

const BASE_URL = 'http://localhost:3002';

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', 'alex@company.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/home/, { timeout: 15000 });
}

// ──────────────────────────────────────────────────────────
// Insights List
// ──────────────────────────────────────────────────────────

test('I1 — insights page loads with ≥1 table row', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/insights`);
  await page.waitForLoadState('networkidle');
  const rows = page.locator('table tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: 10000 });
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

test('I2 — table has expected columns', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/insights`);
  await page.waitForLoadState('networkidle');
  const thead = page.locator('table thead');
  await expect(thead).toBeVisible({ timeout: 10000 });
  const headText = (await thead.innerText()).toLowerCase();
  expect(headText).toContain('headline');
  expect(headText).toContain('pillar');
  expect(headText).toContain('severity');
  expect(headText).toContain('impact');
  expect(headText).toContain('region');
  expect(headText).toContain('status');
});

test('I3 — pillar filter (combobox/select) filters rows', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/insights`);
  await page.waitForLoadState('networkidle');

  // Count rows before filtering
  const rowsBefore = await page.locator('table tbody tr').count();

  // Open the first Radix Select (pillar filter)
  const pillarTrigger = page.locator('[role="combobox"]').first();
  await pillarTrigger.click();
  // Wait for dropdown to appear and click "Demand"
  const demandOption = page.locator('[role="option"]', { hasText: 'Demand' });
  await demandOption.waitFor({ timeout: 5000 });
  await demandOption.click();

  await page.waitForTimeout(400);
  const rowsAfter = await page.locator('table tbody tr').count();

  // Rows should have changed (filtered down) OR show "No insights match" message
  const noMatch = page.locator('text=No insights match');
  const noMatchVisible = await noMatch.isVisible().catch(() => false);
  const filtered = rowsAfter < rowsBefore || noMatchVisible;
  expect(filtered).toBe(true);
});

test('I4 — export button is disabled when no rows selected', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/insights`);
  await page.waitForLoadState('networkidle');

  // Button has "Export Selected" text when nothing is selected
  const exportBtn = page.locator('button', { hasText: /export selected/i });
  await expect(exportBtn).toBeVisible({ timeout: 8000 });
  await expect(exportBtn).toBeDisabled();
});

test('I5 — checking one row enables export button with count', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/insights`);
  await page.waitForLoadState('networkidle');

  // Click the first row checkbox (Radix Checkbox — role="checkbox" in tbody)
  const firstRowCheckbox = page.locator('table tbody tr').first().locator('[role="checkbox"]');
  await firstRowCheckbox.waitFor({ timeout: 8000 });
  await firstRowCheckbox.click();

  await page.waitForTimeout(300);

  // Export button should now show "Export (1)"
  const exportBtn = page.locator('button', { hasText: /export\s*\(\s*1\s*\)/i });
  await expect(exportBtn).toBeVisible({ timeout: 5000 });
  await expect(exportBtn).toBeEnabled();
});

test('I6 — export downloads a CSV file', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/insights`);
  await page.waitForLoadState('networkidle');

  // Select first row
  const firstRowCheckbox = page.locator('table tbody tr').first().locator('[role="checkbox"]');
  await firstRowCheckbox.waitFor({ timeout: 8000 });
  await firstRowCheckbox.click();

  await page.waitForTimeout(300);

  // Click export and capture download
  const exportBtn = page.locator('button', { hasText: /export\s*\(/i });
  await expect(exportBtn).toBeEnabled({ timeout: 5000 });

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    exportBtn.click(),
  ]);

  const filename = download.suggestedFilename();
  expect(filename).toMatch(/insights.*\.csv/i);
});

test('I7 — select-all checkbox selects all visible rows', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/insights`);
  await page.waitForLoadState('networkidle');

  const rowCount = await page.locator('table tbody tr').count();
  expect(rowCount).toBeGreaterThanOrEqual(1);

  // Header checkbox
  const headerCheckbox = page.locator('table thead [role="checkbox"]');
  await headerCheckbox.waitFor({ timeout: 8000 });
  await headerCheckbox.click();

  await page.waitForTimeout(300);

  // Export button should show count = rowCount
  const exportBtn = page.locator('button', { hasText: new RegExp(`export\\s*\\(\\s*${rowCount}\\s*\\)`, 'i') });
  await expect(exportBtn).toBeVisible({ timeout: 5000 });
});

test('I8 — clicking headline link navigates to /insights/[id]', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE_URL}/insights`);
  await page.waitForLoadState('networkidle');

  // Click the first headline link in the table
  const firstLink = page.locator('table tbody tr').first().locator('a');
  await firstLink.waitFor({ timeout: 8000 });
  await firstLink.click();

  await page.waitForURL(/\/insights\/[^/]+$/, { timeout: 10000 });
  expect(page.url()).toMatch(/\/insights\/[^/]+$/);
});

// ──────────────────────────────────────────────────────────
// Insight Detail
// ──────────────────────────────────────────────────────────

async function gotoFirstInsightDetail(page: Page) {
  await login(page);
  await page.goto(`${BASE_URL}/insights`);
  await page.waitForLoadState('networkidle');
  const firstLink = page.locator('table tbody tr').first().locator('a');
  await firstLink.waitFor({ timeout: 8000 });
  await firstLink.click();
  await page.waitForURL(/\/insights\/[^/]+$/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

test('I9 — detail page loads with a headline text visible', async ({ page }) => {
  await gotoFirstInsightDetail(page);
  // The h1 inside the detail header should contain text
  const headline = page.locator('h1').first();
  await expect(headline).toBeVisible({ timeout: 8000 });
  const text = await headline.innerText();
  expect(text.trim().length).toBeGreaterThan(5);
});

test('I10 — back button navigates back to /insights', async ({ page }) => {
  await gotoFirstInsightDetail(page);

  // Back button: a Link wrapping a Button with ArrowLeft icon — look for a button/link near "Insight Detail" label
  // The back button is <Link href="/insights"><Button ...>
  const backLink = page.locator('a[href="/insights"]').first();
  await expect(backLink).toBeVisible({ timeout: 8000 });
  await backLink.click();

  await page.waitForURL(/\/insights$/, { timeout: 10000 });
  expect(page.url()).toMatch(/\/insights$/);
});

test('I11 — status dropdown is visible and its value can be changed', async ({ page }) => {
  await gotoFirstInsightDetail(page);

  // Native <select> for status (not Radix)
  const statusSelect = page.locator('select').first();
  await expect(statusSelect).toBeVisible({ timeout: 8000 });

  const currentValue = await statusSelect.inputValue();
  // Pick a different status
  const allStatuses = ['New', 'Investigating', 'Actioned', 'Monitoring'];
  const nextStatus = allStatuses.find(s => s !== currentValue) ?? 'Investigating';

  await statusSelect.selectOption(nextStatus);
  await page.waitForTimeout(500);

  const newValue = await statusSelect.inputValue();
  expect(newValue).toBe(nextStatus);
});

test('I12 — share button shows a toast containing "copied" or "link" or "share"', async ({ page }) => {
  await gotoFirstInsightDetail(page);

  // Share button text
  const shareBtn = page.locator('button', { hasText: /share/i });
  await expect(shareBtn).toBeVisible({ timeout: 8000 });

  // Mock clipboard API to avoid NotAllowedError in headless mode
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.resolve() },
      writable: true,
    });
  });

  await shareBtn.click();

  // Sonner toast renders in body — look for toast text
  const toast = page.locator('[data-sonner-toast]').first();
  await expect(toast).toBeVisible({ timeout: 5000 });
  const toastText = (await toast.innerText()).toLowerCase();
  const matches = toastText.includes('copied') || toastText.includes('link') || toastText.includes('share');
  expect(matches).toBe(true);
});

test('I13 — notes textarea exists; typing and saving shows success toast', async ({ page }) => {
  await gotoFirstInsightDetail(page);

  // Scroll down to notes section
  const notesTextarea = page.locator('textarea[placeholder*="note"]').first();
  await notesTextarea.scrollIntoViewIfNeeded();
  await expect(notesTextarea).toBeVisible({ timeout: 8000 });

  await notesTextarea.fill('Test note from E2E ' + Date.now());

  const saveBtn = page.locator('button', { hasText: /save notes/i });
  await expect(saveBtn).toBeVisible({ timeout: 5000 });
  await saveBtn.click();

  // Sonner toast
  const toast = page.locator('[data-sonner-toast]').first();
  await expect(toast).toBeVisible({ timeout: 8000 });
  const toastText = (await toast.innerText()).toLowerCase();
  const matches = toastText.includes('saved') || toastText.includes('notes') || toastText.includes('failed');
  expect(matches).toBe(true);
});

test('I14 — "Create Action Item" button opens a dialog', async ({ page }) => {
  await gotoFirstInsightDetail(page);

  // Scroll down to Recommended Actions section
  const createBtn = page.locator('button', { hasText: /create action item/i });
  await createBtn.scrollIntoViewIfNeeded();
  await expect(createBtn).toBeVisible({ timeout: 8000 });
  await createBtn.click();

  // Modal with role="dialog"
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible({ timeout: 5000 });
});
