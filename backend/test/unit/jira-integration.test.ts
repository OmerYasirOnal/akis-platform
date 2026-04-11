import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  createJiraEpicFromSpec,
  commentJiraWithProtoResult,
  commentJiraWithTraceResult,
} from '../../src/pipeline/integrations/jiraIntegration.js';
import type { JiraMCPService } from '../../src/services/mcp/adapters/JiraMCPService.js';
import type { StructuredSpec } from '../../src/pipeline/core/contracts/PipelineTypes.js';

// ─── Test Fixtures ────────────────────────────────

const testSpec: StructuredSpec = {
  title: 'Todo App',
  problemStatement: 'Görev takip uygulaması.',
  userStories: [
    { persona: 'Kullanıcı', action: 'Görev oluşturma', benefit: 'Takip' },
    { persona: 'Yönetici', action: 'Kullanıcı yönetimi', benefit: 'Kontrol' },
  ],
  acceptanceCriteria: [
    { id: 'ac-1', given: 'Giriş yapmış', when: 'Görev ekle', then: 'Oluşur' },
  ],
  technicalConstraints: { stack: 'React' },
  outOfScope: [],
};

// ─── Mock Jira Service ────────────────────────────

interface MockJiraCall {
  method: string;
  args: unknown[];
}

function createMockJira(overrides?: {
  createIssue?: (projectKey: string, fields: unknown) => Promise<{ key: string; id: string }>;
  linkIssues?: (child: string, parent: string, type: string) => Promise<{ success: boolean }>;
  addComment?: (key: string, comment: string) => Promise<unknown>;
  getTransitions?: (key: string) => Promise<{ transitions: Array<{ id: string; name: string }> }>;
  transitionIssue?: (key: string, transitionId: string) => Promise<{ success: boolean }>;
}): { jira: JiraMCPService; calls: MockJiraCall[] } {
  const calls: MockJiraCall[] = [];
  let issueCounter = 0;

  const jira = {
    createIssue: overrides?.createIssue ?? (async (projectKey: string, fields: unknown) => {
      issueCounter++;
      calls.push({ method: 'createIssue', args: [projectKey, fields] });
      return { key: `PROJ-${issueCounter}`, id: `${issueCounter}` };
    }),
    linkIssues: overrides?.linkIssues ?? (async (child: string, parent: string, type: string) => {
      calls.push({ method: 'linkIssues', args: [child, parent, type] });
      return { success: true };
    }),
    addComment: overrides?.addComment ?? (async (key: string, comment: string) => {
      calls.push({ method: 'addComment', args: [key, comment] });
      return { id: '1', body: comment };
    }),
    getTransitions: overrides?.getTransitions ?? (async (key: string) => {
      calls.push({ method: 'getTransitions', args: [key] });
      return { transitions: [{ id: '31', name: 'Done' }] };
    }),
    transitionIssue: overrides?.transitionIssue ?? (async (key: string, transitionId: string) => {
      calls.push({ method: 'transitionIssue', args: [key, transitionId] });
      return { success: true };
    }),
  } as unknown as JiraMCPService;

  return { jira, calls };
}

// ─── createJiraEpicFromSpec ──────────────────────

