import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Counter Application', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.navigate('/');
  });

  test.describe('Initial State (ac-1)', () => {
    test('should display counter value of 0 on initial load', async () => {
      await counterPage.waitForVisible(counterPage.counterDisplay);
      const value = await counterPage.getCounterValue();
      expect(value).toBe(0);
    });

    test('should display the application title', async () => {
      await counterPage.waitForVisible(counterPage.appTitle);
      const title = await counterPage.getTextContent(counterPage.appTitle);
      expect(title.trim()).toBeTruthy();
    });
  });

  test.describe('Increment Functionality (ac-2)', () => {
    test('should increment counter by 1 when increment button is clicked', async () => {
      const initialValue = await counterPage.getCounterValue();
      await counterPage.clickIncrement();
      const newValue = await counterPage.getCounterValue();
      expect(newValue).toBe(initialValue + 1);
    });

    test('should increment counter to 1 from initial state of 0', async () => {
      await counterPage.clickIncrement();
      const value = await counterPage.getCounterValue();
      expect(value).toBe(1);
    });

    test('should increment counter multiple times correctly', async () => {
      await counterPage.clickIncrementTimes(5);
      const value = await counterPage.getCounterValue();
      expect(value).toBe(5);
    });

    test('should increment counter to large positive values', async () => {
      await counterPage.clickIncrementTimes(10);
      const value = await counterPage.getCounterValue();
      expect(value).toBe(10);
    });
  });

  test.describe('Decrement Functionality (ac-3)', () => {
    test('should decrement counter by 1 when decrement button is clicked', async () => {
      await counterPage.clickIncrement();
      const valueAfterIncrement = await counterPage.getCounterValue();
      await counterPage.clickDecrement();
      const newValue = await counterPage.getCounterValue();
      expect(newValue).toBe(valueAfterIncrement - 1);
    });

    test('should decrement counter below zero', async () => {
      await counterPage.clickDecrement();
      const value = await counterPage.getCounterValue();
      expect(value).toBe(-1);
    });

    test('should decrement counter multiple times correctly', async () => {
      await counterPage.clickDecrementTimes(3);
      const value = await counterPage.getCounterValue();
      expect(value).toBe(-3);
    });

    test('should decrement counter from a positive value back to zero', async () => {
      await counterPage.clickIncrementTimes(3);
      await counterPage.clickDecrementTimes(3);
      const value = await counterPage.getCounterValue();
      expect(value).toBe(0);
    });
  });

  test.describe('UI Elements Visibility (ac-4)', () => {
    test('should display counter value, increment button, and decrement button simultaneously', async () => {
      await expect(counterPage.counterDisplay).toBeVisible();
      await expect(counterPage.incrementButton).toBeVisible();
      await expect(counterPage.decrementButton).toBeVisible();
    });

    test('should have increment button with accessible label', async () => {
      const ariaLabel = await counterPage.incrementButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('should have decrement button with accessible label', async () => {
      const ariaLabel = await counterPage.decrementButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('should display counter card container', async () => {
      const card = counterPage.page.locator('.counter-card');
      await expect(card).toBeVisible();
    });
  });

  test.describe('Combined Increment and Decrement Operations', () => {
    test('should correctly reflect counter after mixed increment and decrement operations', async () => {
      await counterPage.clickIncrementTimes(5);
      await counterPage.clickDecrementTimes(2);
      const value = await counterPage.getCounterValue();
      expect(value).toBe(3);
    });

    test('should return to zero after equal increments and decrements', async () => {
      await counterPage.clickIncrementTimes(7);
      await counterPage.clickDecrementTimes(7);
      const value = await counterPage.getCounterValue();
      expect(value).toBe(0);
    });
  });

  test.describe('Page Load and Navigation', () => {
    test('should load the page successfully with status 200', async ({ page }) => {
      const response = await page.goto('/');
      expect(response?.status()).toBe(200);
    });

    test('should have correct page title or heading', async () => {
      const title = await counterPage.page.title();
      expect(title).toBeTruthy();
    });

    test('should maintain counter state during the same session', async () => {
      await counterPage.clickIncrementTimes(3);
      const valueBefore = await counterPage.getCounterValue();
      // Simulate some interaction without navigation
      await counterPage.clickIncrement();
      const valueAfter = await counterPage.getCounterValue();
      expect(valueAfter).toBe(valueBefore + 1);
    });
  });
});
