import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Counter – Initial State (ac-1)', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.navigate('/');
  });

  test('ac-1: counter displays 0 on first load', async () => {
    await expect(counterPage.counterValue).toBeVisible();
    const value = await counterPage.getCounterNumericValue();
    expect(value).toBe(0);
  });

  test('ac-1: increment button is visible on load', async () => {
    await expect(counterPage.incrementButton).toBeVisible();
  });

  test('ac-1: decrement button is visible on load', async () => {
    await expect(counterPage.decrementButton).toBeVisible();
  });

  test('ac-1: counter value has zero CSS class on initial load', async () => {
    const isZero = await counterPage.isZero();
    expect(isZero).toBe(true);
  });

  test('ac-1: app title is displayed', async () => {
    await expect(counterPage.appTitle).toBeVisible();
    const title = await counterPage.appTitle.textContent();
    expect(title).toBeTruthy();
  });

  test('ac-1: info text prompts user to start counting', async () => {
    const info = await counterPage.getInfoText();
    expect(info.length).toBeGreaterThan(0);
  });
});
