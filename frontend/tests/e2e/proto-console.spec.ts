/**
 * Proto Console E2E (mocked backend)
 *
 * Verifies the Proto console page renders and basic interactions work.
 * Backend API calls are mocked via Playwright route interception.
 *
 * Run: pnpm -C frontend exec playwright test proto-console
 */
import { test, expect, type Page, type Route } from '@playwright/test';

/** Mock the auth and agents APIs so the dashboard loads without a live backend */
async function mockDashboardApis(page: Page) {
  // Mock /auth/me → authenticated user
  await page.route('**/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'e2e-user',
        email: 'e2e@test.akis.dev',
        firstName: 'E2E',
        lastName: 'Tester',
        hasSeenBetaWelcome: true,
        dataSharingConsent: true,
        emailVerified: true,
        role: 'user',
      }),
    });
  });

  // Mock running jobs (agent status polling)
  await page.route('**/api/agents/jobs/running', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ jobs: [] }),
    });
  });

  // Mock usage API
  await page.route('**/api/usage/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ used: 0, limit: 100 }),
    });
  });
}

test.describe('Proto Console', () => {
  test('/dashboard/proto renders Proto Console page', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/proto');

    // Should render Proto Console heading
    await expect(page.getByRole('heading', { name: /proto console/i })).toBeVisible();

    // Should have requirements textarea
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Should have "Run Proto" button (disabled initially)
    const runButton = page.getByRole('button', { name: /run proto/i });
    await expect(runButton).toBeVisible();
    await expect(runButton).toBeDisabled();
  });

  test('Proto Console enables Run button when requirements are provided', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/proto');

    // Type requirements
    const textarea = page.locator('textarea');
    await textarea.fill('Build a REST API for a todo list app');

    // Run button should now be enabled
    const runButton = page.getByRole('button', { name: /run proto/i });
    await expect(runButton).toBeEnabled();
  });

  test('Proto Console has Logs and Artifacts tabs', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/proto');

    // Should show both tabs
    await expect(page.getByRole('button', { name: /logs/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /artifacts/i })).toBeVisible();
  });

  test('Proto Console shows empty state for logs', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/proto');

    // Logs tab should show empty state
    await expect(page.getByText(/proto agent activity will appear here/i)).toBeVisible();
  });
});
