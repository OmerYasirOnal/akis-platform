import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  PipelineOrchestrator,
  type PipelineStore,
  type PipelineStateUpdate,
  type PipelineEvent,
} from '../../../pipeline/backend/core/orchestrator/PipelineOrchestrator.js';
import type {
  PipelineState,
  PipelineStage,
  PipelineMetrics,
  ScribeMessageType,
  ScribeOutput,
  ScribeClarification,
  StructuredSpec,
  ProtoOutput,
  TraceOutput,
} from '../../../pipeline/backend/core/contracts/PipelineTypes.js';
import type { ScribeAgent, ScribeState, ScribeResult } from '../../../pipeline/backend/agents/scribe/ScribeAgent.js';
import type { ProtoAgent, ProtoResult } from '../../../pipeline/backend/agents/proto/ProtoAgent.js';
import type { TraceAgent, TraceResult } from '../../../pipeline/backend/agents/trace/TraceAgent.js';
import type { PipelineError } from '../../../pipeline/backend/core/contracts/PipelineTypes.js';

// ─── Test Fixtures ────────────────────────────────

const validSpec: StructuredSpec = {
  title: 'Todo App',
  problemStatement: 'Kullanıcıların görevlerini takip edebilecekleri bir uygulama.',
  userStories: [{ persona: 'Kullanıcı', action: 'Görev oluşturma', benefit: 'Takip' }],
  acceptanceCriteria: [{ id: 'ac-1', given: 'Giriş yapmış', when: 'Görev ekle', then: 'Oluşur' }],
  technicalConstraints: { stack: 'React + Vite' },
  outOfScope: [],
};

const mockScribeOutput: ScribeOutput = {
  spec: validSpec,
  rawMarkdown: '# Todo App\n...',
  confidence: 0.85,
  clarificationsAsked: 1,
};

const mockClarification: ScribeClarification = {
  questions: [
    { id: 'q1', question: 'Hangi auth yöntemi?', reason: 'Auth detayı gerekli', suggestions: ['Google', 'Email'] },
  ],
};

const mockProtoOutput: ProtoOutput = {
  ok: true,
  branch: 'proto/scaffold-123',
  repo: 'testuser/todo-app',
  repoUrl: 'https://github.com/testuser/todo-app',
  files: [{ filePath: 'src/App.tsx', content: 'export default function App() {}', linesOfCode: 1 }],
  setupCommands: ['git clone ...', 'cd todo-app', 'npm install'],
  metadata: { filesCreated: 1, totalLinesOfCode: 1, stackUsed: 'React + Vite', committed: true },
};

const mockTraceOutput: TraceOutput = {
  ok: true,
  testFiles: [{ filePath: 'tests/e2e/todo.spec.ts', content: 'test()', testCount: 2 }],
  coverageMatrix: { 'ac-1': ['tests/e2e/todo.spec.ts'] },
  testSummary: { totalTests: 2, coveragePercentage: 100, coveredCriteria: ['ac-1'], uncoveredCriteria: [] },
  branch: 'trace/tests-456',
};

// ─── In-Memory Store ──────────────────────────────

class InMemoryStore implements PipelineStore {
  private pipelines = new Map<string, PipelineState>();

