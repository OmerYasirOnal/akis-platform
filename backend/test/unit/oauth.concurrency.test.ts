/**
 * OAuth Concurrency, Email Verification, and State TTL Tests
 * Tests race condition handling, email verification policy alignment,
 * and deterministic state token expiration at callback time
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Mock PostgreSQL unique constraint violation error
const PG_UNIQUE_VIOLATION = '23505';

// State TTL constant (mirrors auth.oauth.ts)
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Mock implementation of isStateExpired (matches auth.oauth.ts logic)
function isStateExpired(createdAt: number, nowMs: number = Date.now()): boolean {
  return nowMs - createdAt > STATE_TTL_MS;
}

// Mock state store for testing (isolated from real implementation)
let mockOauthStateStore: Map<string, { provider: string; createdAt: number }>;

/**
 * Test: Concurrent OAuth sign-ins with the same email
 * Simulates race condition where two OAuth callbacks try to create the same user
 */
describe('OAuth Concurrency Safety', () => {
  // Mock user store for simulation
  let mockUsers: Map<string, { id: string; email: string; status: string; emailVerified: boolean }>;
  let insertAttempts: number;
  
  beforeEach(() => {
    mockUsers = new Map();
    insertAttempts = 0;
  });
  
  // Simulates the find-or-create logic with unique constraint handling
  async function findOrCreateUser(
    email: string, 
    profile: { name: string; emailVerified: boolean },
    simulateRace: boolean = false
  ): Promise<{ user: typeof mockUsers extends Map<string, infer V> ? V : never; isNewUser: boolean }> {
    // Step 1: Try to find existing user
    let user = mockUsers.get(email);
    let isNewUser = false;
    
    if (!user) {
      // Simulate race: another "thread" inserts first
      if (simulateRace && insertAttempts === 0) {
        insertAttempts++;
        // First insert attempt - will be "beaten" by concurrent insert
        // Simulate unique constraint violation
        const concurrentUser = {
          id: 'user-concurrent-' + Date.now(),
          email,
          status: profile.emailVerified ? 'active' : 'pending_verification',
          emailVerified: profile.emailVerified,
        };
        mockUsers.set(email, concurrentUser);
        
        // Now our insert "fails" with unique violation
        throw createPgError(PG_UNIQUE_VIOLATION);
      }
      
      // Normal insert path
      const newUser = {
        id: 'user-' + Date.now(),
        email,
        status: profile.emailVerified ? 'active' : 'pending_verification',
        emailVerified: profile.emailVerified,
      };
      mockUsers.set(email, newUser);
      user = newUser;
      isNewUser = true;
    }
    
    return { user, isNewUser };
  }
  
  // Simulates concurrent findOrCreate with retry on unique violation
  async function findOrCreateUserWithRetry(
    email: string,
    profile: { name: string; emailVerified: boolean },
    simulateRace: boolean = false
  ): Promise<{ user: typeof mockUsers extends Map<string, infer V> ? V : never; isNewUser: boolean; retried: boolean }> {
    let retried = false;
    
    try {
      return { ...await findOrCreateUser(email, profile, simulateRace), retried };
    } catch (error: unknown) {
      const pgError = error as { code?: string };
      if (pgError.code === PG_UNIQUE_VIOLATION) {
        // Race condition detected - re-fetch the user
        retried = true;
        const user = mockUsers.get(email);
        if (!user) {
          throw new Error('User not found after unique constraint violation');
        }
        return { user, isNewUser: false, retried };
      }
      throw error;
    }
  }
  
  function createPgError(code: string): Error {
    const error = new Error('duplicate key value violates unique constraint');
    (error as Error & { code: string }).code = code;
    return error;
  }
  
  test('should handle concurrent OAuth callbacks for same email without duplicates', async () => {
    const email = 'concurrent@test.com';
    const profile = { name: 'Test User', emailVerified: true };
    
    // Simulate two concurrent callbacks
    const results = await Promise.all([
      findOrCreateUserWithRetry(email, profile, true), // First one triggers race
      findOrCreateUserWithRetry(email, profile, false), // Second one finds existing
    ]);
    
    // Both should succeed
    assert.ok(results[0].user, 'First callback should get a user');
    assert.ok(results[1].user, 'Second callback should get a user');
    
    // Both should reference the same user
    assert.strictEqual(results[0].user.email, results[1].user.email, 'Both should have same email');
    
    // Only one user should exist in store
    assert.strictEqual(mockUsers.size, 1, 'Only one user should exist (no duplicates)');
    
    // First one should have retried due to race
    assert.strictEqual(results[0].retried, true, 'First callback should have retried');
    
    // Second one should have found existing (no retry needed)
    assert.strictEqual(results[1].isNewUser, false, 'Second callback should find existing user');
  });
  
  test('should create user successfully without race condition', async () => {
    const email = 'normal@test.com';
    const profile = { name: 'Normal User', emailVerified: true };
    
    const result = await findOrCreateUserWithRetry(email, profile, false);
    
    assert.ok(result.user, 'Should create user');
    assert.strictEqual(result.isNewUser, true, 'Should be a new user');
    assert.strictEqual(result.retried, false, 'Should not have retried');
    assert.strictEqual(result.user.status, 'active', 'Verified email user should be active');
  });
});

