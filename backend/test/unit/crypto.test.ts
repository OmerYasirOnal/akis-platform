/**
 * Unit tests for backend/src/utils/crypto.ts
 *
 * Tests encryption key parsing, isEncryptionConfigured helper,
 * and encrypt/decrypt round-trip without hitting a real database.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import { randomBytes } from 'node:crypto';

// We test parseKeyMaterial directly (exported for testability).
// isEncryptionConfigured and encrypt/decrypt depend on getEnv(),
// so we test them by manipulating process.env before lazy-loading.

import { parseKeyMaterial } from '../../src/utils/crypto.js';

describe('parseKeyMaterial', () => {
  test('parses 64-character hex string → 32-byte Buffer', () => {
    const hexKey = randomBytes(32).toString('hex');
    assert.strictEqual(hexKey.length, 64);

    const buf = parseKeyMaterial(hexKey);
    assert.strictEqual(buf.length, 32);
    assert.deepStrictEqual(buf, Buffer.from(hexKey, 'hex'));
  });

  test('parses base64 string → 32-byte Buffer', () => {
    const raw = randomBytes(32);
    const b64 = raw.toString('base64');

    const buf = parseKeyMaterial(b64);
    assert.strictEqual(buf.length, 32);
    assert.deepStrictEqual(buf, raw);
  });

  test('parses base64: prefixed string → 32-byte Buffer', () => {
    const raw = randomBytes(32);
    const prefixed = `base64:${raw.toString('base64')}`;

    const buf = parseKeyMaterial(prefixed);
    assert.strictEqual(buf.length, 32);
    assert.deepStrictEqual(buf, raw);
  });

  test('trims whitespace before parsing', () => {
    const raw = randomBytes(32);
    const padded = `  ${raw.toString('base64')}  `;

    const buf = parseKeyMaterial(padded);
    assert.strictEqual(buf.length, 32);
  });

  test('throws for key shorter than 32 bytes (base64)', () => {
    const shortKey = randomBytes(16).toString('base64');
    assert.throws(
      () => parseKeyMaterial(shortKey),
      /AI_KEY_ENCRYPTION_KEY must be 32 bytes/
    );
  });

  test('throws for key longer than 32 bytes (base64)', () => {
    const longKey = randomBytes(48).toString('base64');
    assert.throws(
      () => parseKeyMaterial(longKey),
      /AI_KEY_ENCRYPTION_KEY must be 32 bytes/
    );
  });

  test('throws for non-hex, non-base64 garbage', () => {
    assert.throws(
      () => parseKeyMaterial('not-a-valid-key-at-all'),
      /AI_KEY_ENCRYPTION_KEY must be 32 bytes/
    );
  });

  test('throws for empty string', () => {
    assert.throws(
      () => parseKeyMaterial(''),
      /AI_KEY_ENCRYPTION_KEY must be 32 bytes/
    );
  });
});

describe('isEncryptionConfigured', () => {
  // isEncryptionConfigured reads from getEnv() which caches.
  // Since we can't easily reset the env singleton in-process,
  // we test the underlying logic via parseKeyMaterial above.
  // The actual integration is covered by the health endpoint test.

  test('valid key → parseKeyMaterial succeeds (proxy for isEncryptionConfigured=true)', () => {
    const valid = randomBytes(32).toString('base64');
    assert.doesNotThrow(() => parseKeyMaterial(valid));
  });

  test('invalid key → parseKeyMaterial throws (proxy for isEncryptionConfigured=false)', () => {
    assert.throws(() => parseKeyMaterial('bad'));
  });
});

describe('encrypt / decrypt round-trip', () => {
  // getEnv() requires DATABASE_URL even in test mode.
  // Set minimal env vars before dynamic-importing crypto module.

  test('encrypts and decrypts a secret correctly', async () => {
    // Minimal env for getEnv() validation
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
    const testKey = randomBytes(32).toString('base64');
    process.env.AI_KEY_ENCRYPTION_KEY = testKey;
    process.env.AI_KEY_ENCRYPTION_KEY_VERSION = 'test-v1';

    // Dynamic import so env is read fresh (cache busted by query param)
    const { encryptSecret, decryptSecret } = await import(`../../src/utils/crypto.js?t=${Date.now()}`);

    const plaintext = 'sk-test-api-key-1234567890abcdef';
    const scope = 'user123:openai';

    const encrypted = encryptSecret(plaintext, scope);

    // Verify encrypted structure
    assert.ok(encrypted.cipherText, 'cipherText should be present');
    assert.ok(encrypted.iv, 'iv should be present');
    assert.ok(encrypted.authTag, 'authTag should be present');
    assert.strictEqual(encrypted.keyVersion, 'test-v1');

    // cipherText should not be the plaintext
    assert.notStrictEqual(encrypted.cipherText, plaintext);

    // Decrypt should return the original plaintext
    const decrypted = decryptSecret(encrypted, scope);
    assert.strictEqual(decrypted, plaintext);
  });

  test('decrypt fails with wrong scope (AAD mismatch)', async () => {
    const { encryptSecret, decryptSecret } = await import(`../../src/utils/crypto.js?t=${Date.now()}`);

    const plaintext = 'sk-secret-key-abcdef1234567890';
    const encrypted = encryptSecret(plaintext, 'user1:openai');

    assert.throws(
      () => decryptSecret(encrypted, 'user2:openai'),
      /Unsupported state|unable to authenticate/i
    );
  });
});
