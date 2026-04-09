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
import { RETRY_CONFIG, createPipelineError, PipelineErrorCode } from '../contracts/PipelineErrors.js';
import { createActivityEmitter, emitActivity } from '../activityEmitter.js';
import { withRetry } from '../retryWrapper.js';
import { scoreScribeEffort, scoreProtoEffort, scoreTraceEffort } from '../effortScorer.js';
import type { ScribeAgent, ScribeState, ScribeResult } from '../../agents/scribe/ScribeAgent.js';
import type { ProtoAgent } from '../../agents/proto/ProtoAgent.js';
import type { TraceAgent } from '../../agents/trace/TraceAgent.js';

// ─── Timeout Guard ───────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} stage timed out after ${Math.round(ms / 1000)}s`));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

const STAGE_TIMEOUT = RETRY_CONFIG.stageTimeoutMs;
const TRACE_TIMEOUT = RETRY_CONFIG.traceStageTimeoutMs;

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
  model: string;
  scribeConversation: ScribeMessageType[];
  scribeOutput: ScribeOutput;
  approvedSpec: StructuredSpec;
  protoOutput: ProtoOutput;
  traceOutput: TraceOutput;
  protoConfig: { repoName: string; repoVisibility: 'public' | 'private' };
  metrics: PipelineMetrics;
  error: PipelineError | null;
  intermediateState: Record<string, unknown>;
  attemptCount: number;
}

// ─── Event Interface ──────────────────────────────

export interface PipelineEvent {
  pipelineId: string;
  type: 'stage_change' | 'scribe_message' | 'error' | 'completed';
  stage?: PipelineStage;
  data?: unknown;
}

// ─── Orchestrator ─────────────────────────────────

export interface AgentSet {
  scribe: ScribeAgent;
  proto: ProtoAgent;
  trace: TraceAgent;
}

export class PipelineOrchestrator {
  constructor(
    private store: PipelineStore,
    private scribe: ScribeAgent,
    private proto: ProtoAgent,
    private trace: TraceAgent,
    private getGitHubOwner: (userId: string) => Promise<string>,
    private emit?: (event: PipelineEvent) => void,
    private createAgentsForModel?: (model: string) => AgentSet,
  ) {}

  private getAgents(model?: string): AgentSet {
    if (model && this.createAgentsForModel) {
      return this.createAgentsForModel(model);
    }
    return { scribe: this.scribe, proto: this.proto, trace: this.trace };
  }

  // ─── Start Pipeline ──────────────────────────

  async startPipeline(userId: string, input: ScribeInput, model?: string): Promise<PipelineState> {
    const pipeline = await this.store.create(userId);

    const conversation: ScribeMessageType[] = [
      { type: 'user_idea', content: input.idea },
    ];

    const updated = await this.store.update(pipeline.id, {
      title: input.idea.slice(0, 100),
      model,
      scribeConversation: conversation,
      metrics: { ...pipeline.metrics, startedAt: new Date() },
    });

    // Run Scribe in background (non-blocking)
    this.runScribeAnalysis(pipeline.id, pipeline.metrics, input, conversation, model).catch((err) => {
      console.error(`[Pipeline] Background Scribe failed for ${pipeline.id}:`, err);
      this.failPipeline(pipeline.id, 'Scribe', err).catch((e) => console.error('[Pipeline] failPipeline also failed:', e));
    });

    return updated;
  }

  // ─── Background Scribe Analysis ───────────────

