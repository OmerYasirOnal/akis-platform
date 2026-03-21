import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Basit Sayaç Uygulaması', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.goto();
  });

  // ── AC-3: Initial state ────────────────────────────────────────────────────

  test('AC-3: should display initial counter value of 0 on load', async () => {
    // Given: The application is first loaded
    // When: No button has been pressed
    // Then: The screen shows 0 as the initial value
    await counterPage.assertCounterValue(0);
  });

  test('should render the counter display element', async () => {
    await expect(counterPage.counterDisplay).toBeVisible();
  });

  test('should render the increment button', async () => {
    await counterPage.assertIncrementButtonVisible();
  });

  test('should render the decrement button', async () => {
    await counterPage.assertDecrementButtonVisible();
  });

  // ── AC-1: Increment ────────────────────────────────────────────────────────

  test('AC-1: should increment counter by 1 when increment button is clicked', async () => {
    // Given: Application is open and counter value is 0
    await counterPage.assertCounterValue(0);

    // When: User clicks the increment button
    await counterPage.clickIncrement();

    // Then: The counter value increases by 1 (0 → 1)
    await counterPage.assertCounterValue(1);
  });

  test('AC-1: should increment counter from a non-zero value', async () => {
    // Given: Counter is at value 5
    await counterPage.clickIncrementTimes(5);
    await counterPage.assertCounterValue(5);

    // When: User clicks increment
    await counterPage.clickIncrement();

    // Then: Counter becomes 6
    await counterPage.assertCounterValue(6);
  });

  // ── AC-2: Decrement ────────────────────────────────────────────────────────

  test('AC-2: should decrement counter by 1 when decrement button is clicked', async () => {
    // Given: Application is open and counter value is 0
    await counterPage.assertCounterValue(0);

    // When: User clicks the decrement button
    await counterPage.clickDecrement();

    // Then: The counter value decreases by 1 (0 → -1)
    await counterPage.assertCounterValue(-1);
  });

  test('AC-2: should decrement counter from a positive value', async () => {
    // Given: Counter is at value 3
    await counterPage.clickIncrementTimes(3);
    await counterPage.assertCounterValue(3);

    // When: User clicks decrement
    await counterPage.clickDecrement();

    // Then: Counter becomes 2
    await counterPage.assertCounterValue(2);
  });

  test('AC-2: should allow counter to go negative', async () => {
    // Given: Counter is at 0
    // When: User clicks decrement 3 times
    await counterPage.clickDecrementTimes(3);

    // Then: Counter shows -3
    await counterPage.assertCounterValue(-3);
  });

  // ── AC-4: Consecutive increments ──────────────────────────────────────────

  test('AC-4: should show values 1, 2, 3 after three consecutive increments', async () => {
    // Given: Application is open
    await counterPage.assertCounterValue(0);

    // When: User clicks increment 3 times
    await counterPage.clickIncrement();
    await counterPage.assertCounterValue(1);

    await counterPage.clickIncrement();
    await counterPage.assertCounterValue(2);

    await counterPage.clickIncrement();
    await counterPage.assertCounterValue(3);
  });

  test('AC-4: should correctly track counter after many increments', async () => {
    // Given: Application is open
    // When: User clicks increment 10 times
    await counterPage.clickIncrementTimes(10);

    // Then: Counter shows 10
    await counterPage.assertCounterValue(10);
  });

  // ── AC-5: Page reload ──────────────────────────────────────────────────────

  test('AC-5: should reset counter to 0 after page reload', async ({ page }) => {
    // Given: Counter has been incremented to some value
    await counterPage.clickIncrementTimes(5);
    await counterPage.assertCounterValue(5);

    // When: User reloads the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Then: Counter returns to initial value of 0
    const freshPage = new CounterPage(page);
    await freshPage.assertCounterValue(0);
  });

  test('AC-5: should reset negative counter to 0 after page reload', async ({ page }) => {
    // Given: Counter has been decremented to a negative value
    await counterPage.clickDecrementTimes(3);
    await counterPage.assertCounterValue(-3);

    // When: User reloads the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Then: Counter returns to 0
    const freshPage = new CounterPage(page);
    await freshPage.assertCounterValue(0);
  });

  // ── Mixed operations ───────────────────────────────────────────────────────

  test('should correctly handle mixed increment and decrement operations', async () => {
    // Given: Application is open
    // When: User increments 5 times then decrements 2 times
    await counterPage.clickIncrementTimes(5);
    await counterPage.clickDecrementTimes(2);

    // Then: Counter shows 3
    await counterPage.assertCounterValue(3);
  });

  test('should return to 0 after equal increments and decrements', async () => {
    // Given: Application is open
    // When: User increments 4 times then decrements 4 times
    await counterPage.clickIncrementTimes(4);
    await counterPage.clickDecrementTimes(4);

    // Then: Counter shows 0
    await counterPage.assertCounterValue(0);
  });
});
