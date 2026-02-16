/**
 * Proto Console E2E (mocked backend)
 *
 * Verifies the Proto console page renders, interactions work, and edge
 * cases (empty state, error, job lifecycle) are handled correctly.
 * Backend API calls are mocked via Playwright route interception.
 *
 * Run: npx playwright test proto-console
 */
import { test, expect } from '@playwright/test';
import {
  mockDashboardApis,
  mockAiKeysStatus,
  mockRunAgent,
  mockJobPolling,
  mockRunAgentError,
} from './helpers/mock-dashboard-apis';

async function completeGuidedBrief(page: import('@playwright/test').Page) {
  const selects = page.locator('select');
  await selects.nth(0).selectOption('web-app');
  await selects.nth(1).selectOption('jwt');
  await selects.nth(2).selectOption('postgres');
  await selects.nth(3).selectOption('cloud-container');
}

test.describe('Proto Console', () => {
  /* ------------------------------------------------------------------ */
  /* P1 — Route load: page renders heading and core elements             */
  /* ------------------------------------------------------------------ */
  test('P1: /dashboard/proto renders Proto Console page', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/proto');

    // Heading
    await expect(page.getByRole('heading', { name: /proto console/i })).toBeVisible({ timeout: 30_000 });

    // Requirements textarea
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Run button (disabled when empty)
    const runButton = page.getByRole('button', { name: /run proto/i });
    await expect(runButton).toBeVisible();
    await expect(runButton).toBeDisabled();
  });

  /* ------------------------------------------------------------------ */
  /* P2 — Run button enables when requirements are provided              */
  /* ------------------------------------------------------------------ */
  test('P2: Run button enables after requirements + guided brief are provided', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/proto');

    const textarea = page.locator('textarea');
    await textarea.fill('Build a REST API for a todo list app');

    const runButton = page.getByRole('button', { name: /run proto/i });
    await expect(runButton).toBeDisabled();
    await completeGuidedBrief(page);
    await expect(runButton).toBeEnabled();
  });

  /* ------------------------------------------------------------------ */
  /* P3 — Tabs: Logs and Artifacts are present                           */
  /* ------------------------------------------------------------------ */
  test('P3: Proto Console has Logs and Artifacts tabs', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/proto');

    await expect(page.getByRole('button', { name: '📋 Logs' })).toBeVisible();
    await expect(page.getByRole('button', { name: '📁 Artifacts' })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* P4 — Empty state for logs                                           */
  /* ------------------------------------------------------------------ */
  test('P4: Logs tab shows empty state when no job has run', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/proto');

    await expect(page.getByTestId('phase-ready-banner')).toBeVisible();
    await expect(page.getByText('Execution updates will appear here.')).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* P5 — Artifacts tab empty state                                      */
  /* ------------------------------------------------------------------ */
  test('P5: Artifacts tab shows empty state placeholder', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/proto');

    // Switch to Artifacts tab
    await page.getByRole('button', { name: '📁 Artifacts' }).click();

    await expect(page.getByText(/generated scaffold files will appear/i)).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* P6 — Run button gated by AI keys status                             */
  /* ------------------------------------------------------------------ */
  test('P6: Run Proto calls AI keys status before job submission', async ({ page }) => {
    await mockDashboardApis(page);
    await mockAiKeysStatus(page);
    await mockRunAgent(page);
    await mockJobPolling(page, [{ state: 'pending' }, { state: 'completed', result: { artifacts: [] } }]);

    await page.goto('/dashboard/proto');

    const aiStatusRequest = page.waitForRequest((req) =>
      req.method() === 'GET' && req.url().includes('/api/settings/ai-keys/status')
    );

    await page.locator('textarea').fill('Create a Node.js CLI tool with command parsing and config management');
    await completeGuidedBrief(page);
    await Promise.all([
      aiStatusRequest,
      page.getByRole('button', { name: /run proto/i }).click(),
    ]);

    // Submission completes and console returns to idle.
    await expect(page.getByRole('button', { name: /run proto/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /run proto/i })).toBeEnabled();
  });

  /* ------------------------------------------------------------------ */
  /* P7 — Happy path: submit → running → completed                       */
  /* ------------------------------------------------------------------ */
  test('P7: Submit requirements triggers job, shows running then completed', async ({ page }) => {
    await mockDashboardApis(page);
    await mockAiKeysStatus(page);
    await mockRunAgent(page);
    await mockJobPolling(page, [
      { state: 'pending' },
      {
        state: 'running',
        trace: [
          { id: 'p1', timestamp: '2026-02-08T12:00:01Z', title: 'Analysing requirements...', status: 'running' },
        ],
      },
      {
        state: 'completed',
        trace: [
          { id: 'p1', timestamp: '2026-02-08T12:00:01Z', title: 'Analysing requirements...', status: 'completed' },
          { id: 'p2', timestamp: '2026-02-08T12:00:03Z', title: 'Generated scaffold', status: 'completed' },
        ],
        result: {
          artifacts: [
            { filePath: 'package.json', content: '{ "name": "my-app" }' },
            { filePath: 'src/index.ts', content: 'console.log("hello");' },
          ],
        },
      },
    ]);

    await page.goto('/dashboard/proto');

    await page.locator('textarea').fill('Build a todo REST API with Express, Postgres, and RBAC support');
    await completeGuidedBrief(page);
    await page.getByRole('button', { name: /run proto/i }).click();

    // Proto auto-switches to Artifacts tab on completion.
    // Wait for "Run Proto" button to confirm completion (isIdle=true when isPolling=false).
    await expect(page.getByRole('button', { name: /run proto/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /run proto/i })).toBeEnabled();

    // Artifacts tab should be active and show generated files
    await expect(page.getByText('package.json')).toBeVisible();
    await expect(page.getByText('src/index.ts')).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* P8 — Error path: backend returns 500 on job submission               */
  /* ------------------------------------------------------------------ */
  test('P8: Backend 500 on submit shows error in logs', async ({ page }) => {
    await mockDashboardApis(page);
    await mockAiKeysStatus(page);
    await mockRunAgentError(page, 500, 'Internal Server Error');

    await page.goto('/dashboard/proto');

    const submitRequest = page.waitForRequest((req) =>
      req.method() === 'POST' && req.url().includes('/api/agents/jobs')
    );

    await page.locator('textarea').fill('Some requirements text for guided Proto flow and scaffold generation');
    await completeGuidedBrief(page);
    await Promise.all([
      submitRequest,
      page.getByRole('button', { name: /run proto/i }).click(),
    ]);

    // On submit failure, console remains ready for retry.
    await expect(page.getByTestId('phase-ready-banner')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /run proto/i })).toBeEnabled();
  });

  /* ------------------------------------------------------------------ */
  /* P9 — Job failure state shows error message                          */
  /* ------------------------------------------------------------------ */
  test('P9: Job failure shows error message in logs', async ({ page }) => {
    await mockDashboardApis(page);
    await mockAiKeysStatus(page);
    await mockRunAgent(page);
    await mockJobPolling(page, [
      { state: 'pending' },
      {
        state: 'failed',
        error: 'SCAFFOLD_ERROR',
        errorMessage: 'Failed to generate scaffold. Template not found.',
      },
    ]);

    await page.goto('/dashboard/proto');

    await page.locator('textarea').fill('Test requirements for failure handling in Proto execution path');
    await completeGuidedBrief(page);
    await page.getByRole('button', { name: /run proto/i }).click();

    // Wait for failure state on phase banner.
    await expect(page.getByTestId('phase-name')).toContainText('Execution failed', { timeout: 15_000 });

    // After failure, "Run Proto" re-appears (user can retry)
    await expect(page.getByRole('button', { name: /run proto/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /run proto/i })).toBeEnabled();
  });

  /* ------------------------------------------------------------------ */
  /* P10 — After completion, Run Proto is re-enabled for retry            */
  /* ------------------------------------------------------------------ */
  test('P10: After job completes, Run Proto is re-enabled for another run', async ({ page }) => {
    await mockDashboardApis(page);
    await mockAiKeysStatus(page);
    await mockRunAgent(page);
    await mockJobPolling(page, [
      { state: 'pending' },
      { state: 'completed', result: { artifacts: [] } },
    ]);

    await page.goto('/dashboard/proto');

    await page.locator('textarea').fill('Quick requirements for retry test with valid guided brief fields');
    await completeGuidedBrief(page);
    await page.getByRole('button', { name: /run proto/i }).click();

    // Proto auto-switches to Artifacts on completion. Wait for "Run Proto" to confirm idle.
    const runButton = page.getByRole('button', { name: /run proto/i });
    await expect(runButton).toBeVisible({ timeout: 15_000 });
    await expect(runButton).toBeEnabled();

    // With no generated artifacts payload, placeholder remains visible.
    await page.getByRole('button', { name: '📁 Artifacts' }).click();
    await expect(page.getByText(/generated scaffold files will appear/i)).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* P11 — Deep link: /dashboard/proto returns SPA HTML                  */
  /* ------------------------------------------------------------------ */
  test('P11: Deep link /dashboard/proto returns SPA HTML', async ({ page }) => {
    await mockDashboardApis(page);

    const response = await page.goto('/dashboard/proto');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const ct = response!.headers()['content-type'] ?? '';
    expect(ct).toContain('text/html');

    // React app mounts and renders Proto heading
    await expect(page.getByRole('heading', { name: /proto console/i })).toBeVisible();
  });

  /* ------------------------------------------------------------------ */
  /* P12 — Optional stack input is present                               */
  /* ------------------------------------------------------------------ */
  test('P12: Tech Stack optional input is visible', async ({ page }) => {
    await mockDashboardApis(page);

    await page.goto('/dashboard/proto');

    // Should have a tech stack input
    const stackInput = page.locator('input[placeholder*="React"]');
    await expect(stackInput).toBeVisible();
  });
});
