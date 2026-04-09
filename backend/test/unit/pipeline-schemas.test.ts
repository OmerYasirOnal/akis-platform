import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ScribeInputSchema,
  ScribeClarificationSchema,
  StructuredSpecSchema,
  ScribeOutputSchema,
  ProtoInputSchema,
  ProtoOutputSchema,
  TraceInputSchema,
  TraceOutputSchema,
  PipelineStageSchema,
  PipelineErrorSchema,
  StartPipelineRequestSchema,
  SendMessageRequestSchema,
  ApproveSpecRequestSchema,
  RejectSpecRequestSchema,
} from '../../src/pipeline/core/contracts/PipelineSchemas.js';

import {
  PipelineErrorCode,
  createPipelineError,
  RETRY_CONFIG,
} from '../../src/pipeline/core/contracts/PipelineErrors.js';

// ─── Test Fixtures ────────────────────────────────

const validSpec = {
  title: 'Todo App with Google Auth',
  problemStatement: 'Users need a simple task management tool with social login.',
  userStories: [
    {
      persona: 'Registered user',
      action: 'Create a new task with title and description',
      benefit: 'Track my daily to-dos efficiently',
    },
  ],
  acceptanceCriteria: [
    {
      id: 'ac-1',
      given: 'A logged-in user on the dashboard',
      when: 'They click the "Add Task" button and fill the form',
      then: 'A new task appears in the task list',
    },
  ],
  technicalConstraints: {
    stack: 'React + Vite + TypeScript',
    integrations: ['Google OAuth'],
    nonFunctional: ['Mobile responsive'],
  },
  outOfScope: ['Admin panel', 'Team collaboration'],
};

// ─── ScribeInput ──────────────────────────────────

describe('Pipeline Schemas — ScribeInput', () => {
  it('accepts valid idea', () => {
    const result = ScribeInputSchema.safeParse({
      idea: 'React ile bir todo uygulaması istiyorum',
    });
    assert.equal(result.success, true);
  });

  it('rejects idea shorter than 10 chars', () => {
    const result = ScribeInputSchema.safeParse({ idea: 'app' });
    assert.equal(result.success, false);
  });

  it('rejects empty idea', () => {
    const result = ScribeInputSchema.safeParse({ idea: '' });
    assert.equal(result.success, false);
  });

  it('accepts idea with optional fields', () => {
    const result = ScribeInputSchema.safeParse({
      idea: 'A todo app with authentication',
      context: 'For personal use',
      targetStack: 'React + Supabase',
    });
    assert.equal(result.success, true);
  });

  it('accepts idea with existingRepo (Scenario B placeholder)', () => {
    const result = ScribeInputSchema.safeParse({
      idea: 'Add dark mode to existing project',
      existingRepo: { owner: 'user', repo: 'my-app', branch: 'main' },
    });
    assert.equal(result.success, true);
  });
});

// ─── ScribeClarification ──────────────────────────

describe('Pipeline Schemas — ScribeClarification', () => {
  it('accepts valid questions (1-4)', () => {
    const result = ScribeClarificationSchema.safeParse({
      questions: [
        {
          id: 'q1',
          question: 'Veritabanı tercihiniz var mı?',
          reason: 'Teknoloji seçimi için önemli',
          suggestions: ['PostgreSQL', 'MongoDB', 'Supabase'],
        },
        {
          id: 'q2',
          question: 'Hedef platformunuz ne?',
          reason: 'UI framework seçimini etkiler',
        },
      ],
    });
    assert.equal(result.success, true);
  });

  it('rejects empty questions array', () => {
    const result = ScribeClarificationSchema.safeParse({ questions: [] });
    assert.equal(result.success, false);
  });

  it('rejects more than 4 questions', () => {
    const questions = Array.from({ length: 5 }, (_, i) => ({
      id: `q${i}`,
      question: `Question ${i}`,
      reason: `Reason ${i}`,
    }));
    const result = ScribeClarificationSchema.safeParse({ questions });
    assert.equal(result.success, false);
  });
});

