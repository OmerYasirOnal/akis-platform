import type {
  PipelineState,
  PipelineStage,
  PipelineError,
  PipelineMetrics,
  ScribeInput,
  ScribeOutput,
  ScribeMessageType,
  StructuredSpec,
  ProtoOutput,
  TraceOutput,
} from '../contracts/PipelineTypes.js';
import { createPipelineError, PipelineErrorCode } from '../contracts/PipelineErrors.js';
import type { ScribeAgent, ScribeState, ScribeResult } from '../../agents/scribe/ScribeAgent.js';
import type { ProtoAgent, ProtoResult } from '../../agents/proto/ProtoAgent.js';
import type { TraceAgent, TraceResult } from '../../agents/trace/TraceAgent.js';

// ─── Store Interface ──────────────────────────────

export interface PipelineStore {
  create(userId: string): Promise<PipelineState>;
  getById(id: string): Promise<PipelineState | null>;
  listByUser(userId: string): Promise<PipelineState[]>;
  update(id: string, data: Partial<PipelineStateUpdate>): Promise<PipelineState>;
}

export interface PipelineStateUpdate {
  stage: PipelineStage;
  title: string;
  scribeConversation: ScribeMessageType[];
  scribeOutput: ScribeOutput;
  approvedSpec: StructuredSpec;
  protoOutput: ProtoOutput;
  traceOutput: TraceOutput;
  protoConfig: { repoName: string; repoVisibility: 'public' | 'private' };
  metrics: PipelineMetrics;
  error: PipelineError | null;
}

// ─── Event Interface ──────────────────────────────

export interface PipelineEvent {
  pipelineId: string;
  type: 'stage_change' | 'scribe_message' | 'error' | 'completed';
  stage?: PipelineStage;
  data?: unknown;
}

// ─── Orchestrator ─────────────────────────────────

export class PipelineOrchestrator {
  constructor(
    private store: PipelineStore,
    private scribe: ScribeAgent,
    private proto: ProtoAgent,
    private trace: TraceAgent,
    private getGitHubOwner: (userId: string) => Promise<string>,
    private emit?: (event: PipelineEvent) => void,
  ) {}

  // ─── Start Pipeline ──────────────────────────

  async startPipeline(userId: string, input: ScribeInput): Promise<PipelineState> {
    const pipeline = await this.store.create(userId);
    const scribeState = this.scribe.createInitialState(input);

    const conversation: ScribeMessageType[] = [
      { type: 'user_idea', content: input.idea },
    ];

    await this.store.update(pipeline.id, {
      title: input.idea.slice(0, 100),
      scribeConversation: conversation,
      metrics: { ...pipeline.metrics, startedAt: new Date() },
    });

    const result = await this.scribe.analyzIdea(scribeState);
    return this.handleScribeResult(pipeline.id, pipeline.metrics, conversation, result);
  }

  // ─── Send Message (Scribe Chat) ──────────────

  async sendMessage(pipelineId: string, message: string): Promise<PipelineState> {
    const pipeline = await this.getPipeline(pipelineId);
    this.assertStage(pipeline, 'scribe_clarifying');

    const scribeState = this.reconstructScribeState(pipeline);
    this.scribe.processUserAnswer(scribeState, message);

    const conversation: ScribeMessageType[] = [
      ...pipeline.scribeConversation,
      { type: 'user_answer', content: message },
    ];

    const result = await this.scribe.continueAfterAnswer(scribeState);
    return this.handleScribeResult(pipelineId, pipeline.metrics, conversation, result, scribeState.clarificationRound);
  }

  // ─── Approve Spec → Proto → Trace ───────────

