#!/usr/bin/env node

/**
 * Screenshot capture script for AKIS Platform staging
 * Captures key pages for public portfolio documentation
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://staging.akisflow.com';

const screenshots = [
  {
    url: BASE_URL,
    path: '/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/docs/public/assets/landing-hero.png',
    description: 'Landing page hero section',
    viewport: { width: 1920, height: 1080 },
    waitFor: 'networkidle2',
    scrollTo: 0
  },
  {
    url: BASE_URL,
    path: '/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/docs/public/assets/landing-capabilities.png',
    description: 'Capabilities/stats cards section',
    viewport: { width: 1920, height: 1080 },
    waitFor: 'networkidle2',
    scrollTo: 800 // Scroll down to capabilities section
  },
  {
    url: `${BASE_URL}/login`,
    path: '/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/docs/public/assets/oauth-login.png',
    description: 'Login page with OAuth buttons',
    viewport: { width: 1920, height: 1080 },
    waitFor: 'networkidle2',
    scrollTo: 0
  },
  {
    url: `${BASE_URL}/signup`,
    path: '/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/docs/public/assets/signup-onboarding.png',
    description: 'Signup/onboarding page',
    viewport: { width: 1920, height: 1080 },
    waitFor: 'networkidle2',
    scrollTo: 0
  }
];

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture for AKIS Platform staging...\n');

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

  try {
    const page = await browser.newPage();

    for (const screenshot of screenshots) {
      console.log(`📸 Capturing: ${screenshot.description}`);
      console.log(`   URL: ${screenshot.url}`);

      // Set viewport
      await page.setViewport(screenshot.viewport);

      // Navigate to URL
      await page.goto(screenshot.url, {
        waitUntil: screenshot.waitFor,
        timeout: 30000
      });

      // Wait a bit for any animations or lazy loading
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Scroll if needed
      if (screenshot.scrollTo > 0) {
        await page.evaluate((scrollY) => {
          window.scrollTo(0, scrollY);
        }, screenshot.scrollTo);
        
        // Wait for scroll to settle
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Take screenshot
      await page.screenshot({
        path: screenshot.path,
        type: 'png',
        fullPage: false // Capture current viewport
      });

      console.log(`   ✅ Saved to: ${screenshot.path}\n`);
    }

    console.log('🎉 All screenshots captured successfully!');
    console.log('\nScreenshot locations:');
    screenshots.forEach((s) => {
      console.log(`  - ${path.basename(s.path)} (${s.description})`);
    });

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
captureScreenshots()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
