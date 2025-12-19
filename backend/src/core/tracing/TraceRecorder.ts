/**
 * TraceRecorder - Utility for recording job execution traces
 * S1.0: Scribe Observability - structured trace timeline
 */

import { db } from '../../db/client.js';
import { jobTraces, jobArtifacts, type NewJobTrace, type NewJobArtifact } from '../../db/schema.js';

export type TraceEventType = 
  | 'step_start'
  | 'step_complete'
  | 'step_failed'
  | 'doc_read'
  | 'file_created'
  | 'file_modified'
  | 'mcp_connect'
  | 'mcp_call'
  | 'ai_call'
  | 'ai_parse_error'
  | 'error'
  | 'info';

export type TraceStatus = 'success' | 'failed' | 'warning' | 'info';

export interface TraceEvent {
  eventType: TraceEventType;
  title: string;
  stepId?: string;
  detail?: Record<string, unknown>;
  durationMs?: number;
  status?: TraceStatus;
  correlationId?: string;
  gatewayUrl?: string;
  errorCode?: string;
}

export interface ArtifactRecord {
  artifactType: 'doc_read' | 'file_created' | 'file_modified' | 'file_deleted';
  path: string;
  operation: 'read' | 'create' | 'modify' | 'delete';
  sizeBytes?: number;
  contentHash?: string;
  preview?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Maximum size for trace detail JSON (to prevent DB bloat)
 */
const MAX_DETAIL_SIZE = 10 * 1024; // 10KB

/**
 * Maximum size for artifact preview
 */
const MAX_PREVIEW_SIZE = 1024; // 1KB

/**
 * Truncate and sanitize trace detail to prevent DB bloat
 */
function sanitizeDetail(detail: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!detail) return null;
  
  const json = JSON.stringify(detail);
  if (json.length <= MAX_DETAIL_SIZE) {
    return detail;
  }
  
  // Truncate large details
  return {
    _truncated: true,
    _originalSize: json.length,
    summary: Object.keys(detail).join(', '),
  };
}

/**
 * Truncate preview text
 */
function truncatePreview(preview: string | undefined): string | null {
  if (!preview) return null;
  if (preview.length <= MAX_PREVIEW_SIZE) return preview;
  return preview.substring(0, MAX_PREVIEW_SIZE - 20) + '\n...[truncated]';
}

/**
 * Redact sensitive values from detail objects
 */
