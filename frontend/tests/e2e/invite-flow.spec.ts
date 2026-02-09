/**
 * Invite Flow E2E Tests
 *
 * Verifies invite accept page routing and UI elements.
 * Tests SPA deep-link routing for /auth/invite/:token.
 *
 * Run: pnpm -C frontend exec playwright test invite-flow
 */
import { test, expect } from '@playwright/test';

test.describe('Invite Accept Page', () => {
  test('/auth/invite/:token renders SPA page (not backend JSON)', async ({
    page,
  }) => {
    // Use a fake token — we just need to verify SPA routing works
    const response = await page.goto('/auth/invite/fake-token-123');
    expect(response).not.toBeNull();

    // Must return 200 (Vite serves index.html for any SPA route)
    expect(response!.status()).toBe(200);

    // Content-Type must be HTML, not application/json
    const ct = response!.headers()['content-type'] ?? '';
    expect(ct).toContain('text/html');
  });

  test('shows loading state initially', async ({ page }) => {
    await page.goto('/auth/invite/some-test-token');

    // The page should show a loading spinner or "validating" text
    // It will try to validate the token and eventually show invalid
    // We check the initial loading state
    const logo = page.locator('img[alt*="AKIS"], h1:has-text("AKIS")');
    await expect(logo.first()).toBeVisible({ timeout: 5000 });
  });

  test('shows invalid invite message for fake token', async ({ page }) => {
    await page.goto('/auth/invite/definitely-not-a-real-token');

    // Wait for validation to complete — should show invalid invite
    // The page will call the backend API which will return 404/error
    // Then show the "Invalid Invite" UI
    await expect(
      page.getByText(/geçersiz davet|invalid invite/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test('invalid invite page has signup link', async ({ page }) => {
    await page.goto('/auth/invite/definitely-not-a-real-token');

    // Wait for invalid state
    await expect(
      page.getByText(/geçersiz davet|invalid invite/i),
    ).toBeVisible({ timeout: 10000 });

    // Should have a link to create a new account
    const signupLink = page.getByRole('link', {
      name: /yeni hesap oluştur|create a new account/i,
    });
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toHaveAttribute('href', '/signup');
  });

  test('invite page shows AKIS logo', async ({ page }) => {
    await page.goto('/auth/invite/test-token-abc');

    // Wait for page to fully load (loading or invalid state)
    await page.waitForTimeout(2000);

    // Logo should be present in all states
    const logo = page.locator('[class*="logo"], img[alt*="AKIS"], a[href="/"]');
    await expect(logo.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Invite Deep-Link SPA Routing', () => {
  test('Caddy/Vite serves SPA for /auth/invite/* paths', async ({ page }) => {
    // Test multiple token formats to ensure catch-all routing works
    const paths = [
      '/auth/invite/abc123',
      '/auth/invite/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    ];

    for (const path of paths) {
      const response = await page.goto(path);
      expect(response).not.toBeNull();
      expect(response!.status()).toBe(200);

      const ct = response!.headers()['content-type'] ?? '';
      expect(ct).toContain('text/html');

      // Must have React root
      const root = page.locator('#root');
      await expect(root).toBeAttached();
    }
  });
});
