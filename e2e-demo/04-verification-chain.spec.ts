import { test } from '@playwright/test';
import { takeNamedScreenshot, takeFullPageScreenshot, pause } from './helpers';

test.describe('Senaryo 4: Ajan Dogrulama Zinciri', () => {
  test('Agents sayfasi ve dogrulama zincirini goster', async ({ page }) => {
    // ═══ Agents Sayfası ═══
    await page.goto('/dashboard/agents');
    await pause(2000);
    await takeNamedScreenshot(page, '40_agents_overview');
    await takeFullPageScreenshot(page, '40_agents_overview');

    // Scribe kartı
    const scribeCard = page.locator('text=Scribe').first();
    if (await scribeCard.isVisible().catch(() => false)) {
      await scribeCard.scrollIntoViewIfNeeded();
      await pause(1000);
      await takeNamedScreenshot(page, '41_scribe_agent_card');
    }

    // Proto kartı
    const protoCard = page.getByText('Proto', { exact: true }).first();
    if (await protoCard.isVisible().catch(() => false)) {
      await protoCard.scrollIntoViewIfNeeded();
      await pause(1000);
      await takeNamedScreenshot(page, '42_proto_agent_card');
    }

    // Trace kartı
    const traceCard = page.getByText('Trace', { exact: true }).first();
    if (await traceCard.isVisible().catch(() => false)) {
      await traceCard.scrollIntoViewIfNeeded();
      await pause(1000);
      await takeNamedScreenshot(page, '43_trace_agent_card');
    }

    // Inter-Agent Contract Diagram (scroll down)
    const contractSection = page.getByText('Kontrat').first();
    if (await contractSection.isVisible().catch(() => false)) {
      await contractSection.scrollIntoViewIfNeeded();
      await pause(1000);
      await takeNamedScreenshot(page, '44_inter_agent_contract');
    }

    // ═══ Tamamlanmış Workflow Detayı ═══
    await page.goto('/dashboard/workflows');
    await pause(1500);

    // İlk completed workflow'a tıkla
    const response = await page.request.get('/api/pipelines');
    const data = await response.json();
    const pipelines = data.pipelines || [];
    const completed = pipelines.find(
      (p: { stage: string }) => p.stage === 'completed' || p.stage === 'completed_partial',
    );

    if (completed) {
      await page.goto(`/dashboard/workflows/${completed.id}`);
      await pause(2000);

      // Stages view'a geç (📊 ikonu)
      const stagesTab = page.locator('button[title="Stages"]').or(page.locator('button:has-text("📊")'));
      if (await stagesTab.isVisible().catch(() => false)) {
        await stagesTab.click();
        await pause(1500);
      }
      await takeNamedScreenshot(page, '45_stage_timeline');
      await takeFullPageScreenshot(page, '45_stage_timeline');

      // Scroll through stages
      await page.evaluate(() => window.scrollTo(0, 300));
      await pause(1000);
      await takeNamedScreenshot(page, '46_stages_detail');

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await pause(1000);
      await takeNamedScreenshot(page, '47_stages_bottom');
    }

    // Full page final screenshot
    await takeFullPageScreenshot(page, '49_verification_chain_complete');
  });
});
