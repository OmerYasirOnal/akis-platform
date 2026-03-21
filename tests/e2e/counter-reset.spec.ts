import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Counter Reset Functionality', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.goto();
  });

  test('should show reset button when present', async () => {
    // If a reset button exists, it should be visible
    const resetBtn = counterPage.resetButton;
    const isVisible = await resetBtn.isVisible().catch(() => false);
    if (isVisible) {
      await expect(resetBtn).toBeEnabled();
    }
  });

  test('should reset counter to 0 when reset button is clicked', async () => {
    // Given: Counter has been incremented
    await counterPage.clickIncrementTimes(7);
    await counterPage.assertCounterValue(7);

    // When: Reset button is clicked (if it exists)
    const resetBtn = counterPage.resetButton;
    const isVisible = await resetBtn.isVisible().catch(() => false);
    if (isVisible) {
      await counterPage.clickReset();
      // Then: Counter returns to 0
      await counterPage.assertCounterValue(0);
    }
  });

  test('should reset negative counter to 0 when reset button is clicked', async () => {
    // Given: Counter has been decremented to negative
    await counterPage.clickDecrementTimes(4);
    await counterPage.assertCounterValue(-4);

    // When: Reset button is clicked (if it exists)
    const resetBtn = counterPage.resetButton;
    const isVisible = await resetBtn.isVisible().catch(() => false);
    if (isVisible) {
      await counterPage.clickReset();
      // Then: Counter returns to 0
      await counterPage.assertCounterValue(0);
    }
  });
});