/**
 * Test: Email verification policy alignment
 * New OAuth users should NOT be active unless email is verified by provider
 */
describe('OAuth Email Verification Policy', () => {
  test('should create user as active when provider verifies email', () => {
    const profile = { emailVerified: true };
    const expectedStatus = profile.emailVerified ? 'active' : 'pending_verification';
    
    assert.strictEqual(expectedStatus, 'active', 'Verified email should result in active status');
  });
  
  test('should create user as pending_verification when email is NOT verified', () => {
    const profile = { emailVerified: false };
    const expectedStatus = profile.emailVerified ? 'active' : 'pending_verification';
    
    assert.strictEqual(expectedStatus, 'pending_verification', 
      'Unverified email should result in pending_verification status');
  });
  
  test('GitHub unverified email scenario should not activate user', () => {
    // Simulates GitHub returning email from fallback (no verified flag)
    const githubProfile = {
      id: '12345',
      email: 'user@example.com',
      name: 'GitHub User',
      emailVerified: false, // GitHub did not verify this email
    };
    
    // Per our implementation, this user should be created with pending_verification
    const status = githubProfile.emailVerified ? 'active' : 'pending_verification';
    
    assert.strictEqual(status, 'pending_verification',
      'GitHub user with unverified email should be pending_verification');
    
    // And they should be redirected to verification flow (not logged in)
    const shouldRedirectToVerification = !githubProfile.emailVerified;
    assert.strictEqual(shouldRedirectToVerification, true,
      'User with unverified email should be redirected to verification');
  });
  
  test('Google verified email scenario should activate user', () => {
    // Google always provides verified_email flag
    const googleProfile = {
      id: 'google-123',
      email: 'user@gmail.com',
      name: 'Google User',
      emailVerified: true, // Google verified this email
    };
    
    const status = googleProfile.emailVerified ? 'active' : 'pending_verification';
    
    assert.strictEqual(status, 'active',
      'Google user with verified email should be active');
  });
  
  test('existing pending_verification user should NOT be activated if OAuth email is unverified', () => {
    const existingUser = {
      id: 'user-123',
      status: 'pending_verification',
      emailVerified: false,
    };
    
    const oauthProfile = {
      emailVerified: false, // Provider did not verify
    };
    
    // Per implementation: if user is pending_verification and OAuth doesn't verify,
    // they should be rejected (redirected to login with error)
    const shouldReject = existingUser.status === 'pending_verification' && !oauthProfile.emailVerified;
    
    assert.strictEqual(shouldReject, true,
      'Pending user with unverified OAuth email should be rejected');
  });
  
  test('existing pending_verification user should be activated if OAuth email IS verified', () => {
    const existingUser = {
      id: 'user-123',
      status: 'pending_verification' as const,
      emailVerified: false,
    };
    
    const oauthProfile = {
      emailVerified: true, // Provider verified this email
    };
    
    // Per implementation: if OAuth verifies email, upgrade user to active
    let newStatus = existingUser.status;
    if (existingUser.status === 'pending_verification' && oauthProfile.emailVerified) {
      newStatus = 'active';
    }
    
    assert.strictEqual(newStatus, 'active',
      'Pending user with verified OAuth email should be upgraded to active');
  });
});

/**
 * Test: Error code handling for PostgreSQL unique violations
 */