  async approveSpec(
    pipelineId: string,
    repoName: string,
    repoVisibility: 'public' | 'private',
    editedSpec?: StructuredSpec,
  ): Promise<PipelineState> {
    const pipeline = await this.getPipeline(pipelineId);
    this.assertStage(pipeline, 'awaiting_approval');

    const spec = editedSpec ?? pipeline.scribeOutput!.spec;
    const owner = await this.getGitHubOwner(pipeline.userId);

    const conversation: ScribeMessageType[] = [
      ...pipeline.scribeConversation,
      { type: 'spec_approved', content: spec },
    ];

    // Transition to proto_building
    await this.store.update(pipelineId, {
      stage: 'proto_building',
      approvedSpec: spec,
      protoConfig: { repoName, repoVisibility },
      scribeConversation: conversation,
      metrics: { ...pipeline.metrics, approvedAt: new Date() },
      error: null,
    });
    this.emitEvent(pipelineId, 'stage_change', 'proto_building');

    // Run Proto
    const protoResult = await this.proto.execute({ spec, repoName, repoVisibility, owner });

    if (protoResult.type === 'error') {
      const updated = await this.store.update(pipelineId, {
        stage: 'failed',
        error: protoResult.error,
      });
      this.emitEvent(pipelineId, 'error', 'failed', protoResult.error);
      return updated;
    }

    // Proto succeeded → auto-run Trace
    await this.store.update(pipelineId, {
      protoOutput: protoResult.data,
      stage: 'trace_testing',
      metrics: { ...pipeline.metrics, approvedAt: pipeline.metrics.approvedAt ?? new Date(), protoCompletedAt: new Date() },
    });
    this.emitEvent(pipelineId, 'stage_change', 'trace_testing');

    return this.runTrace(pipelineId, pipeline.metrics, owner, repoName, protoResult.data.branch, spec);
  }

  // ─── Reject Spec ─────────────────────────────

  async rejectSpec(pipelineId: string, feedback: string): Promise<PipelineState> {
    const pipeline = await this.getPipeline(pipelineId);
    this.assertStage(pipeline, 'awaiting_approval');

    const scribeState = this.reconstructScribeState(pipeline);
    const conversation: ScribeMessageType[] = [
      ...pipeline.scribeConversation,
      { type: 'spec_rejected', content: { feedback } },
    ];

    await this.store.update(pipelineId, {
      stage: 'scribe_generating',
      scribeConversation: conversation,
      error: null,
    });

    const result = await this.scribe.regenerateSpec(scribeState, feedback);

    if (result.type === 'spec') {
      conversation.push({ type: 'spec_draft', content: result.data });
      const updated = await this.store.update(pipelineId, {
        stage: 'awaiting_approval',
        scribeConversation: conversation,
        scribeOutput: result.data,
        title: result.data.spec.title,
      });
      this.emitEvent(pipelineId, 'stage_change', 'awaiting_approval', result.data);
      return updated;
    }

    if (result.type === 'error') {
      const updated = await this.store.update(pipelineId, {
        stage: 'failed',
        scribeConversation: conversation,
        error: result.error,
      });
      this.emitEvent(pipelineId, 'error', 'failed', result.error);
      return updated;
    }

    return pipeline;
  }

  // ─── Retry ───────────────────────────────────

  async retryStage(pipelineId: string): Promise<PipelineState> {
    const pipeline = await this.getPipeline(pipelineId);
    this.assertStage(pipeline, 'failed');

    await this.store.update(pipelineId, {
      error: null,
      metrics: { ...pipeline.metrics, retryCount: pipeline.metrics.retryCount + 1 },
    });

    // Determine which stage failed based on existing data
    if (pipeline.protoOutput && !pipeline.traceOutput) {
      return this.retryTrace(pipelineId, pipeline);
    }
    if (pipeline.approvedSpec && !pipeline.protoOutput) {
      return this.retryProto(pipelineId, pipeline);
    }
    return this.retryScribe(pipelineId, pipeline);
  }

  // ─── Cancel ──────────────────────────────────

