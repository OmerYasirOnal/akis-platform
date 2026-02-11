#!/usr/bin/env node

/**
 * Register a new account on AKIS Platform staging and capture authenticated screenshots
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://staging.akisflow.com';

// Registration credentials
const SIGNUP_EMAIL = 'test-portfolio@akisflow.com';
const SIGNUP_PASSWORD = 'TestPortfolio2026!';
const SIGNUP_FIRST_NAME = 'Test';
const SIGNUP_LAST_NAME = 'Portfolio';

const screenshots = [
  {
    url: `${BASE_URL}/dashboard`,
    path: '/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/docs/public/assets/dashboard-overview.png',
    description: 'Dashboard overview page',
  },
  {
    url: `${BASE_URL}/agents`,
    path: '/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/docs/public/assets/agent-hub.png',
    description: 'Agents hub page',
  },
  {
    url: `${BASE_URL}/agents/scribe`,
    path: '/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/docs/public/assets/agent-console-scribe.png',
    description: 'Scribe agent console',
  }
];

async function registerAccount(page) {
  console.log('📝 Attempting to register new account...');
  
  // Navigate to signup page
  await page.goto(`${BASE_URL}/signup`, {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('   Current URL:', page.url());
  
  // Take initial screenshot
  await page.screenshot({
    path: '/tmp/signup-page-initial.png',
    type: 'png'
  });
  console.log('   📸 Initial signup page: /tmp/signup-page-initial.png');

  // Check all input fields on the page
  const inputs = await page.$$eval('input', elements =>
    elements.map(el => ({
      type: el.type,
      id: el.id,
      name: el.name,
      placeholder: el.placeholder
    }))
  );
  console.log('   📋 Input fields found:', JSON.stringify(inputs, null, 2));

  // Based on multi-step signup, first page should have first name, last name, email
  // Try to find name fields
  const firstNameSelectors = ['input#firstName', 'input[name="firstName"]', 'input[placeholder*="first" i]'];
  const lastNameSelectors = ['input#lastName', 'input[name="lastName"]', 'input[placeholder*="last" i]'];
  const emailSelectors = ['input#email', 'input[type="email"]'];

  let firstNameInput = null;
  let lastNameInput = null;
  let emailInput = null;

  // Find first name
  for (const selector of firstNameSelectors) {
    const element = await page.$(selector);
    if (element) {
      firstNameInput = selector;
      console.log(`   ✅ Found first name input: ${selector}`);
      break;
    }
  }

  // Find last name
  for (const selector of lastNameSelectors) {
    const element = await page.$(selector);
    if (element) {
      lastNameInput = selector;
      console.log(`   ✅ Found last name input: ${selector}`);
      break;
    }
  }

  // Find email
  for (const selector of emailSelectors) {
    const element = await page.$(selector);
    if (element) {
      emailInput = selector;
      console.log(`   ✅ Found email input: ${selector}`);
      break;
    }
  }

  if (!emailInput) {
    throw new Error('Could not find email input field on signup page');
  }

  // Fill in the form
  console.log('   📝 Filling in signup form...');
  
  if (firstNameInput) {
    await page.type(firstNameInput, SIGNUP_FIRST_NAME, { delay: 50 });
    console.log(`   ✅ Entered first name: ${SIGNUP_FIRST_NAME}`);
  }

  if (lastNameInput) {
    await page.type(lastNameInput, SIGNUP_LAST_NAME, { delay: 50 });
    console.log(`   ✅ Entered last name: ${SIGNUP_LAST_NAME}`);
  }

  await page.type(emailInput, SIGNUP_EMAIL, { delay: 50 });
  console.log(`   ✅ Entered email: ${SIGNUP_EMAIL}`);

  // Find and click continue/submit button
  const submitButton = 'button[type="submit"]';
  const button = await page.$(submitButton);
  
  if (!button) {
    throw new Error('Could not find submit button');
  }

  console.log('   ✅ Found submit button');
  
  // Click and wait
  await page.click(submitButton);
  console.log('   🚀 Submitted form, waiting for response...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Take screenshot after submit
  await page.screenshot({
    path: '/tmp/signup-after-submit.png',
    type: 'png'
  });
  console.log('   📸 After submit: /tmp/signup-after-submit.png');
  console.log('   Current URL:', page.url());

  // Check for error messages
  const errorText = await page.evaluate(() => {
    const errorElements = document.querySelectorAll('[class*="error"], [class*="danger"]');
    return Array.from(errorElements).map(el => el.textContent).filter(Boolean).join(' | ');
  });

  if (errorText) {
    console.log('   ⚠️  Error messages found:', errorText);
  }

  // If we're on password page, continue with password
  if (page.url().includes('/signup/password')) {
    console.log('   🔐 On password page, entering password...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const passwordInput = 'input#password';
    await page.waitForSelector(passwordInput, { timeout: 5000 });
    await page.type(passwordInput, SIGNUP_PASSWORD, { delay: 50 });
    console.log('   ✅ Entered password');

    // Check for confirm password field
    const confirmPasswordInput = 'input#confirmPassword';
    const confirmElement = await page.$(confirmPasswordInput);
    if (confirmElement) {
      await page.type(confirmPasswordInput, SIGNUP_PASSWORD, { delay: 50 });
      console.log('   ✅ Entered password confirmation');
    }

    // Submit password
    await page.click('button[type="submit"]');
    console.log('   🚀 Submitted password...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({
      path: '/tmp/signup-after-password.png',
      type: 'png'
    });
    console.log('   📸 After password: /tmp/signup-after-password.png');
    console.log('   Current URL:', page.url());
  }

  // Check if we need email verification
  if (page.url().includes('/verify-email')) {
    console.log('   ⚠️  Email verification required');
    console.log('   ⚠️  Cannot proceed with automated screenshots - verification code needed');
    return false;
  }

  console.log('   ✅ Registration flow completed!\n');
  return true;
}

async function captureScreenshots(page) {
  console.log('📸 Capturing screenshots...\n');

  const results = {
    successful: [],
    failed: []
  };

  for (const screenshot of screenshots) {
    try {
      console.log(`📸 Capturing: ${screenshot.description}`);
      console.log(`   URL: ${screenshot.url}`);

      await page.goto(screenshot.url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);

      // Take screenshot regardless of where we ended up
      await page.screenshot({
        path: screenshot.path,
        type: 'png',
        fullPage: false
      });

      let status = 'captured';
      if (currentUrl.includes('/login')) {
        status = 'redirected to login (not authenticated)';
      } else if (currentUrl.includes('/signup')) {
        status = 'redirected to signup';
      } else if (currentUrl.includes(screenshot.url)) {
        status = 'authenticated page loaded';
      }

      console.log(`   ✅ Saved to: ${screenshot.path}`);
      console.log(`   Status: ${status}\n`);

      results.successful.push({
        description: screenshot.description,
        path: screenshot.path,
        url: screenshot.url,
        actualUrl: currentUrl,
        status: status
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

  return results;
}

async function main() {
  console.log('🚀 Starting AKIS Platform registration and screenshot capture...\n');

  const outputDir = path.dirname(screenshots[0].path);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created output directory: ${outputDir}\n`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Try to register
    const registrationSuccess = await registerAccount(page);

    if (!registrationSuccess) {
      console.log('\n⚠️  Registration requires email verification.');
      console.log('📸 Capturing screenshots without authentication...\n');
    }

    // Capture screenshots (will show login redirect if not authenticated)
    const results = await captureScreenshots(page);

    // Summary
    console.log('📊 CAPTURE SUMMARY');
    console.log('═══════════════════\n');
    
    if (results.successful.length > 0) {
      console.log('✅ Screenshots captured:');
      results.successful.forEach((s) => {
        console.log(`   - ${path.basename(s.path)}`);
        console.log(`     ${s.description}`);
        console.log(`     Status: ${s.status}`);
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

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