  private async runScribeAnalysis(
    pipelineId: string,
    metrics: PipelineMetrics,
    input: ScribeInput,
    conversation: ScribeMessageType[],
    model?: string,
  ): Promise<void> {
    const emit = createActivityEmitter(pipelineId, 'scribe');
    emit('start', 'Kullanıcı fikri analiz ediliyor...', 5);

    // Effort-based model routing
    const effort = scoreScribeEffort(input.idea);
    const effectiveModel = model ?? effort.model;
    console.log(`[Scribe] Effort: ${effort.score}/10 → Model: ${effectiveModel} (${effort.reasoning})`);

    const agents = this.getAgents(effectiveModel);
    const scribeState = agents.scribe.createInitialState(input);
    scribeState.pipelineId = pipelineId;

    await this.writeCheckpoint(pipelineId, 'scribe', input.idea);
    const result = await withRetry(
      (attempt) => {
        if (attempt > 1) emit('retry', `Scribe yeniden deneniyor (deneme ${attempt})...`, 30);
        return withTimeout(agents.scribe.analyzIdea(scribeState), STAGE_TIMEOUT, 'Scribe');
      },
      {
        maxAttempts: 3,
        onError: (err, attempt) =>
          console.warn(`[Pipeline] Scribe analyzIdea attempt ${attempt} failed:`, err),
      },
    );

    await this.handleScribeResult(pipelineId, metrics, conversation, result);

    if (result.type === 'clarification') {
      emit('clarification', 'Açıklayıcı sorular oluşturuldu', 100);
    } else if (result.type === 'error') {
      emit('error', 'Scribe analizi başarısız oldu', 0);
    }
  }

  // ─── Send Message (Scribe Chat) ──────────────

  async sendMessage(pipelineId: string, message: string): Promise<PipelineState> {
    const pipeline = await this.getPipeline(pipelineId);
    this.assertStage(pipeline, 'scribe_clarifying');

    const agents = this.getAgents(pipeline.model);
    const scribeState = this.reconstructScribeState(pipeline);
    agents.scribe.processUserAnswer(scribeState, message);

    const conversation: ScribeMessageType[] = [
      ...pipeline.scribeConversation,
      { type: 'user_answer', content: message },
    ];

    // Update with user answer immediately
    const updated = await this.store.update(pipelineId, {
      scribeConversation: conversation,
      stage: 'scribe_generating',
    });
    this.emitEvent(pipelineId, 'stage_change', 'scribe_generating');

    // Run Scribe continuation in background
    this.runScribeContinuation(pipelineId, pipeline.metrics, scribeState, conversation, pipeline.model).catch((err) => {
      console.error(`[Pipeline] Background Scribe continuation failed for ${pipelineId}:`, err);
      this.failPipeline(pipelineId, 'Scribe', err).catch((e) => console.error('[Pipeline] failPipeline also failed:', e));
    });

    return updated;
  }

  // ─── Background Scribe Continuation ───────────

  private async runScribeContinuation(
    pipelineId: string,
    metrics: PipelineMetrics,
    scribeState: ScribeState,
    conversation: ScribeMessageType[],
    model?: string,
  ): Promise<void> {
    const emit = createActivityEmitter(pipelineId, 'scribe');
    emit('start', 'Kullanıcı yanıtıyla devam ediliyor...', 10);
    scribeState.pipelineId = pipelineId;

    const agents = this.getAgents(model);
    const result = await withRetry(
      (attempt) => {
        if (attempt > 1) emit('retry', `Scribe devamı yeniden deneniyor (deneme ${attempt})...`, 35);
        return withTimeout(agents.scribe.continueAfterAnswer(scribeState), STAGE_TIMEOUT, 'Scribe');
      },
      {
        maxAttempts: 3,
        onError: (err, attempt) =>
          console.warn(`[Pipeline] Scribe continueAfterAnswer attempt ${attempt} failed:`, err),
      },
    );

    await this.handleScribeResult(pipelineId, metrics, conversation, result, scribeState.clarificationRound);

    if (result.type === 'clarification') {
      emit('clarification', 'Ek sorular oluşturuldu', 100);
    } else if (result.type === 'error') {
      emit('error', 'Scribe devamı başarısız oldu', 0);
    }
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

    if (!editedSpec && !pipeline.scribeOutput?.spec) {
      throw new Error('Cannot approve: no spec available (scribeOutput is missing)');
    }
    const spec = editedSpec ?? pipeline.scribeOutput!.spec;

    let owner: string;
    try {
      owner = await this.getGitHubOwner(pipeline.userId);
    } catch (err) {
      const error = createPipelineError(
        PipelineErrorCode.GITHUB_NOT_CONNECTED,
        `GitHub owner çözümlenemedi: ${err instanceof Error ? err.message : String(err)}`,
      );
      const failed = await this.store.update(pipelineId, { stage: 'failed', error });
      this.emitEvent(pipelineId, 'error', 'failed', error);
      return failed;
    }

    const conversation: ScribeMessageType[] = [
      ...pipeline.scribeConversation,
      { type: 'spec_approved', content: spec },
    ];

    // Transition to proto_building — return immediately
    const updated = await this.store.update(pipelineId, {
      stage: 'proto_building',
      approvedSpec: spec,
      protoConfig: { repoName, repoVisibility },
      scribeConversation: conversation,
      metrics: { ...pipeline.metrics, approvedAt: new Date() },
      error: null,
    });
    this.emitEvent(pipelineId, 'stage_change', 'proto_building');

    // Run Proto + Trace in background (non-blocking)
    this.runProtoAndTrace(pipelineId, pipeline.metrics, spec, repoName, repoVisibility, owner, pipeline.model).catch((err) => {
      console.error(`[Pipeline] Background Proto+Trace failed for ${pipelineId}:`, err);
      this.failPipeline(pipelineId, 'Proto/Trace', err).catch((e) => console.error('[Pipeline] failPipeline also failed:', e));
    });

    return updated;
  }

