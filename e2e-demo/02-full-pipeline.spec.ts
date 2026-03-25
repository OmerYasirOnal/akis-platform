import { test, expect } from '@playwright/test';
import { takeNamedScreenshot, takeFullPageScreenshot, typeSlowly, pause } from './helpers';

test.describe('Senaryo 2: Tam Pipeline Akışı', () => {
  test('Fikir → Scribe → Onay → Proto → Trace', async ({ page }) => {
    // ═══ ADIM 1: New Workflow sayfasına git ═══
    await page.goto('/dashboard/workflows/new');
    await pause(2000);
    await takeNamedScreenshot(page, '10_new_workflow_form');

    // ═══ ADIM 2: Fikri yaz ═══
    const ideaText =
      'Kisisel butce takip uygulamasi. Kullanici gelir ve gider ekleyebilsin, kategorilere ayirabilsin, aylik ozet gorebilsin ve butce limiti belirleyebilsin.';

    await typeSlowly(page, 'textarea#idea', ideaText);
    await pause(1500);
    await takeNamedScreenshot(page, '11_idea_written');

    // ═══ ADIM 3: Repository seç (varsa select, yoksa manual) ═══
    // Manuel moda geç — daha güvenilir
    const manuelBtn = page.getByText('Manuel', { exact: true });
    if (await manuelBtn.isVisible().catch(() => false)) {
      await manuelBtn.click();
      await pause(500);
      await page.fill('input#repo', 'OmerYasirOnal/akis-platform-devolopment');
      await pause(500);
    }
    await takeNamedScreenshot(page, '12_repo_selected');

    // ═══ ADIM 4: İş akışını başlat ═══
    await page.locator('button[type="submit"]').click();
    await pause(3000);
    await takeNamedScreenshot(page, '13_pipeline_started');

    // ═══ ADIM 5: Scribe çalışıyor ═══
    await pause(5000);
    await takeNamedScreenshot(page, '14_scribe_running');

    // Scribe'ın bitmesini bekle — "Onayla" butonu veya clarification soruları gelecek
    // Max 3 dakika bekle
    let hasApprove = false;
    for (let i = 0; i < 90; i++) {
      // Check for approve button
      hasApprove = await page
        .getByText('Onayla ve Devam Et')
        .isVisible()
        .catch(() => false);
      if (hasApprove) break;

      // Check for clarification questions — answer if present
      const sendBtn = page.locator('button:has-text("Gönder")');
      const messageInput = page.locator('textarea[placeholder*="Mesaj"]');
      const hasClarification = await messageInput.isVisible().catch(() => false);

      if (hasClarification && (await sendBtn.isVisible().catch(() => false))) {
        await takeNamedScreenshot(page, '14b_scribe_clarification');
        await messageInput.fill(
          'Genel amacli basit butce uygulamasi. Vanilla HTML+CSS+JS, ekstra framework istemiyorum.',
        );
        await sendBtn.click();
        await pause(3000);
      }

      await pause(2000);
    }

    await pause(2000);
    await takeNamedScreenshot(page, '15_scribe_completed_spec');
    await takeFullPageScreenshot(page, '15_scribe_completed_spec');

    if (!hasApprove) {
      console.log('  ⚠ Approve button not found after 3min — stopping');
      return;
    }

    // ═══ ADIM 6: Spec'i onayla ═══
    await takeNamedScreenshot(page, '16_before_approve');

    // Repo name input'u bul ve doldur (approve section'da)
    const repoInput = page.locator('input[placeholder*="repo"]').or(page.locator('input[value*="akis"]'));
    if (await repoInput.isVisible().catch(() => false)) {
      await repoInput.fill('akis-platform-devolopment');
    }

    await page.getByText('Onayla ve Devam Et').click();
    await pause(3000);
    await takeNamedScreenshot(page, '17_approved_proto_starting');

    // ═══ ADIM 7: Proto çalışıyor ═══
    await pause(5000);
    await takeNamedScreenshot(page, '18_proto_running');

    // Proto + Trace tamamlanana kadar bekle (max 5dk)
    for (let i = 0; i < 150; i++) {
      const isDone = await page
        .getByText('completed', { exact: false })
        .or(page.getByText('Tamamlandı'))
        .first()
        .isVisible()
        .catch(() => false);

      // Check for "Geliştirmeye Devam" button (indicates completion)
      const hasDevBtn = await page
        .getByText('Geliştirmeye Devam')
        .isVisible()
        .catch(() => false);

      if (isDone || hasDevBtn) break;
      await pause(2000);
    }

    await pause(3000);
    await takeNamedScreenshot(page, '19_pipeline_completed');
    await takeFullPageScreenshot(page, '19_pipeline_completed');

    // ═══ ADIM 8: Sonuç kartı ═══
    await pause(2000);
    await takeNamedScreenshot(page, '20_result_card');

    // GitHub linki varsa göster
    const githubLink = page.locator('a[href*="github.com"]').first();
    if (await githubLink.isVisible().catch(() => false)) {
      await githubLink.scrollIntoViewIfNeeded();
      await takeNamedScreenshot(page, '21_github_link');
    }
  });
});