// ─── StructuredSpec ───────────────────────────────

describe('Pipeline Schemas — StructuredSpec', () => {
  it('accepts valid spec', () => {
    const result = StructuredSpecSchema.safeParse(validSpec);
    assert.equal(result.success, true);
  });

  it('rejects spec with empty userStories', () => {
    const result = StructuredSpecSchema.safeParse({
      ...validSpec,
      userStories: [],
    });
    assert.equal(result.success, false);
  });

  it('rejects spec with empty acceptanceCriteria', () => {
    const result = StructuredSpecSchema.safeParse({
      ...validSpec,
      acceptanceCriteria: [],
    });
    assert.equal(result.success, false);
  });

  it('rejects spec with short title', () => {
    const result = StructuredSpecSchema.safeParse({
      ...validSpec,
      title: 'ab',
    });
    assert.equal(result.success, false);
  });

  it('rejects spec with short problemStatement', () => {
    const result = StructuredSpecSchema.safeParse({
      ...validSpec,
      problemStatement: 'short',
    });
    assert.equal(result.success, false);
  });
});

// ─── ScribeOutput ─────────────────────────────────

describe('Pipeline Schemas — ScribeOutput', () => {
  it('accepts valid scribe output', () => {
    const result = ScribeOutputSchema.safeParse({
      spec: validSpec,
      plan: {
        projectName: 'todo-app',
        summary: 'A simple todo application with Google Auth login.',
        features: [
          { name: 'Task Management', description: 'Create, edit, and delete tasks' },
        ],
        techChoices: ['React', 'Vite', 'TypeScript', 'Google OAuth'],
        estimatedFiles: 8,
        requiresTests: true,
      },
      rawMarkdown: '# Todo App\n\nA simple todo application.',
      confidence: 0.85,
      clarificationsAsked: 2,
      reviewNotes: {
        selfReviewPassed: true,
        revisionsApplied: [],
        assumptionsMade: [],
      },
    });
    assert.equal(result.success, true);
  });

  it('rejects confidence > 1', () => {
    const result = ScribeOutputSchema.safeParse({
      spec: validSpec,
      rawMarkdown: '# Test',
      confidence: 1.5,
      clarificationsAsked: 0,
    });
    assert.equal(result.success, false);
  });

  it('rejects negative confidence', () => {
    const result = ScribeOutputSchema.safeParse({
      spec: validSpec,
      rawMarkdown: '# Test',
      confidence: -0.1,
      clarificationsAsked: 0,
    });
    assert.equal(result.success, false);
  });

  it('rejects clarificationsAsked > 3', () => {
    const result = ScribeOutputSchema.safeParse({
      spec: validSpec,
      rawMarkdown: '# Test',
      confidence: 0.8,
      clarificationsAsked: 4,
    });
    assert.equal(result.success, false);
  });
});

// ─── ProtoInput ───────────────────────────────────

describe('Pipeline Schemas — ProtoInput', () => {
  it('accepts valid proto input', () => {
    const result = ProtoInputSchema.safeParse({
      spec: validSpec,
      repoName: 'my-todo-app',
      repoVisibility: 'private',
      owner: 'octocat',
    });
    assert.equal(result.success, true);
  });

  it('rejects invalid repo name characters', () => {
    const result = ProtoInputSchema.safeParse({
      spec: validSpec,
      repoName: 'my repo with spaces!',
      repoVisibility: 'public',
      owner: 'octocat',
    });
    assert.equal(result.success, false);
  });

  it('rejects invalid visibility', () => {
    const result = ProtoInputSchema.safeParse({
      spec: validSpec,
      repoName: 'valid-repo',
      repoVisibility: 'internal',
      owner: 'octocat',
    });
    assert.equal(result.success, false);
  });
});

// ─── ProtoOutput ──────────────────────────────────

