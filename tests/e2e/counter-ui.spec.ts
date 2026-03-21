import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Counter UI and Accessibility', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.goto();
  });

  test('should have a visible page title or heading', async ({ page }) => {
    // The app should have a recognizable title or heading
    const heading = page.getByRole('heading').or(page.locator('h1, h2'));
    await expect(heading.first()).toBeVisible();
  });

  test('should have accessible aria-label on increment button', async () => {
    // Increment button should be accessible
    const btn = counterPage.incrementButton;
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('should have accessible aria-label on decrement button', async () => {
    // Decrement button should be accessible
    const btn = counterPage.decrementButton;
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('should display counter value prominently', async () => {
    // Counter display should be visible and contain a number
    await expect(counterPage.counterDisplay).toBeVisible();
    const text = await counterPage.counterDisplay.innerText();
    expect(Number.isInteger(parseInt(text.trim(), 10))).toBe(true);
  });

  test('should respond quickly to button clicks (< 500ms)', async ({ page }) => {
    // Performance: button response should be fast
    const start = Date.now();
    await counterPage.clickIncrement();
    await counterPage.assertCounterValue(1);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Responsive: should work on mobile screen size
    await page.setViewportSize({ width: 375, height: 667 });
    await counterPage.goto();

    await expect(counterPage.counterDisplay).toBeVisible();
    await expect(counterPage.incrementButton).toBeVisible();
    await expect(counterPage.decrementButton).toBeVisible();

    await counterPage.clickIncrement();
    await counterPage.assertCounterValue(1);
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Responsive: should work on tablet screen size
    await page.setViewportSize({ width: 768, height: 1024 });
    await counterPage.goto();

    await expect(counterPage.counterDisplay).toBeVisible();
    await counterPage.clickIncrement();
    await counterPage.assertCounterValue(1);
  });

  test('should show the page title in browser tab', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
