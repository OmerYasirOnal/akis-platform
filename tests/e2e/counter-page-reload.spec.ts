import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Counter – Page Reload Resets State (ac-5)', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.navigate('/');
  });

  test('ac-5: counter resets to 0 after page reload from positive value', async () => {
    await counterPage.clickIncrement();
    await counterPage.clickIncrement();
    await counterPage.clickIncrement();
    const before = await counterPage.getCounterNumericValue();
    expect(before).toBe(3);

    await counterPage.page.reload();
    await counterPage.page.waitForLoadState('domcontentloaded');

    const after = await counterPage.getCounterNumericValue();
    expect(after).toBe(0);
  });

  test('ac-5: counter resets to 0 after page reload from negative value', async () => {
    await counterPage.clickDecrement();
    await counterPage.clickDecrement();
    const before = await counterPage.getCounterNumericValue();
    expect(before).toBe(-2);

    await counterPage.page.reload();
    await counterPage.page.waitForLoadState('domcontentloaded');

    const after = await counterPage.getCounterNumericValue();
    expect(after).toBe(0);
  });

  test('ac-5: counter value has zero CSS class after reload', async () => {
    await counterPage.clickIncrement();
    await counterPage.page.reload();
    await counterPage.page.waitForLoadState('domcontentloaded');
    const isZero = await counterPage.isZero();
    expect(isZero).toBe(true);
  });
});
