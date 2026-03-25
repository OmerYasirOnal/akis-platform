import { test } from '@playwright/test';
import { takeNamedScreenshot, takeFullPageScreenshot, pause } from './helpers';

const PIPELINE_ID = 'cc3c6fd4-d13e-479d-81b7-961853c5917b';

test.describe('Senaryo 2b: Approve → Proto → Trace', () => {
  test('Spec onayla ve pipeline tamamlansın', async ({ page }) => {
    // Navigate to workflow detail
    await page.goto(`/dashboard/workflows/${PIPELINE_ID}`);
    await pause(3000);
    await takeNamedScreenshot(page, '16_before_approve');
    await takeFullPageScreenshot(page, '16_before_approve');

    // Click approve button
    const approveBtn = page.getByText('Onayla ve Devam Et');
    if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.click();
      await pause(3000);
      await takeNamedScreenshot(page, '17_approved_proto_starting');

      // Proto running
      await pause(5000);
      await takeNamedScreenshot(page, '18_proto_running');

      // Wait for completion (max 5min)
      for (let i = 0; i < 150; i++) {
        // Check completion indicators
        const page_text = await page.textContent('body').catch(() => '');
        if (
          page_text?.includes('completed') ||
          page_text?.includes('Geliştirmeye Devam')
        ) {
          break;
        }
        await pause(2000);
      }

      await pause(3000);
      await takeNamedScreenshot(page, '19_pipeline_completed');
      await takeFullPageScreenshot(page, '19_pipeline_completed');

      // Final card
      await takeNamedScreenshot(page, '20_result_card');

      // GitHub link
      const ghLink = page.locator('a[href*="github.com"]').first();
      if (await ghLink.isVisible().catch(() => false)) {
        await ghLink.scrollIntoViewIfNeeded();
        await takeNamedScreenshot(page, '21_github_link');
      }
    } else {
      console.log('  ⚠ Approve button not visible — pipeline may not be in awaiting_approval state');
      await takeFullPageScreenshot(page, '16_page_state');
    }
  });
});
