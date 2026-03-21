import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CounterPage extends BasePage {
  readonly counterDisplay: Locator;
  readonly incrementButton: Locator;
  readonly decrementButton: Locator;
  readonly appTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.counterDisplay = page.locator('.counter-display');
    this.incrementButton = page.locator('.btn-increment');
    this.decrementButton = page.locator('.btn-decrement');
    this.appTitle = page.locator('.app-title');
  }

  async getCounterValue(): Promise<number> {
    const text = await this.getTextContent(this.counterDisplay);
    return parseInt(text.trim(), 10);
  }

  async clickIncrement() {
    await this.incrementButton.click();
  }

  async clickDecrement() {
    await this.decrementButton.click();
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
}
