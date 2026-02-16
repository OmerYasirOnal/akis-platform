import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  OAuthTokenCrypto,
  OAuthTokenCryptoError,
} from '../../src/services/auth/OAuthTokenCrypto.js';

describe('OAuthTokenCrypto', () => {
  it('encrypts token into JSON payload when key is configured', () => {
    const crypto = new OAuthTokenCrypto({
      isConfiguredFn: () => true,
      encryptFn: (plaintext: string) => ({
        cipherText: `enc:${plaintext}`,
        iv: 'iv',
        authTag: 'tag',
        keyVersion: 'v1',
      }),
    });

    const stored = crypto.encryptForStorage({
      userId: 'user-1',
      provider: 'github',
      token: 'gho_test',
    });

    const parsed = JSON.parse(stored) as Record<string, string>;
    assert.equal(parsed.cipherText, 'enc:gho_test');
    assert.equal(parsed.iv, 'iv');
    assert.equal(parsed.authTag, 'tag');
    assert.equal(parsed.keyVersion, 'v1');
  });

  it('strict-blocks token writes when encryption key is missing', () => {
    const crypto = new OAuthTokenCrypto({
      isConfiguredFn: () => false,
    });

    assert.throws(
      () =>
        crypto.encryptForStorage({
          userId: 'user-1',
          provider: 'github',
          token: 'gho_test',
        }),
      (error: unknown) =>
        error instanceof OAuthTokenCryptoError &&
        error.code === 'OAUTH_TOKEN_ENCRYPTION_KEY_MISSING'
    );
  });

  it('returns plaintext token for legacy storage format', () => {
    const crypto = new OAuthTokenCrypto({
      decryptFn: () => {
        throw new Error('should not be called for plaintext token');
      },
    });

    const token = crypto.decryptForUse({
      userId: 'user-1',
      provider: 'github',
      rawToken: 'legacy-plaintext-token',
    });

    assert.equal(token, 'legacy-plaintext-token');
  });

  it('decrypts encrypted JSON token payload', () => {
    const crypto = new OAuthTokenCrypto({
      decryptFn: () => 'decrypted-token',
    });

    const token = crypto.decryptForUse({
      userId: 'user-1',
      provider: 'github',
      rawToken: JSON.stringify({
        cipherText: 'abc',
        iv: 'def',
        authTag: 'ghi',
        keyVersion: 'v1',
      }),
    });

    assert.equal(token, 'decrypted-token');
  });

  it('throws deterministic error when encrypted payload cannot be decrypted', () => {
    const crypto = new OAuthTokenCrypto({
      decryptFn: () => {
        throw new Error('decrypt failed');
      },
    });

    assert.throws(
      () =>
        crypto.decryptForUse({
          userId: 'user-1',
          provider: 'github',
          rawToken: JSON.stringify({
            cipherText: 'abc',
            iv: 'def',
            authTag: 'ghi',
            keyVersion: 'v1',
          }),
        }),
      (error: unknown) =>
        error instanceof OAuthTokenCryptoError &&
        error.code === 'OAUTH_TOKEN_DECRYPT_FAILED'
    );
  });
});
