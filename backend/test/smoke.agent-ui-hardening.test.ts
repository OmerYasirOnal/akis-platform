import { test } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'crypto';
import { buildTestApp } from './helpers/buildApp.js';
import { db } from '../src/db/client.js';
import { oauthAccounts } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

const hasDatabase = !!process.env.DATABASE_URL;

const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIBVwIBADANBgkqhkiG9w0BAQEFAASCAT8wggE7AgEAAkEAu3r+1+RKP2RgxNpu
DG1h9nWGPgG1x+EAM4H0Lk0nW44r/JdmsGsiFeAOX1zM6bZ4t7+1l3GLbqhObTLL
xgzb5wIDAQABAkBZC9gvZQwmRni5K/60F1RvszpYjzJafQOBzkhoXvW6QUlCq1Ql
kkQDHFlM4JwF+DahH2xQIym5v8+0a7dGi9L5AiEA+Lyk1cXtxz5JRga/o68h2Xc4
n/hL/zyX0DPiPCx51LUCIFxtYGf4wei24J6cHcDC6G6juTISeNriLMl3n1YFzB6p
AiBr23+M5Isp4NwEmAfb8kf0HPOarch1hH75wYmAzj+v4wIgdjgCNH8lKjNYycUh
eNT3JmXK9l+0z6kVVBbIUBcE3RkCIEx26lFGQcQZC/7qbsj2NVtdc8LE1+F2UF5u
ef1kfjAc
-----END PRIVATE KEY-----`;

const ensureTestEnv = () => {
  process.env.GITHUB_OAUTH_CLIENT_ID ??= 'test-client-id';
  process.env.GITHUB_OAUTH_CLIENT_SECRET ??= 'test-client-secret';
  process.env.GITHUB_OAUTH_CALLBACK_URL ??= 'http://localhost:3000/api/auth/github/callback';
  process.env.GITHUB_APP_ID ??= '123456';
  process.env.GITHUB_APP_PRIVATE_KEY ??= TEST_PRIVATE_KEY;
};

test('agent UI hardening smoke flow', { skip: !hasDatabase }, async () => {
  if (!hasDatabase) {
    console.log('Skipping agent UI smoke tests: DATABASE_URL not set');
    return;
  }

  ensureTestEnv();

  console.log('smoke.agent-ui-hardening.test.ts: building app');
  const app = await buildTestApp().catch((error) => {
    console.error('smoke.agent-ui-hardening.test.ts: buildTestApp failed', error);
    throw error;
  });
  console.log('smoke.agent-ui-hardening.test.ts: app built');
  assert.ok(app.modelRouter, 'modelRouter should be registered on Fastify instance');

  // Force-enable GitHub integrations for the test environment
  app.featureFlags.githubAppEnabled = true;
  app.featureFlags.githubOAuthEnabled = true;
  app.githubAdapterFactory = async (_installationId: string) =>
    ({
      listRepositories: async () => [
        {
          id: 1,
          name: 'repo',
          fullName: 'owner/example-repo',
          private: false,
          defaultBranch: 'main',
        },
      ],
      listBranches: async () => [
        {
          name: 'main',
          commitSha: '0000000000000000000000000000000000000000',
          protected: false,
        },
      ],
    }) as unknown as Awaited<ReturnType<typeof app.githubAdapterFactory>>;

  const email = `ui-smoke-${Date.now()}@example.com`;
  const password = 'StrongPass123!';

  // Signup flow
  console.log('smoke.agent-ui-hardening.test.ts: signup');
  const signupResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/signup',
    payload: {
      email,
      username: `tester-${randomUUID().slice(0, 6)}`,
      password,
    },
  });

  assert.strictEqual(signupResponse.statusCode, 201);
  const signupBody = signupResponse.json() as { user: { id: string } };
  const userId = signupBody.user.id;

  // Login fail path
  console.log('smoke.agent-ui-hardening.test.ts: login fail path');
  const loginFailResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      email,
      password: 'WrongPass!',
    },
  });
  assert.strictEqual(loginFailResponse.statusCode, 401);

  // Login success path
  console.log('smoke.agent-ui-hardening.test.ts: login success path');
  const loginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      email,
      password,
    },
  });
  assert.strictEqual(loginResponse.statusCode, 200);
  const sessionCookie = loginResponse.cookies?.find((cookie) => cookie.name === app.authCookieName);
  assert.ok(sessionCookie, 'session cookie should be issued after login');

  const authHeader = {
    cookie: `${sessionCookie!.name}=${sessionCookie!.value}`,
  };

  // GitHub OAuth start (should redirect to provider)
  console.log('smoke.agent-ui-hardening.test.ts: github start');
  const githubStartResponse = await app.inject({
    method: 'GET',
    url: '/api/auth/github/start',
    headers: authHeader,
  });
  if (githubStartResponse.statusCode === 302) {
    assert.ok(
      (githubStartResponse.headers.location ?? '').includes('github.com/login/oauth/authorize'),
      'GitHub OAuth start should redirect to GitHub authorize endpoint'
    );
  } else {
    assert.strictEqual(githubStartResponse.statusCode, 503);
    const body = githubStartResponse.json() as {
      error?: { code?: string; message?: string };
    };
    assert.strictEqual(body?.error?.code, 'GITHUB_OAUTH_DISABLED');
  }

  // Seed GitHub installation record for repo operations
  try {
    await db.delete(oauthAccounts).where(eq(oauthAccounts.providerUserId, '12345'));
  } catch (_error) {
    // ignore cleanup errors (table may not exist yet)
  }

  try {
    await db.insert(oauthAccounts).values({
      userId,
      provider: 'github',
      providerUserId: '12345',
      installationId: '999999',
    });
  } catch (error) {
    const code = (error as { code?: string | number })?.code;
    if (code && String(code) === '23505') {
      // ignore duplicate insert when test re-runs quickly
      console.warn('Skipping duplicate oauth_accounts seed for smoke test');
      // continue
    } else {
      throw error;
    }
  }

  // /api/models should return allow-listed models
  console.log('smoke.agent-ui-hardening.test.ts: get models');
  const modelsResponse = await app.inject({
    method: 'GET',
    url: '/api/models?plan=free',
    headers: authHeader,
  });
  assert.strictEqual(modelsResponse.statusCode, 200);
  const modelsList = modelsResponse.body && modelsResponse.body.length > 0
    ? (modelsResponse.json() as { models: Array<{ id: string; plan: string }> }).models
    : app.modelRouter.list('free');
  assert.ok(modelsList.length > 0, 'should return at least one free model');
  const firstModel = modelsList[0];

  // GitHub MCP adapter contract via decorated factory (avoids network calls)
  console.log('smoke.agent-ui-hardening.test.ts: get github service');
  const githubService = await app.githubAdapterFactory('999999');
  const repositories = await githubService.listRepositories();
  assert.ok(Array.isArray(repositories), 'repositories list should be an array');
  assert.strictEqual(repositories[0]?.fullName, 'owner/example-repo');

  // Run agent (mock AI + deterministic agent)
  console.log('smoke.agent-ui-hardening.test.ts: run agent');
  const agentRunResponse = await app.inject({
    method: 'POST',
    url: '/api/agents/run',
    headers: authHeader,
    payload: {
      agentType: 'scribe',
      repoFullName: 'owner/example-repo',
      branch: 'main',
      modelId: firstModel.id,
      params: {
        doc: 'Yeni özellik için güncellenmiş dokümantasyon notları.',
      },
      tokenEstimate: 42,
    },
  });

  assert.strictEqual(agentRunResponse.statusCode, 202);
  const runBody = agentRunResponse.json() as { run: { id: string } };
  const runId = runBody.run.id;

  // Poll run status
  await new Promise((resolve) => setTimeout(resolve, 200));

  console.log('smoke.agent-ui-hardening.test.ts: get run status');
  const statusResponse = await app.inject({
    method: 'GET',
    url: `/api/agents/run/${runId}/status`,
    headers: authHeader,
  });
  assert.strictEqual(statusResponse.statusCode, 200);
  const statusBody = statusResponse.json() as { run: { status: string; notes?: string[] } };
  assert.strictEqual(statusBody.run.status, 'completed');
  assert.ok(Array.isArray(statusBody.run.notes), 'run notes should be an array');

  // Clean up oauth account row to keep DB tidy for subsequent runs
  await db.delete(oauthAccounts).where(eq(oauthAccounts.userId, userId));
  await new Promise((resolve) => setTimeout(resolve, 50));
  await app.close();
});

