import { test, expect } from '@playwright/test';
import { takeNamedScreenshot, pause } from './helpers';

test.describe('Senaryo 1: Dashboard Genel Bakış', () => {
  test('Dashboard sayfalarını gez', async ({ page }) => {
    // 1. Dashboard Overview
    await page.goto('/dashboard');
    await pause(2000);
    await takeNamedScreenshot(page, '01_dashboard_overview');

    // Sidebar'da "Genel Bakış" görünür olmalı
    await expect(page.getByText('Genel Bakış')).toBeVisible();
    await pause(1000);

    // 2. Workflows sayfası — sidebar link (not "Tümünü gör")
    await page.getByRole('link', { name: 'İş Akışları' }).click();
    await pause(2000);
    await takeNamedScreenshot(page, '02_workflows_list');
    await expect(page.getByText('İş Akışları').first()).toBeVisible();

    // 3. Agents sayfası
    await page.getByRole('link', { name: 'Ajanlar' }).click();
    await pause(2000);
    await takeNamedScreenshot(page, '03_agents_page');
    await expect(page.getByRole('heading', { name: 'Ajanlar', exact: true })).toBeVisible();

    // 4. Settings sayfası
    await page.getByRole('link', { name: 'Ayarlar' }).click();
    await pause(2000);
    await takeNamedScreenshot(page, '04_settings_page');
    await expect(page.getByRole('heading', { name: /Ayarlar/i })).toBeVisible();

    // 5. Overview'a geri dön
    await page.getByRole('link', { name: 'Genel Bakış' }).click();
    await pause(2000);
    await takeNamedScreenshot(page, '05_dashboard_final');
  });
});
