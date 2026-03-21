import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Counter – Negative Values (ac-4)', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.navigate('/');
  });

  test('ac-4: decrement from 0 results in -1', async () => {
    await counterPage.clickDecrement();
    const value = await counterPage.getCounterNumericValue();
    expect(value).toBe(-1);
  });

  test('ac-4: negative value is displayed on screen', async () => {
    await counterPage.clickDecrement();
    await expect(counterPage.counterValue).toBeVisible();
    const text = await counterPage.getCounterValue();
    expect(text).toContain('-1');
  });

  test('ac-4: counter value has negative CSS class when below zero', async () => {
    await counterPage.clickDecrement();
    const isNegative = await counterPage.isNegative();
    expect(isNegative).toBe(true);
  });

  test('ac-4: multiple decrements from 0 produce correct negative values', async () => {
    await counterPage.clickDecrement();
    await counterPage.clickDecrement();
    await counterPage.clickDecrement();
    const value = await counterPage.getCounterNumericValue();
    expect(value).toBe(-3);
  });

  test('ac-4: counter is not positive when negative', async () => {
    await counterPage.clickDecrement();
    const isPositive = await counterPage.isPositive();
    expect(isPositive).toBe(false);
  });
});
