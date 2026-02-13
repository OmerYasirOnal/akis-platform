#!/usr/bin/env node
/**
 * Staging Screenshot Script - Authenticated Session
 * Assumes you have a valid session cookie from staging.akisflow.com
 */

import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

const STAGING_URL = 'https://staging.akisflow.com';
const SCREENSHOT_DIR = '/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/piri/docs/screenshots';

async function ensureDir(path) {
  await mkdir(dirname(path), { recursive: true });
}

async function captureScreenshots() {
  console.log('📸 Starting screenshot capture...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { 
      width: 1920, 
      height: 1080,
      deviceScaleFactor: 2
    }
  });
  
  const page = await browser.newPage();

  try {
    // Navigate to agents page (will redirect to login if not authenticated)
    console.log('1️⃣  Navigating to agents page...');
    await page.goto(`${STAGING_URL}/agents`, { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}\n`);
    
    if (currentUrl.includes('/auth/login')) {
      console.log('⚠️  Not authenticated - you need to login first');
      console.log('   Please login manually in the browser window that just opened');
      console.log('   Then press Enter to continue...\n');
      
      // Wait for manual intervention
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
      
      // Navigate back to agents
      await page.goto(`${STAGING_URL}/agents`, { waitUntil: 'networkidle2' });
    }
    
    // Wait a bit for any UI animations
    await page.waitForTimeout(2000);
    
    // Capture Agent Hub
    console.log('2️⃣  Capturing Agent Hub screenshot...');
    await ensureDir(`${SCREENSHOT_DIR}/agent-hub.png`);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/agent-hub.png`,
      fullPage: false // Just viewport, not full page scroll
    });
    console.log(`   ✅ Saved to ${SCREENSHOT_DIR}/agent-hub.png\n`);
    
    // Try to find and navigate to a job
    console.log('3️⃣  Looking for recent jobs...');
    
    // Try multiple possible selectors for job links
    const jobSelectors = [
      'a[href*="/jobs/"]',
      'a[href*="/agent-jobs/"]',
      '[data-testid="job-link"]',
      '.job-item a',
      'tr[data-job-id] a'
    ];
    
    let jobFound = false;
    for (const selector of jobSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        console.log(`   Found job with selector: ${selector}`);
        await page.click(selector);
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(2000);
        jobFound = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!jobFound) {
      console.log('   ⚠️  No jobs found via selectors, trying direct URL...');
      // Try a common job detail URL pattern
      await page.goto(`${STAGING_URL}/jobs`, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(1000);
    }
    
    // Capture job detail
    console.log('4️⃣  Capturing job detail screenshot...');
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/job-detail.png`,
      fullPage: true
    });
    console.log(`   ✅ Saved to ${SCREENSHOT_DIR}/job-detail.png\n`);
    
    // Look for quality score section
    console.log('5️⃣  Looking for quality score...');
    const qualitySelectors = [
      '[data-testid*="quality"]',
      '[class*="quality-score"]',
      '[class*="QualityScore"]',
      'text=Quality Score',
      'text=Score:'
    ];
    
    let foundQuality = false;
    for (const selector of qualitySelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`   Found quality score with selector: ${selector}`);
          
          // Scroll element into view
          await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), element);
          await page.waitForTimeout(500);
          
          await page.screenshot({ 
            path: `${SCREENSHOT_DIR}/quality-score.png`,
            fullPage: false
          });
          console.log(`   ✅ Saved to ${SCREENSHOT_DIR}/quality-score.png\n`);
          foundQuality = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!foundQuality) {
      console.log('   ℹ️  Quality score not visible, using full job detail screenshot\n');
    }
    
    console.log('✅ Screenshot capture completed!');
    console.log('\nScreenshots saved:');
    console.log(`   - ${SCREENSHOT_DIR}/agent-hub.png`);
    console.log(`   - ${SCREENSHOT_DIR}/job-detail.png`);
    if (foundQuality) {
      console.log(`   - ${SCREENSHOT_DIR}/quality-score.png`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    await ensureDir(`${SCREENSHOT_DIR}/error.png`);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/error.png`,
      fullPage: true 
    });
    console.log(`   📸 Error screenshot saved`);
    
  } finally {
    console.log('\n⏳ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

captureScreenshots().catch(console.error);