function redactSensitiveData(detail: Record<string, unknown>): Record<string, unknown> {
  const sensitivePatterns = [
    /token/i,
    /secret/i,
    /password/i,
    /apikey/i,
    /api_key/i,
    /authorization/i,
    /bearer/i,
  ];
  
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(detail)) {
    const isSensitive = sensitivePatterns.some(p => p.test(key));
    
    if (isSensitive && typeof value === 'string') {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = redactSensitiveData(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * TraceRecorder class for recording job execution traces
 */
export class TraceRecorder {
  private jobId: string;
  private pendingTraces: NewJobTrace[] = [];
  private pendingArtifacts: NewJobArtifact[] = [];
  private stepTimers: Map<string, number> = new Map();

  constructor(jobId: string) {
    this.jobId = jobId;
  }

  /**
   * Record a trace event
   */
  async trace(event: TraceEvent): Promise<void> {
    const detail = event.detail ? sanitizeDetail(redactSensitiveData(event.detail)) : null;
    
    const traceRow: NewJobTrace = {
      jobId: this.jobId,
      eventType: event.eventType,
      stepId: event.stepId,
      title: event.title.substring(0, 500), // Ensure title fits
      detail,
      durationMs: event.durationMs,
      status: event.status || 'info',
      correlationId: event.correlationId,
      gatewayUrl: event.gatewayUrl,
      errorCode: event.errorCode,
    };

    this.pendingTraces.push(traceRow);
  }

  /**
   * Record an artifact
   */
  async recordArtifact(artifact: ArtifactRecord): Promise<void> {
    const artifactRow: NewJobArtifact = {
      jobId: this.jobId,
      artifactType: artifact.artifactType,
      path: artifact.path.substring(0, 1000),
      operation: artifact.operation,
      sizeBytes: artifact.sizeBytes,
      contentHash: artifact.contentHash,
      preview: truncatePreview(artifact.preview),
      metadata: artifact.metadata ? sanitizeDetail(artifact.metadata) : null,
    };

    this.pendingArtifacts.push(artifactRow);
  }

  /**
   * Start timing a step
   */
  startStep(stepId: string, title: string): void {
    this.stepTimers.set(stepId, Date.now());
    void this.trace({
      eventType: 'step_start',
      stepId,
      title,
      status: 'info',
    });
  }

  /**
   * Complete a step with success
   */
  completeStep(stepId: string, title: string, detail?: Record<string, unknown>): void {
    const startTime = this.stepTimers.get(stepId);
    const durationMs = startTime ? Date.now() - startTime : undefined;
    this.stepTimers.delete(stepId);
    
    void this.trace({
      eventType: 'step_complete',
      stepId,
      title,
      detail,
      durationMs,
      status: 'success',
    });
  }

  /**
   * Fail a step
   */
  failStep(stepId: string, title: string, error: string, errorCode?: string): void {
    const startTime = this.stepTimers.get(stepId);
    const durationMs = startTime ? Date.now() - startTime : undefined;
    this.stepTimers.delete(stepId);
    
    void this.trace({
      eventType: 'step_failed',
      stepId,
      title,
      detail: { error },
      durationMs,
      status: 'failed',
      errorCode,
    });
  }

  /**
   * Record a document read
   */
  recordDocRead(path: string, sizeBytes?: number, preview?: string): void {
    void this.trace({
      eventType: 'doc_read',
      title: `Read: ${path}`,
      detail: { path, sizeBytes },
      status: 'success',
    });
    
    void this.recordArtifact({
      artifactType: 'doc_read',
      path,
      operation: 'read',
      sizeBytes,
      preview,
    });
  }

  /**
   * Record a file creation
   */
  recordFileCreated(path: string, sizeBytes?: number, preview?: string): void {
    void this.trace({
      eventType: 'file_created',
      title: `Created: ${path}`,
      detail: { path, sizeBytes },
      status: 'success',
    });
    
    void this.recordArtifact({
      artifactType: 'file_created',
      path,
      operation: 'create',
      sizeBytes,
      preview,
    });
  }

  /**
   * Record an MCP connection attempt
   */
  recordMcpConnect(gatewayUrl: string, success: boolean, correlationId?: string, errorCode?: string): void {
    void this.trace({
      eventType: 'mcp_connect',
      title: success ? 'MCP Gateway connected' : 'MCP Gateway connection failed',
      gatewayUrl,
      correlationId,
      status: success ? 'success' : 'failed',
      errorCode,
    });
  }

  /**
   * Record an MCP tool call
   */
  recordMcpCall(toolName: string, success: boolean, durationMs?: number, correlationId?: string, detail?: Record<string, unknown>): void {
    void this.trace({
      eventType: 'mcp_call',
      title: `MCP: ${toolName}`,
      detail,
      durationMs,
      correlationId,
      status: success ? 'success' : 'failed',
    });
  }

  /**
   * Record an AI call
   */
  recordAiCall(purpose: string, success: boolean, durationMs?: number, detail?: Record<string, unknown>): void {
    void this.trace({
      eventType: 'ai_call',
      title: `AI: ${purpose}`,
      detail,
      durationMs,
      status: success ? 'success' : 'failed',
    });
  }

  /**
   * Record an AI parse error (fallback used)
   */
  recordAiParseError(context: string, fallbackUsed: string): void {
    void this.trace({
      eventType: 'ai_parse_error',
      title: `AI parse error: ${context}`,
      detail: { context, fallbackUsed },
      status: 'warning',
    });
  }

  /**
   * Record a general error
   */
  recordError(title: string, errorCode?: string, detail?: Record<string, unknown>): void {
    void this.trace({
      eventType: 'error',
      title,
      detail,
      errorCode,
      status: 'failed',
    });
  }

  /**
   * Record an info event
   */
  recordInfo(title: string, detail?: Record<string, unknown>): void {
    void this.trace({
      eventType: 'info',
      title,
      detail,
      status: 'info',
    });
  }

  /**
   * Flush all pending traces and artifacts to the database
   */
  async flush(): Promise<void> {
    try {
      // Insert traces
      if (this.pendingTraces.length > 0) {
        await db.insert(jobTraces).values(this.pendingTraces);
        this.pendingTraces = [];
      }
      
      // Insert artifacts
      if (this.pendingArtifacts.length > 0) {
        await db.insert(jobArtifacts).values(this.pendingArtifacts);
        this.pendingArtifacts = [];
      }
    } catch (error) {
      console.error('Failed to flush traces/artifacts:', error);
      // Don't throw - tracing should not break job execution
    }
  }

  /**
   * Get summary of recorded events (for job result)
   */
  getSummary(): { traceCount: number; artifactCount: number; documentsRead: number; filesProduced: number } {
    const documentsRead = this.pendingArtifacts.filter(a => a.artifactType === 'doc_read').length;
    const filesProduced = this.pendingArtifacts.filter(a => 
      a.artifactType === 'file_created' || a.artifactType === 'file_modified'
    ).length;
    
    return {
      traceCount: this.pendingTraces.length,
      artifactCount: this.pendingArtifacts.length,
      documentsRead,
      filesProduced,
    };
  }
}

/**
 * Create a TraceRecorder for a job
 */
export function createTraceRecorder(jobId: string): TraceRecorder {
  return new TraceRecorder(jobId);
}

