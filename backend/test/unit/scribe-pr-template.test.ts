/**
 * Regression test: PR template placeholder rendering
 * Ensures ScribeAgent PR title/body templates never reference undefined variables
 * and replace common placeholders deterministically.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ScribeAgent } from '../../src/agents/scribe/ScribeAgent.js';
import type { GitHubMCPService } from '../../src/services/mcp/adapters/GitHubMCPService.js';
import type { AIService } from '../../src/services/ai/AIService.js';

describe('ScribeAgent (PR template placeholders)', () => {
  it('renders {agent}/{summary}/{path}/{count} without leaving braces', async () => {
    let capturedTitle: string | null = null;
    let capturedBody: string | null = null;

    const githubMCP = {
      async createBranch() {
        return { branch: 'docs/scribe-test', sha: 'sha' };
      },
      async getFileContent(_owner: string, _repo: string, _branch: string, path: string) {
        return { content: `existing content for ${path}`, encoding: 'utf8' as const, sha: 'sha-1' };
      },
      async commitFile() {
        return { ok: true, sha: 'commit-sha' };
      },
      async createPRDraft(
        _owner: string,
        _repo: string,
        title: string,
        body: string,
        _head: string,
        _base: string
      ) {
        capturedTitle = title;
        capturedBody = body;
        return { url: 'https://example.invalid/pr/1', number: 1 };
      },
    };

    const aiService = {
      reflector: {
        critique: async () => ({ issues: [], recommendations: [] }),
      },
      generateWorkArtifact: async () => ({
        content: '# Documentation\n\nGenerated content.',
        metadata: {},
      }),
    };

    const agent = new ScribeAgent({
      tools: {
        githubMCP: githubMCP as unknown as GitHubMCPService,
        aiService: aiService as unknown as AIService,
      },
    });

    await agent.executeWithTools({}, undefined, {
      owner: 'acme',
      repo: 'repo',
      baseBranch: 'main',
      targetPath: 'docs/',
      taskDescription: 'Update documentation set',
      dryRun: false,
      prTitleTemplate: 'docs({agent}): {summary} [{path}] ({count})',
      prBodyTemplate: 'Agent={agent}\nPath={path}\nCount={count}\nSummary={summary}',
    });

    assert.ok(capturedTitle, 'expected createPRDraft to be called and capture title');
    assert.ok(capturedBody, 'expected createPRDraft to be called and capture body');

    assert.ok(!capturedTitle.includes('{'), `expected no unrendered placeholders in title: ${capturedTitle}`);
    assert.ok(!capturedBody.includes('{'), `expected no unrendered placeholders in body: ${capturedBody}`);

    assert.ok(capturedTitle.includes('docs(scribe):'), 'expected {agent} placeholder to be replaced');
    assert.ok(capturedTitle.includes('[docs/]'), 'expected {path} placeholder to be replaced with targetPath');
  });
});


