import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

interface SmokeEnv {
  backendUrl: string;
  email: string;
  password: string;
  owner: string;
  repo: string;
  branch: string;
}

interface JobTrace {
  id: string;
  eventType: string;
}

interface JobArtifact {
  id?: string;
  artifactType: string;
}

interface JobDetails {
  state: 'pending' | 'running' | 'completed' | 'failed';
  correlationId?: string | null;
  trace?: JobTrace[];
  artifacts?: JobArtifact[];
  error?: unknown;
}

const smokeEnv: SmokeEnv = {
  backendUrl: process.env.E2E_BACKEND_URL ?? 'http://localhost:3000',
  email: process.env.E2E_EMAIL ?? '',
  password: process.env.E2E_PASSWORD ?? '',
  owner: process.env.E2E_OWNER ?? '',
  repo: process.env.E2E_REPO ?? '',
  branch: process.env.E2E_BRANCH ?? 'main',
};

const missingEnv = Object.entries(smokeEnv)
  .filter(([key, value]) => key !== 'backendUrl' && value.trim() === '')
  .map(([key]) => key);

const bootstrapDisabled = (process.env.SCRIBE_DEV_GITHUB_BOOTSTRAP ?? '').toLowerCase() !== 'true';

test.describe('Scribe dashboard smoke', () => {
  test.skip(
    missingEnv.length > 0,
    `Missing required E2E env vars: ${missingEnv.join(', ')}`
  );

  test.skip(
    bootstrapDisabled,
    'SCRIBE_DEV_GITHUB_BOOTSTRAP must be enabled for the smoke test.'
  );

  test('configures Scribe via wizard and validates job details', async ({ page, request }, testInfo) => {
    await seedTestAccount(request, smokeEnv);

    await loginViaEmailFlow(page, smokeEnv);
    await page.goto('/dashboard/agents/scribe');

    const editConfigButton = page.getByRole('button', { name: /edit config/i });
    if (await editConfigButton.isVisible()) {
      await editConfigButton.click();
    }

    await completeWizardAndRunJob(page, smokeEnv);

    await page.waitForURL('**/dashboard/jobs/*', { timeout: 120_000 });
    const jobId = extractJobId(page.url());
    expect(jobId).toBeTruthy();

    const jobDetails = await waitForJobCompletion(request, smokeEnv, jobId!);

    await page.reload();

    await verifyJobDetailsUI(page, jobDetails);

    await page.screenshot({
      path: testInfo.outputPath('scribe-job.png'),
      fullPage: true,
    });
  });
});

async function seedTestAccount(api: APIRequestContext, env: SmokeEnv) {
  const loginResp = await api.post(`${env.backendUrl}/auth/login`, {
    data: { email: env.email, password: env.password },
  });
  expect(loginResp.ok()).toBeTruthy();

  const bootstrapResp = await api.post(`${env.backendUrl}/test/github/bootstrap`);
  expect(bootstrapResp.ok()).toBeTruthy();

  const configResp = await api.post(`${env.backendUrl}/api/agents/configs/scribe`, {
    data: {
      enabled: true,
      repositoryOwner: env.owner,
      repositoryName: env.repo,
      baseBranch: env.branch,
      targetPlatform: 'github_repo',
      targetConfig: { docs_path: 'docs/' },
      triggerMode: 'manual',
    },
  });
  expect(configResp.ok()).toBeTruthy();
}

async function loginViaEmailFlow(page: Page, env: SmokeEnv) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(env.email);
  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForURL('**/login/password', { timeout: 60_000 });
  await page.getByLabel(/password/i).fill(env.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForLoadState('networkidle');
}

async function completeWizardAndRunJob(page: Page, env: SmokeEnv) {
  await expect(page.getByText('Step 1 of 5')).toBeVisible();
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page.getByText('Step 2 of 5')).toBeVisible();
  const ownerDropdown = page.locator('button').filter({ hasText: env.owner });
  await expect(ownerDropdown).toBeVisible({ timeout: 60_000 });

  const ownerTextInput = page.locator('input[placeholder="Select account or organization..."]');
  await expect(ownerTextInput).toHaveCount(0);

  const repoDropdown = page.locator('button').filter({ hasText: env.repo });
  await expect(repoDropdown).toBeVisible({ timeout: 30_000 });

  const branchDropdown = page.locator('button').filter({ hasText: env.branch });
  await expect(branchDropdown).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page.getByText('Step 3 of 5')).toBeVisible();
  const githubRadio = page.getByLabel('GitHub Repository Docs');
  if (!(await githubRadio.isChecked())) {
    await githubRadio.check();
  }
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page.getByText('Step 4 of 5')).toBeVisible();
  const manualRadio = page.getByLabel('Manual Only');
  if (!(await manualRadio.isChecked())) {
    await manualRadio.check();
  }
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page.getByText('Step 5 of 5')).toBeVisible();
  await expect(page.getByRole('button', { name: /run test job/i })).toBeEnabled();
  await page.getByRole('button', { name: /run test job/i }).click();
}

