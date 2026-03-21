import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3002';

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', 'alex@company.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/home/, { timeout: 15000 });
}

// T1 — Unauthenticated GET /home → redirected to /login
test('T1 - unauthenticated /home redirects to /login', async ({ page }) => {
  await page.goto(`${BASE}/home`);
  await expect(page).toHaveURL(/login/, { timeout: 10000 });
});

// T2 — Unauthenticated GET /insights → redirected to /login
test('T2 - unauthenticated /insights redirects to /login', async ({ page }) => {
  await page.goto(`${BASE}/insights`);
  await expect(page).toHaveURL(/login/, { timeout: 10000 });
});

// T3 — Login page renders: email input, password input, submit button all visible
test('T3 - login page renders required form elements', async ({ page }) => {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 15000 });
});

// T4 — Login with wrong password → error message visible on page (red text)
test('T4 - wrong password shows error message', async ({ page }) => {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', 'alex@company.com');
  await page.fill('input[name="password"]', 'wrongpassword123');
  await page.click('button[type="submit"]');
  // Wait for the error message to appear — it has class text-red-600
  await expect(page.locator('p.text-red-600')).toBeVisible({ timeout: 15000 });
  const errorText = await page.locator('p.text-red-600').textContent();
  expect(errorText).toBeTruthy();
});

// T5 — Login with valid credentials → redirected to /home
test('T5 - successful login redirects to /home', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/home/, { timeout: 15000 });
});

// T6 — After login: session cookie is set
test('T6 - session cookie set after login', async ({ page }) => {
  await login(page);
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'session');
  expect(sessionCookie).toBeDefined();
  expect(sessionCookie?.value).toBeTruthy();
});

// T7 — GET /api/auth/me with valid session → returns { email: 'alex@company.com' }
test('T7 - GET /api/auth/me returns user email after login', async ({ page }) => {
  await login(page);
  const response = await page.request.get(`${BASE}/api/auth/me`);
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.email).toBe('alex@company.com');
});

// T8 — Logout: click logout in user menu → redirected to /login
test('T8 - logout via user menu redirects to /login', async ({ page }) => {
  await login(page);
  // Click the user avatar button (AT initials)
  await page.locator('button', { hasText: 'AT' }).click();
  // Wait for dropdown and click Logout
  await page.locator('[role="menuitem"]', { hasText: 'Logout' }).click();
  await expect(page).toHaveURL(/login/, { timeout: 10000 });
});

// T9 — After logout: accessing /home redirects to /login
test('T9 - after logout /home redirects to /login', async ({ page }) => {
  await login(page);
  // Logout via UI - click the user avatar button
  await page.locator('button', { hasText: 'AT' }).click();
  await page.locator('[role="menuitem"]', { hasText: 'Logout' }).click();
  await expect(page).toHaveURL(/login/, { timeout: 10000 });
  // Now try to access /home again — should redirect back to /login
  await page.goto(`${BASE}/home`);
  await expect(page).toHaveURL(/login/, { timeout: 10000 });
});

// T10 — Rate limiting: send 6 failed login attempts → next attempt returns 429
test('T10 - rate limiting blocks after max failed attempts', async ({ request }) => {
  // Use a timestamp-unique email so no other test's rate limit state interferes
  const testEmail = `ratelimit-${Date.now()}@test.example.com`;
  const wrongPassword = 'badpassword999';

  // The rate limiter: MAX_ATTEMPTS=5 — on the 5th attempt newCount >= MAX_ATTEMPTS, locks
  // Attempts 1-4 return 401, attempt 5 returns 429
  // We send up to 8 attempts and expect a 429 somewhere
  let got429 = false;
  let attempt429At = 0;

  for (let i = 1; i <= 8; i++) {
    const response = await request.post(`${BASE}/api/auth/login`, {
      data: { email: testEmail, password: wrongPassword },
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status() === 429) {
      got429 = true;
      attempt429At = i;
      break;
    }
  }

  expect(got429, `Expected a 429 within 8 attempts, but never got one`).toBe(true);
  // Should have been locked by attempt 5 or 6
  expect(attempt429At).toBeGreaterThanOrEqual(5);
  expect(attempt429At).toBeLessThanOrEqual(7);
});

// T11 — Login page has no JS console errors on load
test('T11 - login page has no JS console errors on load', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });

  // Filter out known non-critical errors (e.g., prefetch failures)
  const criticalErrors = consoleErrors.filter(err =>
    !err.includes('Failed to load resource') &&
    !err.includes('net::ERR_') &&
    !err.includes('favicon')
  );

  expect(criticalErrors).toHaveLength(0);
});
