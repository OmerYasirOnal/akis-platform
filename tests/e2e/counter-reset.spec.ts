import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Counter – Reset Button', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.navigate('/');
  });

  test('reset button is visible', async () => {
    await expect(counterPage.resetButton).toBeVisible();
  });

  test('reset button resets counter from positive value to 0', async () => {
    await counterPage.clickIncrement();
    await counterPage.clickIncrement();
    await counterPage.clickReset();
    const value = await counterPage.getCounterNumericValue();
    expect(value).toBe(0);
  });

  test('reset button resets counter from negative value to 0', async () => {
    await counterPage.clickDecrement();
    await counterPage.clickDecrement();
    await counterPage.clickReset();
    const value = await counterPage.getCounterNumericValue();
    expect(value).toBe(0);
  });

  test('counter has zero CSS class after reset', async () => {
    await counterPage.clickIncrement();
    await counterPage.clickReset();
    const isZero = await counterPage.isZero();
    expect(isZero).toBe(true);
  });
});