function extractJobId(url: string): string | null {
  const match = url.match(/jobs\/([0-9a-f-]+)/i);
  return match ? match[1] : null;
}

async function waitForJobCompletion(api: APIRequestContext, env: SmokeEnv, jobId: string): Promise<JobDetails> {
  const deadline = Date.now() + 240_000;
  let lastResponse: JobDetails | null = null;

  while (Date.now() < deadline) {
    const resp = await api.get(
      `${env.backendUrl}/api/agents/jobs/${jobId}?include=trace,artifacts`
    );
    expect(resp.ok()).toBeTruthy();
    lastResponse = await resp.json();

    if (lastResponse.state === 'completed') {
      return lastResponse;
    }

    if (lastResponse.state === 'failed') {
      throw new Error(`Scribe job failed: ${JSON.stringify(lastResponse.error)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Timed out waiting for Scribe job to complete.');
}

async function verifyJobDetailsUI(page: Page, job: JobDetails) {
  // Verify correlation ID is visible
  await expect(page.getByText('Correlation ID:')).toBeVisible();
  if (job.correlationId) {
    await expect(page.locator('code').filter({ hasText: job.correlationId })).toBeVisible();
  }

  // Verify PR Metadata Card is visible for Scribe jobs (Overview tab)
  await page.getByRole('button', { name: 'Overview' }).click();
  await expect(page.getByTestId('pr-metadata-card')).toBeVisible();

  // Timeline Tab - verify step grouping and filters
  await page.getByRole('button', { name: 'Timeline' }).click();
  if ((job.trace?.length ?? 0) > 0) {
    await expect(page.getByTestId('step-timeline')).toBeVisible();
    
    // Verify filter tabs are present
    await expect(page.getByRole('button', { name: /all/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /reasoning/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /tools/i })).toBeVisible();
    
    // Check for at least one reasoning summary (visible as preview or in expanded state)
    const hasReasoning = job.trace?.some(t => t.eventType === 'reasoning' || (t as { reasoningSummary?: string }).reasoningSummary);
    if (hasReasoning) {
      // Click Reasoning filter to show only reasoning events
      await page.getByRole('button', { name: /reasoning/i }).first().click();
      // Should see at least one event with reasoning content
      await expect(page.locator('[data-testid="reasoning-preview"], [data-testid="reasoning-summary"]').first()).toBeVisible({ timeout: 5000 });
    }
    
    // Switch back to All
    await page.getByRole('button', { name: /all/i }).first().click();
  } else {
    await expect(page.getByTestId('timeline-empty')).toBeVisible();
  }

  // Documents Read Tab - verify ArtifactPreview cards
  await page.getByRole('button', { name: 'Documents Read' }).click();
  const docCount = (job.artifacts ?? []).filter((artifact) => artifact.artifactType === 'doc_read').length;
  if (docCount > 0) {
    await expect(page.getByTestId('documents-list')).toBeVisible();
    // Verify at least one artifact card is present
    await expect(page.getByTestId('artifact-card').first()).toBeVisible();
  } else {
    await expect(page.getByTestId('documents-empty')).toBeVisible();
  }

  // Files Produced Tab - verify ArtifactPreview cards with preview capability
  await page.getByRole('button', { name: 'Files Produced' }).click();
  const fileCount = (job.artifacts ?? []).filter((artifact) =>
    ['file_created', 'file_modified'].includes(artifact.artifactType)
  ).length;
  if (fileCount > 0) {
    await expect(page.getByTestId('files-list')).toBeVisible();
    // Verify at least one artifact card is present
    const firstCard = page.getByTestId('artifact-card').first();
    await expect(firstCard).toBeVisible();
    
    // Test preview functionality - click preview button if available
    const previewToggle = firstCard.getByTestId('preview-toggle');
    if (await previewToggle.isVisible()) {
      await previewToggle.click();
      // Verify preview content or diff viewer appears
      await expect(page.locator('[data-testid="diff-viewer"], pre').first()).toBeVisible();
    }
  } else {
    await expect(page.getByTestId('files-empty')).toBeVisible();
  }
}

