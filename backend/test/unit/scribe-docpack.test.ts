import { test } from 'node:test';
import assert from 'node:assert';
import { resolveDocPackConfig, DOC_PACK_TARGETS, DOC_DEPTH_LIMITS } from '../../src/agents/scribe/DocContract.js';

test('resolveDocPackConfig', async (t) => {
  await t.test('applies standard defaults when no input provided', () => {
    const config = resolveDocPackConfig({});
    assert.strictEqual(config.docPack, 'standard');
    assert.strictEqual(config.docDepth, 'standard');
    assert.strictEqual(config.passes, 1);
    assert.deepStrictEqual(config.outputTargets, DOC_PACK_TARGETS.standard);
    assert.strictEqual(config.maxOutputTokens, DOC_DEPTH_LIMITS.standard);
  });

  await t.test('enforces maxOutputTokens cap at 64000', () => {
    const config = resolveDocPackConfig({ maxOutputTokens: 999_999 });
    assert.strictEqual(config.maxOutputTokens, 64_000);
  });

  await t.test('respects explicit maxOutputTokens within cap', () => {
    const config = resolveDocPackConfig({ maxOutputTokens: 8000 });
    assert.strictEqual(config.maxOutputTokens, 8000);
  });

  await t.test('docPack=readme yields only README target', () => {
    const config = resolveDocPackConfig({ docPack: 'readme' });
    assert.deepStrictEqual(config.outputTargets, ['README']);
    assert.strictEqual(config.passes, 1);
  });

  await t.test('docPack=full triggers passes=2 and expands to all targets', () => {
    const config = resolveDocPackConfig({ docPack: 'full' });
    assert.strictEqual(config.passes, 2);
    assert.deepStrictEqual(config.outputTargets, DOC_PACK_TARGETS.full);
    assert.strictEqual(config.outputTargets.length, 8);
  });

  await t.test('docDepth=deep triggers passes=2', () => {
    const config = resolveDocPackConfig({ docDepth: 'deep' });
    assert.strictEqual(config.passes, 2);
    assert.strictEqual(config.maxOutputTokens, DOC_DEPTH_LIMITS.deep);
  });

  await t.test('user-provided outputTargets are respected for standard pack', () => {
    const config = resolveDocPackConfig({
      docPack: 'standard',
      outputTargets: ['README', 'API'],
    });
    assert.deepStrictEqual(config.outputTargets, ['README', 'API']);
  });

  await t.test('invalid outputTargets are filtered out', () => {
    const config = resolveDocPackConfig({
      docPack: 'standard',
      outputTargets: ['README', 'INVALID_TARGET' as never],
    });
    assert.deepStrictEqual(config.outputTargets, ['README']);
  });

  await t.test('docDepth=lite sets 4000 token budget', () => {
    const config = resolveDocPackConfig({ docDepth: 'lite' });
    assert.strictEqual(config.maxOutputTokens, 4_000);
  });
});
