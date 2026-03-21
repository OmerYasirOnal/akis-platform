import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Counter – Increment (ac-2)', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.navigate('/');
  });

  test('ac-2: clicking increment once increases counter from 0 to 1', async () => {
    await counterPage.clickIncrement();
    const value = await counterPage.getCounterNumericValue();
    expect(value).toBe(1);
  });

  test('ac-2: clicking increment multiple times accumulates correctly', async () => {
    await counterPage.clickIncrement();
    await counterPage.clickIncrement();
    await counterPage.clickIncrement();
    const value = await counterPage.getCounterNumericValue();
    expect(value).toBe(3);
  });

  test('ac-2: counter value has positive CSS class after increment', async () => {
    await counterPage.clickIncrement();
    const isPositive = await counterPage.isPositive();
    expect(isPositive).toBe(true);
  });

  test('ac-2: counter display updates immediately after increment', async () => {
    await counterPage.clickIncrement();
    await expect(counterPage.counterValue).toHaveText('1');
  });

  test('ac-2: info text updates after increment', async () => {
    await counterPage.clickIncrement();
    const info = await counterPage.getInfoText();
    expect(info).not.toContain('Saymaya başlamak');
  });
});
