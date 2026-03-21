import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Counter – Page Navigation and Accessibility', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.navigate('/');
  });

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('increment button has accessible aria-label', async () => {
    const label = await counterPage.incrementButton.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });

  test('decrement button has accessible aria-label', async () => {
    const label = await counterPage.decrementButton.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });

  test('reset button has accessible aria-label', async () => {
    const label = await counterPage.resetButton.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });

  test('counter card is visible in viewport', async () => {
    const card = counterPage.page.locator('.counter-card');
    await expect(card).toBeVisible();
  });

  test('increment and decrement sequence produces correct result', async () => {
    await counterPage.clickIncrement();
    await counterPage.clickIncrement();
    await counterPage.clickDecrement();
    const value = await counterPage.getCounterNumericValue();
    expect(value).toBe(1);
  });
});
