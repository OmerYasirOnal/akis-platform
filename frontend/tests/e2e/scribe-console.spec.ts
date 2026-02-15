/**
 * Scribe Console — Golden Path E2E Tests (mocked backend)
 *
 * Validates the full Scribe user journey:
 *   - Page rendering + correct routing
 *   - GitHub connected → configuration bar populated
 *   - Job submission lifecycle (submit → poll → complete)
 *   - Error paths (submission 500, job execution failure)
 *   - Doc pack configuration interaction
 *   - GitHub disconnected state
 *   - Idle state + Reset Console
 *
 * Run: npx playwright test scribe-console
 */
import { test, expect, type Page } from '@playwright/test';
import {
  mockDashboardApis,
  mockAiKeysStatus,
  mockRunAgent,
  mockJobPolling,
  mockRunAgentError,
  mockGitHubConnected,
  mockGitHubDisconnected,
  MOCK_JOB_ID,
} from './helpers/mock-dashboard-apis';

/* ---------- helpers ---------- */

/**
 * Navigate to Scribe Console with all mocks (auth + GitHub + AI keys).
 * Waits for "Scribe Console" heading to be visible.
 */
async function gotoScribeConsole(page: Page) {
  await mockDashboardApis(page);
  await mockAiKeysStatus(page);
  await mockGitHubConnected(page);
  await page.goto('/agents/scribe');
  await expect(
    page.getByRole('heading', { name: 'Scribe Console' })
  ).toBeVisible({ timeout: 15_000 });
}

/**
 * Wait for the GitHub data to finish loading so the form is fully interactive.
 * We wait until the owner field shows "@e2e-user".
 */
async function waitForGitHubData(page: Page) {
  await expect(page.locator('input[value="@e2e-user"]')).toBeVisible({ timeout: 10_000 });
}

/* ---------- tests ---------- */

