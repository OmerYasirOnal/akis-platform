/**
 * Token Encryption at Rest (AES-256-GCM)
 * 
 * Implements authenticated encryption for OAuth tokens in database.
 * Part of Phase 2: Security Hardening (Gate-B requirement)
 * 
 * @module server/security/encryption
 */

import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard IV length
const AUTH_TAG_LENGTH = 16; // GCM auth tag length
const SALT = 'akis-session-encryption-v1'; // Salt for key derivation

/**
 * Derive encryption key from SESSION_SECRET
 * Uses PBKDF2 with 100,000 iterations
 */
function deriveKey(secret: string): Buffer {
  return pbkdf2Sync(secret, SALT, 100000, 32, 'sha256');
}

/**
 * Get encryption key (primary or fallback to old key for rotation)
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production';
  return deriveKey(secret);
}

/**
 * Get old encryption key for key rotation
 */
function getOldEncryptionKey(): Buffer | null {
  const oldSecret = process.env.SESSION_SECRET_OLD;
  return oldSecret ? deriveKey(oldSecret) : null;
}

/**
 * Encrypt a token using AES-256-GCM
 * 
 * Format: iv:authTag:encrypted (base64url)
 * 
 * @param token - Plain text token
 * @returns Encrypted token string
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted (all base64url)
  return [
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':');
}

/**
 * Decrypt a token using AES-256-GCM
 * 
 * @param encryptedToken - Encrypted token string (iv:authTag:encrypted)
 * @returns Plain text token
 * @throws Error if decryption fails
 */
export function decryptToken(encryptedToken: string): string {
  const parts = encryptedToken.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  
  const [ivB64, authTagB64, encryptedB64] = parts;
  const iv = Buffer.from(ivB64, 'base64url');
  const authTag = Buffer.from(authTagB64, 'base64url');
  const encrypted = Buffer.from(encryptedB64, 'base64url');
  
  // Try with primary key
  try {
    const key = getEncryptionKey();
    return decryptWithKey(key, iv, authTag, encrypted);
  } catch (primaryError) {
    // Try with old key (for key rotation)
    const oldKey = getOldEncryptionKey();
    if (oldKey) {
      try {
        return decryptWithKey(oldKey, iv, authTag, encrypted);
      } catch {
        // Old key also failed, throw original error
        throw primaryError;
      }
    }
    throw primaryError;
  }
}

/**
 * Decrypt with a specific key
 */
function decryptWithKey(
  key: Buffer,
  iv: Buffer,
  authTag: Buffer,
  encrypted: Buffer
): string {
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8');
}

/**
 * Re-encrypt a token with new key (for key rotation)
 * 
 * @param encryptedToken - Token encrypted with old key
 * @returns Token encrypted with new key
 */
export function rotateTokenEncryption(encryptedToken: string): string {
  const decrypted = decryptToken(encryptedToken);
  return encryptToken(decrypted);
}

/**
 * Check if a token needs re-encryption (encrypted with old key)
 * 
 * @param encryptedToken - Encrypted token to check
 * @returns true if needs rotation, false otherwise
 */
export function needsKeyRotation(encryptedToken: string): boolean {
  const oldKey = getOldEncryptionKey();
  if (!oldKey) {
    return false; // No old key configured
  }
  
  try {
    const parts = encryptedToken.split(':');
    if (parts.length !== 3) {
      return false;
    }
    
    const [ivB64, authTagB64, encryptedB64] = parts;
    const iv = Buffer.from(ivB64, 'base64url');
    const authTag = Buffer.from(authTagB64, 'base64url');
    const encrypted = Buffer.from(encryptedB64, 'base64url');
    
    // Try decrypting with new key - if fails, needs rotation
    const key = getEncryptionKey();
    decryptWithKey(key, iv, authTag, encrypted);
    return false; // Decrypts with new key = no rotation needed
  } catch {
    return true; // Failed with new key = needs rotation
  }
}
