/**
 * Integration Test: Scribe Agent - App-Only Mode
 * 
 * Tests that Scribe can run end-to-end using only GitHub App
 * (no OAuth user) and create branch + commit + draft PR.
 */

import { runScribeServer, ScribeRunnerInput } from '@/modules/agents/scribe/server/runner.server';

// Mock environment
const mockEnv = {
  GITHUB_APP_ID: '12345',
  GITHUB_APP_INSTALLATION_ID: '99999',
  GITHUB_APP_PRIVATE_KEY_PEM: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA...mock...
-----END RSA PRIVATE KEY-----`,
  SCRIBE_ALLOW_APP_BOT_FALLBACK: 'true',
};

// Mock GitHub API responses
global.fetch = jest.fn((url: string | URL | Request) => {
  const urlStr = url.toString();

  // Mock installation token
  if (urlStr.includes('/app/installations/') && urlStr.includes('/access_tokens')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        token: 'ghs_mock_installation_token',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }),
    } as Response);
  }

  // Mock repository content
  if (urlStr.includes('/repos/') && urlStr.includes('/contents/')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        content: Buffer.from('# Mock README').toString('base64'),
        sha: 'mock-sha',
      }),
    } as Response);
  }

  // Mock branch creation
  if (urlStr.includes('/repos/') && urlStr.includes('/git/refs')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        ref: 'refs/heads/docs/test-branch',
        object: { sha: 'mock-sha' },
      }),
    } as Response);
  }

  // Mock commit creation
  if (urlStr.includes('/repos/') && urlStr.includes('/contents/') && url instanceof Request && url.method === 'PUT') {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        content: { sha: 'new-mock-sha' },
        commit: { sha: 'commit-mock-sha' },
      }),
    } as Response);
  }

  // Mock PR creation
  if (urlStr.includes('/repos/') && urlStr.includes('/pulls')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        number: 42,
        html_url: 'https://github.com/test/repo/pull/42',
        draft: true,
      }),
    } as Response);
  }

  // Default mock
  return Promise.resolve({
    ok: false,
    status: 404,
    json: async () => ({ message: 'Not found' }),
  } as Response);
}) as jest.Mock;

describe('Scribe Agent - App-Only Mode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ...mockEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('runs successfully using only GitHub App (no OAuth user)', async () => {
    const input: ScribeRunnerInput = {
      repoOwner: 'test-owner',
      repoName: 'test-repo',
      baseBranch: 'main',
      scope: 'readme',
      accessToken: 'ghs_mock_installation_token',
      options: {
        skipValidation: true,
        forceCommit: true,
      },
    };

    const result = await runScribeServer(input, 'test-app-only-001');

    // Should succeed
    expect(result.success).toBe(true);
    
    // Should have logs mentioning app_bot mode
    const logsStr = result.logs.join('\n');
    expect(logsStr).toContain('app_bot');
    
    // Should not have OAuth user mentioned
    expect(logsStr).not.toContain('oauth_user');
    
    // Should have created branch and PR
    expect(result.branchName).toBeTruthy();
    expect(result.prUrl).toBeTruthy();
  }, 30000); // 30s timeout for integration test

  test('shows banner when running as app_bot', async () => {
    const input: ScribeRunnerInput = {
      repoOwner: 'test-owner',
      repoName: 'test-repo',
      baseBranch: 'main',
      scope: 'readme',
      accessToken: 'ghs_mock_installation_token',
      options: {
        skipValidation: true,
        forceCommit: true,
      },
    };

    const result = await runScribeServer(input, 'test-app-only-002');

    // Should have banner message
    const logsStr = result.logs.join('\n');
    expect(logsStr).toContain('AKIS App bot');
    expect(logsStr).toContain('installation');
  }, 30000);

  test('fails gracefully when no auth available', async () => {
    // Remove GitHub App credentials
    delete process.env.GITHUB_APP_INSTALLATION_ID;

    const input: ScribeRunnerInput = {
      repoOwner: 'test-owner',
      repoName: 'test-repo',
      baseBranch: 'main',
      scope: 'readme',
      accessToken: 'invalid',
      options: {
        skipValidation: true,
      },
    };

    const result = await runScribeServer(input, 'test-app-only-003');

    // Should fail
    expect(result.success).toBe(false);
    
    // Should have actionable error
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors![0]).toContain('Authentication');
  }, 30000);
});