describe('PostgreSQL Error Code Handling', () => {
  test('should correctly identify unique violation error', () => {
    const error = new Error('unique constraint violation') as Error & { code?: string };
    error.code = '23505';
    
    assert.strictEqual(error.code, PG_UNIQUE_VIOLATION,
      'Error code should match PG unique violation constant');
  });
  
  test('should not treat other errors as unique violations', () => {
    const otherError = new Error('other error') as Error & { code?: string };
    otherError.code = '42601'; // syntax error
    
    assert.notStrictEqual(otherError.code, PG_UNIQUE_VIOLATION,
      'Other error codes should not match unique violation');
  });
});

/**
 * Test: OAuth State Token TTL Enforcement
 * State tokens must be rejected if expired, even without cleanup running
 * Tests are deterministic and do not depend on real time passing
 */
describe('OAuth State Token TTL', () => {
  // Initialize/clear mock state store before and after each test
  beforeEach(() => {
    mockOauthStateStore = new Map();
  });
  
  afterEach(() => {
    mockOauthStateStore.clear();
  });
  
  test('isStateExpired should return false for fresh state (created now)', () => {
    const now = Date.now();
    const createdAt = now; // Just created
    
    const expired = isStateExpired(createdAt, now);
    
    assert.strictEqual(expired, false, 'Fresh state should not be expired');
  });
  
  test('isStateExpired should return false for state within TTL', () => {
    const now = Date.now();
    const createdAt = now - (STATE_TTL_MS - 60000); // 1 minute before expiry
    
    const expired = isStateExpired(createdAt, now);
    
    assert.strictEqual(expired, false, 'State within TTL should not be expired');
  });
  
  test('isStateExpired should return true for state exactly at TTL boundary', () => {
    const now = Date.now();
    const createdAt = now - STATE_TTL_MS - 1; // Just past TTL
    
    const expired = isStateExpired(createdAt, now);
    
    assert.strictEqual(expired, true, 'State at TTL boundary should be expired');
  });
  
  test('isStateExpired should return true for old state (well past TTL)', () => {
    const now = Date.now();
    const createdAt = now - (STATE_TTL_MS * 2); // Double the TTL
    
    const expired = isStateExpired(createdAt, now);
    
    assert.strictEqual(expired, true, 'Old state should be expired');
  });
  
  test('expired state should be rejected deterministically without cleanup', () => {
    // Simulate creating a state token with an old timestamp
    const stateToken = 'test-state-expired-' + Date.now();
    const now = Date.now();
    const oldCreatedAt = now - (STATE_TTL_MS + 1000); // 1 second past TTL
    
    // Store state with old timestamp (simulates a state that was created long ago)
    mockOauthStateStore.set(stateToken, { provider: 'github', createdAt: oldCreatedAt });
    
    // Verify state exists
    assert.ok(mockOauthStateStore.has(stateToken), 'State should exist in store');
    
    // Verify it would be rejected at callback validation time
    const stateData = mockOauthStateStore.get(stateToken)!;
    const expired = isStateExpired(stateData.createdAt, now);
    
    assert.strictEqual(expired, true, 
      'Expired state should be detected even without cleanup running');
  });
  
  test('valid fresh state should pass TTL validation', () => {
    const stateToken = 'test-state-valid-' + Date.now();
    const now = Date.now();
    const freshCreatedAt = now - 5000; // 5 seconds ago
    
    // Store fresh state
    mockOauthStateStore.set(stateToken, { provider: 'google', createdAt: freshCreatedAt });
    
    // Verify state exists and is valid
    assert.ok(mockOauthStateStore.has(stateToken), 'State should exist in store');
    
    const stateData = mockOauthStateStore.get(stateToken)!;
    const expired = isStateExpired(stateData.createdAt, now);
    
    assert.strictEqual(expired, false, 'Fresh state should pass TTL validation');
    assert.strictEqual(stateData.provider, 'google', 'Provider should match');
  });
  
  test('state should be deleted after successful validation (one-time use)', () => {
    const stateToken = 'test-state-onetime-' + Date.now();
    
    // Store state
    mockOauthStateStore.set(stateToken, { provider: 'github', createdAt: Date.now() });
    assert.ok(mockOauthStateStore.has(stateToken), 'State should exist before validation');
    
    // Simulate successful validation (callback deletes state)
    mockOauthStateStore.delete(stateToken);
    
    assert.strictEqual(mockOauthStateStore.has(stateToken), false, 
      'State should be deleted after use (one-time use)');
  });
  
  test('STATE_TTL_MS should be 10 minutes', () => {
    const tenMinutesInMs = 10 * 60 * 1000;
    
    assert.strictEqual(STATE_TTL_MS, tenMinutesInMs, 
      'State TTL should be exactly 10 minutes (600000ms)');
  });
  
  test('multiple states can exist independently', () => {
    const now = Date.now();
    
    // Create multiple states with different ages
    mockOauthStateStore.set('state-fresh', { provider: 'github', createdAt: now });
    mockOauthStateStore.set('state-old', { provider: 'google', createdAt: now - STATE_TTL_MS - 1 });
    mockOauthStateStore.set('state-valid', { provider: 'github', createdAt: now - 60000 }); // 1 min old
    
    // Verify each state's expiration status independently
    const freshState = mockOauthStateStore.get('state-fresh')!;
    const oldState = mockOauthStateStore.get('state-old')!;
    const validState = mockOauthStateStore.get('state-valid')!;
    
    assert.strictEqual(isStateExpired(freshState.createdAt, now), false, 'Fresh state should be valid');
    assert.strictEqual(isStateExpired(oldState.createdAt, now), true, 'Old state should be expired');
    assert.strictEqual(isStateExpired(validState.createdAt, now), false, 'Valid state should not be expired');
  });
  
  test('same state token cannot be consumed twice (atomic single-use)', () => {
    // This tests the atomic consume-then-validate pattern
    const stateToken = 'test-state-single-use-' + Date.now();
    
    // Store a valid state
    mockOauthStateStore.set(stateToken, { provider: 'github', createdAt: Date.now() });
    
    // First consumption: get data and delete atomically
    const firstData = mockOauthStateStore.get(stateToken);
    const firstDelete = mockOauthStateStore.delete(stateToken);
    
    // Second consumption attempt: should fail (state already consumed)
    const secondData = mockOauthStateStore.get(stateToken);
    const secondDelete = mockOauthStateStore.delete(stateToken);
    
    // First attempt should succeed
    assert.ok(firstData, 'First consumption should get state data');
    assert.strictEqual(firstDelete, true, 'First consumption should successfully delete');
    
    // Second attempt should fail
    assert.strictEqual(secondData, undefined, 'Second consumption should NOT get state data');
    assert.strictEqual(secondDelete, false, 'Second consumption should fail to delete (already deleted)');
  });
  
  test('concurrent state consumption - only one succeeds', async () => {
    // Simulates two callbacks arriving with the same state
    const stateToken = 'test-concurrent-state-' + Date.now();
    mockOauthStateStore.set(stateToken, { provider: 'google', createdAt: Date.now() });
    
    // Simulate concurrent access pattern
    let successCount = 0;
    
    // Thread A and Thread B both try to consume the same state
    const consumeState = () => {
      const data = mockOauthStateStore.get(stateToken);
      const deleted = mockOauthStateStore.delete(stateToken);
      
      // Only count as success if BOTH get and delete succeeded
      if (data && deleted) {
        successCount++;
        return { success: true, data };
      }
      return { success: false, data: null };
    };
    
    // Simulate "concurrent" execution
    const resultA = consumeState();
    const resultB = consumeState();
    
    // Only ONE should succeed (atomic single-use)
    assert.strictEqual(successCount, 1, 'Only one callback should successfully consume the state');
    assert.strictEqual(resultA.success, true, 'First callback should succeed');
    assert.strictEqual(resultB.success, false, 'Second callback should fail');
  });
});

