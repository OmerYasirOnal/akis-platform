/**
 * Tests for SessionService — in-memory session store
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SessionService, type SessionUser } from '../../src/services/session/SessionService.js';

const testUser: SessionUser = { id: 'u-1', email: 'test@akis.com' };

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    service = new SessionService();
  });

  // ─── create ────────────────────────────────────────────────────

  it('creates a session with a UUID id', () => {
    const record = service.create(testUser);
    assert.ok(record.id);
    assert.match(record.id, /^[0-9a-f]{8}-[0-9a-f]{4}-/);
  });

  it('stores user data in session', () => {
    const record = service.create(testUser);
    assert.deepStrictEqual(record.user, testUser);
  });

  it('sets createdAt to a recent Date', () => {
    const before = Date.now();
    const record = service.create(testUser);
    const after = Date.now();
    assert.ok(record.createdAt instanceof Date);
    assert.ok(record.createdAt.getTime() >= before);
    assert.ok(record.createdAt.getTime() <= after);
  });

  it('generates unique IDs for each session', () => {
    const a = service.create(testUser);
    const b = service.create(testUser);
    assert.notEqual(a.id, b.id);
  });

  // ─── get ───────────────────────────────────────────────────────

  it('retrieves a previously created session', () => {
    const created = service.create(testUser);
    const retrieved = service.get(created.id);
    assert.ok(retrieved);
    assert.equal(retrieved.id, created.id);
    assert.deepStrictEqual(retrieved.user, testUser);
  });

  it('returns null for unknown session ID', () => {
    assert.equal(service.get('nonexistent-id'), null);
  });

  it('returns null for empty string ID', () => {
    assert.equal(service.get(''), null);
  });

  // ─── destroy ───────────────────────────────────────────────────

  it('destroys a session so it cannot be retrieved', () => {
    const record = service.create(testUser);
    service.destroy(record.id);
    assert.equal(service.get(record.id), null);
  });

  it('does not throw when destroying nonexistent session', () => {
    assert.doesNotThrow(() => service.destroy('nonexistent'));
  });

  it('only destroys the targeted session', () => {
    const a = service.create(testUser);
    const b = service.create({ id: 'u-2', email: 'other@akis.com' });
    service.destroy(a.id);
    assert.equal(service.get(a.id), null);
    assert.ok(service.get(b.id));
  });

  // ─── isolation ─────────────────────────────────────────────────

  it('separate instances do not share state', () => {
    const other = new SessionService();
    const record = service.create(testUser);
    assert.equal(other.get(record.id), null);
  });
});
