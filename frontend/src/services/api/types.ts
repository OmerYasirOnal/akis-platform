// This file will be generated from OpenAPI schema
// For now, we define basic types manually

export type JobType = 'scribe' | 'trace' | 'proto';

/** Documentation pack level */
export type DocPack = 'readme' | 'standard' | 'full';

/** Documentation depth level */
export type DocDepth = 'lite' | 'standard' | 'deep';

/** Possible doc output targets */
export type DocTarget = 'README' | 'ARCHITECTURE' | 'API' | 'DEVELOPMENT' | 'DEPLOYMENT' | 'CONTRIBUTING' | 'FAQ' | 'CHANGELOG';
export type JobState = 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval';

/** Per-call AI metrics */
export interface JobAiCall {
  id: string;
  callIndex: number;
  provider: string;
  model: string;
  purpose: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  durationMs: number | null;
  estimatedCostUsd: string | null;
  success: boolean;
  errorCode: string | null;
  timestamp: string;
}

/** Structured AI response object */
export interface JobAiInfo {
  /** Requested AI config (what was submitted) */
  requested: {
    provider: string | null;
    model: string | null;
  };
  /** Resolved AI config (what was actually used at runtime) */
  resolved: {
    provider: string | null;
    model: string | null;
    keySource: 'user' | 'env' | null;
    fallbackReason: string | null;
  };
  /** Aggregate AI metrics */
  summary: {
    totalDurationMs: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    estimatedCostUsd: string | null;
  };
  /** Per-call breakdown */
  calls: JobAiCall[];
}

export interface Job {
  id: string;
  type: JobType;
  state: JobState;
  payload?: unknown;
  result?: unknown;
  error?: string;
  /** Structured error code for classification (e.g., AI_RATE_LIMITED, MCP_UNREACHABLE) */
  errorCode?: string | null;
  /** User-friendly error message */
  errorMessage?: string | null;
  /** Full structured error payload for debugging (JSON string) */
  rawErrorPayload?: string | null;
  /** MCP Gateway URL used for this job (for diagnostics) */
  mcpGatewayUrl?: string | null;
  /** MCP Gateway correlation id (safe to share, helps debug gateway logs) */
  correlationId?: string | null;
  /** AI provider used for this job (e.g., openai) - LEGACY, use ai.requested.provider */
  aiProvider?: string | null;
  /** AI model used for this job - LEGACY, use ai.requested.model */
  aiModel?: string | null;
  /** Aggregate AI duration in ms - LEGACY, use ai.summary.totalDurationMs */
  aiTotalDurationMs?: number | null;
  /** Aggregate input tokens - LEGACY, use ai.summary.inputTokens */
  aiInputTokens?: number | null;
  /** Aggregate output tokens - LEGACY, use ai.summary.outputTokens */
  aiOutputTokens?: number | null;
  /** Aggregate total tokens - LEGACY, use ai.summary.totalTokens */
  aiTotalTokens?: number | null;
  /** Estimated AI cost in USD - LEGACY, use ai.summary.estimatedCostUsd */
  aiEstimatedCostUsd?: number | string | null;
  /** Structured AI info with requested/resolved/summary/calls */
  ai?: JobAiInfo;
  /** Request ID from the API response */
  requestId?: string;
  createdAt: string;
  updatedAt: string;
  plan?: JobPlan;
  audit?: JobAudit[];
  /** S1.0: Execution trace events */
  trace?: JobTraceEvent[];
  /** S1.0: Job artifacts (documents read, files produced) */
  artifacts?: JobArtifact[];
  // S1.2: Approval system
  /** Whether this job requires approval before execution */
  requiresApproval?: boolean;
  /** User ID who approved this job */
  approvedBy?: string | null;
  /** Timestamp when job was approved */
  approvedAt?: string | null;
  /** User ID who rejected this job */
  rejectedBy?: string | null;
  /** Timestamp when job was rejected */
  rejectedAt?: string | null;
  /** Comment on approval/rejection */
  approvalComment?: string | null;
  // PR-2: Revision chain
  /** Parent job ID for revision chain */
  parentJobId?: string | null;
  /** Revision instruction */
  revisionNote?: string | null;
}

export interface JobTraceEvent {
  id: string;
  eventType: string;
  stepId?: string;
  title: string;
  detail?: Record<string, unknown>;
  durationMs?: number;
  status?: string;
  correlationId?: string;
  gatewayUrl?: string;
  errorCode?: string;
  timestamp: string;
  // S1.1: Explainability fields
  toolName?: string;
  /** Summary of input/arguments (redacted, user-facing) */
  inputSummary?: string;
  /** Summary of output/result (redacted, user-facing) */
  outputSummary?: string;
  /** User-facing reasoning summary (2-4 sentences) */
  reasoningSummary?: string;
  /** "Asked" - What did the agent ask the tool to do? */
  askedWhat?: string;
  /** "Did" - What action was taken? */
  didWhat?: string;
  /** "Why" - Why was this action taken? */
  whyReason?: string;
}

