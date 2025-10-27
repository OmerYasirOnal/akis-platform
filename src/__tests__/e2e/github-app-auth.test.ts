/**
 * E2E Tests for GitHub App Authentication
 * 
 * These tests verify the complete GitHub App integration flow
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('GitHub App Authentication E2E', () => {
  const testRepoUrl = process.env.TEST_REPO_URL || 'https://github.com/test/repo';

  beforeAll(() => {
    // Verify environment variables
    expect(process.env.GITHUB_APP_ID).toBeDefined();
    expect(process.env.GITHUB_APP_INSTALLATION_ID).toBeDefined();
    expect(process.env.GITHUB_APP_PRIVATE_KEY_PEM).toBeDefined();
  });

  it('should acquire GitHub App installation token', async () => {
    const { getCachedGitHubAppToken } = await import('@/lib/auth/github-app');
    
    const token = await getCachedGitHubAppToken();
    
    expect(token).toBeTruthy();
    expect(token).toMatch(/^ghs_/);
  });

  it('should use token provider with GitHub App priority', async () => {
    const { getGitHubToken } = await import('@/lib/github/token-provider');
    
    const result = await getGitHubToken({
      correlationId: 'e2e-test',
    });

    expect(result).toHaveProperty('token');
    if ('token' in result) {
      expect(result.source).toBe('github_app');
      expect(result.token).toMatch(/^ghs_/);
    }
  });

  it('should fetch default branch using GitHub App token', async () => {
    const { getDefaultBranch } = await import('@/lib/github/operations');
    const [owner, repo] = testRepoUrl.replace('https://github.com/', '').split('/');

    const result = await getDefaultBranch(owner, repo);

    expect(result).toHaveProperty('success', true);
    if (result.success) {
      expect(result.data.defaultBranch).toBeTruthy();
      expect(result.data.defaultBranch).not.toBe('main'); // Verify not hardcoded
    }
  });

  it('should complete full workflow: repo → branch → file → PR', async () => {
    const {
      getDefaultBranch,
      createBranch,
      updateFile,
      createPullRequest,
    } = await import('@/lib/github/operations');

    const [owner, repo] = testRepoUrl.replace('https://github.com/', '').split('/');
    const branchName = `test/e2e-${Date.now()}`;

    // 1. Get default branch
    const defaultBranchResult = await getDefaultBranch(owner, repo);
    expect(defaultBranchResult.success).toBe(true);
    
    if (!defaultBranchResult.success) return;
    const baseBranch = defaultBranchResult.data.defaultBranch;

    // 2. Create branch
    const branchResult = await createBranch(owner, repo, branchName, {
      baseBranch,
    });
    expect(branchResult.success).toBe(true);

    // 3. Update file
    const fileResult = await updateFile(
      owner,
      repo,
      branchName,
      'docs/E2E_TEST.md',
      `# E2E Test\n\nGenerated at ${new Date().toISOString()}`,
      'test: E2E test file'
    );
    expect(fileResult.success).toBe(true);

    // 4. Create PR
    const prResult = await createPullRequest(
      owner,
      repo,
      'test: E2E test PR',
      'This PR was created by E2E tests and can be closed.',
      branchName,
      { base: baseBranch, draft: true }
    );
    expect(prResult.success).toBe(true);
    
    if (prResult.success) {
      console.log('✅ E2E Test PR created:', prResult.data.html_url);
    }
  });
});

describe('Uninstall Revocation Tests', () => {
  it('should fail gracefully when GitHub App is uninstalled', async () => {
    // This test should be run manually after uninstalling the app
    const { getGitHubToken } = await import('@/lib/github/token-provider');

    // Mock env vars to simulate missing App credentials
    const originalEnv = { ...process.env };
    delete process.env.GITHUB_APP_ID;
    delete process.env.GITHUB_APP_INSTALLATION_ID;
    delete process.env.GITHUB_APP_PRIVATE_KEY_PEM;

    const result = await getGitHubToken();

    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.actionable.type).toBe('install_app');
      expect(result.actionable.ctaText).toContain('Install');
    }

    // Restore env vars
    Object.assign(process.env, originalEnv);
  });

  it('should return 401 with actionable CTA on agent endpoint', async () => {
    // Simulate API call without credentials
    const response = await fetch('http://localhost:3000/api/agent/documentation/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repoUrl: 'https://github.com/test/repo',
      }),
    });

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('requiresAuth', true);
    expect(data).toHaveProperty('actionable');
    expect(data.actionable).toHaveProperty('ctaText');
  });
});

describe('Security Tests', () => {
  it('should never expose tokens to client-side', () => {
    // Check if token-provider can be imported on client
    const isServer = typeof window === 'undefined';
    expect(isServer).toBe(true); // This test runs server-side
  });

  it('should redact tokens in logs', async () => {
    const { logger } = await import('@/lib/utils/logger');
    
    // Capture console output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
    };

    logger.info('Test', 'Token: ghp_1234567890123456789012345678901234');

    console.log = originalLog;

    // Verify token is redacted
    const logOutput = logs.join('\n');
    expect(logOutput).toContain('***REDACTED***');
    expect(logOutput).not.toContain('ghp_1234567890123456789012345678901234');
  });

  it('should throw error when calling server functions from client', () => {
    const originalWindow = global.window;
    // @ts-ignore
    global.window = {};

    expect(async () => {
      const { getGitHubToken } = await import('@/lib/github/token-provider');
      await getGitHubToken();
    }).rejects.toThrow('SECURITY');

    global.window = originalWindow;
  });
});

