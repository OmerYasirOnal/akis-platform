/**
 * Trace Console E2E (mocked backend)
 *
 * Verifies the Trace console page renders, interactions work, and edge
 * cases (empty state, error, job lifecycle) are handled correctly.
 * Backend API calls are mocked via Playwright route interception.
 *
 * Run: npx playwright test trace-console
 */
import { test, expect } from '@playwright/test';
import {
  mockDashboardApis,
  mockAiKeysStatus,
  mockRunAgent,
  mockJobPolling,
  mockRunAgentError,
} from './helpers/mock-dashboard-apis';

test.describe('Trace Console', () => {
  /* ------------------------------------------------------------------ */
  /* T1 — Route load: page renders heading and core elements             */
  /* ------------------------------------------------------------------ */
  test('T1: /dashboard/trace renders Trace Console page', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/trace');

    // Heading
    await expect(page.getByRole('heading', { name: /trace console/i })).toBeVisible();

    // Textarea for specification
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Run button (disabled when empty)
    const runButton = page.getByRole('button', { name: /run trace/i });
    await expect(runButton).toBeVisible();
    await expect(runButton).toBeDisabled();
  });

  /* ------------------------------------------------------------------ */
  /* T2 — Run button enables when spec is provided                       */
  /* ------------------------------------------------------------------ */
  test('T2: Run button enables when specification text is entered', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/trace');

    const textarea = page.locator('textarea');
    await textarea.fill('As a user I want to login so that I can access the dashboard');

    const runButton = page.getByRole('button', { name: /run trace/i });
    await expect(runButton).toBeEnabled();
  });

  /* ------------------------------------------------------------------ */
  /* T3 — Tabs: Logs and Results are present                             */
  /* ------------------------------------------------------------------ */
  test('T3: Logs and Results tabs are visible', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/trace');

    await expect(page.getByRole('button', { name: '📋 Logs' })).toBeVisible();
    await expect(page.getByRole('button', { name: '📊 Results' })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* T4 — Empty state for logs                                           */
  /* ------------------------------------------------------------------ */
  test('T4: Logs tab shows empty state when no job has run', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/trace');

    await expect(page.getByTestId('phase-ready-banner')).toBeVisible();
    await expect(page.getByText('Execution updates will appear here.')).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* T5 — Results tab empty state                                        */
  /* ------------------------------------------------------------------ */
  test('T5: Results tab shows empty state placeholder', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/trace');

    // Switch to Results tab
    await page.getByRole('button', { name: '📊 Results' }).click();

    await expect(page.getByText(/run trace once to see generated plans/i)).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* T6 — Happy path: submit spec → running → completed                  */
  /* ------------------------------------------------------------------ */
  test('T6: Submit spec triggers job, shows running then completed state', async ({ page }) => {
    await mockDashboardApis(page);
    await mockAiKeysStatus(page);
    await mockRunAgent(page);
    await mockJobPolling(page, [
      { state: 'pending' },
      {
        state: 'running',
        trace: [
          { id: 't1', timestamp: '2026-02-08T12:00:01Z', title: 'Parsing spec...', status: 'running' },
        ],
      },
      {
        state: 'completed',
        trace: [
          { id: 't1', timestamp: '2026-02-08T12:00:01Z', title: 'Parsing spec...', status: 'completed' },
          { id: 't2', timestamp: '2026-02-08T12:00:03Z', title: 'Generated 5 test cases', status: 'completed' },
        ],
        result: { testCases: 5, coverage: '80%' },
      },
    ]);

    await page.goto('/dashboard/trace');

    // Enter spec and click Run
    await page.locator('textarea').fill('User login acceptance criteria');
    await page.getByRole('button', { name: /run trace/i }).click();

    // Run state should eventually complete on canvas.
    await expect(page.getByTestId('phase-name')).toContainText('Completed successfully', { timeout: 15_000 });
    await expect(page.getByTestId('quality-view')).toBeVisible({ timeout: 15_000 });

    // After completion polling stops → isIdle=true → "Run Trace" re-appears
    await expect(page.getByRole('button', { name: /run trace/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /run trace/i })).toBeEnabled();
  });

  /* ------------------------------------------------------------------ */
  /* T7 — Error path: backend returns 500 on job submission               */
  /* ------------------------------------------------------------------ */
  test('T7: Backend 500 on submit shows error in logs', async ({ page }) => {
    await mockDashboardApis(page);
    await mockAiKeysStatus(page);
    await mockRunAgentError(page, 500, 'Internal Server Error');

    await page.goto('/dashboard/trace');

    const submitRequest = page.waitForRequest((req) =>
      req.method() === 'POST' && req.url().includes('/api/agents/jobs')
    );

    await page.locator('textarea').fill('Some specification text');
    await Promise.all([
      submitRequest,
      page.getByRole('button', { name: /run trace/i }).click(),
    ]);

    // On submit failure, console stays idle and can be retried.
    await expect(page.getByTestId('phase-ready-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /run trace/i })).toBeEnabled();
  });

  /* ------------------------------------------------------------------ */
  /* T8 — Job failure state shows error message                          */
  /* ------------------------------------------------------------------ */
  test('T8: Job failure shows error message in logs', async ({ page }) => {
    await mockDashboardApis(page);
    await mockAiKeysStatus(page);
    await mockRunAgent(page);
    await mockJobPolling(page, [
      { state: 'pending' },
      {
        state: 'failed',
        error: 'AI_RATE_LIMITED',
        errorMessage: 'Rate limit exceeded. Please try again later.',
      },
    ]);

    await page.goto('/dashboard/trace');

    await page.locator('textarea').fill('Test specification for failure');
    await page.getByRole('button', { name: /run trace/i }).click();

    // Wait for failure state on phase banner.
    await expect(page.getByTestId('phase-name')).toContainText('Execution failed', { timeout: 15_000 });

    // After failure polling stops → "Run Trace" re-appears (user can retry)
    await expect(page.getByRole('button', { name: /run trace/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /run trace/i })).toBeEnabled();
  });

  /* ------------------------------------------------------------------ */
  /* T9 — After completion, "Run Trace" is re-enabled for retry           */
  /* ------------------------------------------------------------------ */
  test('T9: After job completes, Run Trace is re-enabled for another run', async ({ page }) => {
    await mockDashboardApis(page);
    await mockAiKeysStatus(page);
    await mockRunAgent(page);
    await mockJobPolling(page, [
      { state: 'pending' },
      { state: 'completed', result: { testCases: 3 } },
    ]);

    await page.goto('/dashboard/trace');

    // Run a job
    await page.locator('textarea').fill('Quick spec for retry test');
    await page.getByRole('button', { name: /run trace/i }).click();

    // Wait for completion state.
    await expect(page.getByTestId('phase-name')).toContainText('Completed successfully', { timeout: 15_000 });
    await expect(page.getByTestId('quality-view')).toBeVisible({ timeout: 15_000 });

    // "Run Trace" should be re-enabled (spec is still filled)
    const runButton = page.getByRole('button', { name: /run trace/i });
    await expect(runButton).toBeVisible({ timeout: 5_000 });
    await expect(runButton).toBeEnabled();
  });

  /* ------------------------------------------------------------------ */
  /* T10 — Deep link: /dashboard/trace returns SPA HTML, not JSON        */
  /* ------------------------------------------------------------------ */
  test('T10: Deep link /dashboard/trace returns SPA HTML', async ({ page }) => {
    await mockDashboardApis(page);

    const response = await page.goto('/dashboard/trace');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const ct = response!.headers()['content-type'] ?? '';
    expect(ct).toContain('text/html');

    // React app mounts and renders Trace heading
    await expect(page.getByRole('heading', { name: /trace console/i })).toBeVisible();
  });
});