describe('Pipeline Schemas — ProtoOutput', () => {
  it('accepts valid proto output', () => {
    const result = ProtoOutputSchema.safeParse({
      ok: true,
      branch: 'proto/scaffold-1709',
      repo: 'octocat/my-todo-app',
      repoUrl: 'https://github.com/octocat/my-todo-app',
      files: [
        { filePath: 'package.json', content: '{}', linesOfCode: 1 },
      ],
      prUrl: 'https://github.com/octocat/my-todo-app/pull/1',
      setupCommands: ['npm install', 'npm run dev'],
      metadata: {
        filesCreated: 1,
        totalLinesOfCode: 1,
        stackUsed: 'React',
        committed: true,
      },
    });
    assert.equal(result.success, true);
  });

  it('rejects output with empty files', () => {
    const result = ProtoOutputSchema.safeParse({
      ok: true,
      branch: 'proto/scaffold-1709',
      repo: 'octocat/my-todo-app',
      repoUrl: 'https://github.com/octocat/my-todo-app',
      files: [],
      setupCommands: ['npm install'],
      metadata: {
        filesCreated: 0,
        totalLinesOfCode: 0,
        stackUsed: 'React',
        committed: true,
      },
    });
    assert.equal(result.success, false);
  });
});

// ─── TraceInput ───────────────────────────────────

describe('Pipeline Schemas — TraceInput', () => {
  it('accepts valid trace input', () => {
    const result = TraceInputSchema.safeParse({
      repoOwner: 'octocat',
      repo: 'my-todo-app',
      branch: 'proto/scaffold-1709',
      spec: validSpec,
    });
    assert.equal(result.success, true);
  });

  it('accepts trace input without spec', () => {
    const result = TraceInputSchema.safeParse({
      repoOwner: 'octocat',
      repo: 'my-todo-app',
      branch: 'main',
    });
    assert.equal(result.success, true);
  });
});

// ─── TraceOutput ──────────────────────────────────

describe('Pipeline Schemas — TraceOutput', () => {
  it('accepts valid trace output', () => {
    const result = TraceOutputSchema.safeParse({
      ok: true,
      testFiles: [
        {
          filePath: 'tests/e2e/auth.spec.ts',
          content: 'test("login", async () => {})',
          testCount: 1,
        },
      ],
      coverageMatrix: { 'ac-1': ['tests/e2e/auth.spec.ts'] },
      testSummary: {
        totalTests: 1,
        coveragePercentage: 100,
        coveredCriteria: ['ac-1'],
        uncoveredCriteria: [],
      },
    });
    assert.equal(result.success, true);
  });

  it('rejects trace output with empty testFiles', () => {
    const result = TraceOutputSchema.safeParse({
      ok: true,
      testFiles: [],
      coverageMatrix: {},
      testSummary: {
        totalTests: 0,
        coveragePercentage: 0,
        coveredCriteria: [],
        uncoveredCriteria: [],
      },
    });
    assert.equal(result.success, false);
  });
});

// ─── PipelineStage ────────────────────────────────

describe('Pipeline Schemas — PipelineStage', () => {
  it('accepts all valid stages', () => {
    const stages = [
      'scribe_clarifying', 'scribe_generating', 'awaiting_approval',
      'proto_building', 'trace_testing',
      'completed', 'completed_partial', 'failed', 'cancelled',
    ];
    for (const stage of stages) {
      const result = PipelineStageSchema.safeParse(stage);
      assert.equal(result.success, true, `Stage "${stage}" should be valid`);
    }
  });

  it('rejects invalid stage', () => {
    const result = PipelineStageSchema.safeParse('unknown_stage');
    assert.equal(result.success, false);
  });
});

// ─── PipelineError ────────────────────────────────

