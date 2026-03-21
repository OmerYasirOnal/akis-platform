import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CounterPage extends BasePage {
  readonly counterValue: Locator;
  readonly incrementButton: Locator;
  readonly decrementButton: Locator;
  readonly resetButton: Locator;
  readonly counterInfo: Locator;
  readonly appTitle: Locator;
  readonly appSubtitle: Locator;

  constructor(page: Page) {
    super(page);
    this.counterValue = page.locator('.counter-value');
    this.incrementButton = page.locator('.btn-increment');
    this.decrementButton = page.locator('.btn-decrement');
    this.resetButton = page.locator('.btn-reset');
    this.counterInfo = page.locator('.counter-info');
    this.appTitle = page.locator('.app-title');
    this.appSubtitle = page.locator('.app-subtitle');
  }

  async getCounterValue(): Promise<string> {
    return (await this.counterValue.textContent()) ?? '';
  }

  async getCounterNumericValue(): Promise<number> {
    const text = await this.getCounterValue();
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

  async getInfoText(): Promise<string> {
    return (await this.counterInfo.textContent()) ?? '';
  }

  async isPositive(): Promise<boolean> {
    return this.counterValue.evaluate((el) => el.classList.contains('positive'));
  }

  async isNegative(): Promise<boolean> {
    return this.counterValue.evaluate((el) => el.classList.contains('negative'));
  }

  async isZero(): Promise<boolean> {
    return this.counterValue.evaluate((el) => el.classList.contains('zero'));
  }
}
