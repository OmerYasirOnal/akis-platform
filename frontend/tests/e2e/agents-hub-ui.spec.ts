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

    await expect(page.getByPlaceholder(/search agents|ajan/i)).toBeVisible();
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
});
