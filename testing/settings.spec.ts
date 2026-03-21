import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3002';

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', 'alex@company.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/home/, { timeout: 15000 });
}

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/settings`);
    // Wait for the page to load and the profile data to hydrate
    await page.waitForSelector('#firstName', { timeout: 10000 });
    // Wait until the firstName input is no longer disabled (data loaded)
    await page.waitForFunction(() => {
      const el = document.querySelector('#firstName') as HTMLInputElement | null;
      return el && !el.disabled;
    }, { timeout: 10000 });
  });

  test('S1 — Settings page loads with profile data (first/last name fields visible and populated)', async ({ page }) => {
    const firstName = page.locator('#firstName');
    const lastName = page.locator('#lastName');
    await expect(firstName).toBeVisible();
    await expect(lastName).toBeVisible();
    const fnValue = await firstName.inputValue();
    const lnValue = await lastName.inputValue();
    // At least one of the name fields should have content
    expect(fnValue.length + lnValue.length).toBeGreaterThan(0);
  });

  test('S2 — Email field is read-only (disabled attribute present)', async ({ page }) => {
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeDisabled();
  });

  test('S3 — First name input is editable (can type into it)', async ({ page }) => {
    const firstName = page.locator('#firstName');
    await expect(firstName).toBeEnabled();
    await firstName.fill('TestEdit');
    await expect(firstName).toHaveValue('TestEdit');
  });

  test('S4 — Change first name → click Save Changes → success toast shown', async ({ page }) => {
    const firstName = page.locator('#firstName');
    const currentValue = await firstName.inputValue();
    const newName = currentValue === 'Alex' ? 'Alexandra' : 'Alex';
    await firstName.fill(newName);

    // Click Save Changes button
    await page.getByRole('button', { name: /save changes/i }).click();

    // Expect a success toast
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 8000 });
    const toastText = await toast.textContent();
    expect(toastText?.toLowerCase()).toContain('profile');
  });

  test('S5 — Reload page → updated name persists', async ({ page }) => {
    const firstName = page.locator('#firstName');
    const currentValue = await firstName.inputValue();
    const newName = currentValue === 'Alex' ? 'AlexPersist' : 'Alex';
    await firstName.fill(newName);

    await page.getByRole('button', { name: /save changes/i }).click();
    // Wait for success toast before reloading
    await page.locator('[data-sonner-toast]').first().waitFor({ timeout: 8000 });

    // Reload and wait for data
    await page.reload();
    await page.waitForSelector('#firstName', { timeout: 10000 });
    await page.waitForFunction(() => {
      const el = document.querySelector('#firstName') as HTMLInputElement | null;
      return el && !el.disabled;
    }, { timeout: 10000 });

    const reloadedValue = await page.locator('#firstName').inputValue();
    expect(reloadedValue).toBe(newName);
  });

  test('S6 — Notification toggles section is visible (≥1 switch element)', async ({ page }) => {
    const switches = page.locator('[role="switch"]');
    const count = await switches.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('S7 — Toggle a notification switch → PATCH /api/settings/preferences fires', async ({ page }) => {
    // Intercept the PATCH request
    const patchPromise = page.waitForRequest(
      (req) => req.url().includes('/api/settings/preferences') && req.method() === 'PATCH',
      { timeout: 8000 }
    );

    // Click the first enabled switch
    const switches = page.locator('[role="switch"]');
    const count = await switches.count();
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const sw = switches.nth(i);
      const disabled = await sw.getAttribute('disabled');
      const ariaDisabled = await sw.getAttribute('aria-disabled');
      if (disabled === null && ariaDisabled !== 'true') {
        await sw.click();
        clicked = true;
        break;
      }
    }
    expect(clicked).toBe(true);

    const request = await patchPromise;
    expect(request).toBeTruthy();
  });

  test('S8 — Data preferences section exists (inputs for brand/time window/geography)', async ({ page }) => {
    const brandInput = page.locator('#defaultBrand');
    const timeWindowInput = page.locator('#defaultTimeWindow');
    const geoInput = page.locator('#defaultGeography');

    await expect(brandInput).toBeVisible();
    await expect(timeWindowInput).toBeVisible();
    await expect(geoInput).toBeVisible();
  });

  test('S9 — Click Save Preferences → success toast shown', async ({ page }) => {
    await page.getByRole('button', { name: /save preferences/i }).click();
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 8000 });
    const toastText = await toast.textContent();
    expect(toastText?.toLowerCase()).toContain('prefer');
  });

  test('S10 — Security section: Change Password button is disabled', async ({ page }) => {
    const changePasswordBtn = page.getByRole('button', { name: /change password/i });
    await expect(changePasswordBtn).toBeVisible();
    await expect(changePasswordBtn).toBeDisabled();
  });
});
