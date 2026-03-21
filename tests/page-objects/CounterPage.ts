import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CounterPage extends BasePage {
  readonly appTitle: Locator;
  readonly counterDisplay: Locator;
  readonly incrementButton: Locator;
  readonly decrementButton: Locator;
  readonly counterLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.appTitle = page.locator('.app-title');
    this.counterDisplay = page.locator('.counter-display');
    this.incrementButton = page.locator('.btn-increment');
    this.decrementButton = page.locator('.btn-decrement');
    this.counterLabel = page.locator('.counter-label');
  }

  async getCounterValue(): Promise<number> {
    const text = await this.counterDisplay.textContent();
    return parseInt(text ?? '0', 10);
  }

  async clickIncrement() {
    await this.incrementButton.click();
  }

  async clickDecrement() {
    await this.decrementButton.click();
  }

  async clickIncrementTimes(n: number) {
    for (let i = 0; i < n; i++) {
      await this.incrementButton.click();
    }
  }

  async clickDecrementTimes(n: number) {
    for (let i = 0; i < n; i++) {
      await this.decrementButton.click();
    }
  }
}
