/**
 * Getting Started Card E2E (mocked backend)
 *
 * Verifies the onboarding checklist card renders on the dashboard,
 * shows correct step states, and can be dismissed.
 *
 * Run: npx playwright test getting-started
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import {
  mockDashboardApis,
  mockAiKeysStatus,
} from './helpers/mock-dashboard-apis';

/**
 * Mock the additional API calls the Dashboard Overview page makes
 * (beyond the base mockDashboardApis set).
 *
 * The base mockDashboardApis mocks /api/usage/** with a simple shape,
 * but UsageWidget expects { period: { start, end }, ... } from
 * /api/usage/current-month. We override with the correct shape here.
 */
async function mockDashboardOverviewApis(page: Page) {
  // UsageWidget: GET /api/usage/current-month (override base mock with correct shape)
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

  // QualityReliabilityCard: GET /api/dashboard/metrics
  await page.route('**/api/dashboard/metrics**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        period: '7d',
        averageQuality: 0,
        successRate: 0,
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        topErrors: [],
      }),
    });
  });
}

test.describe('Getting Started Card', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage dismissal flag before each test
    await page.addInitScript(() => {
      localStorage.removeItem('akis-getting-started-dismissed');
    });
  });

  /* ------------------------------------------------------------------ */
  /* GS1 — Card renders on dashboard with 3 steps                       */
  /* ------------------------------------------------------------------ */
  test('GS1: Getting Started card renders with 3 onboarding steps', async ({ page }) => {
    // Register overview-specific mocks first, then base mocks.
    // Playwright checks routes in reverse order (last registered wins),
    // so mockDashboardOverviewApis must be registered AFTER mockDashboardApis
    // to override the generic /api/usage/** with the correct response shape.
    await mockDashboardApis(page);
    await mockDashboardOverviewApis(page);
    await mockAiKeysStatus(page);

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // Wait for main content to fully render (first load may need Vite compilation)
    await expect(page.locator('main h1')).toBeVisible({ timeout: 20_000 });

    await expect(page.getByRole('heading', { name: 'Getting Started' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Configure AI Provider', { exact: true })).toBeVisible();
    await expect(page.getByText('Run Your First Agent', { exact: true })).toBeVisible();
    await expect(page.getByText('Explore Results', { exact: true })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* GS2 — AI keys step shows as completed when configured               */
  /* ------------------------------------------------------------------ */
  test('GS2: AI keys step shows completed when provider is configured', async ({ page }) => {
    await mockDashboardApis(page);
    await mockDashboardOverviewApis(page);
    await mockAiKeysStatus(page); // mockAiKeysStatus returns openai configured

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Getting Started')).toBeVisible({ timeout: 10_000 });

    // Progress should show 1/3 (AI keys configured)
    await expect(page.getByText('1/3')).toBeVisible();

    // "Set up AI Keys" link should NOT be present (step done)
    await expect(page.getByText('Set up AI Keys')).not.toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* GS3 — Card can be dismissed                                         */
  /* ------------------------------------------------------------------ */
  test('GS3: Dismiss button hides the card', async ({ page }) => {
    await mockDashboardApis(page);
    await mockDashboardOverviewApis(page);
    await mockAiKeysStatus(page);

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Getting Started')).toBeVisible({ timeout: 10_000 });

    // Click dismiss
    await page.getByLabel('Dismiss getting started').click();

    // Card should be gone
    await expect(page.getByText('Getting Started')).not.toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* GS4 — Dismissed state persists across navigation                    */
  /* ------------------------------------------------------------------ */
  test('GS4: Dismissed card stays hidden after page reload', async ({ page }) => {
    await mockDashboardApis(page);
    await mockDashboardOverviewApis(page);
    await mockAiKeysStatus(page);

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Getting Started')).toBeVisible({ timeout: 10_000 });

    // Dismiss
    await page.getByLabel('Dismiss getting started').click();
    await expect(page.getByText('Getting Started')).not.toBeVisible();

    // Navigate away and back
    const sidebarNav = page.locator('aside nav').first();
    await sidebarNav.getByRole('link', { name: 'Jobs' }).click();
    await expect(page).toHaveURL(/\/dashboard\/jobs/);

    await sidebarNav.getByRole('link', { name: 'Overview' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Card should still be hidden
    await expect(page.getByText('Getting Started')).not.toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* GS5 — Step links navigate to correct pages                          */
  /* ------------------------------------------------------------------ */
  test('GS5: Step links point to correct destinations', async ({ page }) => {
    await mockDashboardApis(page);
    await mockDashboardOverviewApis(page);

    // Mock AI keys as unconfigured to show all step links
    await page.route('**/api/settings/ai-keys/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activeProvider: null,
          providers: {
            openai: { configured: false, last4: null, updatedAt: null },
            openrouter: { configured: false, last4: null, updatedAt: null },
          },
        }),
      });
    });

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Getting Started')).toBeVisible({ timeout: 10_000 });

    // Check link destinations
    const aiKeysLink = page.getByRole('link', { name: 'Set up AI Keys' });
    await expect(aiKeysLink).toHaveAttribute('href', '/dashboard/settings/ai-keys');

    const agentsLink = page.getByRole('link', { name: 'Open Agents Hub' });
    await expect(agentsLink).toHaveAttribute('href', '/agents');

    const jobsLink = page.getByRole('link', { name: 'View Jobs' });
    await expect(jobsLink).toHaveAttribute('href', '/dashboard/jobs');
  });
});
