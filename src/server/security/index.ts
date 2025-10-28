/**
 * Security Module
 * 
 * Exports all security utilities for Phase 2.
 * 
 * @module server/security
 */

export {
  generateCSRFToken,
  validateCSRFToken,
  generateCSRFTokenPair,
} from './csrf';

export {
  encryptToken,
  decryptToken,
  rotateTokenEncryption,
  needsKeyRotation,
} from './encryption';

export {
  generateCodeVerifier,
  generateCodeChallenge,
  verifyCodeChallenge,
  generatePKCEPair,
  storeOAuthState,
  consumeOAuthState,
  generateOAuthState,
  type OAuthState,
} from './pkce';

export {
  redactToken,
  redactString,
  redactObject,
  secureLog,
  createSecureLogger,
} from './redact';
