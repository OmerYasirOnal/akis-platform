/**
 * Scribe dry-run behavior
 * Ensures "Run Test Job" (dryRun=true) does not attempt GitHub writes (commit/PR)
 * and therefore cannot regress into MCP write-path failures.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ScribeAgent } from '../../src/agents/scribe/ScribeAgent.js';
import type { GitHubMCPService } from '../../src/services/mcp/adapters/GitHubMCPService.js';
import type { AIService } from '../../src/services/ai/AIService.js';

describe('ScribeAgent (dryRun)', () => {
  it('does not call commitFile or create PR when dryRun=true', async () => {
    let commitCalled = false;
    let prCalled = false;
    let branchCalled = false;

    const githubMCP = {
      async createBranch() {
        branchCalled = true;
        return { branch: 'docs/scribe-test', sha: 'sha' };
      },
      async getFileContent() {
        return { content: 'existing', encoding: 'utf8' as const, sha: 'sha-1' };
      },
      async getFileContentSafe() {
        return { content: 'existing', encoding: 'utf8' as const, sha: 'sha-1' };
      },
      async callToolRaw() {
        return null; // Directory listing returns null for simple tests
      },
      async commitFile() {
        commitCalled = true;
        throw new Error('commitFile should not be called in dryRun');
      },
      async createPRDraft() {
        prCalled = true;
        throw new Error('createPRDraft should not be called in dryRun');
      },
    };

    const aiService = {
      reflector: {
        critique: async () => ({ issues: [], recommendations: [] }),
      },
      generateWorkArtifact: async () => ({ 
        content: '# Test Documentation\n\nGenerated content for test.', 
        metadata: {} 
      }),
    };

    const agent = new ScribeAgent({
      tools: {
        githubMCP: githubMCP as unknown as GitHubMCPService,
        aiService: aiService as unknown as AIService,
      },
    });

    const result = await agent.executeWithTools({}, undefined, {
      owner: 'acme',
      repo: 'repo',
      baseBranch: 'main',
      targetPath: 'README.md',
      taskDescription: 'Test update',
      dryRun: true,
    });

    assert.ok(result && typeof result === 'object');
    const r = result as Record<string, unknown>;

    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.agent, 'scribe-v2');
    assert.strictEqual(commitCalled, false);
    assert.strictEqual(prCalled, false);
    assert.strictEqual(branchCalled, false);
    assert.ok(r.preview, 'expected preview to be present in dryRun result');
    assert.ok(r.diagnostics, 'expected diagnostics to be present in v2 result');
  });
});


