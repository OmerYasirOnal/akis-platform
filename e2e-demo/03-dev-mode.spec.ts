import { test } from '@playwright/test';
import { takeNamedScreenshot, takeFullPageScreenshot, pause } from './helpers';

test.describe('Senaryo 3: Dev Mode — Iteratif Gelistirme', () => {
  test('Dev Mode baslat ve dosya degisikligi yap', async ({ page }) => {
    // Workflows sayfasina git
    await page.goto('/dashboard/workflows');
    await pause(2000);
    await takeNamedScreenshot(page, '30_workflows_for_dev');

    // Completed workflow'a tikla (ilk completed olan)
    const completedBadge = page.locator('button').filter({ hasText: /completed/i }).first();
    if (await completedBadge.isVisible().catch(() => false)) {
      await completedBadge.click();
      await pause(2000);
    } else {
      // Fallback: API'den completed pipeline bul
      const response = await page.request.get('/api/pipelines');
      const data = await response.json();
      const pipelines = data.pipelines || [];
      const completed = pipelines.find(
        (p: { stage: string }) => p.stage === 'completed' || p.stage === 'completed_partial',
      );
      if (completed) {
        await page.goto(`/dashboard/workflows/${completed.id}`);
        await pause(2000);
      }
    }

    await takeNamedScreenshot(page, '31_workflow_detail');

    // Dev Mode tab'ina tikla (⚡ ikonu, title="Dev Mode")
    const devTab = page.locator('button[title="Dev Mode"]');
    if (await devTab.isVisible().catch(() => false)) {
      await devTab.click();
      await pause(1500);
    }
    await takeNamedScreenshot(page, '32_dev_tab_active');

    // "Gelistirmeye Devam Et" butonuna tikla
    const startDevBtn = page.locator('button').filter({ hasText: /Gelistirmeye Devam/i });
    await pause(2000); // Wait for render
    if (await startDevBtn.isVisible().catch(() => false)) {
      await takeNamedScreenshot(page, '33_before_start_dev');
      await startDevBtn.click();
      await pause(5000); // Wait for session to start + file tree load
      await takeNamedScreenshot(page, '33_dev_session_started');
    } else {
      console.log('  Dev session already active or button not found');
      await takeNamedScreenshot(page, '33_dev_session_state');
    }

    // Chat mesaji yaz — input type might be input or textarea
    const chatInput = page.locator('input[placeholder*="gelistirmek"]');
    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatInput.fill('');
      const text = 'Ana sayfaya bir karanlik mod (dark mode) toggle butonu ekle';
      for (const char of text) {
        await page.keyboard.type(char, { delay: 30 });
      }
      await pause(1500);
      await takeNamedScreenshot(page, '34_dev_message_typed');

      // Gonder butonuna tikla
      const sendBtn = page.getByText('Gonder', { exact: true });
      if (await sendBtn.isVisible().catch(() => false)) {
        await sendBtn.click();
        await pause(2000);
        await takeNamedScreenshot(page, '35_dev_message_sent');

        // Agent yanitini bekle (max 2dk)
        for (let i = 0; i < 60; i++) {
          const hasResponse = await page
            .getByText('Push to GitHub')
            .isVisible()
            .catch(() => false);
          const hasChanges = await page
            .locator('text=/dosya değişikliğ|file.*change/i')
            .first()
            .isVisible()
            .catch(() => false);
          if (hasResponse || hasChanges) break;
          await pause(2000);
        }

        await pause(2000);
        await takeNamedScreenshot(page, '36_dev_agent_response');
        await takeFullPageScreenshot(page, '36_dev_agent_response');

        // Push butonu gorunuyorsa
        const pushBtn = page.getByText('Push to GitHub').first();
        if (await pushBtn.isVisible().catch(() => false)) {
          await pushBtn.scrollIntoViewIfNeeded();
          await takeNamedScreenshot(page, '37_push_button_visible');

          // Push'a tikla
          await pushBtn.click();
          await pause(5000);
          await takeNamedScreenshot(page, '38_push_completed');
        } else {
          console.log('  ⚠ Push button not visible (AI may have been rate limited)');
        }
      }
    } else {
      console.log('  ⚠ Chat input not found');
      await takeFullPageScreenshot(page, '34_dev_mode_state');
    }
  });
});
