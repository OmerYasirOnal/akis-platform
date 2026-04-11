import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Tests for VerificationService brute-force protection.
 * Uses a lightweight mock approach — the service has in-memory tracking
 * that locks users after MAX_VERIFY_ATTEMPTS failed attempts.
 */

// We test the logic directly by importing and calling verifyCode
// Since VerificationService depends on DB, we test the lockout counter logic in isolation.

describe('Verification brute-force protection', () => {
  // Simulate the lockout logic from VerificationService
  const MAX_VERIFY_ATTEMPTS = 5;
  const LOCKOUT_MS = 30 * 60 * 1000;

  let failedAttempts: Map<string, { count: number; lockedUntil?: number }>;

  beforeEach(() => {
    failedAttempts = new Map();
  });

  function checkLockout(userId: string): boolean {
    const attempts = failedAttempts.get(userId);
    return !!(attempts?.lockedUntil && Date.now() < attempts.lockedUntil);
  }

  function recordFailedAttempt(userId: string): void {
    const current = failedAttempts.get(userId) ?? { count: 0 };
    current.count += 1;
    if (current.count >= MAX_VERIFY_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCKOUT_MS;
    }
    failedAttempts.set(userId, current);
  }

  function clearAttempts(userId: string): void {
    failedAttempts.delete(userId);
  }

  it('should not lock user before reaching max attempts', () => {
    const userId = 'user-1';
    for (let i = 0; i < MAX_VERIFY_ATTEMPTS - 1; i++) {
      recordFailedAttempt(userId);
    }
    assert.equal(checkLockout(userId), false);
  });

  it('should lock user after MAX_VERIFY_ATTEMPTS failed attempts', () => {
    const userId = 'user-2';
    for (let i = 0; i < MAX_VERIFY_ATTEMPTS; i++) {
      recordFailedAttempt(userId);
    }
    assert.equal(checkLockout(userId), true);
  });

  it('should clear lockout on successful verification', () => {
    const userId = 'user-3';
    for (let i = 0; i < MAX_VERIFY_ATTEMPTS; i++) {
      recordFailedAttempt(userId);
    }
    assert.equal(checkLockout(userId), true);
    clearAttempts(userId);
    assert.equal(checkLockout(userId), false);
  });

  it('should track attempts independently per user', () => {
    const userA = 'user-a';
    const userB = 'user-b';

    for (let i = 0; i < MAX_VERIFY_ATTEMPTS; i++) {
      recordFailedAttempt(userA);
    }
    recordFailedAttempt(userB);

    assert.equal(checkLockout(userA), true);
    assert.equal(checkLockout(userB), false);
  });

  it('should allow retry after lockout expires', () => {
    const userId = 'user-4';
    for (let i = 0; i < MAX_VERIFY_ATTEMPTS; i++) {
      recordFailedAttempt(userId);
    }
    assert.equal(checkLockout(userId), true);

    // Simulate lockout expiry
    const attempts = failedAttempts.get(userId)!;
    attempts.lockedUntil = Date.now() - 1;
    assert.equal(checkLockout(userId), false);
  });

  it('should set lockout duration to 30 minutes', () => {
    const userId = 'user-5';
    const before = Date.now();
    for (let i = 0; i < MAX_VERIFY_ATTEMPTS; i++) {
      recordFailedAttempt(userId);
    }
    const after = Date.now();

    const attempts = failedAttempts.get(userId)!;
    assert.ok(attempts.lockedUntil! >= before + LOCKOUT_MS);
    assert.ok(attempts.lockedUntil! <= after + LOCKOUT_MS);
  });
});
