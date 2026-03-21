import { type Page, type Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForVisible(locator: Locator, timeout = 5_000) {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async getTextContent(locator: Locator): Promise<string> {
    return (await locator.textContent()) ?? '';
  }
}
