#!/usr/bin/env node
/**
 * Staging Test Script with Screenshots
 * Tests staging.akisflow.com and captures screenshots for Piri README
 */

import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

const STAGING_URL = 'https://staging.akisflow.com';
const SCREENSHOT_DIR = '/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/piri/docs/screenshots';

async function ensureDir(path) {
  await mkdir(dirname(path), { recursive: true });
}

async function testStaging() {
  console.log('🚀 Starting staging test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { 
      width: 1920, 
      height: 1080,
      deviceScaleFactor: 2 // Retina quality
    }
  });
  const page = await browser.newPage();

  try {
    // 1. Test health endpoint
    console.log('1️⃣  Testing /health endpoint...');
    const healthResponse = await page.goto(`${STAGING_URL}/health`, { 
      waitUntil: 'networkidle2' 
    });
    const healthText = await page.evaluate(() => document.body.textContent);
    console.log(`   Status: ${healthResponse.status()}`);
    console.log(`   Response: ${healthText}`);
    
    if (healthText.includes('"status":"ok"') || healthText.includes('"status": "ok"')) {
      console.log('   ✅ Health check passed\n');
    } else {
      console.log('   ❌ Health check failed\n');
    }

    // 2. Navigate to main page
    console.log('2️⃣  Loading main page...');
    await page.goto(STAGING_URL, { waitUntil: 'networkidle2' });
    console.log('   ✅ Main page loaded\n');

    // 3. Screenshot main page
    console.log('3️⃣  Capturing main page screenshot...');
    await ensureDir(`${SCREENSHOT_DIR}/main-page.png`);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/main-page.png`,
      fullPage: true 
    });
    console.log(`   ✅ Saved to ${SCREENSHOT_DIR}/main-page.png\n`);

    // 4. Navigate to login page
    console.log('4️⃣  Loading login page...');
    await page.goto(`${STAGING_URL}/auth/login`, { waitUntil: 'networkidle2' });
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/login-page.png`,
      fullPage: true 
    });
    console.log(`   ✅ Saved to ${SCREENSHOT_DIR}/login-page.png\n`);

    // 5. Try to login
    console.log('5️⃣  Attempting login...');
    
    // Wait for email input and fill
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    await page.type('input[type="email"], input[name="email"]', 'omeryasironal@gmail.com');
    
    // Fill password
    await page.type('input[type="password"], input[name="password"]', 'Test1234!');
    
    // Click login button and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {
        console.log('   ⚠️  Navigation timeout - checking current state...');
      }),
      page.click('button[type="submit"]')
    ]);
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('dashboard') || currentUrl.includes('agents')) {
      console.log('   ✅ Login successful\n');
    } else {
      console.log('   ⚠️  May still be on login page or different redirect\n');
    }

    await page.waitForTimeout(2000); // Wait for any animations

    // 6. Navigate to agents page
    console.log('6️⃣  Loading agents page...');
    await page.goto(`${STAGING_URL}/agents`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/agent-hub.png`,
      fullPage: true 
    });
    console.log(`   ✅ Saved to ${SCREENSHOT_DIR}/agent-hub.png\n`);

    // 7. Try to find and click Trace agent
    console.log('7️⃣  Looking for Trace agent...');
    
    try {
      // Look for Trace in sidebar or main area
      await page.waitForSelector('a:has-text("Trace"), button:has-text("Trace")', { timeout: 5000 });
      await page.click('a:has-text("Trace"), button:has-text("Trace")');
      await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
      await page.waitForTimeout(1000);
      
      console.log('   ✅ Navigated to Trace agent\n');
    } catch (e) {
      console.log('   ⚠️  Could not find Trace agent link, trying URL directly...');
      await page.goto(`${STAGING_URL}/agents/trace`, { waitUntil: 'networkidle2' });
    }

    // 8. Screenshot Trace agent page
    console.log('8️⃣  Capturing Trace agent screenshot...');
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/trace-agent.png`,
      fullPage: true 
    });
    console.log(`   ✅ Saved to ${SCREENSHOT_DIR}/trace-agent.png\n`);

    // 9. Try to find a job detail page
    console.log('9️⃣  Looking for job detail pages...');
    
    try {
      // Look for job links or recent jobs
      await page.waitForSelector('a[href*="/jobs/"], a[href*="/agent-jobs/"]', { timeout: 5000 });
      await page.click('a[href*="/jobs/"], a[href*="/agent-jobs/"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/job-detail.png`,
        fullPage: true 
      });
      console.log(`   ✅ Saved to ${SCREENSHOT_DIR}/job-detail.png\n`);
      
      // Look for quality score section
      const hasQualityScore = await page.$('[data-testid*="quality"], [class*="quality"]');
      if (hasQualityScore) {
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/quality-score.png`,
          fullPage: true 
        });
        console.log(`   ✅ Saved to ${SCREENSHOT_DIR}/quality-score.png\n`);
      }
    } catch (e) {
      console.log('   ⚠️  Could not find job detail pages');
      console.log(`   Error: ${e.message}\n`);
    }

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    
    // Capture error screenshot
    await ensureDir(`${SCREENSHOT_DIR}/error.png`);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/error.png`,
      fullPage: true 
    });
    console.log(`   📸 Error screenshot saved to ${SCREENSHOT_DIR}/error.png`);
    
  } finally {
    await browser.close();
  }
}

testStaging().catch(console.error);
