import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAllowedCommand,
  resolveCommand,
  DEFAULT_ALLOWLIST,
  type CommandDefinition,
} from '../../src/services/studio/StudioCommandRunner.js';
import {
  validatePatchProposal,
  computePatchSummary,
  patchProposalSchema,
  type PatchProposal,
} from '../../src/services/studio/PatchProposalService.js';

describe('StudioCommandRunner', () => {
  it('default allowlist has expected commands', () => {
    const keys = DEFAULT_ALLOWLIST.map((c) => c.key);
    assert.ok(keys.includes('git_status'));
    assert.ok(keys.includes('lint'));
    assert.ok(keys.includes('typecheck'));
    assert.ok(keys.includes('test'));
    assert.ok(keys.includes('build'));
  });

  it('isAllowedCommand returns true for valid keys', () => {
    assert.equal(isAllowedCommand('git_status'), true);
    assert.equal(isAllowedCommand('lint'), true);
  });

  it('isAllowedCommand returns false for unknown keys', () => {
    assert.equal(isAllowedCommand('rm_rf'), false);
    assert.equal(isAllowedCommand('sudo'), false);
    assert.equal(isAllowedCommand(''), false);
  });

  it('resolveCommand returns definition for valid key', () => {
    const cmd = resolveCommand('typecheck');
    assert.ok(cmd);
    assert.equal(cmd.command, 'pnpm');
    assert.deepEqual(cmd.args, ['typecheck']);
  });

  it('resolveCommand returns null for unknown key', () => {
    assert.equal(resolveCommand('hack'), null);
  });

  it('custom allowlist overrides default', () => {
    const custom: CommandDefinition[] = [
      { key: 'custom_cmd', label: 'custom', command: 'echo', args: ['hello'] },
    ];
    assert.equal(isAllowedCommand('custom_cmd', custom), true);
    assert.equal(isAllowedCommand('git_status', custom), false);
  });

  it('all default commands use shell:false compatible format', () => {
    for (const cmd of DEFAULT_ALLOWLIST) {
      assert.ok(cmd.command.length > 0, `${cmd.key} has empty command`);
      assert.ok(Array.isArray(cmd.args), `${cmd.key} args is not an array`);
      assert.ok(!cmd.command.includes(' '), `${cmd.key} command has spaces (shell injection risk)`);
    }
  });
});

describe('PatchProposalService', () => {
  const validProposal: PatchProposal = {
    sessionId: '00000000-0000-0000-0000-000000000001',
    title: 'Fix login button',
    patches: [
      { filePath: 'src/components/LoginButton.tsx', operation: 'modify', diff: '+color: blue' },
    ],
    status: 'proposed',
  };

  it('validates a correct proposal', () => {
    const errors = validatePatchProposal(validProposal);
    assert.equal(errors.length, 0);
  });

  it('rejects path traversal', () => {
    const bad: PatchProposal = {
      ...validProposal,
      patches: [{ filePath: '../../../etc/passwd', operation: 'modify', diff: 'x' }],
    };
    const errors = validatePatchProposal(bad);
    assert.ok(errors.some((e) => e.includes('Path traversal')));
  });

  it('rejects absolute paths', () => {
    const bad: PatchProposal = {
      ...validProposal,
      patches: [{ filePath: '/etc/hosts', operation: 'modify', diff: 'x' }],
    };
    const errors = validatePatchProposal(bad);
    assert.ok(errors.some((e) => e.includes('Absolute paths')));
  });

  it('rejects forbidden files', () => {
    const bad: PatchProposal = {
      ...validProposal,
      patches: [{ filePath: '.env', operation: 'create', content: 'SECRET=x' }],
    };
    const errors = validatePatchProposal(bad);
    assert.ok(errors.some((e) => e.includes('Forbidden file')));
  });

  it('rejects forbidden extensions', () => {
    const bad: PatchProposal = {
      ...validProposal,
      patches: [{ filePath: 'keys/server.pem', operation: 'create', content: 'key' }],
    };
    const errors = validatePatchProposal(bad);
    assert.ok(errors.some((e) => e.includes('Forbidden extension')));
  });

  it('requires content for create operation', () => {
    const bad: PatchProposal = {
      ...validProposal,
      patches: [{ filePath: 'src/new.ts', operation: 'create' }],
    };
    const errors = validatePatchProposal(bad);
    assert.ok(errors.some((e) => e.includes('requires content')));
  });

  it('rejects content for delete operation', () => {
    const bad: PatchProposal = {
      ...validProposal,
      patches: [{ filePath: 'old.ts', operation: 'delete', content: 'leftover' }],
    };
    const errors = validatePatchProposal(bad);
    assert.ok(errors.some((e) => e.includes('should not include content')));
  });

  it('computePatchSummary counts correctly', () => {
    const proposal: PatchProposal = {
      sessionId: '00000000-0000-0000-0000-000000000001',
      title: 'Multi-file change',
      patches: [
        { filePath: 'a.ts', operation: 'create', content: 'new' },
        { filePath: 'b.ts', operation: 'modify', diff: 'diff' },
        { filePath: 'c.ts', operation: 'modify', diff: 'diff' },
        { filePath: 'd.ts', operation: 'delete' },
      ],
      status: 'proposed',
    };
    const summary = computePatchSummary(proposal);
    assert.equal(summary.totalFiles, 4);
    assert.equal(summary.created, 1);
    assert.equal(summary.modified, 2);
    assert.equal(summary.deleted, 1);
    assert.equal(summary.status, 'proposed');
  });

  it('patchProposalSchema parses valid input', () => {
    const result = patchProposalSchema.parse({
      sessionId: '00000000-0000-0000-0000-000000000001',
      title: 'Test',
      patches: [{ filePath: 'x.ts', operation: 'create', content: 'code' }],
    });
    assert.equal(result.title, 'Test');
    assert.equal(result.status, 'proposed');
  });
});
