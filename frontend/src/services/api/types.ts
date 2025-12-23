// This file will be generated from OpenAPI schema
// For now, we define basic types manually

export type JobType = 'scribe' | 'trace' | 'proto';
export type JobState = 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval';

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
