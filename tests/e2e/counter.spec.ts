import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Counter Application — Initial State', () => {
  test('ac-1: counter displays 0 on initial load', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    const value = await counterPage.getCounterValue();
    expect(value).toBe(0);
  });

  test('counter display has zero CSS class on initial load', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await expect(counterPage.counterDisplay).toHaveClass(/zero/);
  });

  test('page title is visible', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');

    await expect(counterPage.appTitle).toBeVisible();
    await expect(counterPage.appTitle).toContainText('Sayaç');
  });

  test('page subtitle is visible', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');

    await expect(counterPage.appSubtitle).toBeVisible();
  });

  test('footer is visible', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');

    await expect(counterPage.appFooter).toBeVisible();
  });
});

test.describe('Counter Application — Increase Button (ac-2)', () => {
  test('ac-2: clicking increase button increments counter by 1', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    const before = await counterPage.getCounterValue();
    await counterPage.clickIncrease();
    const after = await counterPage.getCounterValue();

    expect(after).toBe(before + 1);
  });

  test('increase button is visible and enabled', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');

    await expect(counterPage.increaseButton).toBeVisible();
    await expect(counterPage.increaseButton).toBeEnabled();
  });

  test('counter display shows positive class after increase', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await counterPage.clickIncrease();

    await expect(counterPage.counterDisplay).toHaveClass(/positive/);
  });

  test('counter value updates in DOM after increase', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await counterPage.clickIncrease();

    await expect(counterPage.counterDisplay).toHaveText('1');
  });
});

test.describe('Counter Application — Decrease Button (ac-3)', () => {
  test('ac-3: clicking decrease button decrements counter by 1', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    const before = await counterPage.getCounterValue();
    await counterPage.clickDecrease();
    const after = await counterPage.getCounterValue();

    expect(after).toBe(before - 1);
  });

  test('decrease button is visible and enabled', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');

    await expect(counterPage.decreaseButton).toBeVisible();
    await expect(counterPage.decreaseButton).toBeEnabled();
  });

  test('counter display shows negative class after decrease from 0', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await counterPage.clickDecrease();

    await expect(counterPage.counterDisplay).toHaveClass(/negative/);
  });

  test('counter value updates in DOM after decrease', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await counterPage.clickDecrease();

    await expect(counterPage.counterDisplay).toHaveText('-1');
  });
});

test.describe('Counter Application — Multiple Clicks (ac-4)', () => {
  test('ac-4: clicking increase 3 times results in counter value 3', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await counterPage.clickIncreaseNTimes(3);

    const value = await counterPage.getCounterValue();
    expect(value).toBe(3);
  });

  test('clicking increase 5 times results in counter value 5', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await counterPage.clickIncreaseNTimes(5);

    const value = await counterPage.getCounterValue();
    expect(value).toBe(5);
  });

  test('clicking decrease 3 times from 0 results in counter value -3', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await counterPage.clickDecreaseNTimes(3);

    const value = await counterPage.getCounterValue();
    expect(value).toBe(-3);
  });

  test('mixed increase and decrease operations', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await counterPage.clickIncreaseNTimes(5);
    await counterPage.clickDecreaseNTimes(2);

    const value = await counterPage.getCounterValue();
    expect(value).toBe(3);
  });
});

test.describe('Counter Application — Reset Button', () => {
  test('reset button is visible and enabled', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');

    await expect(counterPage.resetButton).toBeVisible();
    await expect(counterPage.resetButton).toBeEnabled();
  });

  test('clicking reset after increase returns counter to 0', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await counterPage.clickIncreaseNTimes(5);
    expect(await counterPage.getCounterValue()).toBe(5);

    await counterPage.clickReset();
    expect(await counterPage.getCounterValue()).toBe(0);
  });

  test('clicking reset after decrease returns counter to 0', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await counterPage.clickDecreaseNTimes(3);
    expect(await counterPage.getCounterValue()).toBe(-3);

    await counterPage.clickReset();
    expect(await counterPage.getCounterValue()).toBe(0);
  });

  test('counter display shows zero class after reset', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await counterPage.clickIncreaseNTimes(3);
    await counterPage.clickReset();

    await expect(counterPage.counterDisplay).toHaveClass(/zero/);
  });
});

test.describe('Counter Application — Accessibility', () => {
  test('counter display has aria-live attribute', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    await expect(counterPage.counterDisplay).toHaveAttribute('aria-live', 'polite');
  });

  test('counter display has aria-label attribute', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.waitForVisible(counterPage.counterDisplay);

    const ariaLabel = await counterPage.counterDisplay.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('0');
  });

  test('increase button has accessible name', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');

    await expect(counterPage.increaseButton).toHaveAttribute('aria-label', 'Artır');
  });

  test('decrease button has accessible name', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');

    await expect(counterPage.decreaseButton).toHaveAttribute('aria-label', 'Azalt');
  });

  test('reset button has accessible name', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');

    await expect(counterPage.resetButton).toHaveAttribute('aria-label', 'Sıfırla');
  });
});

test.describe('Counter Application — Page Navigation', () => {
  test('application loads at root path', async ({ page }) => {
    const counterPage = new CounterPage(page);
    const response = await counterPage.navigate('/');

    await expect(counterPage.counterDisplay).toBeVisible();
  });

  test('page does not show error state on load', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');

    const errorElements = page.locator('[class*="error"]');
    await expect(errorElements).toHaveCount(0);
  });
});
