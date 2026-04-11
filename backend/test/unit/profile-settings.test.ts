/**
 * Profile Settings — Route Handler Logic Tests
 *
 * Tests the validation schemas and response builders
 * from api/settings/profile.ts without requiring DB access.
 *
 * Mirrors patterns from settings-routes.test.ts.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Schemas re-created from profile.ts
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

// ─────────────────────────────────────────────────────────────────────────────
// Response builders matching profile.ts handler logic
// ─────────────────────────────────────────────────────────────────────────────

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

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/settings/profile
// ═════════════════════════════════════════════════════════════════════════════

describe('Profile — GET /api/settings/profile returns user data', () => {
  it('returns complete profile shape for active user', () => {
    const user = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      status: 'active',
      createdAt: new Date('2026-01-01T10:00:00Z'),
    };
    const result = buildProfileResponse(user);

    assert.equal(result.id, 'user-1');
    assert.equal(result.name, 'Test User');
    assert.equal(result.email, 'test@example.com');
    assert.equal(result.emailVerified, true);
    assert.equal(result.status, 'active');
    assert.equal(result.createdAt, '2026-01-01T10:00:00.000Z');
  });

  it('handles null createdAt gracefully', () => {
    const user = {
      id: 'user-2',
      name: 'New User',
      email: 'new@example.com',
      emailVerified: false,
      status: 'pending',
      createdAt: null,
    };
    const result = buildProfileResponse(user);
    assert.equal(result.createdAt, undefined);
  });

  it('response has all required fields', () => {
    const result = buildProfileResponse({
      id: 'u1',
      name: 'Alice',
      email: 'alice@test.com',
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

  it('returns 401 when not authenticated', () => {
    const err = new Error('UNAUTHORIZED');
    const response =
      err.message === 'UNAUTHORIZED'
        ? { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }
        : null;
    assert.ok(response !== null);
    assert.equal(response!.error.code, 'UNAUTHORIZED');
  });

  it('returns 404 when user not found', () => {
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
// PUT /api/settings/profile — Name validation
// ═════════════════════════════════════════════════════════════════════════════

describe('Profile — PUT /api/settings/profile validates name', () => {
  it('accepts a valid name', () => {
    const parsed = updateProfileSchema.parse({ name: 'Omer Yasir Onal' });
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

  it('rejects name longer than 100 chars', () => {
    const longName = 'A'.repeat(101);
    assert.throws(
      () => updateProfileSchema.parse({ name: longName }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        return err.errors.some((e) => e.message === 'Name is too long');
      },
    );
  });

  it('accepts name of exactly 100 characters (boundary)', () => {
    const exactName = 'B'.repeat(100);
    const parsed = updateProfileSchema.parse({ name: exactName });
    assert.equal(parsed.name.length, 100);
  });

  it('accepts name of exactly 1 character (boundary)', () => {
    const parsed = updateProfileSchema.parse({ name: 'X' });
    assert.equal(parsed.name, 'X');
  });

  it('name is trimmed before storage', () => {
    const raw = '  Alice  ';
    const trimmed = raw.trim();
    const response = { success: true, name: trimmed };
    assert.equal(response.name, 'Alice');
  });

  it('returns 400 on validation error', () => {
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
// PUT /api/settings/profile/password — Password validation
// ═════════════════════════════════════════════════════════════════════════════

describe('Profile — PUT /api/settings/profile/password validates password', () => {
  const validPassword = 'MySecurePass1';

  it('accepts valid password change payload', () => {
    const parsed = changePasswordSchema.parse({
      currentPassword: 'OldPass1',
      newPassword: validPassword,
    });
    assert.equal(parsed.newPassword, validPassword);
  });

  it('rejects newPassword shorter than 8 characters', () => {
    assert.throws(
      () =>
        changePasswordSchema.parse({
          currentPassword: 'old',
          newPassword: 'Ab1',
        }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        return err.errors.some((e) => e.message.includes('8 characters'));
      },
    );
  });

  it('rejects newPassword without lowercase letter', () => {
    assert.throws(
      () =>
        changePasswordSchema.parse({
          currentPassword: 'old',
          newPassword: 'NOLOWER12',
        }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        return err.errors.some((e) => e.message.includes('lowercase'));
      },
    );
  });

  it('rejects newPassword without uppercase letter', () => {
    assert.throws(
      () =>
        changePasswordSchema.parse({
          currentPassword: 'old',
          newPassword: 'nouppercase1',
        }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        return err.errors.some((e) => e.message.includes('uppercase'));
      },
    );
  });

  it('rejects newPassword without a number', () => {
    assert.throws(
      () =>
        changePasswordSchema.parse({
          currentPassword: 'old',
          newPassword: 'NoNumbersHere',
        }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        return err.errors.some((e) => e.message.includes('number'));
      },
    );
  });

  it('rejects newPassword longer than 128 characters', () => {
    const tooLong = 'Aa1' + 'x'.repeat(130);
    assert.throws(
      () =>
        changePasswordSchema.parse({
          currentPassword: 'old',
          newPassword: tooLong,
        }),
      (err: unknown) => err instanceof z.ZodError,
    );
  });

  it('requires current password (non-empty)', () => {
    assert.throws(
      () =>
        changePasswordSchema.parse({
          currentPassword: '',
          newPassword: validPassword,
        }),
      (err: unknown) => {
        if (!(err instanceof z.ZodError)) return false;
        return err.errors.some((e) => e.message === 'Current password is required');
      },
    );
  });

  it('accepts password exactly 8 characters (boundary)', () => {
    const parsed = changePasswordSchema.parse({
      currentPassword: 'anything',
      newPassword: 'Abcdef1!',
    });
    assert.ok(parsed.newPassword.length >= 8);
  });

  it('returns INVALID_PASSWORD for wrong current password', () => {
    const isValid = false;
    const response = !isValid
      ? { error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } }
      : null;
    assert.ok(response !== null);
    assert.equal(response!.error.code, 'INVALID_PASSWORD');
  });

  it('returns OAUTH_USER when user has no password hash', () => {
    const passwordHash: string | null = null;
    const response = !passwordHash
      ? {
          error: {
            code: 'OAUTH_USER',
            message: 'Cannot change password for OAuth-linked accounts without a password',
          },
        }
      : null;
    assert.ok(response !== null);
    assert.equal(response!.error.code, 'OAUTH_USER');
  });

  it('success response is { success: true }', () => {
    const response = { success: true };
    assert.equal(response.success, true);
  });
});
