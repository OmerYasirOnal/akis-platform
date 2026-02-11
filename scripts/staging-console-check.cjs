const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  const urls = [
    { name: 'Landing Page', url: 'https://staging.akisflow.com/' },
    { name: 'Agents Page', url: 'https://staging.akisflow.com/agents' }
  ];

  for (const { name, url } of urls) {
    console.log(`\n=== ${name} ===`);
    console.log(`URL: ${url}\n`);
    
    consoleErrors.length = 0;
    pageErrors.length = 0;
    
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check for AKIS logo
    const logoExists = await page.locator('img[src*="akis-logo"]').count() > 0 ||
                      await page.locator('img[alt*="AKIS"]').count() > 0 ||
                      await page.locator('nav img').count() > 0;
    
    console.log(`Logo in navigation: ${logoExists ? '✓ Found' : '✗ Not found'}`);

    // Check for error messages
    const bodyText = await page.textContent('body');
    const hasRequestFailed = bodyText.includes('Request failed');
    const hasInternalError = bodyText.includes('Internal server error');
    
    console.log(`"Request failed" visible: ${hasRequestFailed ? '✗ YES' : '✓ No'}`);
    console.log(`"Internal server error" visible: ${hasInternalError ? '✗ YES' : '✓ No'}`);
    
    // Report console errors
    if (consoleErrors.length > 0) {
      console.log(`\n⚠️ Console Errors (${consoleErrors.length}):`);
      consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('\n✓ No console errors');
    }
    
    if (pageErrors.length > 0) {
      console.log(`\n⚠️ Page Errors (${pageErrors.length}):`);
      pageErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('✓ No page errors');
    }
  }

  await browser.close();
  console.log('\n=== Check complete ===');
})();
