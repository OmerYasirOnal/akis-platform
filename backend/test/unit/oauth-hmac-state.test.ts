import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'crypto';

/**
 * Tests for HMAC-signed OAuth state token generation and verification.
 * Mirrors the logic in auth.oauth.ts — stateless, restart-safe CSRF protection.
 */

const STATE_TTL_MS = 10 * 60 * 1000;
const SIGNING_KEY = 'test-jwt-secret-32chars-minimum!!';

function hmacSign(payload: string): string {
  return createHmac('sha256', SIGNING_KEY).update(payload).digest('base64url');
}

function generateSignedState(provider: string): string {
  const payload = JSON.stringify({ provider, ts: Date.now(), nonce: randomBytes(16).toString('hex') });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = hmacSign(encoded);
  return `${encoded}.${sig}`;
}

function verifySignedState(state: string): { provider: string; createdAt: number } | null {
  const dotIdx = state.indexOf('.');
  if (dotIdx < 0) return null;
  const encoded = state.slice(0, dotIdx);
  const sig = state.slice(dotIdx + 1);
  if (hmacSign(encoded) !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (!payload.provider || !payload.ts) return null;
    if (Date.now() - payload.ts > STATE_TTL_MS) return null;
    return { provider: payload.provider, createdAt: payload.ts };
  } catch {
    return null;
  }
}

describe('OAuth HMAC-signed state tokens', () => {
  it('should generate and verify a valid state token', () => {
    const state = generateSignedState('github');
    const result = verifySignedState(state);
    assert.ok(result);
    assert.equal(result.provider, 'github');
    assert.ok(Date.now() - result.createdAt < 1000);
  });

  it('should reject tampered state', () => {
    const state = generateSignedState('github');
    // Modify the encoded payload (flip a character) to simulate tampering
    const [encoded, sig] = state.split('.');
    const tampered = `${encoded.slice(0, -1)}X.${sig}`;
    const result = verifySignedState(tampered);
    assert.equal(result, null);
  });

  it('should reject state with invalid signature', () => {
    const state = generateSignedState('google');
    const [encoded] = state.split('.');
    const fakeState = `${encoded}.invalid_signature`;
    assert.equal(verifySignedState(fakeState), null);
  });

  it('should reject state without dot separator', () => {
    assert.equal(verifySignedState('nodothere'), null);
  });

  it('should reject empty string', () => {
    assert.equal(verifySignedState(''), null);
  });

  it('should reject expired state', () => {
    const payload = JSON.stringify({ provider: 'github', ts: Date.now() - STATE_TTL_MS - 1000, nonce: 'test' });
    const encoded = Buffer.from(payload).toString('base64url');
    const sig = hmacSign(encoded);
    const expiredState = `${encoded}.${sig}`;
    assert.equal(verifySignedState(expiredState), null);
  });

  it('should accept state just before TTL expiry', () => {
    const payload = JSON.stringify({ provider: 'github', ts: Date.now() - STATE_TTL_MS + 5000, nonce: 'test' });
    const encoded = Buffer.from(payload).toString('base64url');
    const sig = hmacSign(encoded);
    const almostExpired = `${encoded}.${sig}`;
    const result = verifySignedState(almostExpired);
    assert.ok(result);
    assert.equal(result.provider, 'github');
  });

  it('should generate unique states for same provider', () => {
    const state1 = generateSignedState('github');
    const state2 = generateSignedState('github');
    assert.notEqual(state1, state2);
  });

  it('should preserve provider through encode/decode cycle', () => {
    for (const provider of ['github', 'google']) {
      const state = generateSignedState(provider);
      const result = verifySignedState(state);
      assert.ok(result);
      assert.equal(result.provider, provider);
    }
  });

  it('should reject state with missing provider field', () => {
    const payload = JSON.stringify({ ts: Date.now(), nonce: 'test' });
    const encoded = Buffer.from(payload).toString('base64url');
    const sig = hmacSign(encoded);
    assert.equal(verifySignedState(`${encoded}.${sig}`), null);
  });

  it('should reject state with missing timestamp field', () => {
    const payload = JSON.stringify({ provider: 'github', nonce: 'test' });
    const encoded = Buffer.from(payload).toString('base64url');
    const sig = hmacSign(encoded);
    assert.equal(verifySignedState(`${encoded}.${sig}`), null);
  });
});
