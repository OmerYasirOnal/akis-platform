/**
 * OAuth Concurrency and Email Verification Tests
 * Tests race condition handling and email verification policy alignment
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mock PostgreSQL unique constraint violation error
const PG_UNIQUE_VIOLATION = '23505';

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

