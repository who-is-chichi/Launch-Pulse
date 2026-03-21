import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3002';

test('diag - check login page HTTP status', async ({ request }) => {
  const response = await request.get(`${BASE}/login`);
  console.log('Login page status:', response.status());
  console.log('Login page headers:', JSON.stringify(Object.fromEntries(Object.entries(await response.headers()))));
  const body = await response.text();
  console.log('Login page body (first 500):', body.substring(0, 500));
});

test('diag - test login API directly', async ({ request }) => {
  const response = await request.post(`${BASE}/api/auth/login`, {
    data: { email: 'alex@company.com', password: 'password123' },
    headers: { 'Content-Type': 'application/json' },
  });
  console.log('Login API status:', response.status());
  const body = await response.text();
  console.log('Login API body:', body.substring(0, 500));
  console.log('Login API headers:', JSON.stringify(Object.fromEntries(Object.entries(await response.headers()))));
});

test('diag - check rate limit API directly', async ({ request }) => {
  const testEmail = `diag-rl-${Date.now()}@test.example.com`;
  const results: number[] = [];
  for (let i = 1; i <= 8; i++) {
    const response = await request.post(`${BASE}/api/auth/login`, {
      data: { email: testEmail, password: 'wrongpassword' },
      headers: { 'Content-Type': 'application/json' },
    });
    results.push(response.status());
    console.log(`Attempt ${i}: status=${response.status()}`);
    if (response.status() === 429) break;
  }
  console.log('All statuses:', results);
});
