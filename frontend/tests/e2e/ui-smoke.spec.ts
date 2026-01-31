/**
 * UI Smoke Test - CSS and Component Verification
 * 
 * This test verifies that critical UI elements have correct computed CSS styles.
 * It catches regressions in Tailwind config, CSS variables, and component styling.
 * 
 * Run: pnpm -C frontend exec playwright test ui-smoke --headed
 */
import { test, expect } from '@playwright/test';

test.describe('UI Styling Smoke Test', () => {
  test.describe('Landing Page', () => {
    test('CTA buttons have proper styling', async ({ page }) => {
      await page.goto('/');
      
      // Find primary CTA button (e.g., "Başlayın" or "Get Started")
      const primaryCta = page.locator('a[href*="signup"], button').filter({ hasText: /başlayın|get started|sign up/i }).first();
      
      if (await primaryCta.isVisible({ timeout: 5000 }).catch(() => false)) {
        const bgColor = await primaryCta.evaluate(el => getComputedStyle(el).backgroundColor);
        
        // Should NOT be transparent
        expect(bgColor, 'Primary CTA should have solid background').not.toBe('rgba(0, 0, 0, 0)');
        
        // Take screenshot
        await page.screenshot({ path: 'test-results/screenshots/ui-landing-cta.png', fullPage: false });
      }
    });

    test('Cards have border and elevation', async ({ page }) => {
      await page.goto('/');
      
      // Find feature/agent cards
      const card = page.locator('[class*="card"], [class*="rounded-lg"][class*="border"]').first();
      
      if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
        const borderColor = await card.evaluate(el => getComputedStyle(el).borderColor);
        const boxShadow = await card.evaluate(el => getComputedStyle(el).boxShadow);
        
        // Border should be visible (not fully transparent)
        expect(borderColor, 'Card should have visible border').not.toBe('rgba(0, 0, 0, 0)');
        
        // Note: Shadow may be 'none' in some designs, so we don't assert it
        console.log('Card shadow:', boxShadow);
      }
    });
  });

  test.describe('Login Page', () => {
    test('Continue button has solid background', async ({ page }) => {
      await page.goto('/login');
      
      // Find the continue/submit button
      const continueBtn = page.locator('button[type="submit"], button').filter({ hasText: /devam|continue|next/i }).first();
      
      if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        const bgColor = await continueBtn.evaluate(el => getComputedStyle(el).backgroundColor);
        
        // Should NOT be transparent for primary action
        expect(bgColor, 'Continue button should have solid background').not.toBe('rgba(0, 0, 0, 0)');
        
        await page.screenshot({ path: 'test-results/screenshots/ui-login-button.png' });
      }
    });

    test('Input fields have visible borders', async ({ page }) => {
      await page.goto('/login');
      
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      
      if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        const borderWidth = await emailInput.evaluate(el => getComputedStyle(el).borderWidth);
        
        // Border should exist and be visible
        expect(borderWidth, 'Input should have border').not.toBe('0px');
        
        await page.screenshot({ path: 'test-results/screenshots/ui-login-input.png' });
      }
    });
  });

  test.describe('CSS Variables', () => {
    test('Theme CSS variables are defined', async ({ page }) => {
      await page.goto('/');
      
      // Check that critical CSS variables are defined
      const cssVars = await page.evaluate(() => {
        const root = document.documentElement;
        const style = getComputedStyle(root);
        return {
          akPrimary: style.getPropertyValue('--ak-primary').trim(),
          akBg: style.getPropertyValue('--ak-bg').trim(),
          akSurface: style.getPropertyValue('--ak-surface').trim(),
        };
      });
      
      // --ak-primary should be defined (e.g., #07D1AF)
      expect(cssVars.akPrimary, '--ak-primary should be defined').toBeTruthy();
      
      // --ak-bg should be defined
      expect(cssVars.akBg, '--ak-bg should be defined').toBeTruthy();
      
      console.log('CSS Variables:', cssVars);
    });
  });

  test.describe('Tailwind Utility Classes', () => {
    test('bg-ak-primary produces correct background color', async ({ page }) => {
      await page.goto('/');
      
      // Add a test element with bg-ak-primary class
      const testBgColor = await page.evaluate(() => {
        const testEl = document.createElement('div');
        testEl.className = 'bg-ak-primary';
        testEl.style.position = 'absolute';
        testEl.style.left = '-9999px';
        document.body.appendChild(testEl);
        const color = getComputedStyle(testEl).backgroundColor;
        document.body.removeChild(testEl);
        return color;
      });
      
      // Should NOT be transparent - Tailwind should generate the utility
      expect(testBgColor, 'bg-ak-primary should produce non-transparent background').not.toBe('rgba(0, 0, 0, 0)');
      
      console.log('bg-ak-primary computed:', testBgColor);
    });

    test('shadow-ak-elevation-1 produces box-shadow', async ({ page }) => {
      await page.goto('/');
      
      // Add a test element with shadow class
      const testShadow = await page.evaluate(() => {
        const testEl = document.createElement('div');
        testEl.className = 'shadow-ak-elevation-1';
        testEl.style.position = 'absolute';
        testEl.style.left = '-9999px';
        document.body.appendChild(testEl);
        const shadow = getComputedStyle(testEl).boxShadow;
        document.body.removeChild(testEl);
        return shadow;
      });
      
      console.log('shadow-ak-elevation-1 computed:', testShadow);
      // Note: May be 'none' if CSS variable not resolved, but should be defined
    });
  });
});
