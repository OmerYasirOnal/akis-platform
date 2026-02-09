/**
 * Contract tests for user-ai-keys pure helpers
 * Re-creates normalizeApiKey and buildScope logic
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── Re-create helpers from user-ai-keys.ts ─────────────────────

type AIKeyProvider = 'openai' | 'openrouter';

function normalizeApiKey(key: string): string {
  return key.trim();
}

function buildScope(userId: string, provider: AIKeyProvider): string {
  return `${userId}:${provider}`;
}

type AIKeyStatus = {
  provider: AIKeyProvider;
  configured: boolean;
  last4: string | null;
  updatedAt: string | null;
};

type MultiProviderStatus = {
  activeProvider: AIKeyProvider | null;
  providers: {
    openai: Omit<AIKeyStatus, 'provider'>;
    openrouter: Omit<AIKeyStatus, 'provider'>;
  };
};

function buildMultiProviderStatus(
  activeProvider: AIKeyProvider | null,
  openai: Omit<AIKeyStatus, 'provider'>,
  openrouter: Omit<AIKeyStatus, 'provider'>,
): MultiProviderStatus {
  return { activeProvider, providers: { openai, openrouter } };
}

// ─── normalizeApiKey ──────────────────────────────────────────────

describe('normalizeApiKey', () => {
  it('trims leading whitespace', () => {
    assert.equal(normalizeApiKey('  sk-abc123'), 'sk-abc123');
  });

  it('trims trailing whitespace', () => {
    assert.equal(normalizeApiKey('sk-abc123  '), 'sk-abc123');
  });

  it('trims both sides', () => {
    assert.equal(normalizeApiKey('  sk-abc123  '), 'sk-abc123');
  });

  it('trims newlines and tabs', () => {
    assert.equal(normalizeApiKey('\nsk-abc123\t'), 'sk-abc123');
  });

  it('preserves internal whitespace', () => {
    assert.equal(normalizeApiKey('sk abc'), 'sk abc');
  });

  it('handles empty string', () => {
    assert.equal(normalizeApiKey(''), '');
  });

  it('handles already clean key', () => {
    assert.equal(normalizeApiKey('sk-proj-abc123'), 'sk-proj-abc123');
  });
});

// ─── buildScope ───────────────────────────────────────────────────

describe('buildScope (user-ai-keys)', () => {
  it('builds userId:provider scope', () => {
    assert.equal(buildScope('user-1', 'openai'), 'user-1:openai');
  });

  it('builds scope for openrouter', () => {
    assert.equal(buildScope('user-2', 'openrouter'), 'user-2:openrouter');
  });

  it('handles UUID userId', () => {
    assert.equal(
      buildScope('550e8400-e29b-41d4-a716-446655440000', 'openai'),
      '550e8400-e29b-41d4-a716-446655440000:openai',
    );
  });
});

// ─── MultiProviderStatus shape ────────────────────────────────────

describe('MultiProviderStatus contract', () => {
  const unconfigured = { configured: false, last4: null, updatedAt: null };
  const configured = { configured: true, last4: 'b123', updatedAt: '2025-01-15T00:00:00Z' };

  it('activeProvider is null when never set', () => {
    const status = buildMultiProviderStatus(null, unconfigured, unconfigured);
    assert.equal(status.activeProvider, null);
  });

  it('both providers unconfigured', () => {
    const status = buildMultiProviderStatus(null, unconfigured, unconfigured);
    assert.equal(status.providers.openai.configured, false);
    assert.equal(status.providers.openrouter.configured, false);
  });

  it('openai configured, openrouter not', () => {
    const status = buildMultiProviderStatus('openai', configured, unconfigured);
    assert.equal(status.activeProvider, 'openai');
    assert.equal(status.providers.openai.configured, true);
    assert.equal(status.providers.openai.last4, 'b123');
    assert.equal(status.providers.openrouter.configured, false);
  });

  it('both providers configured', () => {
    const status = buildMultiProviderStatus('openrouter', configured, configured);
    assert.equal(status.activeProvider, 'openrouter');
    assert.equal(status.providers.openai.configured, true);
    assert.equal(status.providers.openrouter.configured, true);
  });

  it('last4 extraction from key (last 4 chars)', () => {
    const key = 'sk-proj-abc123def456xyz';
    const last4 = key.slice(-4);
    assert.equal(last4, '6xyz');
    assert.equal(last4.length, 4);
  });
});