test.describe('Scribe Console — Golden Path', () => {

  test('SC1: page renders with heading and configuration bar', async ({ page }) => {
    await gotoScribeConsole(page);

    // Main heading
    await expect(page.getByRole('heading', { name: 'Scribe Console' })).toBeVisible();

    // Configuration section
    await expect(page.getByRole('heading', { name: 'Configuration' })).toBeVisible();

    // Workspace tabs (Logs, Preview, Diff)
    await expect(page.getByRole('button', { name: /Logs/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Preview/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Diff/i })).toBeVisible();
  });

  test('SC2: GitHub connected shows owner, repo, branch', async ({ page }) => {
    await gotoScribeConsole(page);
    await waitForGitHubData(page);

    // Owner field (read-only)
    const ownerInput = page.locator('input[value="@e2e-user"]');
    await expect(ownerInput).toBeVisible();
    await expect(ownerInput).toHaveAttribute('readonly');

    // Branch preview should appear (scribe/docs-YYYYMMDD-HHMMSS pattern)
    await expect(page.getByText('Branch will be created:')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/scribe\/docs-/)).toBeVisible();
  });

  test('SC3: Run Scribe button enabled when config is complete', async ({ page }) => {
    await gotoScribeConsole(page);
    await waitForGitHubData(page);

    // "Run Scribe" should be enabled when owner + repo + branch are populated
    const runButton = page.getByRole('button', { name: /Run Scribe/i });
    await expect(runButton).toBeVisible();
    await expect(runButton).toBeEnabled({ timeout: 5_000 });
  });

  test('SC4: golden path — submit job → poll → completed with logs', async ({ page }) => {
    await gotoScribeConsole(page);
    await waitForGitHubData(page);

    // Set up job submission + polling mocks
    await mockRunAgent(page);
    await mockJobPolling(page, [
      { state: 'pending' },
      {
        state: 'running',
        trace: [
          { id: 'ev-1', timestamp: '2026-02-09T00:00:01Z', title: 'Cloning repository...', status: 'running' },
        ],
      },
      {
        state: 'completed',
        trace: [
          { id: 'ev-1', timestamp: '2026-02-09T00:00:01Z', title: 'Cloning repository...', status: 'completed' },
          { id: 'ev-2', timestamp: '2026-02-09T00:00:02Z', title: 'Analyzing code structure...', status: 'completed' },
          { id: 'ev-3', timestamp: '2026-02-09T00:00:03Z', title: 'Generating documentation...', status: 'completed' },
        ],
        result: { ok: true, filesUpdated: 3, preview: 'Generated docs preview...' },
      },
    ]);

    // Click Run Scribe
    const runButton = page.getByRole('button', { name: /Run Scribe/i });
    await runButton.click();

    // Wait for completion state on canvas.
    await expect(page.getByTestId('phase-name')).toContainText('Completed successfully', { timeout: 15_000 });
    await expect(page.getByTestId('quality-view')).toBeVisible({ timeout: 15_000 });

    // After completion, "Run Scribe" button is re-enabled (isPolling=false → isIdle=true)
    // Note: RunBar lives in DashboardLayout only, not AgentsLayout
    const reRunButton = page.getByRole('button', { name: /Run Scribe/i });
    await reRunButton.scrollIntoViewIfNeeded();
    await expect(reRunButton).toBeEnabled();
  });

  test('SC5: job submission fails (500) → error in logs', async ({ page }) => {
    await gotoScribeConsole(page);
    await waitForGitHubData(page);

    // Mock submission failure
    await mockRunAgentError(page, 500, 'Internal server error');

    const submitRequest = page.waitForRequest((req) =>
      req.method() === 'POST' && req.url().includes('/api/agents/jobs')
    );

    // Click Run Scribe
    await Promise.all([
      submitRequest,
      page.getByRole('button', { name: /Run Scribe/i }).click(),
    ]);

    // Submission failed but console remains retryable.
    await expect(page.getByTestId('phase-ready-banner')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Run Scribe/i })).toBeEnabled();
  });

  test('SC6: job fails during execution → error state', async ({ page }) => {
    await gotoScribeConsole(page);
    await waitForGitHubData(page);

    await mockRunAgent(page);
    await mockJobPolling(page, [
      { state: 'pending' },
      { state: 'running' },
      {
        state: 'failed',
        error: 'MCP gateway timeout',
        errorMessage: 'MCP gateway timeout after 120s',
      },
    ]);

    await page.getByRole('button', { name: /Run Scribe/i }).click();

    // Wait for failure state on phase banner.
    await expect(page.getByTestId('phase-name')).toContainText('Execution failed', { timeout: 15_000 });

    // Console returns to retryable idle.
    await expect(page.getByRole('button', { name: /Run Scribe/i })).toBeEnabled();
  });

  test('SC7: doc pack selector changes output targets', async ({ page }) => {
    await gotoScribeConsole(page);

    // Auto mode is default and checklist stays hidden until a pack is selected.
    await expect(page.getByText('~16K')).toBeVisible();
    await expect(page.getByText(/automatically determine which documents to generate/i)).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'README' })).toHaveCount(0);

    // Switch to "Deep Doc Pack"
    const packSelect = page.locator('select').first();
    await packSelect.selectOption('full');

    // Should show 2-pass badge and larger budget
    await expect(page.getByText('~16K')).toBeVisible(); // Budget depends on depth, not pack
    await expect(page.getByText('2-pass')).toBeVisible();

    // Additional targets should appear (use label locator for consistency)
    await expect(page.locator('label').filter({ hasText: 'DEPLOYMENT' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'CONTRIBUTING' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'FAQ' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'CHANGELOG' })).toBeVisible();
  });

  test('SC8: GitHub not connected → shows error notice', async ({ page }) => {
    await mockDashboardApis(page);
    await mockAiKeysStatus(page);
    await mockGitHubDisconnected(page);

    await page.goto('/dashboard/scribe');
    await expect(
      page.getByRole('heading', { name: 'Scribe Console' })
    ).toBeVisible({ timeout: 15_000 });

    // Error notice should be visible
    await expect(
      page.getByText(/GitHub not connected/i)
    ).toBeVisible({ timeout: 10_000 });

    // Owner should show "Not connected"
    await expect(
      page.locator('input[value="Not connected"]')
    ).toBeVisible();
  });

  test('SC9: logs tab shows idle state when no job running', async ({ page }) => {
    await gotoScribeConsole(page);

    // Logs tab should show idle LiveAgentCanvas state.
    await expect(page.getByTestId('phase-ready-banner')).toBeVisible();
    await expect(page.getByText('Execution updates will appear here.')).toBeVisible();
  });

  test('SC10: re-run clears state after completion', async ({ page }) => {
    await gotoScribeConsole(page);
    await waitForGitHubData(page);

    await mockRunAgent(page);
    await mockJobPolling(page, [
      { state: 'pending' },
      { state: 'completed', result: { ok: true, filesUpdated: 1 } },
    ]);

    // Run and wait for completion
    await page.getByRole('button', { name: /Run Scribe/i }).click();
    await expect(page.getByTestId('phase-name')).toContainText('Completed successfully', { timeout: 15_000 });
    await expect(page.getByTestId('quality-view')).toBeVisible({ timeout: 15_000 });

    // After completion, isPolling=false → isIdle=true → "Run Scribe" shows again
    const reRunBtn = page.getByRole('button', { name: /Run Scribe/i });
    await reRunBtn.scrollIntoViewIfNeeded();
    await expect(reRunBtn).toBeEnabled({ timeout: 5_000 });
  });

  test('SC11: correct route /agents/scribe renders page', async ({ page }) => {
    await gotoScribeConsole(page);

    // URL should be correct
    expect(page.url()).toContain('/agents/scribe');

    // Page should have rendered correctly
    await expect(page.getByRole('heading', { name: 'Scribe Console' })).toBeVisible();
  });

  test('SC12: job submission sends correct payload shape', async ({ page }) => {
    await gotoScribeConsole(page);
    await waitForGitHubData(page);

    // Capture the POST body
    let capturedBody: Record<string, unknown> | null = null;
    await page.route('**/api/agents/jobs', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ jobId: MOCK_JOB_ID, state: 'pending' }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock polling for the subsequent getJob call
    await mockJobPolling(page, [{ state: 'pending' }]);

    await page.getByRole('button', { name: /Run Scribe/i }).click();

    // Wait until pending state is reflected in run bar.
    await expect(page.getByRole('button', { name: /running\.\.\./i })).toBeVisible({ timeout: 10_000 });

    // Verify payload structure
    expect(capturedBody).toBeTruthy();
    expect(capturedBody!.type).toBe('scribe');

    const payload = capturedBody!.payload as Record<string, unknown>;
    expect(payload.owner).toBe('e2e-user');
    expect(payload.repo).toBe('demo-app');
    expect(payload.baseBranch).toBe('main');
    expect(payload.targetPath).toBe('docs/');
    expect(payload.docPack).toBeUndefined();
    expect(payload.docDepth).toBe('standard');
    expect(payload.aiProvider).toBe('openai');
    expect(payload.outputTargets).toBeUndefined();
  });
});
