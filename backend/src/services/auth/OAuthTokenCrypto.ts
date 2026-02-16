import {
  decryptSecret,
  encryptSecret,
  isEncryptionConfigured,
  type EncryptedSecret,
} from '../../utils/crypto.js';

export type OAuthTokenKind = 'access' | 'refresh';

export type OAuthTokenCryptoErrorCode =
  | 'OAUTH_TOKEN_ENCRYPTION_KEY_MISSING'
  | 'OAUTH_TOKEN_ENCRYPT_FAILED'
  | 'OAUTH_TOKEN_DECRYPT_FAILED';

export class OAuthTokenCryptoError extends Error {
  readonly code: OAuthTokenCryptoErrorCode;
  readonly cause?: unknown;

  constructor(code: OAuthTokenCryptoErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'OAuthTokenCryptoError';
    this.code = code;
    this.cause = cause;
  }
}

interface OAuthTokenCryptoDeps {
  encryptFn?: typeof encryptSecret;
  decryptFn?: typeof decryptSecret;
  isConfiguredFn?: typeof isEncryptionConfigured;
}

function buildScope(userId: string, provider: string, kind: OAuthTokenKind): string {
  return `oauth-token:${provider}:${kind}:${userId}`;
}

function isEncryptedSecret(value: unknown): value is EncryptedSecret {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.cipherText === 'string' &&
    typeof candidate.iv === 'string' &&
    typeof candidate.authTag === 'string' &&
    typeof candidate.keyVersion === 'string'
  );
}

export class OAuthTokenCrypto {
  private readonly encryptFn: typeof encryptSecret;
  private readonly decryptFn: typeof decryptSecret;
  private readonly isConfiguredFn: typeof isEncryptionConfigured;

  constructor(deps: OAuthTokenCryptoDeps = {}) {
    this.encryptFn = deps.encryptFn ?? encryptSecret;
    this.decryptFn = deps.decryptFn ?? decryptSecret;
    this.isConfiguredFn = deps.isConfiguredFn ?? isEncryptionConfigured;
  }

  encryptForStorage(input: {
    userId: string;
    provider: string;
    token: string;
    kind?: OAuthTokenKind;
  }): string {
    const kind = input.kind ?? 'access';

    if (!this.isConfiguredFn()) {
      throw new OAuthTokenCryptoError(
        'OAUTH_TOKEN_ENCRYPTION_KEY_MISSING',
        'OAuth token encryption key is not configured'
      );
    }

    try {
      const encrypted = this.encryptFn(input.token, buildScope(input.userId, input.provider, kind));
      return JSON.stringify(encrypted);
    } catch (error) {
      throw new OAuthTokenCryptoError(
        'OAUTH_TOKEN_ENCRYPT_FAILED',
        `Failed to encrypt OAuth ${kind} token for provider ${input.provider}`,
        error
      );
    }
  }

  decryptForUse(input: {
    userId: string;
    provider: string;
    rawToken: string | null | undefined;
    kind?: OAuthTokenKind;
  }): string | null {
    const rawToken = input.rawToken;
    if (!rawToken) {
      return null;
    }

    const encrypted = this.tryParseEncryptedPayload(rawToken);
    if (!encrypted) {
      return rawToken;
    }

    const kind = input.kind ?? 'access';

    try {
      return this.decryptFn(encrypted, buildScope(input.userId, input.provider, kind));
    } catch (error) {
      throw new OAuthTokenCryptoError(
        'OAUTH_TOKEN_DECRYPT_FAILED',
        `Failed to decrypt OAuth ${kind} token for provider ${input.provider}`,
        error
      );
    }
  }

  private tryParseEncryptedPayload(rawToken: string): EncryptedSecret | null {
    if (!rawToken.startsWith('{') || !rawToken.endsWith('}')) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawToken);
      return isEncryptedSecret(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

export const oauthTokenCrypto = new OAuthTokenCrypto();
