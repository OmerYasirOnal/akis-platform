import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/CounterPage';

test.describe('Basit Sayaç Uygulaması', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.navigate('/');
  });

  // ── ac-3: Initial state ──────────────────────────────────────────────────

  test('ac-3: sayaç başlangıçta 0 değerini göstermelidir', async () => {
    await counterPage.waitForVisible(counterPage.counterDisplay);
    const value = await counterPage.getCounterValue();
    expect(value).toBe(0);
  });

  test('sayfa başlığı görünür olmalıdır', async () => {
    await counterPage.waitForVisible(counterPage.appTitle);
    const title = await counterPage.appTitle.textContent();
    expect(title).toBeTruthy();
  });

  test('artır ve azalt butonları görünür olmalıdır', async () => {
    await counterPage.waitForVisible(counterPage.incrementButton);
    await counterPage.waitForVisible(counterPage.decrementButton);
    await expect(counterPage.incrementButton).toBeVisible();
    await expect(counterPage.decrementButton).toBeVisible();
  });

  test('sayaç etiketi görünür olmalıdır', async () => {
    await counterPage.waitForVisible(counterPage.counterLabel);
    await expect(counterPage.counterLabel).toBeVisible();
  });

  // ── ac-1: Increment ──────────────────────────────────────────────────────

  test('ac-1: artır butonuna tıklandığında sayaç 1 artmalıdır', async () => {
    const before = await counterPage.getCounterValue();
    await counterPage.clickIncrement();
    const after = await counterPage.getCounterValue();
    expect(after).toBe(before + 1);
  });

  test('ac-1: artır butonuna tıklandığında 0 → 1 olmalıdır', async () => {
    await counterPage.clickIncrement();
    const value = await counterPage.getCounterValue();
    expect(value).toBe(1);
  });

  // ── ac-2: Decrement ──────────────────────────────────────────────────────

  test('ac-2: azalt butonuna tıklandığında sayaç 1 azalmalıdır', async () => {
    const before = await counterPage.getCounterValue();
    await counterPage.clickDecrement();
    const after = await counterPage.getCounterValue();
    expect(after).toBe(before - 1);
  });

  test('ac-2: azalt butonuna tıklandığında 0 → -1 olmalıdır', async () => {
    await counterPage.clickDecrement();
    const value = await counterPage.getCounterValue();
    expect(value).toBe(-1);
  });

  // ── ac-4: Repeated increment ─────────────────────────────────────────────

  test('ac-4: artır butonuna 5 kez tıklandığında sayaç 5 olmalıdır', async () => {
    await counterPage.clickIncrementTimes(5);
    const value = await counterPage.getCounterValue();
    expect(value).toBe(5);
  });

  test('ac-4: her tıklamadan sonra değer sırasıyla 1,2,3,4,5 olmalıdır', async () => {
    for (let expected = 1; expected <= 5; expected++) {
      await counterPage.clickIncrement();
      const value = await counterPage.getCounterValue();
      expect(value).toBe(expected);
    }
  });

  // ── Combined operations ──────────────────────────────────────────────────

  test('artır ve azalt işlemleri birlikte doğru çalışmalıdır', async () => {
    await counterPage.clickIncrementTimes(3);
    expect(await counterPage.getCounterValue()).toBe(3);

    await counterPage.clickDecrementTimes(2);
    expect(await counterPage.getCounterValue()).toBe(1);

    await counterPage.clickDecrement();
    expect(await counterPage.getCounterValue()).toBe(0);
  });

  test('negatif değerlere geçiş doğru çalışmalıdır', async () => {
    await counterPage.clickDecrementTimes(3);
    const value = await counterPage.getCounterValue();
    expect(value).toBe(-3);
  });

  // ── Visual / CSS class checks ────────────────────────────────────────────

  test('pozitif değerde sayaç görsel olarak farklı görünmelidir', async () => {
    await counterPage.clickIncrement();
    const className = await counterPage.counterDisplay.getAttribute('class');
    expect(className).toContain('positive');
  });

  test('negatif değerde sayaç görsel olarak farklı görünmelidir', async () => {
    await counterPage.clickDecrement();
    const className = await counterPage.counterDisplay.getAttribute('class');
    expect(className).toContain('negative');
  });

  test('sıfır değerinde sayaç zero sınıfına sahip olmalıdır', async () => {
    const className = await counterPage.counterDisplay.getAttribute('class');
    expect(className).toContain('zero');
  });

  // ── Accessibility ────────────────────────────────────────────────────────

  test('artır butonunun aria-label niteliği olmalıdır', async () => {
    const ariaLabel = await counterPage.incrementButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('azalt butonunun aria-label niteliği olmalıdır', async () => {
    const ariaLabel = await counterPage.decrementButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });
});