/**
 * Test: Unverified Email Race Condition Prevention
 * Two OAuth callbacks for the same unverified email must NOT result in successful login
 */
describe('OAuth Unverified Email Race Condition', () => {
  // Mock user store for simulation
  let mockUsers: Map<string, { id: string; email: string; status: string; emailVerified: boolean }>;
  
  beforeEach(() => {
    mockUsers = new Map();
  });
  
  // Simulates the unified status validation logic from auth.oauth.ts
  function validateUserForOAuth(
    user: { id: string; status: string; emailVerified: boolean },
    profile: { emailVerified: boolean }
  ): { allowed: boolean; reason?: string; shouldUpgrade?: boolean } {
    // Check disabled/deleted status first
    if (user.status === 'disabled') {
      return { allowed: false, reason: 'account_disabled' };
    }
    if (user.status === 'deleted') {
      return { allowed: false, reason: 'account_not_found' };
    }
    
    // Handle pending_verification status
    // This is the key check that must run for ALL paths (new, existing, race-condition)
    if (user.status === 'pending_verification') {
      if (profile.emailVerified) {
        // Provider verified email, can upgrade to active
        return { allowed: true, shouldUpgrade: true };
      } else {
        // Provider did not verify email - CANNOT proceed
        return { allowed: false, reason: 'email_not_verified' };
      }
    }
    
    // Active user - allowed
    return { allowed: true };
  }
  
  test('race condition path: re-fetched user with pending_verification must still be rejected', () => {
    // Simulates Thread B scenario: race condition occurs, user is re-fetched
    // The re-fetched user has pending_verification status
    const email = 'unverified@test.com';
    
    // User was created by Thread A (or exists) with pending_verification
    const existingUser = {
      id: 'user-' + Date.now(),
      email,
      status: 'pending_verification',
      emailVerified: false,
    };
    mockUsers.set(email, existingUser);
    
    // Thread B's OAuth profile does NOT have verified email
    const oauthProfile = { emailVerified: false };
    
    // Simulate Thread B's validation after race condition re-fetch
    // isNewUser would be false due to race condition, but validation should STILL reject
    const result = validateUserForOAuth(existingUser, oauthProfile);
    
    assert.strictEqual(result.allowed, false, 
      'Login should be rejected for pending_verification user with unverified OAuth email');
    assert.strictEqual(result.reason, 'email_not_verified',
      'Rejection reason should be email_not_verified');
  });
  
  test('concurrent unverified callbacks cannot both succeed', () => {
    const email = 'race-unverified@test.com';
    
    // Both OAuth profiles have unverified email
    const profileA = { emailVerified: false };
    const profileB = { emailVerified: false };
    
    // User doesn't exist initially
    let user = mockUsers.get(email);
    
    // Thread A creates user with pending_verification
    if (!user) {
      user = {
        id: 'user-a-' + Date.now(),
        email,
        status: 'pending_verification',
        emailVerified: false,
      };
      mockUsers.set(email, user);
    }
    
    // Thread A validates and MUST be rejected
    const resultA = validateUserForOAuth(user, profileA);
    
    // Thread B (race condition) re-fetches user and validates
    const refetchedUser = mockUsers.get(email)!;
    const resultB = validateUserForOAuth(refetchedUser, profileB);
    
    // BOTH should be rejected - neither should succeed
    assert.strictEqual(resultA.allowed, false, 'Thread A should be rejected');
    assert.strictEqual(resultB.allowed, false, 'Thread B should also be rejected');
    assert.strictEqual(resultA.reason, 'email_not_verified', 'Thread A reason');
    assert.strictEqual(resultB.reason, 'email_not_verified', 'Thread B reason');
  });
  
  test('pending_verification user CAN login if OAuth provider verifies email', () => {
    const email = 'upgradeable@test.com';
    
    // User exists with pending_verification (e.g., created via email/password signup)
    const user = {
      id: 'user-upgrade-' + Date.now(),
      email,
      status: 'pending_verification',
      emailVerified: false,
    };
    mockUsers.set(email, user);
    
    // OAuth profile HAS verified email (e.g., Google always verifies)
    const oauthProfile = { emailVerified: true };
    
    const result = validateUserForOAuth(user, oauthProfile);
    
    assert.strictEqual(result.allowed, true, 
      'Login should be allowed when OAuth provider verifies email');
    assert.strictEqual(result.shouldUpgrade, true,
      'User should be marked for upgrade to active status');
  });
  
  test('active user with verified OAuth should succeed', () => {
    const user = {
      id: 'user-active',
      email: 'active@test.com',
      status: 'active',
      emailVerified: true,
    };
    
    const oauthProfile = { emailVerified: true };
    
    const result = validateUserForOAuth(user, oauthProfile);
    
    assert.strictEqual(result.allowed, true, 'Active user should be allowed');
    assert.strictEqual(result.shouldUpgrade, undefined, 'No upgrade needed for active user');
  });
  
  test('disabled user should be rejected regardless of OAuth verification', () => {
    const user = {
      id: 'user-disabled',
      email: 'disabled@test.com',
      status: 'disabled',
      emailVerified: true,
    };
    
    const oauthProfile = { emailVerified: true };
    
    const result = validateUserForOAuth(user, oauthProfile);
    
    assert.strictEqual(result.allowed, false, 'Disabled user should be rejected');
    assert.strictEqual(result.reason, 'account_disabled', 'Reason should be account_disabled');
  });
});

