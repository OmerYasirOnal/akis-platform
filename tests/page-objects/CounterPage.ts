import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CounterPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators ──────────────────────────────────────────────────────────────

  get counterDisplay() {
    return this.page.locator('.counter-display');
  }

  get incrementButton() {
    return this.page.getByRole('button', { name: /artır/i }).or(
      this.page.locator('.btn-increment')
    );
  }

  get decrementButton() {
    return this.page.getByRole('button', { name: /azalt/i }).or(
      this.page.locator('.btn-decrement')
    );
  }

  get resetButton() {
    return this.page.getByRole('button', { name: /sıfırla/i }).or(
      this.page.locator('.counter-reset')
    );
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async goto() {
    await this.navigate('/');
  }

  async getCounterValue(): Promise<number> {
    const text = await this.counterDisplay.innerText();
    return parseInt(text.trim(), 10);
  }

  async clickIncrement() {
    await this.incrementButton.click();
  }

  async clickDecrement() {
    await this.decrementButton.click();
  }

  async clickReset() {
    await this.resetButton.click();
  }

  async clickIncrementTimes(n: number) {
    for (let i = 0; i < n; i++) {
      await this.clickIncrement();
    }
  }

  async clickDecrementTimes(n: number) {
    for (let i = 0; i < n; i++) {
      await this.clickDecrement();
    }
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async assertCounterValue(expected: number) {
    await expect(this.counterDisplay).toHaveText(String(expected));
  }

  async assertIncrementButtonVisible() {
    await expect(this.incrementButton).toBeVisible();
  }

  async assertDecrementButtonVisible() {
    await expect(this.decrementButton).toBeVisible();
  }
}
