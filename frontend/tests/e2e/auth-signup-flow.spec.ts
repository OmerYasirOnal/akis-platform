/**
 * Signup Happy-Path E2E (mocked backend)
 *
 * Walks through the 5-step signup flow:
 *   /signup → /signup/password → /signup/verify-email → /auth/welcome-beta → /auth/privacy-consent
 *
 * All backend API calls are mocked via Playwright route interception so the
 * test runs without a live backend. Each run uses a unique email via timestamp.
 *
 * Run: pnpm -C frontend exec playwright test auth-signup-flow
 */
import { test, expect, type Page, type Route } from '@playwright/test';

const TEST_USER_ID = 'e2e-test-user-' + Date.now();

function uniqueEmail(): string {
  return `e2e+${Date.now()}@test.akis.dev`;
}

/** Set up route mocks for the entire signup flow */
async function mockSignupApi(page: Page, email: string) {
  // POST /auth/signup/start → return userId + email
  await page.route('**/auth/signup/start', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ userId: TEST_USER_ID, email }),
    });
  });

  // POST /auth/signup/password → return success (password step)
  await page.route('**/auth/signup/password', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, message: 'Password set' }),
    });
  });

  // POST /auth/verify-email → success
  await page.route('**/auth/verify-email', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // POST /auth/resend-verification → success
  await page.route('**/auth/resend-verification', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // POST /auth/preferences → success (used by WelcomeBeta + PrivacyConsent)
  await page.route('**/auth/preferences', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // GET /auth/me → user without welcome/consent completed
  await page.route('**/auth/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: TEST_USER_ID,
        email,
        firstName: 'E2E',
        lastName: 'Tester',
        hasSeenBetaWelcome: false,
        dataSharingConsent: null,
        emailVerified: true,
      }),
    });
  });
}

test.describe('Signup happy path', () => {
  test('Step 1: /signup form accepts name + email and navigates to /signup/password', async ({
    page,
  }) => {
    const email = uniqueEmail();
    await mockSignupApi(page, email);

    await page.goto('/signup');

    // Fill the form
    await page.locator('#firstName').fill('E2E');
    await page.locator('#lastName').fill('Tester');
    await page.locator('#email').fill(email);

    // Submit
    await page.locator('form').getByRole('button', { name: /continue|create/i }).click();

    // Should navigate to password step
    await page.waitForURL('**/signup/password', { timeout: 10_000 });
    expect(page.url()).toContain('/signup/password');
  });

  test('Step 2: /signup/password accepts password and navigates to verify-email', async ({
    page,
  }) => {
    const email = uniqueEmail();
    await mockSignupApi(page, email);

    // Pre-seed sessionStorage (normally set by step 1)
    await page.goto('/signup');
    await page.evaluate(
      ([uid, em]) => {
        sessionStorage.setItem(
          'akis_signup_data',
          JSON.stringify({ userId: uid, firstName: 'E2E', lastName: 'Tester', email: em }),
        );
      },
      [TEST_USER_ID, email],
    );

    await page.goto('/signup/password');

    // The password page should show password fields
    const passwordInput = page.locator('#password, input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 5_000 });
    await passwordInput.fill('SecureP@ss123!');

    // Fill confirm password if it exists
    const confirmInput = page.locator('#confirmPassword, input[name="confirmPassword"]').first();
    if (await confirmInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmInput.fill('SecureP@ss123!');
    }

    // Submit
    await page.locator('form').getByRole('button', { name: /create|continue|sign up/i }).click();

    // Should navigate to verify-email
    await page.waitForURL('**/signup/verify-email', { timeout: 10_000 });
    expect(page.url()).toContain('/signup/verify-email');
  });

  test('Step 3: /auth/welcome-beta page renders and Continue button is clickable', async ({
    page,
  }) => {
    const email = uniqueEmail();
    await mockSignupApi(page, email);

    await page.goto('/auth/welcome-beta');

    // Verify page content
    await expect(page.getByRole('heading', { name: /welcome to akis/i })).toBeVisible();
    await expect(page.getByText('🎉')).toBeVisible();

    const continueBtn = page.getByRole('button', { name: /continue to akis dashboard/i });
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toBeEnabled();

    // Click should navigate to /dashboard (API call mocked)
    await continueBtn.click();
    await page.waitForURL('**/dashboard**', { timeout: 10_000 });
  });

  test('Step 4: /auth/privacy-consent page renders and Continue works', async ({
    page,
  }) => {
    const email = uniqueEmail();
    await mockSignupApi(page, email);

    await page.goto('/auth/privacy-consent');

    // Verify page content
    await expect(page.getByRole('heading', { name: /help improve akis/i })).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();

    const continueBtn = page.getByRole('button', { name: /continue to dashboard/i });
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toBeEnabled();

    // Toggle checkbox and submit
    await page.getByRole('checkbox').check();
    await continueBtn.click();

    // Should navigate to welcome-beta or dashboard
    await page.waitForURL(/\/(auth\/welcome-beta|dashboard)/, { timeout: 10_000 });
  });
});