  // ─── Background Proto + Trace Runner ────────

  private async runProtoAndTrace(
    pipelineId: string,
    metrics: PipelineMetrics,
    spec: StructuredSpec,
    repoName: string,
    repoVisibility: 'public' | 'private',
    owner: string,
    model?: string,
  ): Promise<void> {
    const protoEmit = createActivityEmitter(pipelineId, 'proto');
    protoEmit('start', 'Onaylanan spec okunuyor...', 5);

    // Effort-based model routing for Proto
    const protoEffort = scoreProtoEffort(spec);
    const protoModel = model ?? protoEffort.model;
    console.log(`[Proto] Effort: ${protoEffort.score}/10 → Model: ${protoModel} (${protoEffort.reasoning})`);

    const agents = this.getAgents(protoModel);
    await this.writeCheckpoint(pipelineId, 'proto', spec.title);
    const protoResult = await withRetry(
      (attempt) => {
        if (attempt > 1) protoEmit('retry', `Proto yeniden deneniyor (deneme ${attempt})...`, 25);
        return withTimeout(
          agents.proto.execute({ spec, repoName, repoVisibility, owner, pipelineId }),
          STAGE_TIMEOUT,
          'Proto',
        );
      },
      {
        maxAttempts: 3,
        onError: (err, attempt) =>
          console.warn(`[Pipeline] Proto execute attempt ${attempt} failed:`, err),
      },
    );

    if (protoResult.type === 'error') {
      await this.store.update(pipelineId, {
        stage: 'failed',
        error: protoResult.error,
      });
      this.emitEvent(pipelineId, 'error', 'failed', protoResult.error);
      return;
    }

    const protoCompletedMetrics = { ...metrics, approvedAt: metrics.approvedAt ?? new Date(), protoCompletedAt: new Date() };

    // Check if Scribe marked this as not requiring tests
    const pipeline = await this.getPipeline(pipelineId);
    const requiresTests = pipeline.scribeOutput?.plan?.requiresTests ?? true;

    if (!requiresTests) {
      // Skip Trace — mark as completed directly
      await this.store.update(pipelineId, {
        protoOutput: protoResult.data,
        stage: 'completed',
        metrics: { ...protoCompletedMetrics, traceCompletedAt: new Date(), totalDurationMs: Date.now() - protoCompletedMetrics.startedAt.getTime() },
      });
      this.emitEvent(pipelineId, 'stage_change', 'completed');
      return;
    }

    // Proto succeeded → transition to trace_testing
    await this.store.update(pipelineId, {
      protoOutput: protoResult.data,
      stage: 'trace_testing',
      metrics: protoCompletedMetrics,
    });
    this.emitEvent(pipelineId, 'stage_change', 'trace_testing');

    // Run Trace
    await this.runTrace(pipelineId, metrics, owner, repoName, protoResult.data.branch, spec, model);
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

    const agents = this.getAgents(pipeline.model);
    const result = await withTimeout(
      agents.scribe.regenerateSpec(scribeState, feedback),
      STAGE_TIMEOUT,
      'Scribe',
    );

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

    const updated = await this.store.update(pipelineId, {
      error: null,
      metrics: { ...pipeline.metrics, retryCount: pipeline.metrics.retryCount + 1 },
    });

    // Determine which stage failed based on existing data
    if (pipeline.protoOutput && !pipeline.traceOutput) {
      this.retryTrace(pipelineId, pipeline).catch((err) => {
        console.error(`[Pipeline] Retry trace failed for ${pipelineId}:`, err);
      });
      return updated;
    }
    if (pipeline.approvedSpec && !pipeline.protoOutput) {
      this.retryProto(pipelineId, pipeline).catch((err) => {
        console.error(`[Pipeline] Retry proto failed for ${pipelineId}:`, err);
      });
      return updated;
    }
    return this.retryScribe(pipelineId, pipeline);
  }