describe('Pipeline Schemas — PipelineError', () => {
  it('accepts valid error', () => {
    const result = PipelineErrorSchema.safeParse({
      code: 'AI_RATE_LIMITED',
      message: 'AI servisi şu an yoğun.',
      retryable: true,
      recoveryAction: 'retry',
    });
    assert.equal(result.success, true);
  });

  it('accepts error with technicalDetail', () => {
    const result = PipelineErrorSchema.safeParse({
      code: 'GITHUB_API_ERROR',
      message: 'GitHub hatası',
      technicalDetail: 'HTTP 500 from api.github.com',
      retryable: true,
      recoveryAction: 'retry',
    });
    assert.equal(result.success, true);
  });
});

// ─── API Request Schemas ──────────────────────────

describe('Pipeline Schemas — API Request', () => {
  it('StartPipelineRequest accepts valid input', () => {
    const result = StartPipelineRequestSchema.safeParse({
      idea: 'React ile bir e-ticaret uygulaması istiyorum',
    });
    assert.equal(result.success, true);
  });

  it('StartPipelineRequest rejects short idea', () => {
    const result = StartPipelineRequestSchema.safeParse({ idea: 'app' });
    assert.equal(result.success, false);
  });

  it('SendMessageRequest accepts valid message', () => {
    const result = SendMessageRequestSchema.safeParse({
      message: 'PostgreSQL kullanmak istiyorum',
    });
    assert.equal(result.success, true);
  });

  it('SendMessageRequest rejects empty message', () => {
    const result = SendMessageRequestSchema.safeParse({ message: '' });
    assert.equal(result.success, false);
  });

  it('ApproveSpecRequest accepts valid input', () => {
    const result = ApproveSpecRequestSchema.safeParse({
      repoName: 'my-todo-app',
      repoVisibility: 'private',
    });
    assert.equal(result.success, true);
  });

  it('ApproveSpecRequest accepts input with edited spec', () => {
    const result = ApproveSpecRequestSchema.safeParse({
      spec: validSpec,
      repoName: 'my-app',
      repoVisibility: 'public',
    });
    assert.equal(result.success, true);
  });

  it('RejectSpecRequest accepts valid feedback', () => {
    const result = RejectSpecRequestSchema.safeParse({
      feedback: 'Auth kısmını Google yerine GitHub ile yapalım',
    });
    assert.equal(result.success, true);
  });

  it('RejectSpecRequest rejects empty feedback', () => {
    const result = RejectSpecRequestSchema.safeParse({ feedback: '' });
    assert.equal(result.success, false);
  });
});

// ─── PipelineErrors ───────────────────────────────

describe('PipelineErrors', () => {
  it('createPipelineError returns correct structure', () => {
    const error = createPipelineError(
      PipelineErrorCode.AI_RATE_LIMITED,
      'Rate limit exceeded: 429'
    );
    assert.equal(error.code, 'AI_RATE_LIMITED');
    assert.equal(error.retryable, true);
    assert.equal(error.recoveryAction, 'retry');
    assert.equal(error.technicalDetail, 'Rate limit exceeded: 429');
    assert.ok(error.message.length > 0);
  });

  it('createPipelineError works for non-retryable errors', () => {
    const error = createPipelineError(PipelineErrorCode.GITHUB_NOT_CONNECTED);
    assert.equal(error.retryable, false);
    assert.equal(error.recoveryAction, 'reconnect_github');
    assert.equal(error.technicalDetail, undefined);
  });

  it('all error codes have definitions', () => {
    for (const code of Object.values(PipelineErrorCode)) {
      const error = createPipelineError(code);
      assert.ok(error.message, `Error code "${code}" should have a message`);
      assert.equal(typeof error.retryable, 'boolean', `Error code "${code}" should have retryable`);
    }
  });

  it('RETRY_CONFIG has correct values', () => {
    assert.equal(RETRY_CONFIG.maxRetries, 3);
    assert.equal(RETRY_CONFIG.backoffDelays.length, 3);
    assert.equal(RETRY_CONFIG.specValidationMaxRetries, 2);
    assert.equal(RETRY_CONFIG.stageTimeoutMs, 300_000);
  });
});
