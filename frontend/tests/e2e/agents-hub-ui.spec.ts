import { test, expect, type Page, type Route } from '@playwright/test';
import { mockDashboardApis, mockAiKeysStatus } from './helpers/mock-dashboard-apis';

async function mockAgentsHubApis(page: Page) {
  await mockDashboardApis(page);
  await mockAiKeysStatus(page);

  await page.route('**/api/ai/supported-models**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        provider: 'openai',
        models: [
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', recommended: true },
          { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', recommended: false },
        ],
      }),
    });
  });

  await page.route('**/api/integrations/github/status', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ connected: true, login: 'e2e-user' }),
    });
  });

  await page.route('**/api/integrations/github/repos**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        repos: [{ name: 'demo-app', private: false, description: 'Demo app', defaultBranch: 'main' }],
      }),
    });
  });

  await page.route('**/api/integrations/github/branches**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        branches: [{ name: 'main', isDefault: true }],
        defaultBranch: 'main',
      }),
    });
  });

  await page.route('**/api/agents/configs', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ configs: [] }),
    });
  });

  await page.route('**/api/conversations/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.endsWith('/api/conversations/threads') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ threads: [] }),
      });
      return;
    }
    if (url.endsWith('/api/conversations/threads') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          thread: {
            id: 'e2e-thread',
            title: 'Scribe Session',
            status: 'active',
            agentType: 'scribe',
            activeRuns: 0,
            lastMessageAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastMessagePreview: null,
            lastMessageRole: null,
            messageCount: 0,
          },
        }),
      });
      return;
    }
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ messages: [], candidates: [] }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: { id: 'msg-1' }, candidates: [] }),
    });
  });

  await page.route(/\/api\/smart-automations(?:\?.*)?$/, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ automations: [] }),
    });
  });
}

test.describe('Agents Hub UI', () => {
  test('AH1: /agents renders quick-start first with configuration collapsed', async ({ page }) => {
    await mockAgentsHubApis(page);
    await page.goto('/agents');

    await expect(page.getByPlaceholder(/search agents|ajan/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /show configuration/i })).toBeVisible();
    await expect(page.getByText('Repository')).toHaveCount(0);
  });

  test('AH2: configuration expands on demand', async ({ page }) => {
    await mockAgentsHubApis(page);
    await page.goto('/agents');

    await page.getByRole('button', { name: /show configuration/i }).click();
    await expect(page.getByText('Repository')).toBeVisible();
    await expect(page.getByText('Base Branch')).toBeVisible();
  });

  test('AH3: user can create a new conversation from session rail', async ({ page }) => {
    await mockAgentsHubApis(page);
    await page.goto('/agents');

    await page.getByRole('button', { name: /new|yeni/i }).click();
    await expect(page.getByRole('heading', { name: /SCRIBE/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /scribe/i }).first()).toBeVisible();
  });

  test('AH4: session rail preview redacts sensitive snippets', async ({ page }) => {
    await mockAgentsHubApis(page);
    await page.route('**/api/conversations/threads', async (route: Route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          threads: [
            {
              id: '3f4a26f0-65bc-4baf-a653-f2f37029100f',
              title: 'Trace Session',
              status: 'active',
              agentType: 'trace',
              activeRuns: 0,
              lastMessageAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastMessagePreview: 'File: const token=ghp_1234567890SUPERSECRET',
              lastMessageRole: 'assistant',
              messageCount: 1,
            },
          ],
        }),
      });
    });
    await page.goto('/agents');

    await expect(page.getByText('Agent progress update')).toBeVisible();
    await expect(page.getByText(/ghp_1234567890SUPERSECRET/i)).toHaveCount(0);
    await expect(page.getByText(/File: const token/i)).toHaveCount(0);
  });

  test('AH5: technical details visibility can be toggled from header', async ({ page }) => {
    await mockAgentsHubApis(page);
    await page.goto('/agents');

    const detailsToggle = page.getByRole('button', { name: /show details/i });
    await expect(detailsToggle).toBeVisible();
    await detailsToggle.click();
    await expect(page.getByRole('button', { name: /hide details/i })).toBeVisible();
  });

  test('AH6: session rail previews can be hidden for privacy', async ({ page }) => {
    await mockAgentsHubApis(page);
    await page.route('**/api/conversations/threads', async (route: Route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          threads: [
            {
              id: '8a56f711-709b-43fa-ac20-5187f7f12726',
              title: 'Scribe Session',
              status: 'active',
              agentType: 'scribe',
              activeRuns: 0,
              lastMessageAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastMessagePreview: 'Generated docs for sprint release notes',
              lastMessageRole: 'assistant',
              messageCount: 1,
            },
          ],
        }),
      });
    });

    await page.goto('/agents');
    await expect(page.getByText(/Generated docs for sprint release notes/i)).toBeVisible();

    await page.getByRole('button', { name: /hide previews/i }).click();
    await expect(page.getByRole('button', { name: /show previews/i })).toBeVisible();
    await expect(page.getByText('Preview hidden')).toBeVisible();
    await expect(page.getByText(/Generated docs for sprint release notes/i)).toHaveCount(0);
  });

  test('AH7: live follow toggle is available for chat control', async ({ page }) => {
    await mockAgentsHubApis(page);
    await page.goto('/agents');

    await expect(page.getByRole('button', { name: /pause follow/i })).toBeVisible();
    await page.getByRole('button', { name: /pause follow/i }).click();
    await expect(page.getByRole('button', { name: /follow live/i })).toBeVisible();
  });

  test('AH8: chat content can be hidden for privacy', async ({ page }) => {
    await mockAgentsHubApis(page);
    await page.goto('/agents');

    await page.getByRole('button', { name: /new|yeni/i }).click();
    await expect(page.getByRole('heading', { name: /SCRIBE ·/i })).toBeVisible();

    await page.getByRole('button', { name: /hide chat|sohbeti gizle/i }).click();
    await expect(page.getByRole('button', { name: /show chat|sohbeti göster/i })).toBeVisible();
    await expect(page.getByText(/Message hidden for privacy|Mesaj gizlilik için gizlendi/i)).toBeVisible();
  });

  test('AH9: privacy preset toggles chat, preview, and detail visibility together', async ({ page }) => {
    await mockAgentsHubApis(page);
    await page.goto('/agents');

    await page.getByRole('button', { name: /new|yeni/i }).click();
    await expect(page.getByRole('heading', { name: /SCRIBE ·/i })).toBeVisible();

    await page.getByRole('button', { name: /enable privacy|gizliliği aç/i }).click();
    await expect(page.getByRole('button', { name: /show chat|sohbeti göster/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /show previews|önizlemeleri göster/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /show details|detayları göster/i })).toBeVisible();

    await page.getByRole('button', { name: /disable privacy|gizliliği kapat/i }).click();
    await expect(page.getByRole('button', { name: /hide chat|sohbeti gizle/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /hide previews|önizlemeleri gizle/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /show details|detayları göster/i })).toBeVisible();
  });
});