  // ─── Cancel ──────────────────────────────────

  async cancelPipeline(pipelineId: string): Promise<PipelineState> {
    const pipeline = await this.getPipeline(pipelineId);
    // Already cancelled — return as-is
    if (pipeline.stage === 'cancelled') return pipeline;
    // Any stage can be cancelled (including completed — acts as "delete from view")
    const updated = await this.store.update(pipelineId, { stage: 'cancelled' });
    this.emitEvent(pipelineId, 'stage_change', 'cancelled');
    return updated;
  }

  // ─── Skip Trace ──────────────────────────────

  async skipTrace(pipelineId: string): Promise<PipelineState> {
    const pipeline = await this.getPipeline(pipelineId);

    // Allow skip from trace_testing OR failed — but only if Proto already succeeded
    const isTraceFailure = pipeline.stage === 'failed' && pipeline.protoOutput != null;
    if (pipeline.stage !== 'trace_testing' && !isTraceFailure) {
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
    model?: string,
  ): Promise<PipelineState> {
    const traceEmit = createActivityEmitter(pipelineId, 'trace');
    traceEmit('start', 'Scaffold dosyaları analiz ediliyor...', 5);

    // Effort-based model routing for Trace (estimate from spec criteria count)
    const traceEffort = scoreTraceEffort({ fileCount: spec?.acceptanceCriteria?.length ?? 5 });
    const traceModel = model ?? traceEffort.model;
    console.log(`[Trace] Effort: ${traceEffort.score}/10 → Model: ${traceModel} (${traceEffort.reasoning})`);

    const agents = this.getAgents(traceModel);
    await this.writeCheckpoint(pipelineId, 'trace', `${owner}/${repo}@${branch}`);
    const traceResult = await withRetry(
      (attempt) => {
        if (attempt > 1) traceEmit('retry', `Trace yeniden deneniyor (deneme ${attempt})...`, 30);
        return withTimeout(
          agents.trace.execute({ repoOwner: owner, repo, branch, spec, pipelineId }),
          TRACE_TIMEOUT,
          'Trace',
        );
      },
      {
        maxAttempts: 3,
        onError: (err, attempt) =>
          console.warn(`[Pipeline] Trace execute attempt ${attempt} failed:`, err),
      },
    );

    if (traceResult.type === 'error') {
      // Graceful degradation — completed_partial (keep error visible for UI)
      const updated = await this.store.update(pipelineId, {
        stage: 'completed_partial',
        error: traceResult.error,
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

    // Pipeline tamamlanma sinyali
    emitActivity({
      pipelineId,
      stage: 'trace',
      step: 'pipeline_complete',
      message: 'Pipeline başarıyla tamamlandı',
      progress: 100,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  // ─── Private: Retry Helpers ──────────────────

  private async retryTrace(pipelineId: string, pipeline: PipelineState): Promise<PipelineState> {
    let owner: string;
    try {
      owner = await this.getGitHubOwner(pipeline.userId);
    } catch (err) {
      const error = createPipelineError(
        PipelineErrorCode.GITHUB_NOT_CONNECTED,
        `GitHub owner çözümlenemedi: ${err instanceof Error ? err.message : String(err)}`,
      );
      const failed = await this.store.update(pipelineId, { stage: 'failed', error });
      this.emitEvent(pipelineId, 'error', 'failed', error);
      return failed;
    }

    await this.store.update(pipelineId, { stage: 'trace_testing' });
    this.emitEvent(pipelineId, 'stage_change', 'trace_testing');

    const repo = pipeline.protoConfig?.repoName ?? pipeline.protoOutput!.repo.split('/')[1];

    return this.runTrace(
      pipelineId,
      pipeline.metrics,
      owner,
      repo,
      pipeline.protoOutput!.branch,
      pipeline.approvedSpec,
      pipeline.model,
    );
  }

  private async retryProto(pipelineId: string, pipeline: PipelineState): Promise<PipelineState> {
    let owner: string;
    try {
      owner = await this.getGitHubOwner(pipeline.userId);
    } catch (err) {
      const error = createPipelineError(
        PipelineErrorCode.GITHUB_NOT_CONNECTED,
        `GitHub owner çözümlenemedi: ${err instanceof Error ? err.message : String(err)}`,
      );
      const failed = await this.store.update(pipelineId, { stage: 'failed', error });
      this.emitEvent(pipelineId, 'error', 'failed', error);
      return failed;
    }
    if (!pipeline.approvedSpec) {
      throw new Error('Cannot retry Proto: approvedSpec is missing');
    }
    const repoName = pipeline.protoConfig?.repoName ?? this.deriveRepoName(pipeline.approvedSpec.title);
    const repoVisibility = pipeline.protoConfig?.repoVisibility ?? 'private';

    await this.store.update(pipelineId, { stage: 'proto_building' });
    this.emitEvent(pipelineId, 'stage_change', 'proto_building');

    const agents = this.getAgents(pipeline.model);
    const result = await withTimeout(
      agents.proto.execute({
        spec: pipeline.approvedSpec,
        repoName,
        repoVisibility,
        owner,
        pipelineId,
      }),
      STAGE_TIMEOUT,
      'Proto',
    );

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

    return this.runTrace(pipelineId, pipeline.metrics, owner, repoName, result.data.branch, pipeline.approvedSpec, pipeline.model);
  }

  private async retryScribe(pipelineId: string, pipeline: PipelineState): Promise<PipelineState> {
    const agents = this.getAgents(pipeline.model);
    const scribeState = this.reconstructScribeState(pipeline);
    scribeState.pipelineId = pipelineId;
    await this.store.update(pipelineId, { stage: 'scribe_clarifying' });
    this.emitEvent(pipelineId, 'stage_change', 'scribe_clarifying');

    const result = await withTimeout(
      agents.scribe.analyzIdea(scribeState),
      STAGE_TIMEOUT,
      'Scribe',
    );
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

  private async failPipeline(pipelineId: string, label: string, err: unknown): Promise<void> {
    const isTimeout = err instanceof Error && err.message.includes('timed out');
    const error = isTimeout
      ? createPipelineError(PipelineErrorCode.PIPELINE_TIMEOUT, `${label}: ${(err as Error).message}`)
      : createPipelineError(PipelineErrorCode.AI_PROVIDER_ERROR, `${label}: ${err instanceof Error ? err.message : String(err)}`);

    await this.store.update(pipelineId, { stage: 'failed', error });
    this.emitEvent(pipelineId, 'error', 'failed', error);
  }

  private emitEvent(
    pipelineId: string,
    type: PipelineEvent['type'],
    stage?: PipelineStage,
    data?: unknown,
  ): void {
    this.emit?.({ pipelineId, type, stage, data });
  }

  private async writeCheckpoint(
    pipelineId: string,
    agentName: string,
    input: unknown,
  ): Promise<void> {
    try {
      await this.store.update(pipelineId, {
        intermediateState: {
          agent: agentName,
          startedAt: new Date().toISOString(),
          status: 'in_progress',
          inputSummary: typeof input === 'string' ? input.slice(0, 200) : 'structured',
        },
        attemptCount: 0, // will be incremented by retry wrapper
      });
    } catch {
      // checkpoint failure is non-fatal — don't block agent execution
    }
  }
}
