/**
 * Unit Tests for Actor Context System
 * 
 * Tests actor resolution with different scenarios:
 * - OAuth user only
 * - GitHub App only
 * - Both available
 * - None available
 * - Fallback disabled
 */

import { resolveActorOrFallback, isAppBotFallbackEnabled, getCommitAuthor, getActorBanner } from '@/lib/auth/actor';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Actor Resolution', () => {
  test('resolves as oauth_user when user token and userId provided', () => {
    const actor = resolveActorOrFallback({
      userToken: 'ghp_test123',
      userId: 'user-123',
      githubLogin: 'testuser',
      correlationId: 'test-001',
    });

    expect(actor.mode).toBe('oauth_user');
    expect(actor.userId).toBe('user-123');
    expect(actor.githubLogin).toBe('testuser');
    expect(actor.correlationId).toBe('test-001');
  });

  test('resolves as app_bot when only installationId provided and fallback enabled', () => {
    process.env.SCRIBE_ALLOW_APP_BOT_FALLBACK = 'true';

    const actor = resolveActorOrFallback({
      installationId: 12345,
      correlationId: 'test-002',
    });

    expect(actor.mode).toBe('app_bot');
    expect(actor.installationId).toBe(12345);
    expect(actor.githubLogin).toBe('akis-app[bot]');
  });

  test('resolves as app_bot from environment when no options provided', () => {
    process.env.SCRIBE_ALLOW_APP_BOT_FALLBACK = 'true';
    process.env.GITHUB_APP_INSTALLATION_ID = '99999';

    const actor = resolveActorOrFallback({
      correlationId: 'test-003',
    });

    expect(actor.mode).toBe('app_bot');
    expect(actor.installationId).toBe(99999);
  });

  test('prefers oauth_user over app_bot when both available', () => {
    process.env.GITHUB_APP_INSTALLATION_ID = '99999';

    const actor = resolveActorOrFallback({
      userToken: 'ghp_test123',
      userId: 'user-123',
      githubLogin: 'testuser',
      installationId: 12345,
    });

    expect(actor.mode).toBe('oauth_user');
    expect(actor.userId).toBe('user-123');
    expect(actor.installationId).toBe(12345); // Should still be included
  });

  test('throws error when no auth available and fallback enabled', () => {
    process.env.SCRIBE_ALLOW_APP_BOT_FALLBACK = 'true';
    delete process.env.GITHUB_APP_INSTALLATION_ID;

    expect(() => {
      resolveActorOrFallback({});
    }).toThrow('Authentication required');
  });

  test('throws error when fallback disabled', () => {
    process.env.SCRIBE_ALLOW_APP_BOT_FALLBACK = 'false';
    process.env.GITHUB_APP_INSTALLATION_ID = '99999';

    expect(() => {
      resolveActorOrFallback({
        installationId: 12345,
      });
    }).toThrow('app_bot fallback is disabled');
  });
});

describe('isAppBotFallbackEnabled', () => {
  test('returns true by default', () => {
    delete process.env.SCRIBE_ALLOW_APP_BOT_FALLBACK;
    expect(isAppBotFallbackEnabled()).toBe(true);
  });

  test('returns false when explicitly disabled', () => {
    process.env.SCRIBE_ALLOW_APP_BOT_FALLBACK = 'false';
    expect(isAppBotFallbackEnabled()).toBe(false);
  });

  test('returns true when explicitly enabled', () => {
    process.env.SCRIBE_ALLOW_APP_BOT_FALLBACK = 'true';
    expect(isAppBotFallbackEnabled()).toBe(true);
  });
});

describe('getCommitAuthor', () => {
  test('returns user email for oauth_user mode', () => {
    const actor = {
      mode: 'oauth_user' as const,
      userId: 'user-123',
      githubLogin: 'testuser',
    };

    const author = getCommitAuthor(actor);
    expect(author.name).toBe('testuser');
    expect(author.email).toBe('testuser@users.noreply.github.com');
  });

  test('returns app bot email for app_bot mode', () => {
    const actor = {
      mode: 'app_bot' as const,
      installationId: 12345,
    };

    const author = getCommitAuthor(actor);
    expect(author.name).toBe('AKIS Scribe Agent');
    expect(author.email).toBe('akis-scribe[bot]@users.noreply.github.com');
  });

  test('returns service account email for service_account mode', () => {
    const actor = {
      mode: 'service_account' as const,
    };

    const author = getCommitAuthor(actor);
    expect(author.name).toBe('AKIS Service');
    expect(author.email).toBe('service@akis.dev');
  });

  test('handles missing githubLogin in oauth_user mode', () => {
    const actor = {
      mode: 'oauth_user' as const,
      userId: 'user-123',
    };

    const author = getCommitAuthor(actor);
    expect(author.name).toBe('AKIS User');
    expect(author.email).toBe('noreply@akis.dev');
  });
});

describe('getActorBanner', () => {
  test('returns banner for app_bot mode', () => {
    const actor = {
      mode: 'app_bot' as const,
      installationId: 12345,
    };

    const banner = getActorBanner(actor);
    expect(banner).not.toBeNull();
    expect(banner?.type).toBe('info');
    expect(banner?.text).toContain('AKIS App bot');
    expect(banner?.text).toContain('12345');
  });

  test('returns null for oauth_user mode', () => {
    const actor = {
      mode: 'oauth_user' as const,
      userId: 'user-123',
    };

    const banner = getActorBanner(actor);
    expect(banner).toBeNull();
  });

  test('returns null for service_account mode', () => {
    const actor = {
      mode: 'service_account' as const,
    };

    const banner = getActorBanner(actor);
    expect(banner).toBeNull();
  });
});

