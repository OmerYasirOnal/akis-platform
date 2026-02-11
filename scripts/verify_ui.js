#!/usr/bin/env node

/**
 * UI Verification Script for AKIS Platform Staging
 * Checks specific UI elements and reports findings
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'https://staging.akisflow.com';

async function verifyUI() {
  console.log('🔍 Starting UI Verification for AKIS Platform Staging...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // ===== 1. LANDING PAGE =====
    console.log('📍 Page 1: Landing Page (/)');
    console.log('─'.repeat(50));
    
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot
    await page.screenshot({
      path: '/tmp/landing-page-verification.png',
      type: 'png',
      fullPage: false
    });
    console.log('📸 Screenshot saved: /tmp/landing-page-verification.png\n');

    // Check 1: CTA Buttons
    const ctaButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a[class*="button"], a[class*="btn"]'));
      return buttons.slice(0, 5).map(btn => {
        const styles = window.getComputedStyle(btn);
        return {
          text: btn.textContent?.trim().substring(0, 50),
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          hasGreenBg: styles.backgroundColor.includes('rgb') && 
                     (styles.backgroundColor.includes('34, 197, 94') || // green-500
                      styles.backgroundColor.includes('74, 222, 128') || // green-400
                      styles.backgroundColor.includes('16, 185, 129') || // emerald-500
                      styles.backgroundColor.includes('20, 184, 166')), // teal-500
          textColor: styles.color,
          isReadable: !styles.color.includes('rgb(255, 255, 255)') && !styles.color.includes('rgb(243, 244, 246)'),
        };
      });
    });

    console.log('✓ CTA Buttons Analysis:');
    ctaButtons.forEach((btn, i) => {
      console.log(`  Button ${i + 1}: "${btn.text}"`);
      console.log(`    Background: ${btn.backgroundColor}`);
      console.log(`    Text Color: ${btn.color}`);
      console.log(`    Has Green BG: ${btn.hasGreenBg ? '✓ YES' : '✗ NO'}`);
      console.log(`    Dark/Readable Text: ${btn.isReadable ? '✓ YES (dark)' : '✗ NO (light)'}`);
    });
    console.log('');

    results.push({
      check: 'CTA Buttons - Dark text on green background',
      status: ctaButtons.some(btn => btn.hasGreenBg && btn.isReadable) ? '✓ PASS' : '✗ FAIL',
      details: ctaButtons
    });

    // Check 2: Capabilities Section
    const capabilities = await page.evaluate(() => {
      // Look for fake metrics like "500+ teams" or "50000+ jobs"
      const text = document.body.innerText;
      const hasFakeMetrics = /\d{3,}\+?\s*(teams|jobs|users|developers)/i.test(text);
      
      // Look for capability cards
      const cards = Array.from(document.querySelectorAll('[class*="card"]'));
      const hasCards = cards.length > 0;
      
      return {
        hasFakeMetrics,
        hasCards,
        cardCount: cards.length,
        sampleText: text.substring(0, 500)
      };
    });

    console.log('✓ Capabilities Section:');
    console.log(`  Has Cards: ${capabilities.hasCards ? '✓ YES' : '✗ NO'} (${capabilities.cardCount} found)`);
    console.log(`  Has Fake Metrics (500+ teams, etc): ${capabilities.hasFakeMetrics ? '✗ YES (BAD)' : '✓ NO (GOOD)'}`);
    console.log('');

    results.push({
      check: 'Capabilities - Shows cards, not fake metrics',
      status: capabilities.hasCards && !capabilities.hasFakeMetrics ? '✓ PASS' : '⚠ PARTIAL',
      details: capabilities
    });

    // Check 3: Logo
    const logo = await page.evaluate(() => {
      const logos = Array.from(document.querySelectorAll('img[alt*="logo" i], img[src*="logo"], svg[class*="logo"]'));
      if (logos.length === 0) return null;
      
      const logoEl = logos[0];
      const parent = logoEl.parentElement;
      const parentStyles = parent ? window.getComputedStyle(parent) : null;
      
      return {
        found: true,
        tagName: logoEl.tagName,
        src: logoEl.src || 'SVG',
        parentBackground: parentStyles?.backgroundColor || 'transparent',
        hasColoredBackground: parentStyles?.backgroundColor && 
                             parentStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                             parentStyles.backgroundColor !== 'transparent'
      };
    });

    console.log('✓ Logo:');
    if (logo) {
      console.log(`  Found: ✓ YES (${logo.tagName})`);
      console.log(`  Parent Background: ${logo.parentBackground}`);
      console.log(`  Has Colored Background: ${logo.hasColoredBackground ? '✗ YES (BAD)' : '✓ NO (GOOD)'}`);
    } else {
      console.log(`  Found: ✗ NO`);
    }
    console.log('');

    results.push({
      check: 'Logo - Transparent background',
      status: logo && !logo.hasColoredBackground ? '✓ PASS' : '✗ FAIL',
      details: logo
    });

    // ===== 2. LOGIN PAGE =====
    console.log('\n📍 Page 2: Login Page (/login)');
    console.log('─'.repeat(50));
    
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({
      path: '/tmp/login-page-verification.png',
      type: 'png',
      fullPage: false
    });
    console.log('📸 Screenshot saved: /tmp/login-page-verification.png\n');

    const loginButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[type="submit"]'));
      if (buttons.length === 0) return null;
      
      const btn = buttons[0];
      const styles = window.getComputedStyle(btn);
      return {
        text: btn.textContent?.trim(),
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        isReadable: !styles.color.includes('rgb(255, 255, 255)') && !styles.color.includes('rgb(243, 244, 246)'),
      };
    });

    console.log('✓ Login Button:');
    if (loginButton) {
      console.log(`  Text: "${loginButton.text}"`);
      console.log(`  Background: ${loginButton.backgroundColor}`);
      console.log(`  Text Color: ${loginButton.color}`);
      console.log(`  Dark/Readable Text: ${loginButton.isReadable ? '✓ YES (dark)' : '✗ NO (light)'}`);
    }
    console.log('');

    results.push({
      check: 'Login Button - Dark readable text',
      status: loginButton && loginButton.isReadable ? '✓ PASS' : '✗ FAIL',
      details: loginButton
    });

    const loginLogo = await page.evaluate(() => {
      const logos = Array.from(document.querySelectorAll('img[alt*="logo" i], img[src*="logo"], svg[class*="logo"]'));
      return logos.length > 0 ? { found: true } : { found: false };
    });

    console.log('✓ Login Logo:');
    console.log(`  Found: ${loginLogo.found ? '✓ YES' : '✗ NO'}`);
    console.log('');

    results.push({
      check: 'Login Logo - Appears correctly',
      status: loginLogo.found ? '✓ PASS' : '✗ FAIL',
      details: loginLogo
    });

    // ===== 3. SIGNUP PAGE =====
    console.log('\n📍 Page 3: Signup Page (/signup)');
    console.log('─'.repeat(50));
    
    await page.goto(`${BASE_URL}/signup`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({
      path: '/tmp/signup-page-verification.png',
      type: 'png',
      fullPage: false
    });
    console.log('📸 Screenshot saved: /tmp/signup-page-verification.png\n');

    const signupButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[type="submit"]'));
      if (buttons.length === 0) return null;
      
      const btn = buttons[0];
      const styles = window.getComputedStyle(btn);
      return {
        text: btn.textContent?.trim(),
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        isReadable: !styles.color.includes('rgb(255, 255, 255)') && !styles.color.includes('rgb(243, 244, 246)'),
      };
    });

    console.log('✓ Signup Button:');
    if (signupButton) {
      console.log(`  Text: "${signupButton.text}"`);
      console.log(`  Background: ${signupButton.backgroundColor}`);
      console.log(`  Text Color: ${signupButton.color}`);
      console.log(`  Dark/Readable Text: ${signupButton.isReadable ? '✓ YES (dark)' : '✗ NO (light)'}`);
    }
    console.log('');

    results.push({
      check: 'Signup Button - Dark readable text',
      status: signupButton && signupButton.isReadable ? '✓ PASS' : '✗ FAIL',
      details: signupButton
    });

    // ===== SUMMARY =====
    console.log('\n' + '═'.repeat(50));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('═'.repeat(50) + '\n');

    results.forEach((result, i) => {
      console.log(`${i + 1}. ${result.check}`);
      console.log(`   ${result.status}`);
      console.log('');
    });

    const passCount = results.filter(r => r.status.includes('PASS')).length;
    const totalCount = results.length;

    console.log(`Overall: ${passCount}/${totalCount} checks passed`);
    console.log('\nScreenshots saved to /tmp/ directory for manual review.');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

verifyUI()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
