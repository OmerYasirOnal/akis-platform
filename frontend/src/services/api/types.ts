// This file will be generated from OpenAPI schema
// For now, we define basic types manually

export type JobType = 'scribe' | 'trace' | 'proto';
export type JobState = 'pending' | 'running' | 'completed' | 'failed';

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
  artifactType: string;
  path: string;
  operation: string;
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
  steps: unknown[];
  rationale?: string;
  createdAt: string;
}

export interface JobAudit {
  phase: string;
  payload: unknown;
  createdAt: string;
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
