import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getEnv } from '../config/env.js';

const AAD_PREFIX = 'akis:user-ai-key:';

export type EncryptedSecret = {
  cipherText: string;
  iv: string;
  authTag: string;
  keyVersion: string;
};

/**
 * Parse raw key material from an env var value.
 * Accepts 64-char hex string or base64 (optionally prefixed with "base64:").
 * Returns a 32-byte Buffer or throws.
 */
export function parseKeyMaterial(rawKey: string): Buffer {
  const trimmed = rawKey.trim();

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  const base64 = trimmed.replace(/^base64:/, '');
  const decoded = Buffer.from(base64, 'base64');
  if (decoded.length === 32) {
    return decoded;
  }

  throw new Error('AI_KEY_ENCRYPTION_KEY must be 32 bytes (base64 or hex)');
}

/**
 * Check whether AI key encryption is properly configured.
 * Returns true if AI_KEY_ENCRYPTION_KEY exists and decodes to 32 bytes.
 * Never throws — safe to call from health/readiness checks.
 */
export function isEncryptionConfigured(): boolean {
  try {
    const env = getEnv();
    if (!env.AI_KEY_ENCRYPTION_KEY) return false;
    parseKeyMaterial(env.AI_KEY_ENCRYPTION_KEY);
    return true;
  } catch {
    return false;
  }
}

function getEncryptionKey(): { key: Buffer; version: string } {
  const env = getEnv();
  if (!env.AI_KEY_ENCRYPTION_KEY) {
    throw new Error('AI_KEY_ENCRYPTION_KEY is not configured');
  }

  return {
    key: parseKeyMaterial(env.AI_KEY_ENCRYPTION_KEY),
    version: env.AI_KEY_ENCRYPTION_KEY_VERSION || 'v1',
  };
}

function buildAad(scope: string): Buffer {
  return Buffer.from(`${AAD_PREFIX}${scope}`, 'utf8');
}

export function encryptSecret(plaintext: string, scope: string): EncryptedSecret {
  const { key, version } = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(buildAad(scope));

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    cipherText: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    keyVersion: version,
  };
}

export function decryptSecret(encrypted: EncryptedSecret, scope: string): string {
  const { key } = getEncryptionKey();
  const iv = Buffer.from(encrypted.iv, 'base64');
  const authTag = Buffer.from(encrypted.authTag, 'base64');
  const cipherText = Buffer.from(encrypted.cipherText, 'base64');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(buildAad(scope));
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return decrypted.toString('utf8');
}