  async cancelPipeline(pipelineId: string): Promise<PipelineState> {
    const pipeline = await this.getPipeline(pipelineId);
    const terminal: PipelineStage[] = ['completed', 'completed_partial', 'cancelled'];
    if (terminal.includes(pipeline.stage)) {
      throw new Error(`Cannot cancel pipeline in stage: ${pipeline.stage}`);
    }
    const updated = await this.store.update(pipelineId, { stage: 'cancelled' });
    this.emitEvent(pipelineId, 'stage_change', 'cancelled');
    return updated;
  }

  // ─── Skip Trace ──────────────────────────────

  async skipTrace(pipelineId: string): Promise<PipelineState> {
    const pipeline = await this.getPipeline(pipelineId);
    if (pipeline.stage !== 'trace_testing' && pipeline.stage !== 'failed') {
      throw new Error(`Cannot skip trace in stage: ${pipeline.stage}`);
    }
    const updated = await this.store.update(pipelineId, {
      stage: 'completed_partial',
      metrics: {
        ...pipeline.metrics,
        totalDurationMs: Date.now() - pipeline.metrics.startedAt.getTime(),
      },
    });
    this.emitEvent(pipelineId, 'completed', 'completed_partial');
    return updated;
  }

  // ─── Query ───────────────────────────────────

  async getStatus(pipelineId: string): Promise<PipelineState> {
    return this.getPipeline(pipelineId);
  }

  async listPipelines(userId: string): Promise<PipelineState[]> {
    return this.store.listByUser(userId);
  }

  // ─── Private: Scribe Result Handler ──────────

  private async handleScribeResult(
    pipelineId: string,
    metrics: PipelineMetrics,
    conversation: ScribeMessageType[],
    result: ScribeResult,
    clarificationRound?: number,
  ): Promise<PipelineState> {
    if (result.type === 'clarification') {
      conversation.push({ type: 'clarification', content: result.data });
      const updated = await this.store.update(pipelineId, {
        stage: 'scribe_clarifying',
        scribeConversation: conversation,
        metrics: {
          ...metrics,
          clarificationRounds: clarificationRound ?? (metrics.clarificationRounds + 1),
        },
      });
      this.emitEvent(pipelineId, 'scribe_message', 'scribe_clarifying', result.data);
      return updated;
    }

    if (result.type === 'spec') {
      conversation.push({ type: 'spec_draft', content: result.data });
      const updated = await this.store.update(pipelineId, {
        stage: 'awaiting_approval',
        scribeConversation: conversation,
        scribeOutput: result.data,
        title: result.data.spec.title,
        metrics: { ...metrics, scribeCompletedAt: new Date() },
      });
      this.emitEvent(pipelineId, 'stage_change', 'awaiting_approval', result.data);
      return updated;
    }

    // Error
    const updated = await this.store.update(pipelineId, {
      stage: 'failed',
      scribeConversation: conversation,
      error: result.error,
    });
    this.emitEvent(pipelineId, 'error', 'failed', result.error);
    return updated;
  }

  // ─── Private: Trace Runner ───────────────────

  private async runTrace(
    pipelineId: string,
    metrics: PipelineMetrics,
    owner: string,
    repo: string,
    branch: string,
    spec?: StructuredSpec,
  ): Promise<PipelineState> {
    const traceResult = await this.trace.execute({ repoOwner: owner, repo, branch, spec });

    if (traceResult.type === 'error') {
      // Graceful degradation — completed_partial
      const updated = await this.store.update(pipelineId, {
        stage: 'completed_partial',
        metrics: {
          ...metrics,
          protoCompletedAt: metrics.protoCompletedAt ?? new Date(),
          totalDurationMs: Date.now() - metrics.startedAt.getTime(),
        },
      });
      this.emitEvent(pipelineId, 'completed', 'completed_partial');
      return updated;
    }

    const updated = await this.store.update(pipelineId, {
      stage: 'completed',
      traceOutput: traceResult.data,
      metrics: {
        ...metrics,
        protoCompletedAt: metrics.protoCompletedAt ?? new Date(),
        traceCompletedAt: new Date(),
        totalDurationMs: Date.now() - metrics.startedAt.getTime(),
      },
    });
    this.emitEvent(pipelineId, 'completed', 'completed');
    return updated;
  }