export interface JobArtifact {
  id: string;
  /** Artifact type: doc_read, file_created, file_modified, file_preview */
  artifactType: 'doc_read' | 'file_created' | 'file_modified' | 'file_deleted' | 'file_preview' | string;
  path: string;
  /** Operation: read, create, modify, delete, preview */
  operation: 'read' | 'create' | 'modify' | 'delete' | 'preview' | string;
  sizeBytes?: number;
  contentHash?: string;
  preview?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  // S1.1: Diff preview fields
  /** Unified diff preview for modified files */
  diffPreview?: string;
  /** Number of lines added */
  linesAdded?: number;
  /** Number of lines removed */
  linesRemoved?: number;
}

export interface JobPlan {
  id: string;
  jobId: string;
  /** Legacy: Plan steps array */
  steps?: unknown[];
  /** Legacy: Plan rationale */
  rationale?: string;
  /** PR-1: Contract-first plan document (Markdown) */
  planMarkdown?: string | null;
  /** PR-1: Structured plan data (JSON) */
  planJson?: unknown;
  createdAt: string;
  updatedAt?: string;
}

export interface JobAudit {
  phase: string;
  payload: unknown;
  createdAt: string;
}

// PR-2: Feedback Loop Types
export interface JobComment {
  id: string;
  jobId: string;
  userId?: string;
  text: string;
  createdAt: string;
}

export interface RevisionInfo {
  parentJob?: {
    id: string;
    state: JobState;
    createdAt: string;
  } | null;
  revisions: Array<{
    id: string;
    state: JobState;
    revisionNote?: string;
    createdAt: string;
    completedAt?: string;
  }>;
  isRevision: boolean;
  revisionNote?: string;
}

export interface JobsListResponse {
  items: Job[];
  nextCursor: string | null;
}

export interface CreateJobRequest {
  type: JobType;
  payload?: {
    doc?: string; // for scribe
    spec?: string; // for trace
    goal?: string; // for proto
    [key: string]: unknown;
  };
}

export interface CreateJobResponse {
  jobId: string;
  state: JobState;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

// ============================================================================
// S2.0.3: Real-time Stream Event Types
// ============================================================================

/**
 * Stage event - Job execution phase changes
 */
export interface StageStreamEvent {
  type: 'stage';
  eventId: number;
  ts: string;
  jobId: string;
  stage: 'init' | 'planning' | 'executing' | 'reflecting' | 'validating' | 'publishing' | 'completed' | 'failed';
  status: 'started' | 'progress' | 'completed';
  message?: string;
}

/**
 * Plan event - When planner produces a plan
 */
export interface PlanStreamEvent {
  type: 'plan';
  eventId: number;
  ts: string;
  jobId: string;
  steps: Array<{
    id: string;
    title: string;
    detail?: string;
  }>;
  currentStepId?: string;
  planMarkdown?: string;
}

/**
 * Tool event - MCP/GitHub/external tool calls
 */
export interface ToolStreamEvent {
  type: 'tool';
  eventId: number;
  ts: string;
  jobId: string;
  toolName: string;
  provider: 'mcp' | 'github' | 'ai' | 'internal';
  inputSummary?: string;
  durationMs?: number | null;
  ok: boolean;
  errorSummary?: string;
  correlationId?: string;
  asked?: string;
  did?: string;
  why?: string;
}

/**
 * Artifact event - File/PR/link produced
 */
export interface ArtifactStreamEvent {
  type: 'artifact';
  eventId: number;
  ts: string;
  jobId: string;
  kind: 'file' | 'commit' | 'pr' | 'link' | 'doc_read';
  label: string;
  path?: string;
  url?: string;
  summary?: string;
  preview?: string;
  operation?: 'read' | 'create' | 'modify' | 'delete' | 'preview';
  sizeBytes?: number;
}

/**
 * Log event - Informational messages
 */
export interface LogStreamEvent {
  type: 'log';
  eventId: number;
  ts: string;
  jobId: string;
  level: 'info' | 'warn';
  message: string;
  detail?: Record<string, unknown>;
}

/**
 * Error event - Error occurred
 */
export interface ErrorStreamEvent {
  type: 'error';
  eventId: number;
  ts: string;
  jobId: string;
  message: string;
  code?: string;
  scope: 'planning' | 'execution' | 'reflection' | 'validation' | 'mcp' | 'ai' | 'github' | 'unknown';
  fatal: boolean;
}

/**
 * Trace event - Individual trace timeline entry
 */
export interface TraceStreamEvent {
  type: 'trace';
  eventId: number;
  ts: string;
  jobId: string;
  eventType: string;
  stepId?: string;
  title: string;
  detail?: Record<string, unknown>;
  durationMs?: number;
  status?: 'success' | 'failed' | 'warning' | 'info';
  correlationId?: string;
  toolName?: string;
  inputSummary?: string;
  outputSummary?: string;
  reasoningSummary?: string;
  askedWhat?: string;
  didWhat?: string;
  whyReason?: string;
}

/**
 * AI Call event - LLM invocation details
 */
export interface AiCallStreamEvent {
  type: 'ai_call';
  eventId: number;
  ts: string;
  jobId: string;
  purpose: string;
  provider: string;
  model: string;
  durationMs?: number;
  tokens?: {
    input?: number;
    output?: number;
    total?: number;
  };
  ok: boolean;
  errorCode?: string;
}

/**
 * Union type for all stream events
 */
export type StreamEvent =
  | StageStreamEvent
  | PlanStreamEvent
  | ToolStreamEvent
  | ArtifactStreamEvent
  | LogStreamEvent
  | ErrorStreamEvent
  | TraceStreamEvent
  | AiCallStreamEvent;
