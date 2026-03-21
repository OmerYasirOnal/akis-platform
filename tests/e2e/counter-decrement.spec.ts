import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Counter – Decrement (ac-3)', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    // Start from a positive value to test decrement
    await counterPage.clickIncrement();
    await counterPage.clickIncrement();
  });

  test('ac-3: clicking decrement decreases counter by 1', async () => {
    const before = await counterPage.getCounterNumericValue();
    await counterPage.clickDecrement();
    const after = await counterPage.getCounterNumericValue();
    expect(after).toBe(before - 1);
  });

  test('ac-3: clicking decrement multiple times accumulates correctly', async () => {
    await counterPage.clickDecrement();
    await counterPage.clickDecrement();
    const value = await counterPage.getCounterNumericValue();
    expect(value).toBe(0);
  });

  test('ac-3: counter display updates immediately after decrement', async () => {
    await counterPage.clickDecrement();
    await expect(counterPage.counterValue).toHaveText('1');
  });
});
