#!/usr/bin/env node

/**
 * Screenshot capture script for authenticated AKIS Platform pages
 * Logs in and captures dashboard, agents hub, and agent console screenshots
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://staging.akisflow.com';

// Login credentials
const LOGIN_EMAIL = 'omeryasironal@gmail.com';
const LOGIN_PASSWORD = 'Test123!';

const screenshots = [
  {
    url: `${BASE_URL}/dashboard`,
    path: '/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/docs/public/assets/dashboard-overview.png',
    description: 'Dashboard overview page',
    viewport: { width: 1920, height: 1080 },
  },
  {
    url: `${BASE_URL}/agents`,
    path: '/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/docs/public/assets/agent-hub.png',
    description: 'Agents hub page with agent cards',
    viewport: { width: 1920, height: 1080 },
  },
  {
    url: `${BASE_URL}/agents/scribe`,
    path: '/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/docs/public/assets/agent-console-scribe.png',
    description: 'Scribe agent console',
    viewport: { width: 1920, height: 1080 },
  }
];

async function login(page) {
  console.log('🔐 Attempting to log in (multi-step flow)...');
  
  // ===== STEP 1: Email =====
  console.log('   📧 Step 1: Entering email...');
  await page.goto(`${BASE_URL}/login`, {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Find and fill email input
  const emailInput = 'input#email';
  try {
    await page.waitForSelector(emailInput, { timeout: 5000 });
    console.log(`   ✅ Found email input`);
  } catch (e) {
    throw new Error('Could not find email input on login page');
  }

  await page.type(emailInput, LOGIN_EMAIL, { delay: 50 });
  console.log(`   ✅ Entered email: ${LOGIN_EMAIL}`);

  // Find and click continue button
  const continueButton = 'button[type="submit"]';
  await page.waitForSelector(continueButton, { timeout: 5000 });
  console.log(`   ✅ Found continue button`);

  // Click continue button
  await page.click(continueButton);
  console.log('   ⏳ Waiting for response...');
  
  // Wait a bit for the API call to complete
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Take a screenshot to see what happened
  await page.screenshot({
    path: '/tmp/after-email-submit.png',
    type: 'png'
  });
  console.log('   📸 Debug screenshot: /tmp/after-email-submit.png');
  
  // Check current URL
  const currentUrl = page.url();
  console.log('   Current URL:', currentUrl);
  
  // Check for error messages on the page
  const errorText = await page.evaluate(() => {
    const errorElements = document.querySelectorAll('[class*="error"], [class*="danger"]');
    return Array.from(errorElements).map(el => el.textContent).filter(Boolean).join(' | ');
  });
  
  if (errorText) {
    console.log('   ⚠️  Error messages found:', errorText);
  }
  
  // Wait for URL change (React Router navigation, not full page load)
  if (!currentUrl.includes('/login/password')) {
    console.log('   ⏳ Waiting for navigation to password page...');
    try {
      await page.waitForFunction(
        () => window.location.pathname.includes('/login/password'),
        { timeout: 5000 }
      );
    } catch (e) {
      throw new Error(`Did not navigate to password page. Current URL: ${currentUrl}. Error text: ${errorText || 'none'}. Check /tmp/after-email-submit.png`);
    }
  }

  // Wait a bit more for the page to fully render
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('   Current URL after email step:', page.url());

  // ===== STEP 2: Password =====
  console.log('   🔐 Step 2: Entering password...');
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Find and fill password input
  const passwordInput = 'input#password';
  try {
    await page.waitForSelector(passwordInput, { timeout: 5000 });
    console.log(`   ✅ Found password input`);
  } catch (e) {
    await page.screenshot({
      path: '/tmp/login-password-page-error.png',
      type: 'png'
    });
    throw new Error('Could not find password input. Check /tmp/login-password-page-error.png');
  }

  await page.type(passwordInput, LOGIN_PASSWORD, { delay: 50 });
  console.log(`   ✅ Entered password`);

  // Find and click submit button
  const submitButton = 'button[type="submit"]';
  await page.waitForSelector(submitButton, { timeout: 5000 });
  console.log(`   ✅ Found submit button`);

  // Click and wait for navigation
  console.log('   🚀 Submitting login...');
  await page.click(submitButton);
  
  // Wait for URL to change away from /login/password
  console.log('   ⏳ Waiting for redirect...');
  await page.waitForFunction(
    () => !window.location.pathname.includes('/login'),
    { timeout: 15000 }
  );

  // Wait a bit more for the page to settle
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('   Current URL after login:', page.url());

  // Check if we successfully logged in
  // Could redirect to: /dashboard, /auth/privacy-consent, or /auth/welcome-beta
  const validUrls = ['/dashboard', '/auth/privacy-consent', '/auth/welcome-beta', '/agents'];
  const finalUrl = page.url();
  const isLoggedIn = validUrls.some(path => finalUrl.includes(path));

  if (!isLoggedIn) {
    await page.screenshot({
      path: '/tmp/login-final-error.png',
      type: 'png'
    });
    throw new Error(`Login may have failed. Current URL: ${finalUrl}. Check /tmp/login-final-error.png`);
  }

  console.log('   ✅ Login successful!\n');
}

async function captureAuthenticatedScreenshots() {
  console.log('🚀 Starting authenticated screenshot capture for AKIS Platform staging...\n');

  // Ensure output directory exists
  const outputDir = path.dirname(screenshots[0].path);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created output directory: ${outputDir}\n`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    successful: [],
    failed: []
  };

  try {
    const page = await browser.newPage();

    // Perform login
    try {
      await login(page);
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }

    // Capture each screenshot
    for (const screenshot of screenshots) {
      try {
        console.log(`📸 Capturing: ${screenshot.description}`);
        console.log(`   URL: ${screenshot.url}`);

        // Set viewport
        await page.setViewport(screenshot.viewport);

        // Navigate to URL
        await page.goto(screenshot.url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if we got redirected to login (session expired or auth failed)
        if (page.url().includes('/login')) {
          throw new Error('Redirected to login page - authentication may have failed');
        }

        // Take screenshot
        await page.screenshot({
          path: screenshot.path,
          type: 'png',
          fullPage: false
        });

        console.log(`   ✅ Saved to: ${screenshot.path}\n`);
        results.successful.push({
          description: screenshot.description,
          path: screenshot.path,
          url: screenshot.url
        });

      } catch (error) {
        console.error(`   ❌ Failed to capture ${screenshot.description}:`, error.message);
        results.failed.push({
          description: screenshot.description,
          path: screenshot.path,
          url: screenshot.url,
          error: error.message
        });
        console.log('');
      }
    }

    // Summary
    console.log('📊 CAPTURE SUMMARY');
    console.log('═══════════════════\n');
    
    if (results.successful.length > 0) {
      console.log('✅ Successfully captured:');
      results.successful.forEach((s) => {
        console.log(`   - ${path.basename(s.path)} (${s.description})`);
      });
      console.log('');
    }

    if (results.failed.length > 0) {
      console.log('❌ Failed to capture:');
      results.failed.forEach((s) => {
        console.log(`   - ${s.description}: ${s.error}`);
      });
      console.log('');
    }

    console.log(`Total: ${results.successful.length}/${screenshots.length} successful`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await browser.close();
  }

  return results;
}

// Run the script
captureAuthenticatedScreenshots()
  .then((results) => {
    process.exit(results.failed.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
