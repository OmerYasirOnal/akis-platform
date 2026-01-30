/**
 * Stream Event Types for Real-time Job Execution Trace
 * S2.0.3: Live Execution Trace + Thinking UX
 *
 * These types define the SSE event payload structure for real-time job observability.
 * IMPORTANT: Never expose raw chain-of-thought. Only safe, redacted summaries.
 */

/**
 * Base event with common fields
 */
interface BaseStreamEvent {
  /** Monotonically increasing event ID for reconnection */
  eventId: number;
  /** ISO timestamp */
  ts: string;
  /** Job ID this event belongs to */
  jobId: string;
}

/**
 * Stage event - Job execution phase changes
 */
export interface StageEvent extends BaseStreamEvent {
  type: 'stage';
  stage: 'init' | 'planning' | 'executing' | 'reflecting' | 'validating' | 'publishing' | 'completed' | 'failed';
  status: 'started' | 'progress' | 'completed';
  message?: string;
}

/**
 * Plan event - When planner produces a plan
 */
export interface PlanEvent extends BaseStreamEvent {
  type: 'plan';
  steps: Array<{
    id: string;
    title: string;
    detail?: string;
  }>;
  currentStepId?: string;
  /** Markdown plan document (if available) */
  planMarkdown?: string;
}

/**
 * Tool event - MCP/GitHub/external tool calls
 */
export interface ToolEvent extends BaseStreamEvent {
  type: 'tool';
  toolName: string;
  provider: 'mcp' | 'github' | 'ai' | 'internal';
  /** Redacted input summary (user-facing) */
  inputSummary?: string;
  /** Duration in ms (null if still running) */
  durationMs?: number | null;
  /** Whether call succeeded */
  ok: boolean;
  /** Redacted error summary if failed */
  errorSummary?: string;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** Explainability fields (Asked/Did/Why) */
  asked?: string;
  did?: string;
  why?: string;
}

/**
 * Artifact event - File/PR/link produced
 */
export interface ArtifactEvent extends BaseStreamEvent {
  type: 'artifact';
  kind: 'file' | 'commit' | 'pr' | 'link' | 'doc_read';
  label: string;
  path?: string;
  url?: string;
  summary?: string;
  /** Preview content (truncated, redacted) */
  preview?: string;
  /** Operation type */
  operation?: 'read' | 'create' | 'modify' | 'delete' | 'preview';
  /** Size in bytes */
  sizeBytes?: number;
}

/**
 * Log event - Informational messages
 */
export interface LogEvent extends BaseStreamEvent {
  type: 'log';
  level: 'info' | 'warn';
  message: string;
  detail?: Record<string, unknown>;
}

/**
 * Error event - Error occurred
 */
export interface ErrorEvent extends BaseStreamEvent {
  type: 'error';
  message: string;
  code?: string;
  /** Error scope: which part of execution failed */
  scope: 'planning' | 'execution' | 'reflection' | 'validation' | 'mcp' | 'ai' | 'github' | 'unknown';
  /** Whether this is a fatal error that stops execution */
  fatal: boolean;
}

/**
 * Trace event - Individual trace timeline entry (for backward compat)
 */
export interface TraceEvent extends BaseStreamEvent {
  type: 'trace';
  eventType: string;
  stepId?: string;
  title: string;
  detail?: Record<string, unknown>;
  durationMs?: number;
  status?: 'success' | 'failed' | 'warning' | 'info';
  correlationId?: string;
  /** Explainability fields */
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
export interface AiCallEvent extends BaseStreamEvent {
  type: 'ai_call';
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
  | StageEvent
  | PlanEvent
  | ToolEvent
  | ArtifactEvent
  | LogEvent
  | ErrorEvent
  | TraceEvent
  | AiCallEvent;

/**
 * SSE message wrapper
 */
export interface SSEMessage {
  /** Event ID for Last-Event-ID reconnection */
  id: string;
  /** Event type (for EventSource type filtering) */
  event?: string;
  /** JSON-encoded StreamEvent */
  data: string;
}

/**
 * Helper to create SSE-formatted message
 */
export function formatSSEMessage(event: StreamEvent): string {
  const lines: string[] = [];
  lines.push(`id: ${event.eventId}`);
  lines.push(`event: ${event.type}`);
  lines.push(`data: ${JSON.stringify(event)}`);
  lines.push(''); // Empty line to terminate event
  return lines.join('\n') + '\n';
}

/**
 * Redaction patterns for sensitive data
 */
export const REDACTION_PATTERNS = [
  /ghp_[A-Za-z0-9_]+/g,       // GitHub PAT
  /gho_[A-Za-z0-9_]+/g,       // GitHub OAuth
  /ghs_[A-Za-z0-9_]+/g,       // GitHub App
  /ghr_[A-Za-z0-9_]+/g,       // GitHub Refresh
  /sk-[A-Za-z0-9_-]+/g,       // OpenAI
  /Bearer\s+[A-Za-z0-9._-]+/gi, // Bearer tokens
  /token["\s:=]+[A-Za-z0-9._-]+/gi, // Generic tokens
  /password["\s:=]+[^\s"]+/gi, // Passwords
  /apikey["\s:=]+[A-Za-z0-9._-]+/gi, // API keys
  /secret["\s:=]+[^\s"]+/gi, // Secrets
];

/**
 * Redact sensitive data from text
 */
export function redactSensitiveText(text: string): string {
  let result = text;
  for (const pattern of REDACTION_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}
