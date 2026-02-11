#!/usr/bin/env node
import { chromium } from 'playwright';

const urls = [
  { name: 'landing-page', url: 'https://staging.akisflow.com/' },
  { name: 'agents-page', url: 'https://staging.akisflow.com/agents' }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const consoleMessages = [];
  const consoleErrors = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    consoleErrors.push(`PageError: ${error.message}`);
  });

  for (const { name, url } of urls) {
    console.log(`\n=== Navigating to ${name}: ${url} ===`);
    
    try {
      // Clear previous console logs
      consoleMessages.length = 0;
      consoleErrors.length = 0;

      // Navigate and wait for load
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait a bit for any async content
      await page.waitForTimeout(2000);

      // Take screenshot
      const screenshotPath = `./staging-screenshots/${name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✓ Screenshot saved: ${screenshotPath}`);

      // Check for error messages in page content
      const bodyText = await page.textContent('body');
      const hasRequestFailed = bodyText.includes('Request failed');
      const hasInternalError = bodyText.includes('Internal server error');
      const hasErrorVisible = bodyText.includes('Error') || bodyText.includes('error');

      console.log(`\nPage Analysis:`);
      console.log(`- URL loaded: ${page.url()}`);
      console.log(`- "Request failed" visible: ${hasRequestFailed}`);
      console.log(`- "Internal server error" visible: ${hasInternalError}`);
      console.log(`- Generic error text: ${hasErrorVisible}`);

      // Check for AKIS logo
      const logoSelectors = [
        'img[alt*="AKIS"]',
        'img[alt*="akis"]',
        'img[src*="akis-logo"]',
        'img[src*="logo"]',
        '[data-testid="logo"]',
        '.logo',
        'nav img'
      ];
      
      let logoFound = false;
      for (const selector of logoSelectors) {
        const logoCount = await page.locator(selector).count();
        if (logoCount > 0) {
          console.log(`- Logo found: ${selector} (${logoCount} element(s))`);
          logoFound = true;
          break;
        }
      }
      if (!logoFound) {
        console.log(`- Logo: NOT FOUND (checked common selectors)`);
      }

      // Report console errors
      if (consoleErrors.length > 0) {
        console.log(`\n⚠️  Console Errors (${consoleErrors.length}):`);
        consoleErrors.forEach((err, i) => {
          console.log(`  ${i + 1}. ${err}`);
        });
      } else {
        console.log(`\n✓ No console errors`);
      }

      // Show important console messages (warnings, info about loading)
      const importantMessages = consoleMessages.filter(m => 
        m.type === 'warning' || m.type === 'error'
      );
      if (importantMessages.length > 0) {
        console.log(`\nConsole Warnings/Errors:`);
        importantMessages.forEach(msg => {
          console.log(`  [${msg.type}] ${msg.text}`);
        });
      }

    } catch (error) {
      console.error(`✗ Failed to process ${name}:`, error.message);
    }
  }

  await browser.close();
  console.log('\n=== Visual check complete ===');
})();
