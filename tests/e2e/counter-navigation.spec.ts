import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Sayaç Sayfası - Navigasyon ve Yükleme', () => {
  test('uygulama kök URL üzerinden yüklenmelidir', async ({ page }) => {
    const counterPage = new CounterPage(page);
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await counterPage.waitForVisible(counterPage.counterDisplay);
  });

  test('sayfa yenilendikten sonra sayaç sıfırlanmalıdır', async ({ page }) => {
    const counterPage = new CounterPage(page);
    await counterPage.navigate('/');
    await counterPage.clickIncrementTimes(5);
    expect(await counterPage.getCounterValue()).toBe(5);

    await page.reload();
    await counterPage.waitForVisible(counterPage.counterDisplay);
    expect(await counterPage.getCounterValue()).toBe(0);
  });

  test('sayfa başlığı doğru olmalıdır', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });
});
