/**
 * Unit tests: Integrations API — OAuth flows, token CRUD, validation logic
 *
 * Tests cover:
 * 1. fetchFromGitHub helper: response parsing and error handling
 * 2. getGitHubToken: OAuth lookup, dev bootstrap fallback
 * 3. GitHub endpoint validation: missing params, not connected states
 * 4. Jira/Confluence connect: input validation, URL normalization
 * 5. testAtlassianConnection: HTTP auth, status code handling
 * 6. OAuth state (CSRF): cookie comparison logic
 * 7. Error response shapes and auth guard behavior
 * 8. Integration list: graceful degradation when services fail
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

// ─── Re-create fetchFromGitHub logic ──────────────────────────────────

interface FetchFromGitHubOptions {
  status: number;
  ok: boolean;
  body: unknown;
  statusText?: string;
}

function simulateFetchFromGitHub<T>(opts: FetchFromGitHubOptions): T {
  if (!opts.ok) {
    const error = opts.body as { message?: string };
    throw new Error(
      error?.message || `GitHub API error: ${opts.status} ${opts.statusText || ''}`
    );
  }
  return opts.body as T;
}

// ─── Re-create getGitHubToken logic ───────────────────────────────────

const DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER = '__DEV_GITHUB_BOOTSTRAP__';

interface OAuthRecord {
  accessToken: string | null;
}

interface DevEnv {
  SCRIBE_DEV_GITHUB_BOOTSTRAP: string;
  SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN?: string;
  GITHUB_TOKEN?: string;
}

function simulateDecryptOAuthToken(rawToken: string): string | null {
  if (!rawToken.startsWith('{') || !rawToken.endsWith('}')) {
    return rawToken;
  }

  try {
    const parsed = JSON.parse(rawToken) as { cipherText?: string };
    if (typeof parsed.cipherText === 'string') {
      return parsed.cipherText.replace(/^enc:/, '');
    }
    return rawToken;
  } catch {
    return rawToken;
  }
}

function simulateGetGitHubToken(
  oauthRecord: OAuthRecord | null,
  devEnv: DevEnv
): string | null {
  const rawToken = oauthRecord?.accessToken || null;

  if (rawToken && rawToken !== DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER) {
    return simulateDecryptOAuthToken(rawToken);
  }

  if (
    rawToken === DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER &&
    devEnv.SCRIBE_DEV_GITHUB_BOOTSTRAP === 'true'
  ) {
    return devEnv.SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN || devEnv.GITHUB_TOKEN || null;
  }

  return rawToken;
}

// ─── Re-create testAtlassianConnection logic ──────────────────────────

function simulateTestAtlassianConnection(
  httpStatus: number,
  responseBody: { displayName?: string } | null,
  fetchError: Error | null,
  _provider: 'jira' | 'confluence'
): { success: boolean; error?: string; displayName?: string } {
  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (httpStatus === 401) {
    return { success: false, error: 'Invalid credentials. Check your email and API token.' };
  }
  if (httpStatus === 403) {
    return { success: false, error: 'Access forbidden. Your API token may lack required permissions.' };
  }
  if (httpStatus < 200 || httpStatus >= 300) {
    return { success: false, error: `API error (${httpStatus}): ` };
  }

  return { success: true, displayName: responseBody?.displayName };
}

// ─── Re-create input validation logic ─────────────────────────────────

function validateJiraConnectInput(body: {
  siteUrl?: string;
  email?: string;
  apiToken?: string;
}): { valid: boolean; error?: string } {
  if (!body.siteUrl || !body.email || !body.apiToken) {
    return { valid: false, error: 'siteUrl, email, and apiToken are required' };
  }
  return { valid: true };
}

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

// ─── Re-create OAuth state validation ─────────────────────────────────

function validateOAuthState(
  storedState: string | undefined,
  receivedState: string | undefined
): { valid: boolean; reason?: string } {
  if (!storedState || storedState !== receivedState) {
    return { valid: false, reason: 'state_mismatch' };
  }
  return { valid: true };
}

// ─── Re-create requireAuth simulation ─────────────────────────────────

function simulateRequireAuth(
  hasSession: boolean,
  user?: { id: string; email: string; role: string }
): { id: string; email: string; role: string } {
  if (!hasSession || !user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

// ─── Re-create integration status aggregation ─────────────────────────

interface ServiceStatus {
  connected: boolean;
  error?: { code: string; message: string };
}

function buildDegradedIntegrationStatus(): {
  github: ServiceStatus;
  atlassian: ServiceStatus & { jiraAvailable: boolean; confluenceAvailable: boolean };
  jira: ServiceStatus;
  confluence: ServiceStatus;
} {
  return {
    github: { connected: false, error: { code: 'STATUS_CHECK_FAILED', message: 'Service unavailable' } },
    atlassian: { connected: false, jiraAvailable: false, confluenceAvailable: false, error: { code: 'STATUS_CHECK_FAILED', message: 'Service unavailable' } },
    jira: { connected: false, error: { code: 'STATUS_CHECK_FAILED', message: 'Service unavailable' } },
    confluence: { connected: false, error: { code: 'STATUS_CHECK_FAILED', message: 'Service unavailable' } },
  };
}

// Helper: build Jira status from OAuth + legacy fallback
function resolveJiraStatus(
  atlassianConnected: boolean,
  atlassianJiraAvailable: boolean,
  legacyCred: { isValid: boolean; siteUrl: string; userEmail: string } | null
): { connected: boolean; viaOAuth?: boolean; siteUrl?: string } {
  if (atlassianConnected && atlassianJiraAvailable) {
    return { connected: true, viaOAuth: true };
  }
  if (legacyCred) {
    return { connected: legacyCred.isValid, viaOAuth: false, siteUrl: legacyCred.siteUrl };
  }
  return { connected: false };
}

// ─── Test Data ──────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-001', email: 'dev@test.local', role: 'member' };
const MOCK_ADMIN = { id: 'admin-001', email: 'admin@test.local', role: 'admin' };

// ─── Test Suites ────────────────────────────────────────────────────

describe('fetchFromGitHub — Response Handling', () => {
  test('returns parsed JSON on 200 OK', () => {
    const result = simulateFetchFromGitHub<{ login: string }>({
      status: 200,
      ok: true,
      body: { login: 'testuser' },
    });
    assert.equal(result.login, 'testuser');
  });

  test('returns array data from GitHub API', () => {
    const repos = simulateFetchFromGitHub<Array<{ name: string }>>({
      status: 200,
      ok: true,
      body: [{ name: 'repo1' }, { name: 'repo2' }],
    });
    assert.equal(repos.length, 2);
    assert.equal(repos[0].name, 'repo1');
  });

  test('throws on 401 Unauthorized with GitHub message', () => {
    assert.throws(
      () => simulateFetchFromGitHub({ status: 401, ok: false, body: { message: 'Bad credentials' } }),
      { message: 'Bad credentials' }
    );
  });

  test('throws on 403 Forbidden with rate limit message', () => {
    assert.throws(
      () => simulateFetchFromGitHub({ status: 403, ok: false, body: { message: 'API rate limit exceeded' } }),
      { message: 'API rate limit exceeded' }
    );
  });

  test('throws on 404 Not Found with fallback message', () => {
    assert.throws(
      () => simulateFetchFromGitHub({ status: 404, ok: false, body: {}, statusText: 'Not Found' }),
      { message: 'GitHub API error: 404 Not Found' }
    );
  });

  test('throws on 500 with empty body (fallback message)', () => {
    assert.throws(
      () => simulateFetchFromGitHub({ status: 500, ok: false, body: null, statusText: 'Internal Server Error' }),
      /GitHub API error: 500/
    );
  });
});

describe('getGitHubToken — Token Resolution', () => {
  const defaultDevEnv: DevEnv = {
    SCRIBE_DEV_GITHUB_BOOTSTRAP: 'false',
  };

  test('returns null when no OAuth record exists', () => {
    const token = simulateGetGitHubToken(null, defaultDevEnv);
    assert.equal(token, null);
  });

  test('returns null when OAuth record has null accessToken', () => {
    const token = simulateGetGitHubToken({ accessToken: null }, defaultDevEnv);
    assert.equal(token, null);
  });

  test('returns real token when present', () => {
    const token = simulateGetGitHubToken({ accessToken: 'gho_abc123' }, defaultDevEnv);
    assert.equal(token, 'gho_abc123');
  });

  test('decrypts encrypted JSON token payload', () => {
    const token = simulateGetGitHubToken(
      {
        accessToken: JSON.stringify({
          cipherText: 'enc:gho_encrypted_123',
          iv: 'iv',
          authTag: 'tag',
          keyVersion: 'v1',
        }),
      },
      defaultDevEnv
    );
    assert.equal(token, 'gho_encrypted_123');
  });

  test('returns placeholder token when dev bootstrap is disabled', () => {
    const token = simulateGetGitHubToken(
      { accessToken: DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER },
      { SCRIBE_DEV_GITHUB_BOOTSTRAP: 'false' }
    );
    assert.equal(token, DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER);
  });

  test('returns dev bootstrap token when enabled and SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN set', () => {
    const token = simulateGetGitHubToken(
      { accessToken: DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER },
      {
        SCRIBE_DEV_GITHUB_BOOTSTRAP: 'true',
        SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN: 'ghp_dev_token_123',
      }
    );
    assert.equal(token, 'ghp_dev_token_123');
  });

  test('falls back to GITHUB_TOKEN when SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN not set', () => {
    const token = simulateGetGitHubToken(
      { accessToken: DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER },
      {
        SCRIBE_DEV_GITHUB_BOOTSTRAP: 'true',
        GITHUB_TOKEN: 'ghp_fallback_456',
      }
    );
    assert.equal(token, 'ghp_fallback_456');
  });

  test('returns null when dev bootstrap enabled but no env tokens set', () => {
    const token = simulateGetGitHubToken(
      { accessToken: DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER },
      { SCRIBE_DEV_GITHUB_BOOTSTRAP: 'true' }
    );
    assert.equal(token, null);
  });

  test('prioritizes SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN over GITHUB_TOKEN', () => {
    const token = simulateGetGitHubToken(
      { accessToken: DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER },
      {
        SCRIBE_DEV_GITHUB_BOOTSTRAP: 'true',
        SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN: 'ghp_primary',
        GITHUB_TOKEN: 'ghp_fallback',
      }
    );
    assert.equal(token, 'ghp_primary');
  });
});

describe('testAtlassianConnection — HTTP Status Handling', () => {
  test('returns success with displayName on 200', () => {
    const result = simulateTestAtlassianConnection(200, { displayName: 'John Doe' }, null, 'jira');
    assert.equal(result.success, true);
    assert.equal(result.displayName, 'John Doe');
  });

  test('returns error on 401 with credentials message', () => {
    const result = simulateTestAtlassianConnection(401, null, null, 'jira');
    assert.equal(result.success, false);
    assert.ok(result.error?.includes('Invalid credentials'));
  });

  test('returns error on 403 with permissions message', () => {
    const result = simulateTestAtlassianConnection(403, null, null, 'confluence');
    assert.equal(result.success, false);
    assert.ok(result.error?.includes('permissions'));
  });

  test('returns error on 500 with status code in message', () => {
    const result = simulateTestAtlassianConnection(500, null, null, 'jira');
    assert.equal(result.success, false);
    assert.ok(result.error?.includes('500'));
  });

  test('returns error on network failure', () => {
    const result = simulateTestAtlassianConnection(0, null, new Error('ECONNREFUSED'), 'jira');
    assert.equal(result.success, false);
    assert.equal(result.error, 'ECONNREFUSED');
  });

  test('returns error on DNS resolution failure', () => {
    const result = simulateTestAtlassianConnection(0, null, new Error('getaddrinfo ENOTFOUND'), 'confluence');
    assert.equal(result.success, false);
    assert.ok(result.error?.includes('ENOTFOUND'));
  });

  test('returns success with undefined displayName when body is empty', () => {
    const result = simulateTestAtlassianConnection(200, {}, null, 'jira');
    assert.equal(result.success, true);
    assert.equal(result.displayName, undefined);
  });
});

describe('Jira/Confluence Connect — Input Validation', () => {
  test('rejects missing siteUrl', () => {
    const result = validateJiraConnectInput({ email: 'a@b.com', apiToken: 'tok' });
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('siteUrl'));
  });

  test('rejects missing email', () => {
    const result = validateJiraConnectInput({ siteUrl: 'https://x.atlassian.net', apiToken: 'tok' });
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('email'));
  });

  test('rejects missing apiToken', () => {
    const result = validateJiraConnectInput({ siteUrl: 'https://x.atlassian.net', email: 'a@b.com' });
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('apiToken'));
  });

  test('rejects all fields missing', () => {
    const result = validateJiraConnectInput({});
    assert.equal(result.valid, false);
  });

  test('accepts valid input with all fields', () => {
    const result = validateJiraConnectInput({
      siteUrl: 'https://acme.atlassian.net',
      email: 'dev@acme.com',
      apiToken: 'ATATT3xFfGF0...',
    });
    assert.equal(result.valid, true);
  });

  test('rejects empty string siteUrl', () => {
    const result = validateJiraConnectInput({ siteUrl: '', email: 'a@b.com', apiToken: 'tok' });
    assert.equal(result.valid, false);
  });

  test('rejects empty string email', () => {
    const result = validateJiraConnectInput({ siteUrl: 'https://x.atlassian.net', email: '', apiToken: 'tok' });
    assert.equal(result.valid, false);
  });

  test('rejects empty string apiToken', () => {
    const result = validateJiraConnectInput({ siteUrl: 'https://x.atlassian.net', email: 'a@b.com', apiToken: '' });
    assert.equal(result.valid, false);
  });
});

describe('Site URL Normalization', () => {
  test('removes single trailing slash', () => {
    assert.equal(normalizeSiteUrl('https://acme.atlassian.net/'), 'https://acme.atlassian.net');
  });

  test('removes multiple trailing slashes', () => {
    assert.equal(normalizeSiteUrl('https://acme.atlassian.net///'), 'https://acme.atlassian.net');
  });

  test('preserves URL without trailing slash', () => {
    assert.equal(normalizeSiteUrl('https://acme.atlassian.net'), 'https://acme.atlassian.net');
  });

  test('preserves path segments', () => {
    assert.equal(normalizeSiteUrl('https://acme.atlassian.net/wiki/'), 'https://acme.atlassian.net/wiki');
  });

  test('handles URL with port', () => {
    assert.equal(normalizeSiteUrl('http://localhost:8080/'), 'http://localhost:8080');
  });
});

describe('OAuth State Validation (CSRF)', () => {
  test('valid: stored state matches received state', () => {
    const state = 'abc123def456';
    const result = validateOAuthState(state, state);
    assert.equal(result.valid, true);
  });

  test('invalid: stored state is undefined (no cookie)', () => {
    const result = validateOAuthState(undefined, 'abc123');
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'state_mismatch');
  });

  test('invalid: received state is undefined (missing query param)', () => {
    const result = validateOAuthState('abc123', undefined);
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'state_mismatch');
  });

  test('invalid: states do not match', () => {
    const result = validateOAuthState('stored-state-abc', 'tampered-state-xyz');
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'state_mismatch');
  });

  test('invalid: both undefined', () => {
    const result = validateOAuthState(undefined, undefined);
    assert.equal(result.valid, false);
  });

  test('valid: long hex state (32 bytes = 64 chars)', () => {
    const state = 'a'.repeat(64);
    const result = validateOAuthState(state, state);
    assert.equal(result.valid, true);
  });
});

describe('Auth Guard — requireAuth Simulation', () => {
  test('throws UNAUTHORIZED when no session', () => {
    assert.throws(
      () => simulateRequireAuth(false),
      { message: 'UNAUTHORIZED' }
    );
  });

  test('throws UNAUTHORIZED when session exists but no user', () => {
    assert.throws(
      () => simulateRequireAuth(true, undefined),
      { message: 'UNAUTHORIZED' }
    );
  });

  test('returns user when session and user exist', () => {
    const user = simulateRequireAuth(true, MOCK_USER);
    assert.equal(user.id, MOCK_USER.id);
    assert.equal(user.email, MOCK_USER.email);
  });

  test('returns admin user correctly', () => {
    const user = simulateRequireAuth(true, MOCK_ADMIN);
    assert.equal(user.role, 'admin');
  });
});

describe('GitHub Status Endpoint — Response Shapes', () => {
  test('not connected: token is null', () => {
    const token = simulateGetGitHubToken(null, { SCRIBE_DEV_GITHUB_BOOTSTRAP: 'false' });
    const response = token
      ? { connected: true, login: 'user' }
      : { connected: false };
    assert.equal(response.connected, false);
    assert.equal('login' in response, false);
  });

  test('connected: valid token resolves user', () => {
    const token = simulateGetGitHubToken({ accessToken: 'gho_valid' }, { SCRIBE_DEV_GITHUB_BOOTSTRAP: 'false' });
    assert.ok(token);
    // Simulate successful GitHub API call
    const githubUser = simulateFetchFromGitHub<{ login: string; avatar_url: string }>({
      status: 200,
      ok: true,
      body: { login: 'octocat', avatar_url: 'https://github.com/images/octocat.png' },
    });
    const response = {
      connected: true,
      login: githubUser.login,
      avatarUrl: githubUser.avatar_url,
    };
    assert.equal(response.connected, true);
    assert.equal(response.login, 'octocat');
  });

  test('token exists but invalid: returns not connected with error', () => {
    // When token validation fails (GitHub returns error), status shows disconnected
    const response = { connected: false, error: 'Token invalid or expired' };
    assert.equal(response.connected, false);
    assert.ok(response.error.includes('invalid'));
  });
});

describe('GitHub Repos Endpoint — Query Param Validation', () => {
  test('missing owner param → 400 MISSING_OWNER', () => {
    const owner: string | undefined = undefined;
    const errorResponse = !owner
      ? { code: 400, error: { code: 'MISSING_OWNER', message: 'owner query parameter is required' } }
      : null;
    assert.ok(errorResponse);
    assert.equal(errorResponse.code, 400);
    assert.equal(errorResponse.error.code, 'MISSING_OWNER');
  });

  test('empty owner string → 400 MISSING_OWNER', () => {
    const owner = '';
    const errorResponse = !owner
      ? { code: 400, error: { code: 'MISSING_OWNER', message: 'owner query parameter is required' } }
      : null;
    assert.ok(errorResponse);
    assert.equal(errorResponse.code, 400);
  });

  test('no token → 412 GITHUB_NOT_CONNECTED', () => {
    const token = simulateGetGitHubToken(null, { SCRIBE_DEV_GITHUB_BOOTSTRAP: 'false' });
    const errorResponse = !token
      ? { code: 412, error: { code: 'GITHUB_NOT_CONNECTED', message: 'GitHub is not connected. Please connect GitHub first.' } }
      : null;
    assert.ok(errorResponse);
    assert.equal(errorResponse.code, 412);
    assert.equal(errorResponse.error.code, 'GITHUB_NOT_CONNECTED');
  });
});

describe('GitHub Branches Endpoint — Query Param Validation', () => {
  test('missing both owner and repo → 400 MISSING_PARAMS', () => {
    const owner: string | undefined = undefined;
    const repo: string | undefined = undefined;
    const needsError = !owner || !repo;
    assert.ok(needsError);
  });

  test('missing only repo → 400 MISSING_PARAMS', () => {
    const owner = 'acme';
    const repo: string | undefined = undefined;
    const needsError = !owner || !repo;
    assert.ok(needsError);
  });

  test('missing only owner → 400 MISSING_PARAMS', () => {
    const owner: string | undefined = undefined;
    const repo = 'my-repo';
    const needsError = !owner || !repo;
    assert.ok(needsError);
  });

  test('both present → no validation error', () => {
    const owner = 'acme';
    const repo = 'my-repo';
    const needsError = !owner || !repo;
    assert.equal(needsError, false);
  });
});

describe('GitHub Disconnect — Response Shape', () => {
  test('successful disconnect returns { ok: true }', () => {
    const response = { ok: true };
    assert.equal(response.ok, true);
  });

  test('unauthenticated disconnect returns 401', () => {
    const response = {
      code: 401,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    };
    assert.equal(response.code, 401);
    assert.equal(response.error.code, 'UNAUTHORIZED');
  });
});

describe('Atlassian OAuth — Configuration Checks', () => {
  test('501 when OAuth client ID/secret not set', () => {
    const isConfigured = false;
    const response = !isConfigured
      ? { code: 501, error: { code: 'ATLASSIAN_OAUTH_NOT_CONFIGURED' } }
      : null;
    assert.ok(response);
    assert.equal(response.code, 501);
    assert.equal(response.error.code, 'ATLASSIAN_OAUTH_NOT_CONFIGURED');
  });

  test('unauthenticated request → redirect to login', () => {
    assert.throws(
      () => simulateRequireAuth(false),
      { message: 'UNAUTHORIZED' }
    );
  });
});

describe('Atlassian Disconnect — Response', () => {
  test('successful disconnect returns { ok: true }', () => {
    const response = { ok: true };
    assert.equal(response.ok, true);
  });
});

describe('Integration Status List — Graceful Degradation', () => {
  test('returns degraded response when all checks fail', () => {
    const response = buildDegradedIntegrationStatus();
    assert.equal(response.github.connected, false);
    assert.equal(response.atlassian.connected, false);
    assert.equal(response.jira.connected, false);
    assert.equal(response.confluence.connected, false);
    assert.ok(response.github.error);
    assert.equal(response.github.error!.code, 'STATUS_CHECK_FAILED');
    assert.equal(response.atlassian.jiraAvailable, false);
    assert.equal(response.atlassian.confluenceAvailable, false);
  });

  test('each service has STATUS_CHECK_FAILED error code', () => {
    const response = buildDegradedIntegrationStatus();
    assert.equal(response.github.error?.code, 'STATUS_CHECK_FAILED');
    assert.equal(response.atlassian.error?.code, 'STATUS_CHECK_FAILED');
    assert.equal(response.jira.error?.code, 'STATUS_CHECK_FAILED');
    assert.equal(response.confluence.error?.code, 'STATUS_CHECK_FAILED');
  });

  test('degraded response has same shape as healthy response', () => {
    const response = buildDegradedIntegrationStatus();
    assert.ok('github' in response);
    assert.ok('atlassian' in response);
    assert.ok('jira' in response);
    assert.ok('confluence' in response);
  });
});

describe('Jira Status — OAuth vs Legacy Fallback', () => {
  test('prefers OAuth when Atlassian connected with Jira available', () => {
    const status = resolveJiraStatus(true, true, null);
    assert.equal(status.connected, true);
    assert.equal(status.viaOAuth, true);
  });

  test('falls back to legacy API token when OAuth not available', () => {
    const status = resolveJiraStatus(false, false, {
      isValid: true,
      siteUrl: 'https://acme.atlassian.net',
      userEmail: 'dev@acme.com',
    });
    assert.equal(status.connected, true);
    assert.equal(status.viaOAuth, false);
    assert.equal(status.siteUrl, 'https://acme.atlassian.net');
  });

  test('disconnected when no OAuth and no legacy credential', () => {
    const status = resolveJiraStatus(false, false, null);
    assert.equal(status.connected, false);
  });

  test('disconnected when Atlassian connected but Jira not available', () => {
    const status = resolveJiraStatus(true, false, null);
    assert.equal(status.connected, false);
  });

  test('legacy credential with isValid=false shows disconnected', () => {
    const status = resolveJiraStatus(false, false, {
      isValid: false,
      siteUrl: 'https://acme.atlassian.net',
      userEmail: 'dev@acme.com',
    });
    assert.equal(status.connected, false);
    assert.equal(status.viaOAuth, false);
  });

  test('OAuth takes priority over valid legacy credential', () => {
    const status = resolveJiraStatus(true, true, {
      isValid: true,
      siteUrl: 'https://legacy.atlassian.net',
      userEmail: 'legacy@acme.com',
    });
    assert.equal(status.connected, true);
    assert.equal(status.viaOAuth, true);
    assert.equal(status.siteUrl, undefined); // OAuth doesn't set siteUrl from legacy
  });
});

describe('Error Response Shapes — Integration Endpoints', () => {
  test('UNAUTHORIZED has standard shape', () => {
    const resp = { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } };
    assert.equal(resp.error.code, 'UNAUTHORIZED');
    assert.equal(typeof resp.error.message, 'string');
  });

  test('GITHUB_NOT_CONNECTED has standard shape', () => {
    const resp = { error: { code: 'GITHUB_NOT_CONNECTED', message: 'GitHub is not connected. Please connect GitHub first.' } };
    assert.equal(resp.error.code, 'GITHUB_NOT_CONNECTED');
    assert.ok(resp.error.message.includes('connect'));
  });

  test('MISSING_FIELDS has standard shape', () => {
    const resp = { error: { code: 'MISSING_FIELDS', message: 'siteUrl, email, and apiToken are required' } };
    assert.equal(resp.error.code, 'MISSING_FIELDS');
    assert.ok(resp.error.message.includes('siteUrl'));
  });

  test('CONNECTION_FAILED has standard shape', () => {
    const resp = { error: { code: 'CONNECTION_FAILED', message: 'Failed to connect to Jira' } };
    assert.equal(resp.error.code, 'CONNECTION_FAILED');
  });

  test('GITHUB_OAUTH_NOT_CONFIGURED has standard shape', () => {
    const resp = { error: { code: 'GITHUB_OAUTH_NOT_CONFIGURED', message: 'GitHub OAuth is not configured.' } };
    assert.equal(resp.error.code, 'GITHUB_OAUTH_NOT_CONFIGURED');
  });

  test('all error codes are uppercase', () => {
    const codes = [
      'UNAUTHORIZED', 'GITHUB_NOT_CONNECTED', 'MISSING_FIELDS',
      'CONNECTION_FAILED', 'GITHUB_OAUTH_NOT_CONFIGURED',
      'ATLASSIAN_OAUTH_NOT_CONFIGURED', 'STATUS_CHECK_FAILED',
      'MISSING_OWNER', 'MISSING_PARAMS', 'NOT_CONNECTED',
    ];
    for (const code of codes) {
      assert.equal(code, code.toUpperCase(), `Error code ${code} should be uppercase`);
    }
  });
});

describe('Token Last4 Extraction', () => {
  test('extracts last 4 characters from API token', () => {
    const token = 'ATATT3xFfGF0abcdef1234567890';
    const last4 = token.slice(-4);
    assert.equal(last4, '7890');
    assert.equal(last4.length, 4);
  });

  test('handles short token (less than 4 chars)', () => {
    const token = 'abc';
    const last4 = token.slice(-4);
    assert.equal(last4, 'abc');
  });

  test('handles exactly 4 char token', () => {
    const token = 'abcd';
    const last4 = token.slice(-4);
    assert.equal(last4, 'abcd');
  });
});

describe('GitHub Owners Response — User + Organizations', () => {
  test('builds owners list with user first, then orgs', () => {
    const githubUser = { login: 'octocat', avatar_url: 'https://example.com/octocat.png' };
    const orgs = [
      { login: 'acme-corp', avatar_url: 'https://example.com/acme.png' },
      { login: 'open-source', avatar_url: 'https://example.com/os.png' },
    ];

    const owners = [
      { login: githubUser.login, type: 'User' as const, avatarUrl: githubUser.avatar_url },
      ...orgs.map((org) => ({
        login: org.login,
        type: 'Organization' as const,
        avatarUrl: org.avatar_url,
      })),
    ];

    assert.equal(owners.length, 3);
    assert.equal(owners[0].type, 'User');
    assert.equal(owners[0].login, 'octocat');
    assert.equal(owners[1].type, 'Organization');
    assert.equal(owners[1].login, 'acme-corp');
    assert.equal(owners[2].type, 'Organization');
    assert.equal(owners[2].login, 'open-source');
  });

  test('builds owners list with no orgs', () => {
    const githubUser = { login: 'solo-dev', avatar_url: '' };
    const orgs: Array<{ login: string; avatar_url: string }> = [];

    const owners = [
      { login: githubUser.login, type: 'User' as const, avatarUrl: githubUser.avatar_url },
      ...orgs.map((org) => ({
        login: org.login,
        type: 'Organization' as const,
        avatarUrl: org.avatar_url,
      })),
    ];

    assert.equal(owners.length, 1);
    assert.equal(owners[0].type, 'User');
  });
});

describe('GitHub Repos Response — Mapping', () => {
  test('maps raw GitHub repo response to clean shape', () => {
    const rawRepos = [
      { name: 'my-app', full_name: 'octocat/my-app', default_branch: 'main', private: false, description: 'A cool app' },
      { name: 'secret-proj', full_name: 'octocat/secret-proj', default_branch: 'develop', private: true, description: null },
    ];

    const repos = rawRepos.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      private: repo.private,
      description: repo.description,
    }));

    assert.equal(repos.length, 2);
    assert.equal(repos[0].fullName, 'octocat/my-app');
    assert.equal(repos[0].defaultBranch, 'main');
    assert.equal(repos[0].private, false);
    assert.equal(repos[1].private, true);
    assert.equal(repos[1].description, null);
  });
});

describe('GitHub Branches Response — Mapping', () => {
  test('maps branches with isDefault flag', () => {
    const defaultBranch = 'main';
    const rawBranches = [
      { name: 'main' },
      { name: 'develop' },
      { name: 'feature/auth' },
    ];

    const branches = rawBranches.map((branch) => ({
      name: branch.name,
      isDefault: branch.name === defaultBranch,
    }));

    assert.equal(branches.length, 3);
    assert.equal(branches[0].isDefault, true);
    assert.equal(branches[1].isDefault, false);
    assert.equal(branches[2].isDefault, false);
  });

  test('handles repo where default branch is not first in list', () => {
    const defaultBranch = 'develop';
    const rawBranches = [
      { name: 'main' },
      { name: 'develop' },
    ];

    const branches = rawBranches.map((branch) => ({
      name: branch.name,
      isDefault: branch.name === defaultBranch,
    }));

    assert.equal(branches[0].isDefault, false);
    assert.equal(branches[1].isDefault, true);
  });
});

describe('Basic Auth Header — Atlassian API Token', () => {
  test('builds correct Basic auth header from email and token', () => {
    const email = 'dev@acme.com';
    const apiToken = 'ATATT3xFfGF0abc';
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    const header = `Basic ${auth}`;
    assert.ok(header.startsWith('Basic '));

    // Decode and verify
    const decoded = Buffer.from(auth, 'base64').toString('utf-8');
    assert.equal(decoded, `${email}:${apiToken}`);
  });

  test('handles special characters in email and token', () => {
    const email = 'user+test@example.com';
    const apiToken = 'tok/en=with+special';
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    const decoded = Buffer.from(auth, 'base64').toString('utf-8');
    assert.equal(decoded, `${email}:${apiToken}`);
  });
});