  // ─── Private: Retry Helpers ──────────────────

  private async retryTrace(pipelineId: string, pipeline: PipelineState): Promise<PipelineState> {
    await this.store.update(pipelineId, { stage: 'trace_testing' });
    this.emitEvent(pipelineId, 'stage_change', 'trace_testing');

    const owner = await this.getGitHubOwner(pipeline.userId);
    const repo = pipeline.protoConfig?.repoName ?? pipeline.protoOutput!.repo.split('/')[1];

    return this.runTrace(
      pipelineId,
      pipeline.metrics,
      owner,
      repo,
      pipeline.protoOutput!.branch,
      pipeline.approvedSpec,
    );
  }

  private async retryProto(pipelineId: string, pipeline: PipelineState): Promise<PipelineState> {
    const owner = await this.getGitHubOwner(pipeline.userId);
    const repoName = pipeline.protoConfig?.repoName ?? this.deriveRepoName(pipeline.approvedSpec!.title);
    const repoVisibility = pipeline.protoConfig?.repoVisibility ?? 'private';

    await this.store.update(pipelineId, { stage: 'proto_building' });
    this.emitEvent(pipelineId, 'stage_change', 'proto_building');

    const result = await this.proto.execute({
      spec: pipeline.approvedSpec!,
      repoName,
      repoVisibility,
      owner,
    });

    if (result.type === 'error') {
      const updated = await this.store.update(pipelineId, { stage: 'failed', error: result.error });
      this.emitEvent(pipelineId, 'error', 'failed', result.error);
      return updated;
    }

    await this.store.update(pipelineId, {
      protoOutput: result.data,
      stage: 'trace_testing',
      metrics: { ...pipeline.metrics, protoCompletedAt: new Date() },
    });
    this.emitEvent(pipelineId, 'stage_change', 'trace_testing');

    return this.runTrace(pipelineId, pipeline.metrics, owner, repoName, result.data.branch, pipeline.approvedSpec);
  }

  private async retryScribe(pipelineId: string, pipeline: PipelineState): Promise<PipelineState> {
    const scribeState = this.reconstructScribeState(pipeline);
    await this.store.update(pipelineId, { stage: 'scribe_clarifying' });
    this.emitEvent(pipelineId, 'stage_change', 'scribe_clarifying');

    const result = await this.scribe.analyzIdea(scribeState);
    return this.handleScribeResult(pipelineId, pipeline.metrics, [...pipeline.scribeConversation], result);
  }

  // ─── Private: Utilities ──────────────────────

  private async getPipeline(id: string): Promise<PipelineState> {
    const pipeline = await this.store.getById(id);
    if (!pipeline) throw new Error(`Pipeline not found: ${id}`);
    return pipeline;
  }

  private assertStage(pipeline: PipelineState, expected: PipelineStage): void {
    if (pipeline.stage !== expected) {
      throw new Error(`Invalid stage: expected ${expected}, got ${pipeline.stage}`);
    }
  }

  private reconstructScribeState(pipeline: PipelineState): ScribeState {
    const ideaMsg = pipeline.scribeConversation.find((m) => m.type === 'user_idea');
    const clarificationCount = pipeline.scribeConversation.filter((m) => m.type === 'clarification').length;

    return {
      idea: typeof ideaMsg?.content === 'string' ? ideaMsg.content : '',
      conversation: [...pipeline.scribeConversation],
      clarificationRound: clarificationCount,
      phase: pipeline.stage === 'awaiting_approval' ? 'done' : 'clarifying',
    };
  }

  private deriveRepoName(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
  }

  private emitEvent(
    pipelineId: string,
    type: PipelineEvent['type'],
    stage?: PipelineStage,
    data?: unknown,
  ): void {
    this.emit?.({ pipelineId, type, stage, data });
  }
}