describe('Jira Integration — createJiraEpicFromSpec', () => {
  it('creates an epic and sub-tasks from spec', async () => {
    const { jira, calls } = createMockJira();

    const epicKey = await createJiraEpicFromSpec(jira, 'PROJ', testSpec);

    assert.equal(epicKey, 'PROJ-1');

    // 1 epic + 2 user stories = 3 createIssue calls
    const createCalls = calls.filter((c) => c.method === 'createIssue');
    assert.equal(createCalls.length, 3);

    // Verify epic fields
    const epicFields = createCalls[0].args[1] as { summary: string; issueType: string };
    assert.equal(epicFields.summary, 'Todo App');
    assert.equal(epicFields.issueType, 'Epic');

    // Verify sub-task linkage calls
    const linkCalls = calls.filter((c) => c.method === 'linkIssues');
    assert.equal(linkCalls.length, 2);
  });

  it('returns null when epic creation fails', async () => {
    const { jira } = createMockJira({
      createIssue: async () => { throw new Error('Jira API error'); },
    });

    const result = await createJiraEpicFromSpec(jira, 'PROJ', testSpec);
    assert.equal(result, null);
  });

  it('continues even if sub-task creation fails', async () => {
    let createCount = 0;
    const { jira } = createMockJira({
      createIssue: async (projectKey, _fields) => {
        createCount++;
        if (createCount > 1) throw new Error('Sub-task fail');
        return { key: `${projectKey}-1`, id: '1' };
      },
    });

    const result = await createJiraEpicFromSpec(jira, 'PROJ', testSpec);
    // Epic should still be returned even if sub-tasks fail
    assert.equal(result, 'PROJ-1');
  });
});

// ─── commentJiraWithProtoResult ──────────────────

describe('Jira Integration — commentJiraWithProtoResult', () => {
  it('posts a comment with branch and files info', async () => {
    const { jira, calls } = createMockJira();

    await commentJiraWithProtoResult(jira, 'PROJ-1', {
      branch: 'proto/scaffold-123',
      repo: 'testuser/todo-app',
      prUrl: 'https://github.com/testuser/todo-app/pull/1',
      filesCreated: 10,
    });

    const commentCalls = calls.filter((c) => c.method === 'addComment');
    assert.equal(commentCalls.length, 1);

    const comment = commentCalls[0].args[1] as string;
    assert.ok(comment.includes('proto/scaffold-123'));
    assert.ok(comment.includes('10'));
    assert.ok(comment.includes('Pull Request'));
  });

  it('does not throw when comment fails', async () => {
    const { jira } = createMockJira({
      addComment: async () => { throw new Error('Comment fail'); },
    });

    // Should not throw
    await commentJiraWithProtoResult(jira, 'PROJ-1', {
      branch: 'proto/scaffold-123',
      repo: 'testuser/todo-app',
      filesCreated: 5,
    });
  });
});

// ─── commentJiraWithTraceResult ──────────────────

describe('Jira Integration — commentJiraWithTraceResult', () => {
  it('posts comment and transitions to Done when tests pass', async () => {
    const { jira, calls } = createMockJira();

    await commentJiraWithTraceResult(jira, 'PROJ-1', {
      totalTests: 5,
      coveragePercentage: 85,
      passed: true,
    });

    const commentCalls = calls.filter((c) => c.method === 'addComment');
    assert.equal(commentCalls.length, 1);
    const comment = commentCalls[0].args[1] as string;
    assert.ok(comment.includes('All tests passed'));
    assert.ok(comment.includes('5'));
    assert.ok(comment.includes('85'));

    // Should also transition
    const transitionCalls = calls.filter((c) => c.method === 'transitionIssue');
    assert.equal(transitionCalls.length, 1);
    assert.equal(transitionCalls[0].args[1], '31'); // Done transition ID
  });

  it('posts comment without transition when tests fail', async () => {
    const { jira, calls } = createMockJira();

    await commentJiraWithTraceResult(jira, 'PROJ-1', {
      totalTests: 5,
      coveragePercentage: 40,
      passed: false,
    });

    const commentCalls = calls.filter((c) => c.method === 'addComment');
    assert.equal(commentCalls.length, 1);
    const comment = commentCalls[0].args[1] as string;
    assert.ok(comment.includes('Some tests failed'));

    // Should NOT transition
    const transitionCalls = calls.filter((c) => c.method === 'transitionIssue');
    assert.equal(transitionCalls.length, 0);
  });

  it('does not throw when comment fails', async () => {
    const { jira } = createMockJira({
      addComment: async () => { throw new Error('Comment fail'); },
    });

    await commentJiraWithTraceResult(jira, 'PROJ-1', {
      totalTests: 3,
      coveragePercentage: 100,
      passed: true,
    });
  });
});
