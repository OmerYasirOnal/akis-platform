/**
 * Auth Deep-Link Routing Guard
 *
 * Verifies that SPA client-side routes under /auth/* are served by the
 * Vite dev-server (or Caddy's try_files in production) as an HTML document,
 * NOT as a backend JSON 404.
 *
 * This is the test that would have caught the original Phase-A routing bug
 * where Caddy forwarded /auth/* to the Fastify backend instead of serving
 * index.html.
 *
 * Run: pnpm -C frontend exec playwright test auth-deep-links
 */
import { test, expect } from '@playwright/test';

test.describe('SPA deep-link routing', () => {
  test('/auth/welcome-beta renders React page, not backend JSON', async ({
    page,
  }) => {
    const response = await page.goto('/auth/welcome-beta');
    expect(response).not.toBeNull();

    // Must return 200 (Vite serves index.html for any SPA route)
    expect(response!.status()).toBe(200);

    // Content-Type must be HTML, not application/json
    const ct = response!.headers()['content-type'] ?? '';
    expect(ct).toContain('text/html');

    // The React app should mount and render the WelcomeBeta page
    await expect(page.getByRole('heading', { name: /welcome to akis/i })).toBeVisible();
    await expect(page.getByText('🎉')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /continue to akis dashboard/i }),
    ).toBeVisible();
  });

  test('/auth/privacy-consent renders React page, not backend JSON', async ({
    page,
  }) => {
    const response = await page.goto('/auth/privacy-consent');
    expect(response).not.toBeNull();

    expect(response!.status()).toBe(200);

    const ct = response!.headers()['content-type'] ?? '';
    expect(ct).toContain('text/html');

    // PrivacyConsent page renders these elements
    await expect(page.getByRole('heading', { name: /help improve akis/i })).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /continue to dashboard/i }),
    ).toBeVisible();
  });

  test('/signup renders React page (email form)', async ({ page }) => {
    const response = await page.goto('/signup');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const ct = response!.headers()['content-type'] ?? '';
    expect(ct).toContain('text/html');

    // SignupEmail has firstName, lastName, email fields
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
  });

  test('/login renders React page (email form)', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const ct = response!.headers()['content-type'] ?? '';
    expect(ct).toContain('text/html');

    // LoginEmail page has an email input and heading
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