  async create(userId: string): Promise<PipelineState> {
    const id = crypto.randomUUID();
    const pipeline: PipelineState = {
      id,
      userId,
      stage: 'scribe_clarifying',
      scribeConversation: [],
      metrics: { startedAt: new Date(), clarificationRounds: 0, retryCount: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pipelines.set(id, pipeline);
    return { ...pipeline };
  }

  async getById(id: string): Promise<PipelineState | null> {
    const p = this.pipelines.get(id);
    return p ? { ...p } : null;
  }

  async listByUser(userId: string): Promise<PipelineState[]> {
    return [...this.pipelines.values()].filter((p) => p.userId === userId).map((p) => ({ ...p }));
  }

  async update(id: string, data: Partial<PipelineStateUpdate>): Promise<PipelineState> {
    const existing = this.pipelines.get(id);
    if (!existing) throw new Error(`Pipeline not found: ${id}`);
    const updated: PipelineState = {
      ...existing,
      ...data,
      metrics: data.metrics ? { ...existing.metrics, ...data.metrics } : existing.metrics,
      updatedAt: new Date(),
    } as PipelineState;
    if (data.error === null) updated.error = undefined;
    this.pipelines.set(id, updated);
    return { ...updated };
  }
}

// ─── Mock Factories ───────────────────────────────

function createMockScribe(overrides?: {
  analyzIdea?: (state: ScribeState) => Promise<ScribeResult>;
  continueAfterAnswer?: (state: ScribeState) => Promise<ScribeResult>;
  regenerateSpec?: (state: ScribeState, feedback: string) => Promise<ScribeResult>;
}): ScribeAgent {
  return {
    createInitialState(input: { idea: string; context?: string; targetStack?: string }) {
      return {
        idea: input.idea,
        context: input.context,
        targetStack: input.targetStack,
        conversation: [],
        clarificationRound: 0,
        phase: 'clarifying' as const,
      };
    },
    analyzIdea: overrides?.analyzIdea ?? (async () => ({ type: 'spec' as const, data: mockScribeOutput })),
    processUserAnswer(state: ScribeState, answer: string) {
      state.conversation.push({ type: 'user_answer', content: answer });
    },
    continueAfterAnswer: overrides?.continueAfterAnswer ?? (async () => ({ type: 'spec' as const, data: mockScribeOutput })),
    regenerateSpec: overrides?.regenerateSpec ?? (async () => ({ type: 'spec' as const, data: mockScribeOutput })),
    generateSpec: async () => ({ type: 'spec' as const, data: mockScribeOutput }),
  } as unknown as ScribeAgent;
}

function createMockProto(overrides?: {
  execute?: (input: unknown) => Promise<ProtoResult>;
}): ProtoAgent {
  return {
    execute: overrides?.execute ?? (async () => ({ type: 'output' as const, data: mockProtoOutput })),
  } as unknown as ProtoAgent;
}

function createMockTrace(overrides?: {
  execute?: (input: unknown) => Promise<TraceResult>;
}): TraceAgent {
  return {
    execute: overrides?.execute ?? (async () => ({ type: 'output' as const, data: mockTraceOutput })),
  } as unknown as TraceAgent;
}

function createOrchestrator(overrides?: {
  store?: PipelineStore;
  scribe?: ScribeAgent;
  proto?: ProtoAgent;
  trace?: TraceAgent;
  getGitHubOwner?: (userId: string) => Promise<string>;
  emit?: (event: PipelineEvent) => void;
}) {
  const store = overrides?.store ?? new InMemoryStore();
  return {
    store,
    orchestrator: new PipelineOrchestrator(
      store,
      overrides?.scribe ?? createMockScribe(),
      overrides?.proto ?? createMockProto(),
      overrides?.trace ?? createMockTrace(),
      overrides?.getGitHubOwner ?? (async () => 'testuser'),
      overrides?.emit,
    ),
  };
}

// ─── Happy Path ───────────────────────────────────

describe('Orchestrator — Happy path', () => {
  it('clear idea → spec → approve → completed', async () => {
    const { orchestrator } = createOrchestrator();

    // Step 1: Start pipeline — clear idea → directly generates spec
    const started = await orchestrator.startPipeline('user-1', { idea: 'React todo app with Google Auth' });
    assert.equal(started.stage, 'awaiting_approval');
    assert.ok(started.scribeOutput);
    assert.equal(started.title, 'Todo App');

    // Step 2: Approve spec → Proto → Trace → completed
    const completed = await orchestrator.approveSpec(started.id, 'my-todo-app', 'private');
    assert.equal(completed.stage, 'completed');
    assert.ok(completed.protoOutput);
    assert.ok(completed.traceOutput);
    assert.ok(completed.metrics.protoCompletedAt);
    assert.ok(completed.metrics.traceCompletedAt);
  });

  it('vague idea → clarification → answer → spec → approve → completed', async () => {
    let callCount = 0;
    const scribe = createMockScribe({
      analyzIdea: async () => {
        callCount++;
        return { type: 'clarification', data: mockClarification };
      },
      continueAfterAnswer: async () => {
        return { type: 'spec', data: mockScribeOutput };
      },
    });
    const { orchestrator } = createOrchestrator({ scribe });

    // Step 1: Start → clarification
    const started = await orchestrator.startPipeline('user-1', { idea: 'Bir uygulama istiyorum' });
    assert.equal(started.stage, 'scribe_clarifying');
    assert.equal(started.scribeConversation.length, 2); // user_idea + clarification

    // Step 2: Send answer → spec
    const answered = await orchestrator.sendMessage(started.id, 'Google Auth istiyorum');
    assert.equal(answered.stage, 'awaiting_approval');

    // Step 3: Approve → completed
    const completed = await orchestrator.approveSpec(answered.id, 'my-app', 'private');
    assert.equal(completed.stage, 'completed');
  });
});

// ─── Error and Retry ──────────────────────────────

describe('Orchestrator — Error and retry', () => {
  it('Proto fails → failed → retry → completed', async () => {
    let protoCallCount = 0;
    const proto = createMockProto({
      execute: async () => {
        protoCallCount++;
        if (protoCallCount === 1) {
          return {
            type: 'error' as const,
            error: { code: 'GITHUB_API_ERROR', message: 'Temporary failure', retryable: true },
          };
        }
        return { type: 'output' as const, data: mockProtoOutput };
      },
    });
    const { orchestrator } = createOrchestrator({ proto });

    // Start → spec
    const started = await orchestrator.startPipeline('user-1', { idea: 'React todo app' });
    assert.equal(started.stage, 'awaiting_approval');

    // Approve → Proto fails
    const failed = await orchestrator.approveSpec(started.id, 'my-app', 'private');
    assert.equal(failed.stage, 'failed');
    assert.equal(failed.error?.code, 'GITHUB_API_ERROR');

    // Retry → Proto succeeds → Trace → completed
    const retried = await orchestrator.retryStage(failed.id);
    assert.equal(retried.stage, 'completed');
    assert.equal(protoCallCount, 2);
  });

  it('Scribe fails → failed → retry → clarification', async () => {
    let analyzCount = 0;
    const scribe = createMockScribe({
      analyzIdea: async () => {
        analyzCount++;
        if (analyzCount === 1) {
          return {
            type: 'error' as const,
            error: { code: 'AI_PROVIDER_ERROR', message: 'AI down', retryable: true },
          };
        }
        return { type: 'clarification', data: mockClarification };
      },
    });
    const { orchestrator } = createOrchestrator({ scribe });

    // Start → error
    const started = await orchestrator.startPipeline('user-1', { idea: 'Bir uygulama istiyorum' });
    assert.equal(started.stage, 'failed');

    // Retry → clarification
    const retried = await orchestrator.retryStage(started.id);
    assert.equal(retried.stage, 'scribe_clarifying');
  });
});

// ─── Graceful Degradation ─────────────────────────

describe('Orchestrator — Graceful degradation', () => {
  it('Trace failure → completed_partial', async () => {
    const trace = createMockTrace({
      execute: async () => ({
        type: 'error' as const,
        error: { code: 'TRACE_TEST_GENERATION_FAILED', message: 'AI failed', retryable: true },
      }),
    });
    const { orchestrator } = createOrchestrator({ trace });

    const started = await orchestrator.startPipeline('user-1', { idea: 'Todo app' });
    const completed = await orchestrator.approveSpec(started.id, 'my-app', 'private');
    assert.equal(completed.stage, 'completed_partial');
    // Proto output should still be saved
    const status = await orchestrator.getStatus(completed.id);
    assert.ok(status.protoOutput);
    assert.equal(status.traceOutput, undefined);
  });
});

// ─── Cancel ───────────────────────────────────────

describe('Orchestrator — Cancel', () => {
  it('cancels pipeline mid-flow', async () => {
    const scribe = createMockScribe({
      analyzIdea: async () => ({ type: 'clarification', data: mockClarification }),
    });
    const { orchestrator } = createOrchestrator({ scribe });

    const started = await orchestrator.startPipeline('user-1', { idea: 'Some app idea here' });
    assert.equal(started.stage, 'scribe_clarifying');

    const cancelled = await orchestrator.cancelPipeline(started.id);
    assert.equal(cancelled.stage, 'cancelled');
  });

  it('rejects cancel on completed pipeline', async () => {
    const { orchestrator } = createOrchestrator();

    const started = await orchestrator.startPipeline('user-1', { idea: 'Todo app' });
    const completed = await orchestrator.approveSpec(started.id, 'my-app', 'private');
    assert.equal(completed.stage, 'completed');

    await assert.rejects(
      () => orchestrator.cancelPipeline(completed.id),
      { message: /Cannot cancel/ },
    );
  });
});

// ─── Skip Trace ───────────────────────────────────

describe('Orchestrator — Skip trace', () => {
  it('skips trace → completed_partial', async () => {
    // Use a trace that never completes (we'll skip before it matters)
    // We need Proto to succeed and then Trace to be "in progress"
    // For this test, we simulate being in trace_testing stage manually
    const store = new InMemoryStore();
    const trace = createMockTrace({
      execute: async () => {
        // This won't be called because we'll skip trace
        return { type: 'output' as const, data: mockTraceOutput };
      },
    });
    const { orchestrator } = createOrchestrator({ store, trace });

    const started = await orchestrator.startPipeline('user-1', { idea: 'Todo app' });
    // Approve → Proto succeeds → trace_testing → but trace also succeeds immediately
    // To test skipTrace, we need a trace that takes time. Instead, let's set stage manually.
    await store.update(started.id, {
      stage: 'trace_testing' as PipelineStage,
      protoOutput: mockProtoOutput,
      approvedSpec: validSpec,
    });

    const skipped = await orchestrator.skipTrace(started.id);
    assert.equal(skipped.stage, 'completed_partial');
  });
});

// ─── Reject Spec ──────────────────────────────────

describe('Orchestrator — Reject spec', () => {
  it('rejects spec → regenerates → awaiting_approval', async () => {
    const { orchestrator } = createOrchestrator();

    const started = await orchestrator.startPipeline('user-1', { idea: 'Todo app' });
    assert.equal(started.stage, 'awaiting_approval');

    const rejected = await orchestrator.rejectSpec(started.id, 'User story eksik');
    assert.equal(rejected.stage, 'awaiting_approval');
    // Conversation should have spec_rejected + spec_draft
    const hasRejection = rejected.scribeConversation.some((m) => m.type === 'spec_rejected');
    assert.ok(hasRejection);
  });
});

// ─── Stage Validation ─────────────────────────────

describe('Orchestrator — Stage validation', () => {
  it('rejects sendMessage in wrong stage', async () => {
    const { orchestrator } = createOrchestrator();

    const started = await orchestrator.startPipeline('user-1', { idea: 'Todo app' });
    assert.equal(started.stage, 'awaiting_approval');

    await assert.rejects(
      () => orchestrator.sendMessage(started.id, 'hello'),
      { message: /Invalid stage/ },
    );
  });

  it('rejects approveSpec in wrong stage', async () => {
    const scribe = createMockScribe({
      analyzIdea: async () => ({ type: 'clarification', data: mockClarification }),
    });
    const { orchestrator } = createOrchestrator({ scribe });

    const started = await orchestrator.startPipeline('user-1', { idea: 'Some idea for an app' });
    assert.equal(started.stage, 'scribe_clarifying');

    await assert.rejects(
      () => orchestrator.approveSpec(started.id, 'repo', 'private'),
      { message: /Invalid stage/ },
    );
  });
});

// ─── Concurrent Pipelines ─────────────────────────

describe('Orchestrator — Concurrent pipelines', () => {
  it('handles multiple pipelines for same user independently', async () => {
    const { orchestrator } = createOrchestrator();

    const p1 = await orchestrator.startPipeline('user-1', { idea: 'Todo app one' });
    const p2 = await orchestrator.startPipeline('user-1', { idea: 'Todo app two' });

    assert.notEqual(p1.id, p2.id);
    assert.equal(p1.stage, 'awaiting_approval');
    assert.equal(p2.stage, 'awaiting_approval');

    // Complete p1
    const c1 = await orchestrator.approveSpec(p1.id, 'app-one', 'private');
    assert.equal(c1.stage, 'completed');

    // p2 still awaiting
    const s2 = await orchestrator.getStatus(p2.id);
    assert.equal(s2.stage, 'awaiting_approval');

    // List shows both
    const list = await orchestrator.listPipelines('user-1');
    assert.equal(list.length, 2);
  });
});

// ─── Events ───────────────────────────────────────

describe('Orchestrator — Events', () => {
  it('emits events during pipeline lifecycle', async () => {
    const events: PipelineEvent[] = [];
    const { orchestrator } = createOrchestrator({
      emit: (event) => events.push(event),
    });

    const started = await orchestrator.startPipeline('user-1', { idea: 'Todo app' });
    const completed = await orchestrator.approveSpec(started.id, 'my-app', 'private');

    assert.ok(events.length >= 3); // stage_change to awaiting_approval, proto_building, trace_testing, completed
    assert.ok(events.some((e) => e.type === 'stage_change' && e.stage === 'awaiting_approval'));
    assert.ok(events.some((e) => e.type === 'stage_change' && e.stage === 'proto_building'));
    assert.ok(events.some((e) => e.type === 'completed'));
  });
});
