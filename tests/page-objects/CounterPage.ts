import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CounterPage extends BasePage {
  readonly counterDisplay: Locator;
  readonly increaseButton: Locator;
  readonly decreaseButton: Locator;
  readonly resetButton: Locator;
  readonly appTitle: Locator;
  readonly appSubtitle: Locator;
  readonly appFooter: Locator;

  constructor(page: Page) {
    super(page);
    this.counterDisplay = page.locator('.counter-display');
    this.increaseButton = page.getByRole('button', { name: 'Artır' });
    this.decreaseButton = page.getByRole('button', { name: 'Azalt' });
    this.resetButton = page.getByRole('button', { name: 'Sıfırla' });
    this.appTitle = page.locator('.app-title');
    this.appSubtitle = page.locator('.app-subtitle');
    this.appFooter = page.locator('.app-footer');
  }

  async getCounterValue(): Promise<number> {
    const text = await this.counterDisplay.textContent();
    return parseInt(text?.trim() ?? '0', 10);
  }

  async clickIncrease() {
    await this.increaseButton.click();
  }

  async clickDecrease() {
    await this.decreaseButton.click();
  }

  async clickReset() {
    await this.resetButton.click();
  }

  async clickIncreaseNTimes(n: number) {
    for (let i = 0; i < n; i++) {
      await this.increaseButton.click();
    }
  }

  async clickDecreaseNTimes(n: number) {
    for (let i = 0; i < n; i++) {
      await this.decreaseButton.click();
    }
  }
}
