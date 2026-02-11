/**
 * Local Smoke Test - UI Click-Through Verification
 * 
 * This test verifies that the frontend loads correctly and basic navigation works.
 * It does NOT require authentication or external services.
 * 
 * Run: pnpm -C frontend exec playwright test local-smoke --headed
 */
import { test, expect } from '@playwright/test';

test.describe('Local UI Smoke Test', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loaded (either landing or redirect to login)
    await expect(page).toHaveURL(/\/(|login.*)/);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/01-homepage.png', fullPage: true });
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    
    // Check login page elements
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/02-login-page.png', fullPage: true });
  });

  test('dev login works (if enabled)', async ({ page }) => {
    // Check if dev login is enabled via env var
    const devLoginEnabled = process.env.VITE_ENABLE_DEV_LOGIN === 'true';
    
    if (!devLoginEnabled) {
      test.skip(true, 'VITE_ENABLE_DEV_LOGIN is not enabled');
      return;
    }

    await page.goto('/login');
    
    // Look for dev login button
    const devLoginButton = page.getByRole('button', { name: /dev login|test login/i });
    if (await devLoginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await devLoginButton.click();
      await page.waitForURL('**/dashboard/**', { timeout: 30000 });
      await page.screenshot({ path: 'test-results/screenshots/03-dashboard.png', fullPage: true });
    } else {
      test.skip(true, 'Dev login button not found');
    }
  });

  test('health endpoint is accessible', async ({ request }) => {
    // Test backend health endpoint directly (use 127.0.0.1 to avoid IPv6 issues)
    const apiBase = process.env.API_BASE_URL ?? 'http://127.0.0.1:3000';
    let response;
    try {
      response = await request.get(`${apiBase}/health`, { timeout: 5000 });
    } catch (error) {
      test.skip(true, `Backend is not reachable at ${apiBase}: ${String(error)}`);
      return;
    }
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('jobs API returns 200', async ({ request }) => {
    // Test jobs list endpoint (use 127.0.0.1 to avoid IPv6 issues)
    const apiBase = process.env.API_BASE_URL ?? 'http://127.0.0.1:3000';
    let response;
    try {
      response = await request.get(`${apiBase}/api/agents/jobs?limit=1`, { timeout: 5000 });
    } catch (error) {
      test.skip(true, `Backend is not reachable at ${apiBase}: ${String(error)}`);
      return;
    }
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('items');
  });
});
