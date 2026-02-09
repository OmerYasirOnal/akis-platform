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
import { test, expect, type Page, type Route } from '@playwright/test';
import {
  mockDashboardApis,
  mockUnauthenticated,
  mockAiKeysStatus,
  mockGitHubConnected,
} from './helpers/mock-dashboard-apis';

/** Mock additional dashboard overview APIs (usage, metrics) */
async function mockOverviewApis(page: Page) {
  await page.route('**/api/usage/current-month', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        period: { start: '2026-02-01', end: '2026-02-28' },
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0, jobCount: 0 },
        freeQuota: { tokens: 100000, costUsd: 1.0 },
        used: { tokens: 0, costUsd: 0 },
        remaining: { tokens: 100000, costUsd: 1.0 },
        onDemand: { tokens: 0, costUsd: 0 },
        percentUsed: { tokens: 0, cost: 0 },
      }),
    });
  });
  await page.route('**/api/dashboard/metrics**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        period: '7d', averageQuality: 0, successRate: 0,
        totalJobs: 0, completedJobs: 0, failedJobs: 0, topErrors: [],
      }),
    });
  });
}

test.describe('Sidebar Navigation', () => {
  /* ------------------------------------------------------------------ */
  /* N1 — Sidebar Agents group shows only Agents Hub link                */
  /* ------------------------------------------------------------------ */
  test('N1: Sidebar shows Agents Hub link (no individual agent links)', async ({ page }) => {
    await mockDashboardApis(page);
    await mockOverviewApis(page);
    await mockAiKeysStatus(page);

    // Navigate to Dashboard (which has sidebar)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Scope to the <nav> inside the visible desktop sidebar
    const sidebarNav = page.locator('aside nav').first();

    // Agents Hub link should be visible and point to /agents
    const hubLink = sidebarNav.getByRole('link', { name: 'Agents Hub' });
    await expect(hubLink).toBeVisible({ timeout: 10_000 });
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
    await mockOverviewApis(page);
    await mockAiKeysStatus(page);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click Agents Hub in the sidebar nav
    const sidebarNav = page.locator('aside nav').first();
    const hubLink = sidebarNav.getByRole('link', { name: 'Agents Hub' });
    await expect(hubLink).toBeVisible({ timeout: 10_000 });
    await hubLink.click();

    await expect(page).toHaveURL(/\/agents/, { timeout: 10_000 });
  });

  /* ------------------------------------------------------------------ */
  /* N3 — Direct navigation to /agents/scribe loads Scribe page          */
  /* ------------------------------------------------------------------ */
  test('N3: Direct navigation to /agents/scribe loads correctly', async ({ page }) => {
    await mockDashboardApis(page);
    await mockAiKeysStatus(page);
    await mockGitHubConnected(page);

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
