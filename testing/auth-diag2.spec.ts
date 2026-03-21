import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3002';

test('diag2 - login page via browser (not request)', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  // Capture whatever is on the page
  const content = await page.content();
  console.log('Page content (first 500):', content.substring(0, 500));
  const title = await page.title();
  console.log('Page title:', title);
  // Check if there's ANY input element
  const inputs = await page.locator('input').count();
  console.log('Input count:', inputs);
  const url = page.url();
  console.log('Final URL:', url);
});

test('diag2 - login page via browser with longer wait', async ({ page }) => {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const inputs = await page.locator('input').count();
  console.log('Input count after 3s wait:', inputs);
  const allInputInfo = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    return Array.from(inputs).map(i => ({ name: i.name, id: i.id, type: i.type }));
  });
  console.log('All inputs:', JSON.stringify(allInputInfo));
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('Body text:', bodyText);
});

test('diag2 - check if server is accessible', async ({ request }) => {
  // Try a simple GET to the API
  try {
    const resp = await request.get(`${BASE}/api/brands`);
    console.log('Brands API status:', resp.status());
  } catch (e) {
    console.log('Brands API error:', e);
  }

  // Check home page redirect
  const homeResp = await request.get(`${BASE}/home`, { maxRedirects: 0 }).catch(e => ({ status: () => 'ERROR: ' + e.message }));
  console.log('Home page status:', homeResp.status());
});
