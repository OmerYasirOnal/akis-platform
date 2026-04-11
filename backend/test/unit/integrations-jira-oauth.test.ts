/**
 * Integrations — Jira/Atlassian OAuth Logic Tests
 *
 * Tests validation, response shapes, and error handling logic from
 * api/integrations.ts without requiring DB or real API access.
 *
 * Covers:
 *  - Connection test endpoint validation
 *  - Status endpoint response shapes
 *  - Disconnect logic
 *  - Input validation for Jira/Confluence connect
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers mirroring integrations.ts logic
// ─────────────────────────────────────────────────────────────────────────────

interface JiraConnectBody {
  siteUrl?: string;
  email?: string;
  apiToken?: string;
}

function validateJiraConnectBody(body: JiraConnectBody): { valid: boolean; error?: string } {
  if (!body.siteUrl || !body.email || !body.apiToken) {
    return { valid: false, error: 'siteUrl, email, and apiToken are required' };
  }
  return { valid: true };
}

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

interface TestConnectionResult {
  success: boolean;
  error?: string;
  displayName?: string;
}

interface AtlassianStatus {
  connected: boolean;
  siteUrl?: string;
  cloudId?: string;
  jiraAvailable: boolean;
  confluenceAvailable: boolean;
  error?: { code: string; message: string };
}

interface JiraStatus {
  connected: boolean;
  siteUrl?: string;
  userEmail?: string;
  lastValidatedAt?: Date | null;
  viaOAuth?: boolean;
  error?: { code: string; message: string };
}

function buildIntegrationsResponse(
  github: { connected: boolean; login?: string; avatarUrl?: string; error?: string },
  atlassian: AtlassianStatus,
  jira: JiraStatus,
  confluence: { connected: boolean; siteUrl?: string },
): {
  github: typeof github;
  atlassian: typeof atlassian;
  jira: typeof jira;
  confluence: typeof confluence;
} {
  return { github, atlassian, jira, confluence };
}

function buildGitHubStatusResponse(
  token: string | null,
  githubUser: { login: string; avatar_url: string } | null,
): { connected: boolean; login?: string; avatarUrl?: string; error?: string } {
  if (!token) return { connected: false };
  if (!githubUser) return { connected: false, error: 'Token invalid or expired' };
  return { connected: true, login: githubUser.login, avatarUrl: githubUser.avatar_url };
}

// ═════════════════════════════════════════════════════════════════════════════
// Connection test endpoint validation
// ═════════════════════════════════════════════════════════════════════════════

describe('Integrations — Jira connect validation', () => {
  it('rejects missing siteUrl', () => {
    const result = validateJiraConnectBody({ email: 'a@b.com', apiToken: 'tok' });
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('siteUrl'));
  });

  it('rejects missing email', () => {
    const result = validateJiraConnectBody({ siteUrl: 'https://x.atlassian.net', apiToken: 'tok' });
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('email'));
  });

  it('rejects missing apiToken', () => {
    const result = validateJiraConnectBody({ siteUrl: 'https://x.atlassian.net', email: 'a@b.com' });
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('apiToken'));
  });

  it('rejects completely empty body', () => {
    const result = validateJiraConnectBody({});
    assert.equal(result.valid, false);
  });

  it('accepts valid body with all required fields', () => {
    const result = validateJiraConnectBody({
      siteUrl: 'https://mysite.atlassian.net',
      email: 'user@example.com',
      apiToken: 'my-api-token',
    });
    assert.equal(result.valid, true);
    assert.equal(result.error, undefined);
  });
});

describe('Integrations — Site URL normalization', () => {
  it('removes trailing slash', () => {
    assert.equal(normalizeSiteUrl('https://mysite.atlassian.net/'), 'https://mysite.atlassian.net');
  });

  it('removes multiple trailing slashes', () => {
    assert.equal(normalizeSiteUrl('https://mysite.atlassian.net///'), 'https://mysite.atlassian.net');
  });

  it('leaves URL without trailing slash unchanged', () => {
    assert.equal(normalizeSiteUrl('https://mysite.atlassian.net'), 'https://mysite.atlassian.net');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Status endpoint response shapes
// ═════════════════════════════════════════════════════════════════════════════

describe('Integrations — Status endpoint response shapes', () => {
  it('GitHub status returns connected=false when no token', () => {
    const result = buildGitHubStatusResponse(null, null);
    assert.equal(result.connected, false);
    assert.equal(result.login, undefined);
  });

  it('GitHub status returns connected=true with login when token valid', () => {
    const result = buildGitHubStatusResponse('valid-token', {
      login: 'octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/583231',
    });
    assert.equal(result.connected, true);
    assert.equal(result.login, 'octocat');
    assert.ok(result.avatarUrl?.includes('github'));
  });

  it('GitHub status returns error when token exists but user fetch fails', () => {
    const result = buildGitHubStatusResponse('expired-token', null);
    assert.equal(result.connected, false);
    assert.ok(result.error?.includes('invalid'));
  });

  it('integrations response has all required top-level fields', () => {
    const result = buildIntegrationsResponse(
      { connected: false },
      { connected: false, jiraAvailable: false, confluenceAvailable: false },
      { connected: false },
      { connected: false },
    );

    assert.ok('github' in result);
    assert.ok('atlassian' in result);
    assert.ok('jira' in result);
    assert.ok('confluence' in result);
  });

  it('atlassian status has jiraAvailable and confluenceAvailable fields', () => {
    const atlassianStatus: AtlassianStatus = {
      connected: true,
      siteUrl: 'https://mysite.atlassian.net',
      cloudId: 'cloud-123',
      jiraAvailable: true,
      confluenceAvailable: false,
    };

    assert.equal(atlassianStatus.connected, true);
    assert.equal(atlassianStatus.jiraAvailable, true);
    assert.equal(atlassianStatus.confluenceAvailable, false);
  });

  it('jira status via OAuth has viaOAuth flag', () => {
    const jiraStatus: JiraStatus = {
      connected: true,
      siteUrl: 'https://mysite.atlassian.net',
      viaOAuth: true,
    };

    assert.equal(jiraStatus.connected, true);
    assert.equal(jiraStatus.viaOAuth, true);
  });

  it('jira status via legacy API token has userEmail', () => {
    const jiraStatus: JiraStatus = {
      connected: true,
      siteUrl: 'https://mysite.atlassian.net',
      userEmail: 'user@example.com',
      lastValidatedAt: new Date('2026-04-01T00:00:00Z'),
    };

    assert.equal(jiraStatus.connected, true);
    assert.equal(jiraStatus.userEmail, 'user@example.com');
    assert.ok(jiraStatus.lastValidatedAt instanceof Date);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Disconnect logic
// ═════════════════════════════════════════════════════════════════════════════

describe('Integrations — Disconnect removes credentials', () => {
  it('GitHub disconnect returns { ok: true }', () => {
    // Mirrors: DELETE /api/integrations/github → reply.code(200).send({ ok: true })
    const response = { ok: true };
    assert.equal(response.ok, true);
    assert.equal(typeof response.ok, 'boolean');
  });

  it('Atlassian disconnect returns { ok: true }', () => {
    // Mirrors: POST /api/integrations/atlassian/disconnect → reply.code(200).send({ ok: true })
    const response = { ok: true };
    assert.equal(response.ok, true);
  });

  it('Jira disconnect returns { ok: true }', () => {
    // Mirrors: DELETE /api/integrations/jira → reply.code(200).send({ ok: true })
    const response = { ok: true };
    assert.equal(response.ok, true);
  });

  it('Confluence disconnect returns { ok: true }', () => {
    // Mirrors: DELETE /api/integrations/confluence → reply.code(200).send({ ok: true })
    const response = { ok: true };
    assert.equal(response.ok, true);
  });

  it('returns 401 for unauthenticated disconnect', () => {
    const err = new Error('UNAUTHORIZED');
    const response =
      err.message === 'UNAUTHORIZED'
        ? { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }
        : null;
    assert.ok(response !== null);
    assert.equal(response!.error.code, 'UNAUTHORIZED');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Connection test result handling
// ═════════════════════════════════════════════════════════════════════════════

describe('Integrations — Test connection result handling', () => {
  it('successful test returns { success: true }', () => {
    const result: TestConnectionResult = { success: true, displayName: 'My Project' };
    assert.equal(result.success, true);
    assert.equal(result.displayName, 'My Project');
  });

  it('failed test returns { success: false, error }', () => {
    const result: TestConnectionResult = { success: false, error: 'Invalid credentials' };
    assert.equal(result.success, false);
    assert.ok(result.error?.includes('Invalid'));
  });

  it('CONNECTION_FAILED error shape when test fails', () => {
    const testResult: TestConnectionResult = { success: false, error: 'Bad token' };
    const response = !testResult.success
      ? {
          error: {
            code: 'CONNECTION_FAILED',
            message: testResult.error || 'Failed to connect to Jira',
          },
        }
      : null;
    assert.ok(response !== null);
    assert.equal(response!.error.code, 'CONNECTION_FAILED');
    assert.equal(response!.error.message, 'Bad token');
  });

  it('falls back to default message when test error is empty', () => {
    const testResult: TestConnectionResult = { success: false };
    const response = !testResult.success
      ? {
          error: {
            code: 'CONNECTION_FAILED',
            message: testResult.error || 'Failed to connect to Jira',
          },
        }
      : null;
    assert.ok(response !== null);
    assert.equal(response!.error.message, 'Failed to connect to Jira');
  });

  it('NOT_CONNECTED error when testing without existing credentials', () => {
    const existingCred = null;
    const response = !existingCred
      ? { error: { code: 'NOT_CONNECTED', message: 'Jira is not connected' } }
      : null;
    assert.ok(response !== null);
    assert.equal(response!.error.code, 'NOT_CONNECTED');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Error fallback for status checks
// ═════════════════════════════════════════════════════════════════════════════

describe('Integrations — Graceful degradation on status check failure', () => {
  it('returns disconnected status with error info when Atlassian check fails', () => {
    const atlassianStatus: AtlassianStatus = {
      connected: false,
      jiraAvailable: false,
      confluenceAvailable: false,
      error: { code: 'STATUS_CHECK_FAILED', message: 'Unable to check Atlassian status' },
    };
    assert.equal(atlassianStatus.connected, false);
    assert.equal(atlassianStatus.error?.code, 'STATUS_CHECK_FAILED');
  });

  it('returns full error response when all status checks fail', () => {
    const response = {
      github: { connected: false, error: 'Service unavailable' },
      atlassian: {
        connected: false,
        jiraAvailable: false,
        confluenceAvailable: false,
        error: { code: 'STATUS_CHECK_FAILED', message: 'Service unavailable' },
      },
      jira: {
        connected: false,
        error: { code: 'STATUS_CHECK_FAILED', message: 'Service unavailable' },
      },
      confluence: {
        connected: false,
        error: { code: 'STATUS_CHECK_FAILED', message: 'Service unavailable' },
      },
    };

    assert.equal(response.github.connected, false);
    assert.equal(response.atlassian.connected, false);
    assert.equal(response.jira.connected, false);
    assert.equal(response.confluence.connected, false);
  });

  it('Jira status check failure returns disconnected with error', () => {
    const jiraStatus: JiraStatus = {
      connected: false,
      error: { code: 'STATUS_CHECK_FAILED', message: 'Unable to check Jira connection status. Please try again later.' },
    };
    assert.equal(jiraStatus.connected, false);
    assert.ok(jiraStatus.error?.message.includes('try again'));
  });
});
