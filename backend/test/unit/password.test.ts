/**
 * Unit tests for password hashing and verification
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';

import { hashPassword, verifyPassword } from '../../src/services/auth/password.js';

describe('hashPassword', () => {
  test('returns a bcrypt hash string', async () => {
    const hash = await hashPassword('mypassword');
    assert.ok(typeof hash === 'string');
    assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'should be a bcrypt hash');
  });

  test('produces different hashes for the same password (unique salt)', async () => {
    const hash1 = await hashPassword('test123');
    const hash2 = await hashPassword('test123');
    assert.notStrictEqual(hash1, hash2);
  });

  test('hash length is 60 characters (bcrypt standard)', async () => {
    const hash = await hashPassword('password');
    assert.strictEqual(hash.length, 60);
  });
});

describe('verifyPassword', () => {
  test('returns true for correct password', async () => {
    const hash = await hashPassword('correct-password');
    const result = await verifyPassword('correct-password', hash);
    assert.strictEqual(result, true);
  });

  test('returns false for wrong password', async () => {
    const hash = await hashPassword('correct-password');
    const result = await verifyPassword('wrong-password', hash);
    assert.strictEqual(result, false);
  });

  test('returns false for empty password against valid hash', async () => {
    const hash = await hashPassword('notempty');
    const result = await verifyPassword('', hash);
    assert.strictEqual(result, false);
  });

  test('works with special characters', async () => {
    const pw = '!@#$%^&*()_+-={}[]|;:,.<>?/~`ñü';
    const hash = await hashPassword(pw);
    const result = await verifyPassword(pw, hash);
    assert.strictEqual(result, true);
  });

  test('works with long passwords', async () => {
    const pw = 'a'.repeat(72); // bcrypt max is 72 bytes
    const hash = await hashPassword(pw);
    const result = await verifyPassword(pw, hash);
    assert.strictEqual(result, true);
  });
});
