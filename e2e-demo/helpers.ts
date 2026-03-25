import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'demo-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

export async function takeNamedScreenshot(page: Page, name: string) {
  const filename = `${name}.png`;
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: false,
  });
  console.log(`  Screenshot: ${filename}`);
}

export async function takeFullPageScreenshot(page: Page, name: string) {
  const filename = `${name}_full.png`;
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true,
  });
  console.log(`  Full screenshot: ${filename}`);
}

export async function typeSlowly(page: Page, selector: string, text: string) {
  await page.click(selector);
  await page.fill(selector, '');
  for (const char of text) {
    await page.keyboard.type(char, { delay: 50 });
  }
}

export async function pause(ms: number = 2000) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await pause(500);
}
