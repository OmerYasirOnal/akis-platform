/**
 * Landing Page Sanity E2E Tests
 *
 * Verifies that all landing page sections render correctly and
 * the TR/EN locale toggle swaps visible strings.
 *
 * Run: pnpm -C frontend exec playwright test landing-sanity
 */
import { test, expect, type Page } from '@playwright/test';

const CONSOLE_ALLOW_PATTERNS = [
  /\/auth\/me.*401/,
  /\/api\/.*401/,
  /Failed to load resource/,
];

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const allowed = CONSOLE_ALLOW_PATTERNS.some((p) => p.test(text));
      if (!allowed) errors.push(text);
    }
  });
  return errors;
}

test.describe('Landing Page Sanity', () => {
  test('all key sections render', async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto('/', { waitUntil: 'networkidle' });

    // Hero section
    await expect(page.getByText('The New Center for Software Development')).toBeVisible({
      timeout: 10_000,
    });

    // Stats section
    await expect(page.getByText('Trusted by Growing Teams')).toBeVisible();

    // Features section
    await expect(page.getByText('Everything You Need to Automate')).toBeVisible();

    // FAQ section
    await expect(page.getByText('Frequently Asked Questions')).toBeVisible();

    // Screenshot for verification
    await page.screenshot({
      path: 'test-results/screenshots/landing-sections.png',
      fullPage: true,
    });

    expect(errors, 'Unexpected console errors detected').toEqual([]);
  });

  test('TR/EN locale toggle swaps text', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify initial EN state
    await expect(page.getByText('The New Center for Software Development')).toBeVisible({
      timeout: 10_000,
    });

    // Click TR button
    const trButton = page.getByRole('button', { name: 'Switch to Turkish' });
    await trButton.click();

    // Wait for TR strings to appear (check at least 3 key translations)
    await expect(page.getByText('Yazılım Geliştirmenin Yeni Merkezi')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText('Otomasyona İhtiyacınız Olan Her Şey')).toBeVisible();
    await expect(page.getByText('Sıkça Sorulan Sorular')).toBeVisible();

    // Screenshot TR state
    await page.screenshot({
      path: 'test-results/screenshots/landing-tr.png',
      fullPage: true,
    });

    // Switch back to EN
    const enButton = page.getByRole('button', { name: 'Switch to English' });
    await enButton.click();

    await expect(page.getByText('The New Center for Software Development')).toBeVisible({
      timeout: 5_000,
    });

    // Screenshot EN restored
    await page.screenshot({
      path: 'test-results/screenshots/landing-en-restored.png',
      fullPage: true,
    });
  });
});
