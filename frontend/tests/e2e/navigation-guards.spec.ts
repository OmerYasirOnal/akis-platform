/**
 * Navigation & Route Guard E2E (mocked backend)
 *
 * Verifies:
 * - Sidebar shows only Agents Hub (no individual Scribe/Trace/Proto links)
 * - ProtectedRoute redirects unauthenticated users to /login
 * - /dashboard/* routes redirect to /agents/* for authenticated users
 *
 * Run: npx playwright test navigation-guards
 */
import { test, expect } from '@playwright/test';
import {
  mockDashboardApis,
  mockUnauthenticated,
} from './helpers/mock-dashboard-apis';

test.describe('Sidebar Navigation', () => {
  /* ------------------------------------------------------------------ */
  /* N1 — Sidebar Agents group shows only Agents Hub link                */
  /* ------------------------------------------------------------------ */
  test('N1: Sidebar shows Agents Hub link (no individual agent links)', async ({ page }) => {
    await mockDashboardApis(page);

    // Navigate to agents trace page
    await page.goto('/agents/trace');
    await expect(page.getByRole('heading', { name: /trace console/i })).toBeVisible();

    // Scope to the <nav> inside the visible desktop sidebar
    const sidebarNav = page.locator('aside nav').first();

    // Agents Hub link should be visible and point to /agents
    const hubLink = sidebarNav.getByRole('link', { name: 'Agents Hub' });
    await expect(hubLink).toBeVisible();
    await expect(hubLink).toHaveAttribute('href', '/agents');

    // Individual Scribe/Trace/Proto links should NOT be in sidebar
    await expect(sidebarNav.getByRole('link', { name: 'Scribe' })).not.toBeVisible();
    await expect(sidebarNav.getByRole('link', { name: 'Trace' })).not.toBeVisible();
    await expect(sidebarNav.getByRole('link', { name: 'Proto' })).not.toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* N2 — Clicking Agents Hub navigates to /agents                       */
  /* ------------------------------------------------------------------ */
  test('N2: Clicking Agents Hub in sidebar navigates to Agents page', async ({ page }) => {
    await mockDashboardApis(page);

    // Start at a dashboard page
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10_000 });

    // Click Agents Hub in the sidebar nav
    const sidebarNav = page.locator('aside nav').first();
    await sidebarNav.getByRole('link', { name: 'Agents Hub' }).click();

    await expect(page).toHaveURL(/\/agents$/);
  });

  /* ------------------------------------------------------------------ */
  /* N3 — Direct navigation to /agents/scribe loads Scribe page          */
  /* ------------------------------------------------------------------ */
  test('N3: Direct navigation to /agents/scribe loads correctly', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/agents/scribe');
    await expect(page.getByRole('heading', { name: /scribe console/i })).toBeVisible({ timeout: 15_000 });
    expect(page.url()).toContain('/agents/scribe');
  });
});

test.describe('Route Guards', () => {
  /* ------------------------------------------------------------------ */
  /* G0 — Unauthenticated /agents redirects to /login                     */
  /* ------------------------------------------------------------------ */
  test('G0: /agents redirects to /login when not authenticated', async ({ page }) => {
    await mockUnauthenticated(page);

    await page.goto('/agents');

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  /* ------------------------------------------------------------------ */
  /* G1 — Unauthenticated /dashboard redirects to /login                  */
  /* ------------------------------------------------------------------ */
  test('G1: /dashboard redirects to /login when not authenticated', async ({ page }) => {
    await mockUnauthenticated(page);

    await page.goto('/dashboard');

    // ProtectedRoute should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  /* ------------------------------------------------------------------ */
  /* G2 — Unauthenticated /dashboard/trace redirects to /login            */
  /* ------------------------------------------------------------------ */
  test('G2: /dashboard/trace redirects to /login when not authenticated', async ({ page }) => {
    await mockUnauthenticated(page);

    await page.goto('/dashboard/trace');

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  /* ------------------------------------------------------------------ */
  /* G3 — Unauthenticated /dashboard/proto redirects to /login            */
  /* ------------------------------------------------------------------ */
  test('G3: /dashboard/proto redirects to /login when not authenticated', async ({ page }) => {
    await mockUnauthenticated(page);

    await page.goto('/dashboard/proto');

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  /* ------------------------------------------------------------------ */
  /* G4 — /dashboard/trace redirects to /agents/trace                     */
  /* ------------------------------------------------------------------ */
  test('G4: /dashboard/trace redirects to /agents/trace', async ({ page }) => {
    await mockDashboardApis(page);

    const response = await page.goto('/dashboard/trace');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    // Should redirect to /agents/trace
    await expect(page).toHaveURL(/\/agents\/trace/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /trace console/i })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* G5 — /dashboard/proto redirects to /agents/proto                     */
  /* ------------------------------------------------------------------ */
  test('G5: /dashboard/proto redirects to /agents/proto', async ({ page }) => {
    await mockDashboardApis(page);

    const response = await page.goto('/dashboard/proto');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    // Should redirect to /agents/proto
    await expect(page).toHaveURL(/\/agents\/proto/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /proto console/i })).toBeVisible();
  });
});
