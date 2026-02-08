/**
 * Settings — AI Provider Keys E2E (mocked backend)
 *
 * Verifies the AI keys settings page renders, handles save success/failure,
 * and displays structured encryption errors correctly.
 *
 * Run: npx playwright test settings-ai-keys
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import {
  mockDashboardApis,
  mockAiKeysStatus,
} from './helpers/mock-dashboard-apis';

/* ---------- helpers ---------- */

/**
 * Navigate to /dashboard/settings/ai-keys with all necessary mocks in place.
 */
async function gotoAiKeysPage(page: Page) {
  await mockDashboardApis(page);
  await mockAiKeysStatus(page);
  await page.goto('/dashboard/settings/ai-keys');
  await expect(page.getByRole('heading', { name: 'AI Provider Keys' })).toBeVisible({ timeout: 15_000 });
}

/**
 * Mock PUT /api/settings/ai-keys with a success response.
 */
async function mockSaveKeySuccess(page: Page) {
  await page.route('**/api/settings/ai-keys', async (route: Route) => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          provider: body?.provider || 'openai',
          configured: true,
          last4: '4321',
          updatedAt: '2026-02-09T00:00:00Z',
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock PUT /api/settings/ai-keys with a 503 ENCRYPTION_NOT_CONFIGURED error.
 */
async function mockSaveKeyEncryptionError(page: Page) {
  await page.route('**/api/settings/ai-keys', async (route: Route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'ENCRYPTION_NOT_CONFIGURED',
            message: 'Server encryption is not properly configured. Contact administrator.',
            hint: 'Set AI_KEY_ENCRYPTION_KEY in the server environment.',
          },
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock GET /api/settings/ai-keys/status to return an encryption error (503).
 */
async function mockStatusEncryptionError(page: Page) {
  await page.route('**/api/settings/ai-keys/status', async (route: Route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'ENCRYPTION_NOT_CONFIGURED',
          message: 'Server encryption is not properly configured. Contact administrator.',
        },
      }),
    });
  });
}

/* ---------- tests ---------- */

test.describe('AI Provider Keys Settings', () => {

  test('AK1: page renders with title and provider cards', async ({ page }) => {
    await gotoAiKeysPage(page);

    // Title
    await expect(page.getByRole('heading', { name: 'AI Provider Keys' })).toBeVisible();

    // Provider cards (use heading role to avoid strict mode violations)
    await expect(page.getByRole('heading', { name: /OpenAI/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /OpenRouter/ })).toBeVisible();

    // Security notice
    await expect(page.getByText('Secure Key Storage')).toBeVisible();
  });

  test('AK2: configured provider shows status indicators', async ({ page }) => {
    await gotoAiKeysPage(page);

    // OpenAI is mocked as configured with last4='1234'
    await expect(page.getByText('Configured').first()).toBeVisible();
    await expect(page.getByText('1234')).toBeVisible();
  });

  test('AK3: save key success path (mocked)', async ({ page }) => {
    await gotoAiKeysPage(page);
    await mockSaveKeySuccess(page);

    // Find the OpenAI card's input and fill it
    const openaiInput = page.locator('input[placeholder="sk-..."]');
    await openaiInput.fill('sk-test-valid-key-1234567890abcdef');

    // Click Save in the OpenAI card
    const saveButtons = page.getByRole('button', { name: 'Save' });
    await saveButtons.first().click();

    // Verify success message appears
    await expect(page.getByText('API key saved successfully!')).toBeVisible({ timeout: 5_000 });
  });

  test('AK4: save key with encryption error shows structured error', async ({ page }) => {
    await gotoAiKeysPage(page);
    await mockSaveKeyEncryptionError(page);

    // Fill and attempt to save
    const openaiInput = page.locator('input[placeholder="sk-..."]');
    await openaiInput.fill('sk-test-valid-key-1234567890abcdef');

    const saveButtons = page.getByRole('button', { name: 'Save' });
    await saveButtons.first().click();

    // HttpClient retries 5xx up to 3 times (1s+2s+4s=7s). Allow enough time.
    await expect(
      page.getByText('Server encryption is not configured')
    ).toBeVisible({ timeout: 15_000 });
  });

  test('AK5: status fetch failure with encryption error shows page-level error', async ({ page }) => {
    await mockDashboardApis(page);
    // Override ai-keys status to return encryption error
    await mockStatusEncryptionError(page);

    await page.goto('/dashboard/settings/ai-keys');
    await expect(page.getByRole('heading', { name: 'AI Provider Keys' })).toBeVisible({ timeout: 15_000 });

    // Should show the encryption error at page level
    await expect(
      page.getByText('Server encryption is not configured')
    ).toBeVisible({ timeout: 5_000 });
  });

  test('AK6: save button is disabled when input is empty', async ({ page }) => {
    await gotoAiKeysPage(page);

    // Without typing anything, the Save buttons should be disabled
    const saveButtons = page.getByRole('button', { name: 'Save' });
    const first = saveButtons.first();
    await expect(first).toBeDisabled();
  });

  test('AK7: save request sends correct payload shape', async ({ page }) => {
    await gotoAiKeysPage(page);

    // Intercept PUT and capture request body
    let capturedBody: Record<string, unknown> | null = null;
    await page.route('**/api/settings/ai-keys', async (route: Route) => {
      if (route.request().method() === 'PUT') {
        capturedBody = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            provider: 'openai',
            configured: true,
            last4: 'cdef',
            updatedAt: '2026-02-09T00:00:00Z',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Fill OpenAI key and save
    const openaiInput = page.locator('input[placeholder="sk-..."]');
    await openaiInput.fill('sk-test-valid-key-1234567890abcdef');
    await page.getByRole('button', { name: 'Save' }).first().click();

    // Wait for the request to complete
    await expect(page.getByText('API key saved successfully!')).toBeVisible({ timeout: 5_000 });

    // Verify payload
    expect(capturedBody).toBeTruthy();
    expect(capturedBody!.provider).toBe('openai');
    expect(capturedBody!.apiKey).toBe('sk-test-valid-key-1234567890abcdef');
  });

  test('AK8: client-side validation rejects non-sk- prefix for OpenAI', async ({ page }) => {
    await gotoAiKeysPage(page);

    const openaiInput = page.locator('input[placeholder="sk-..."]');
    await openaiInput.fill('invalid-prefix-key-12345678901234');

    await page.getByRole('button', { name: 'Save' }).first().click();

    // Should show client-side validation error
    await expect(
      page.getByText('OpenAI keys should start with sk-')
    ).toBeVisible({ timeout: 3_000 });
  });
});
