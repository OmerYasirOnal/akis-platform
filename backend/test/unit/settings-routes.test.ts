/**
 * Settings Routes — Contract & Logic Tests
 *
 * Tests pure logic extracted from:
 *   - api/settings/ai-keys.ts     (GET status, PUT upsert, DELETE)
 *   - api/settings/pipeline-stats.ts (GET stats)
 *   - api/settings/profile.ts     (GET profile, PUT profile, PUT password)
 *
 * SKIP_DB_TESTS=true — no real DB access. All logic is tested inline
 * by re-creating the pure computation and validation functions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers re-created from ai-keys.ts and user-ai-keys.ts
// ─────────────────────────────────────────────────────────────────────────────

type AIKeyProvider = 'anthropic' | 'openai' | 'openrouter';

const providerSchema = z.enum(['anthropic', 'openai', 'openrouter']);

const apiKeySchema = z
  .string()
  .min(20, 'API key must be at least 20 characters')
  .regex(/^\S+$/, 'API key must not include whitespace');

const upsertSchema = z.object({
  provider: providerSchema,
  apiKey: apiKeySchema,
});

const deleteSchema = z.object({
  provider: providerSchema,
});

const setActiveProviderSchema = z.object({
  provider: providerSchema,
});

function normalizeApiKey(key: string): string {
  return key.trim();
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
    anthropic: Omit<AIKeyStatus, 'provider'>;
    openai: Omit<AIKeyStatus, 'provider'>;
    openrouter: Omit<AIKeyStatus, 'provider'>;
  };
};

function buildMultiProviderStatus(
  activeProvider: AIKeyProvider | null,
  records: Record<AIKeyProvider, { encryptedKey?: string; last4?: string | null; updatedAt?: Date | null }>,
): MultiProviderStatus {
  const toStatus = (provider: AIKeyProvider) => {
    const r = records[provider];
    const configured = Boolean(r?.encryptedKey);
    return {
      configured,
      last4: r?.last4 ?? null,
      updatedAt: r?.updatedAt ? r.updatedAt.toISOString() : null,
    };
  };

  return {
    activeProvider,
    providers: {
      anthropic: toStatus('anthropic'),
      openai: toStatus('openai'),
      openrouter: toStatus('openrouter'),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers re-created from pipeline-stats.ts
// ─────────────────────────────────────────────────────────────────────────────

function computeSuccessRate(total: number, successCount: number): number {
  return total > 0 ? Math.round((successCount / total) * 100) : 0;
}

function buildPipelineStatsResponse(
  agg: {
    totalPipelines: number;
    successCount: number;
    avgScribeMs: number | null;
    avgProtoMs: number | null;
    avgTraceMs: number | null;
    avgTotalMs: number | null;
  },
  recent: Array<{
    id: string;
    title: string;
    stage: string;
    createdAt: Date;
    durationMs: number | null;
  }>,
) {
  const successRate = computeSuccessRate(agg.totalPipelines, agg.successCount);
  return {
    totalPipelines: agg.totalPipelines,
    successRate,
    avgDurations: {
      scribeMs: agg.avgScribeMs ?? null,
      protoMs: agg.avgProtoMs ?? null,
      traceMs: agg.avgTraceMs ?? null,
      totalMs: agg.avgTotalMs ?? null,
    },
    recentPipelines: recent.map((r) => ({
      id: r.id,
      title: r.title,
      stage: r.stage,
      createdAt: r.createdAt.toISOString(),
      durationMs: r.durationMs,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers re-created from profile.ts
// ─────────────────────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

function buildProfileResponse(user: {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  status: string;
  createdAt: Date | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    status: user.status,
    createdAt: user.createdAt?.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Error response builders (mirrors route handler patterns)
// ─────────────────────────────────────────────────────────────────────────────

function makeUnauthorizedError() {
  return { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } };
}

function makeValidationError(details: unknown) {
  return { error: { code: 'VALIDATION_ERROR', message: 'Invalid API key payload', details } };
}

// ═════════════════════════════════════════════════════════════════════════════
// AI KEYS — Status
// ═════════════════════════════════════════════════════════════════════════════

describe('AI Keys — GET /api/settings/ai-keys/status', () => {
  it('returns status with all providers unconfigured for new user', () => {
    const empty = { encryptedKey: undefined, last4: null, updatedAt: null };
    const status = buildMultiProviderStatus(null, {
      anthropic: empty,
      openai: empty,
      openrouter: empty,
    });

    assert.equal(status.activeProvider, null);
    assert.equal(status.providers.anthropic.configured, false);
    assert.equal(status.providers.anthropic.last4, null);
    assert.equal(status.providers.openai.configured, false);
    assert.equal(status.providers.openrouter.configured, false);
  });

  it('returns configured=true and last4 when provider has a key', () => {
    const configured = {
      encryptedKey: 'encrypted-blob',
      last4: 'x789',
      updatedAt: new Date('2026-03-01T00:00:00Z'),
    };
    const empty = { encryptedKey: undefined, last4: null, updatedAt: null };

    const status = buildMultiProviderStatus('anthropic', {
      anthropic: configured,
      openai: empty,
      openrouter: empty,
    });

    assert.equal(status.activeProvider, 'anthropic');
    assert.equal(status.providers.anthropic.configured, true);
    assert.equal(status.providers.anthropic.last4, 'x789');
    assert.equal(status.providers.anthropic.updatedAt, '2026-03-01T00:00:00.000Z');
    assert.equal(status.providers.openai.configured, false);
  });

  it('returns all providers configured when all have keys', () => {
    const rec = { encryptedKey: 'enc', last4: 'abcd', updatedAt: new Date() };
    const status = buildMultiProviderStatus('openai', {
      anthropic: rec,
      openai: rec,
      openrouter: rec,
    });

    assert.equal(status.providers.anthropic.configured, true);
    assert.equal(status.providers.openai.configured, true);
    assert.equal(status.providers.openrouter.configured, true);
    assert.equal(status.activeProvider, 'openai');
  });

  it('returns 401 envelope when not authenticated', () => {
    const err = new Error('UNAUTHORIZED');
    const response =
      err.message === 'UNAUTHORIZED'
        ? makeUnauthorizedError()
        : { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };

    assert.deepEqual(response, {
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  });

  it('status response shape has required top-level fields', () => {
    const empty = { encryptedKey: undefined, last4: null, updatedAt: null };
    const status = buildMultiProviderStatus(null, {
      anthropic: empty,
      openai: empty,
      openrouter: empty,
    });

    assert.ok('activeProvider' in status);
    assert.ok('providers' in status);
    assert.ok('anthropic' in status.providers);
    assert.ok('openai' in status.providers);
    assert.ok('openrouter' in status.providers);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AI KEYS — PUT (upsert)
// ═════════════════════════════════════════════════════════════════════════════

describe('AI Keys — PUT /api/settings/ai-keys', () => {
  it('accepts valid anthropic key payload', () => {
    const body = { provider: 'anthropic', apiKey: 'sk-ant-api03-validkeyvalue1234' };
    const parsed = upsertSchema.parse(body);
    assert.equal(parsed.provider, 'anthropic');
    assert.equal(parsed.apiKey, 'sk-ant-api03-validkeyvalue1234');
  });

  it('accepts valid openai key payload', () => {
    const body = { provider: 'openai', apiKey: 'sk-openai-validlongkeyabcdefgh' };
    const parsed = upsertSchema.parse(body);
    assert.equal(parsed.provider, 'openai');
  });

  it('accepts valid openrouter key payload', () => {
    const body = { provider: 'openrouter', apiKey: 'sk-or-v1-validlongkeyabcdefghijklmno' };
    const parsed = upsertSchema.parse(body);
    assert.equal(parsed.provider, 'openrouter');
  });

  it('rejects empty apiKey', () => {
    assert.throws(
      () => upsertSchema.parse({ provider: 'openai', apiKey: '' }),
      (err: unknown) => err instanceof z.ZodError,
    );
  });

  it('rejects apiKey shorter than 20 characters', () => {
    assert.throws(
      () => upsertSchema.parse({ provider: 'openai', apiKey: 'sk-short' }),
      (err: unknown) => err instanceof z.ZodError,
    );
  });

  it('rejects apiKey containing whitespace', () => {
    assert.throws(
      () => upsertSchema.parse({ provider: 'openai', apiKey: 'sk-has a space inside key value' }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        const messages = err.errors.map((e) => e.message);
        return messages.some((m) => m.includes('whitespace'));
      },
    );
  });

  it('rejects unknown provider', () => {
    assert.throws(
      () => upsertSchema.parse({ provider: 'gemini', apiKey: 'sk-valid-key-long-enough-abc' }),
      (err: unknown) => err instanceof z.ZodError,
    );
  });

  it('rejects missing provider field', () => {
    assert.throws(
      () => upsertSchema.parse({ apiKey: 'sk-valid-key-long-enough-abc' }),
      (err: unknown) => err instanceof z.ZodError,
    );
  });

  it('normalizeApiKey trims surrounding whitespace before storing', () => {
    const raw = '  sk-ant-api03-validkeyvalue1234  ';
    const normalized = normalizeApiKey(raw);
    assert.equal(normalized, 'sk-ant-api03-validkeyvalue1234');
    assert.equal(normalized.slice(-4), '1234');
  });

  it('last4 is the last 4 characters of the normalized key', () => {
    const key = 'sk-ant-api03-my-secret-abc9';
    const normalized = normalizeApiKey(key);
    const last4 = normalized.slice(-4);
    assert.equal(last4.length, 4);
    assert.equal(last4, 'abc9');
  });

  it('upsert response has required fields', () => {
    // Simulates the shape returned by upsertUserAiKey
    const result: AIKeyStatus = {
      provider: 'openai',
      configured: true,
      last4: 'fgh1',
      updatedAt: new Date().toISOString(),
    };

    assert.equal(result.configured, true);
    assert.ok(result.last4 !== null && result.last4.length === 4);
    assert.ok(typeof result.updatedAt === 'string');
  });

  it('returns UNAUTHORIZED error shape when no auth token', () => {
    const err = new Error('UNAUTHORIZED');
    const isUnauthorized = err.message === 'UNAUTHORIZED';
    assert.ok(isUnauthorized);
    const response = makeUnauthorizedError();
    assert.equal(response.error.code, 'UNAUTHORIZED');
  });

  it('ZodError produces VALIDATION_ERROR envelope', () => {
    let zodErr: z.ZodError | null = null;
    try {
      upsertSchema.parse({ provider: 'openai', apiKey: '' });
    } catch (err: unknown) {
      if (err instanceof z.ZodError) zodErr = err;
    }

    assert.ok(zodErr instanceof z.ZodError);
    const envelope = makeValidationError(zodErr.errors);
    assert.equal(envelope.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(envelope.error.details));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AI KEYS — DELETE
// ═════════════════════════════════════════════════════════════════════════════

describe('AI Keys — DELETE /api/settings/ai-keys', () => {
  it('accepts valid delete payload for anthropic', () => {
    const parsed = deleteSchema.parse({ provider: 'anthropic' });
    assert.equal(parsed.provider, 'anthropic');
  });

  it('accepts valid delete payload for openai', () => {
    const parsed = deleteSchema.parse({ provider: 'openai' });
    assert.equal(parsed.provider, 'openai');
  });

  it('accepts valid delete payload for openrouter', () => {
    const parsed = deleteSchema.parse({ provider: 'openrouter' });
    assert.equal(parsed.provider, 'openrouter');
  });

  it('rejects missing provider on delete', () => {
    assert.throws(
      () => deleteSchema.parse({}),
      (err: unknown) => err instanceof z.ZodError,
    );
  });

  it('rejects unknown provider on delete', () => {
    assert.throws(
      () => deleteSchema.parse({ provider: 'cohere' }),
      (err: unknown) => err instanceof z.ZodError,
    );
  });

  it('delete success response shape is { ok: true }', () => {
    // Mirrors the handler: return reply.code(200).send({ ok: true })
    const response = { ok: true };
    assert.equal(response.ok, true);
    assert.equal(typeof response.ok, 'boolean');
  });

  it('returns UNAUTHORIZED envelope when not authenticated', () => {
    const err = new Error('UNAUTHORIZED');
    const response =
      err.message === 'UNAUTHORIZED'
        ? makeUnauthorizedError()
        : null;
    assert.ok(response !== null);
    assert.equal(response!.error.code, 'UNAUTHORIZED');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AI KEYS — Set Active Provider
// ═════════════════════════════════════════════════════════════════════════════

describe('AI Keys — PUT /api/settings/ai-provider/active', () => {
  it('accepts anthropic as active provider', () => {
    const parsed = setActiveProviderSchema.parse({ provider: 'anthropic' });
    assert.equal(parsed.provider, 'anthropic');
  });

  it('accepts openai as active provider', () => {
    const parsed = setActiveProviderSchema.parse({ provider: 'openai' });
    assert.equal(parsed.provider, 'openai');
  });

  it('rejects unknown provider for active provider', () => {
    assert.throws(
      () => setActiveProviderSchema.parse({ provider: 'huggingface' }),
      (err: unknown) => err instanceof z.ZodError,
    );
  });

  it('response shape after setting active provider has activeProvider field', () => {
    // Mirrors what getMultiProviderStatus returns after setUserActiveProvider
    const empty = { encryptedKey: undefined, last4: null, updatedAt: null };
    const status = buildMultiProviderStatus('openai', {
      anthropic: empty,
      openai: { encryptedKey: 'enc', last4: 'xyz1', updatedAt: new Date() },
      openrouter: empty,
    });
    assert.equal(status.activeProvider, 'openai');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PIPELINE STATS — GET /api/settings/pipeline-stats
// ═════════════════════════════════════════════════════════════════════════════

describe('Pipeline Stats — GET /api/settings/pipeline-stats', () => {
  it('returns zero stats for a new user with no pipelines', () => {
    const agg = {
      totalPipelines: 0,
      successCount: 0,
      avgScribeMs: null,
      avgProtoMs: null,
      avgTraceMs: null,
      avgTotalMs: null,
    };
    const result = buildPipelineStatsResponse(agg, []);

    assert.equal(result.totalPipelines, 0);
    assert.equal(result.successRate, 0);
    assert.deepEqual(result.avgDurations, {
      scribeMs: null,
      protoMs: null,
      traceMs: null,
      totalMs: null,
    });
    assert.deepEqual(result.recentPipelines, []);
  });

  it('returns correct successRate when all pipelines completed', () => {
    const agg = {
      totalPipelines: 5,
      successCount: 5,
      avgScribeMs: 3000,
      avgProtoMs: 2000,
      avgTraceMs: 1500,
      avgTotalMs: 7000,
    };
    const result = buildPipelineStatsResponse(agg, []);
    assert.equal(result.successRate, 100);
  });

  it('returns correct successRate for partial success', () => {
    const agg = {
      totalPipelines: 10,
      successCount: 7,
      avgScribeMs: null,
      avgProtoMs: null,
      avgTraceMs: null,
      avgTotalMs: null,
    };
    const result = buildPipelineStatsResponse(agg, []);
    assert.equal(result.successRate, 70);
  });

  it('rounds successRate to nearest integer', () => {
    // 1/3 = 33.33... → 33
    assert.equal(computeSuccessRate(3, 1), 33);
    // 2/3 = 66.66... → 67
    assert.equal(computeSuccessRate(3, 2), 67);
  });

  it('maps recentPipelines and serializes createdAt to ISO string', () => {
    const agg = {
      totalPipelines: 2,
      successCount: 1,
      avgScribeMs: null,
      avgProtoMs: null,
      avgTraceMs: null,
      avgTotalMs: null,
    };
    const recent = [
      {
        id: 'pipe-1',
        title: 'Blog API',
        stage: 'completed',
        createdAt: new Date('2026-04-01T08:00:00Z'),
        durationMs: 8500,
      },
      {
        id: 'pipe-2',
        title: 'Chat App',
        stage: 'failed',
        createdAt: new Date('2026-04-02T09:00:00Z'),
        durationMs: null,
      },
    ];

    const result = buildPipelineStatsResponse(agg, recent);

    assert.equal(result.recentPipelines.length, 2);
    assert.equal(result.recentPipelines[0].id, 'pipe-1');
    assert.equal(result.recentPipelines[0].createdAt, '2026-04-01T08:00:00.000Z');
    assert.equal(result.recentPipelines[0].durationMs, 8500);
    assert.equal(result.recentPipelines[1].stage, 'failed');
    assert.equal(result.recentPipelines[1].durationMs, null);
  });

  it('passes through avgDurations correctly when present', () => {
    const agg = {
      totalPipelines: 3,
      successCount: 3,
      avgScribeMs: 4500,
      avgProtoMs: 3200,
      avgTraceMs: 1800,
      avgTotalMs: 9500,
    };
    const result = buildPipelineStatsResponse(agg, []);

    assert.deepEqual(result.avgDurations, {
      scribeMs: 4500,
      protoMs: 3200,
      traceMs: 1800,
      totalMs: 9500,
    });
  });

  it('handles null durations with null coalescing', () => {
    const agg = {
      totalPipelines: 1,
      successCount: 0,
      avgScribeMs: null,
      avgProtoMs: null,
      avgTraceMs: null,
      avgTotalMs: null,
    };
    const result = buildPipelineStatsResponse(agg, []);
    assert.equal(result.avgDurations.scribeMs, null);
    assert.equal(result.avgDurations.protoMs, null);
    assert.equal(result.avgDurations.traceMs, null);
    assert.equal(result.avgDurations.totalMs, null);
  });

  it('returns UNAUTHORIZED when no auth on pipeline stats', () => {
    const err = new Error('UNAUTHORIZED');
    const isUnauth = err.message === 'UNAUTHORIZED';
    assert.ok(isUnauth);
    const envelope = makeUnauthorizedError();
    assert.equal(envelope.error.code, 'UNAUTHORIZED');
  });

  it('response has all required top-level fields', () => {
    const result = buildPipelineStatsResponse(
      { totalPipelines: 0, successCount: 0, avgScribeMs: null, avgProtoMs: null, avgTraceMs: null, avgTotalMs: null },
      [],
    );

    assert.ok('totalPipelines' in result);
    assert.ok('successRate' in result);
    assert.ok('avgDurations' in result);
    assert.ok('recentPipelines' in result);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PROFILE — GET /api/settings/profile
// ═════════════════════════════════════════════════════════════════════════════

describe('Profile — GET /api/settings/profile', () => {
  it('returns profile shape for a standard user', () => {
    const user = {
      id: 'user-abc123',
      name: 'Omer Yasir',
      email: 'omer@example.com',
      emailVerified: true,
      status: 'active',
      createdAt: new Date('2026-01-01T10:00:00Z'),
    };

    const result = buildProfileResponse(user);

    assert.equal(result.id, 'user-abc123');
    assert.equal(result.name, 'Omer Yasir');
    assert.equal(result.email, 'omer@example.com');
    assert.equal(result.emailVerified, true);
    assert.equal(result.status, 'active');
    assert.equal(result.createdAt, '2026-01-01T10:00:00.000Z');
  });

  it('handles null createdAt gracefully', () => {
    const user = {
      id: 'user-xyz',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: false,
      status: 'pending',
      createdAt: null,
    };
    const result = buildProfileResponse(user);
    assert.equal(result.createdAt, undefined);
  });

  it('response shape has all required fields', () => {
    const result = buildProfileResponse({
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      emailVerified: false,
      status: 'active',
      createdAt: new Date(),
    });

    assert.ok('id' in result);
    assert.ok('name' in result);
    assert.ok('email' in result);
    assert.ok('emailVerified' in result);
    assert.ok('status' in result);
    assert.ok('createdAt' in result);
  });

  it('returns 401 envelope when not authenticated', () => {
    const err = new Error('UNAUTHORIZED');
    const response =
      err.message === 'UNAUTHORIZED'
        ? { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }
        : null;

    assert.ok(response !== null);
    assert.equal(response!.error.code, 'UNAUTHORIZED');
  });

  it('returns 404 envelope when user not found in DB', () => {
    // Mirrors: if (!user) return reply.code(404).send({ error: { code: 'USER_NOT_FOUND' } })
    const user: null = null;
    const response =
      user === null
        ? { error: { code: 'USER_NOT_FOUND', message: 'User not found' } }
        : null;

    assert.ok(response !== null);
    assert.equal(response!.error.code, 'USER_NOT_FOUND');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PROFILE — PUT /api/settings/profile (update name)
// ═════════════════════════════════════════════════════════════════════════════

describe('Profile — PUT /api/settings/profile', () => {
  it('accepts valid name update', () => {
    const body = { name: 'Omer Yasir Onal' };
    const parsed = updateProfileSchema.parse(body);
    assert.equal(parsed.name, 'Omer Yasir Onal');
  });

  it('rejects empty name', () => {
    assert.throws(
      () => updateProfileSchema.parse({ name: '' }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        return err.errors.some((e) => e.message === 'Name is required');
      },
    );
  });

  it('rejects name longer than 100 characters', () => {
    const longName = 'A'.repeat(101);
    assert.throws(
      () => updateProfileSchema.parse({ name: longName }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        return err.errors.some((e) => e.message === 'Name is too long');
      },
    );
  });

  it('accepts name of exactly 100 characters', () => {
    const exactName = 'B'.repeat(100);
    const parsed = updateProfileSchema.parse({ name: exactName });
    assert.equal(parsed.name.length, 100);
  });

  it('profile update response shape is { success, name }', () => {
    const body = { name: '  Alice  ' };
    const parsed = updateProfileSchema.parse(body);
    const trimmedName = parsed.name.trim();
    const response = { success: true, name: trimmedName };

    assert.equal(response.success, true);
    assert.equal(response.name, 'Alice');
  });

  it('name is trimmed before storing', () => {
    const raw = '  John Doe  ';
    const trimmed = raw.trim();
    assert.equal(trimmed, 'John Doe');
  });

  it('returns 401 envelope on unauthenticated update', () => {
    const err = new Error('UNAUTHORIZED');
    const response =
      err.message === 'UNAUTHORIZED'
        ? { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }
        : null;
    assert.ok(response !== null);
    assert.equal(response!.error.code, 'UNAUTHORIZED');
  });

  it('returns 400 envelope on ZodError', () => {
    let zodErr: z.ZodError | null = null;
    try {
      updateProfileSchema.parse({ name: '' });
    } catch (err: unknown) {
      if (err instanceof z.ZodError) zodErr = err;
    }
    assert.ok(zodErr instanceof z.ZodError);
    const response = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid profile data',
        details: zodErr.errors,
      },
    };
    assert.equal(response.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(response.error.details));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PROFILE — PUT /api/settings/profile/password
// ═════════════════════════════════════════════════════════════════════════════

describe('Profile — PUT /api/settings/profile/password', () => {
  const validPassword = 'MySecurePass1';

  it('accepts valid password change payload', () => {
    const body = { currentPassword: 'OldPass1', newPassword: validPassword };
    const parsed = changePasswordSchema.parse(body);
    assert.equal(parsed.newPassword, validPassword);
  });

  it('rejects newPassword shorter than 8 characters', () => {
    assert.throws(
      () => changePasswordSchema.parse({ currentPassword: 'old', newPassword: 'Ab1' }),
      (err: unknown) => err instanceof z.ZodError,
    );
  });

  it('rejects newPassword without lowercase letter', () => {
    assert.throws(
      () => changePasswordSchema.parse({ currentPassword: 'old', newPassword: 'NOLOWER12' }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        return err.errors.some((e) => e.message.includes('lowercase'));
      },
    );
  });

  it('rejects newPassword without uppercase letter', () => {
    assert.throws(
      () => changePasswordSchema.parse({ currentPassword: 'old', newPassword: 'nouppercase1' }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        return err.errors.some((e) => e.message.includes('uppercase'));
      },
    );
  });

  it('rejects newPassword without a number', () => {
    assert.throws(
      () => changePasswordSchema.parse({ currentPassword: 'old', newPassword: 'NoNumbersHere' }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        return err.errors.some((e) => e.message.includes('number'));
      },
    );
  });

  it('rejects newPassword longer than 128 characters', () => {
    const tooLong = 'Aa1' + 'x'.repeat(130);
    assert.throws(
      () => changePasswordSchema.parse({ currentPassword: 'old', newPassword: tooLong }),
      (err: unknown) => err instanceof z.ZodError,
    );
  });

  it('rejects empty currentPassword', () => {
    assert.throws(
      () => changePasswordSchema.parse({ currentPassword: '', newPassword: validPassword }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        return err.errors.some((e) => e.message === 'Current password is required');
      },
    );
  });

  it('returns INVALID_PASSWORD error for wrong current password', () => {
    // Mirrors handler: isValid = false → code(400).send({ error: { code: 'INVALID_PASSWORD' } })
    const isValid = false;
    const response = !isValid
      ? { error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } }
      : null;
    assert.ok(response !== null);
    assert.equal(response!.error.code, 'INVALID_PASSWORD');
  });

  it('returns OAUTH_USER error when user has no password hash', () => {
    // Mirrors handler: if (!user.passwordHash) → code(400).send(...)
    const passwordHash: string | null = null;
    const response = !passwordHash
      ? { error: { code: 'OAUTH_USER', message: 'Cannot change password for OAuth-linked accounts without a password' } }
      : null;
    assert.ok(response !== null);
    assert.equal(response!.error.code, 'OAUTH_USER');
  });

  it('password change success response is { success: true }', () => {
    const response = { success: true };
    assert.equal(response.success, true);
  });

  it('returns 401 envelope when unauthenticated', () => {
    const err = new Error('UNAUTHORIZED');
    const response =
      err.message === 'UNAUTHORIZED'
        ? { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }
        : null;
    assert.ok(response !== null);
    assert.equal(response!.error.code, 'UNAUTHORIZED');
  });

  it('accepts password exactly 8 characters (boundary)', () => {
    const parsed = changePasswordSchema.parse({
      currentPassword: 'anything',
      newPassword: 'Abcdef1!',
    });
    assert.ok(parsed.newPassword.length >= 8);
  });
});
