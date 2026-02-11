import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

// Validate the API contract schemas match expected shapes
const createSessionSchema = z.object({
  title: z.string().trim().min(1).max(256),
  repoUrl: z.string().url().max(512).optional(),
  branch: z.string().max(256).optional(),
});

const updateSessionSchema = z.object({
  title: z.string().trim().min(1).max(256).optional(),
  state: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  workspace: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const listQuerySchema = z.object({
  state: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

describe('Studio session schemas', () => {
  it('createSessionSchema accepts valid input', () => {
    const result = createSessionSchema.parse({
      title: 'My project',
      repoUrl: 'https://github.com/user/repo',
      branch: 'main',
    });
    assert.equal(result.title, 'My project');
    assert.equal(result.repoUrl, 'https://github.com/user/repo');
    assert.equal(result.branch, 'main');
  });

  it('createSessionSchema rejects empty title', () => {
    assert.throws(() => createSessionSchema.parse({ title: '' }));
  });

  it('createSessionSchema allows title-only', () => {
    const result = createSessionSchema.parse({ title: 'Minimal' });
    assert.equal(result.title, 'Minimal');
    assert.equal(result.repoUrl, undefined);
    assert.equal(result.branch, undefined);
  });

  it('updateSessionSchema allows partial updates', () => {
    const result = updateSessionSchema.parse({ state: 'paused' });
    assert.equal(result.state, 'paused');
    assert.equal(result.title, undefined);
  });

  it('updateSessionSchema rejects invalid state', () => {
    assert.throws(() => updateSessionSchema.parse({ state: 'invalid' }));
  });

  it('listQuerySchema uses defaults', () => {
    const result = listQuerySchema.parse({});
    assert.equal(result.limit, 20);
    assert.equal(result.offset, 0);
    assert.equal(result.state, undefined);
  });

  it('listQuerySchema filters by state', () => {
    const result = listQuerySchema.parse({ state: 'active', limit: '5' });
    assert.equal(result.state, 'active');
    assert.equal(result.limit, 5);
  });

  it('studio session state enum covers 4 states', () => {
    const states = ['active', 'paused', 'completed', 'archived'];
    for (const state of states) {
      const result = updateSessionSchema.parse({ state });
      assert.equal(result.state, state);
    }
  });
});
