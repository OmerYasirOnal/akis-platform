import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Job, JobTraceEvent as TraceEventType, JobArtifact as ArtifactType } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Pill } from '../components/ui/Pill';
import { CodeBlock } from '../components/ui/CodeBlock';
import { ErrorToast } from '../components/ui/ErrorToast';
import { StepTimeline } from '../components/agents/StepTimeline';
import { ThinkingIndicator } from '../components/agents/ThinkingIndicator';
import { ArtifactPreview, PRMetadataCard, RunSummaryPanel, IssueReportModal } from '../components/jobs';
import { PlanView } from '../components/jobs/PlanView';
import { FeedbackTab } from '../components/jobs/FeedbackTab';
import { useJobStream, type TraceStreamEvent, type ArtifactStreamEvent } from '../hooks/useJobStream';

// ============================================================================
// Types
// ============================================================================

interface TraceEvent {
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
  toolName?: string;
  inputSummary?: string;
  outputSummary?: string;
  reasoningSummary?: string;
  askedWhat?: string;
  didWhat?: string;
  whyReason?: string;
}

interface Artifact {
  id: string;
  artifactType: string;
  path: string;
  operation: string;
  sizeBytes?: number;
  contentHash?: string;
  preview?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

type SectionId = 'overview' | 'activity' | 'outputs' | 'quality';

// ============================================================================
// Helper Functions
// ============================================================================

interface ErrorHintInfo {
  hint: string;
  action?: string;
  link?: string;
}

function getErrorHint(errorCode?: string | null): ErrorHintInfo | null {
  if (!errorCode) return null;
  const hints: Record<string, ErrorHintInfo> = {
    'MCP_UNREACHABLE': { hint: 'MCP Gateway is not running or unreachable.', action: 'Run: ./scripts/mcp-doctor.sh' },
    'MCP_TIMEOUT': { hint: 'Connection to MCP Gateway timed out.', action: 'Check if gateway is healthy' },
    'MCP_DNS_FAILED': { hint: 'Cannot resolve MCP Gateway hostname.', action: 'Check GITHUB_MCP_BASE_URL in backend/.env' },
    'MCP_UNAUTHORIZED': { hint: 'Invalid or missing GitHub token.', action: 'Check GITHUB_TOKEN in .env.mcp.local' },
    'MCP_FORBIDDEN': { hint: 'GitHub token lacks required scopes.', action: 'Ensure token has: repo, read:org' },
    'MCP_RATE_LIMITED': { hint: 'GitHub API rate limit exceeded.', action: 'Wait a few minutes and try again' },
    'MCP_SERVER_ERROR': { hint: 'MCP Gateway server error.', action: 'Check logs: docker compose -f docker-compose.mcp.yml logs' },
    'MCP_CONFIG_MISSING': { hint: 'MCP configuration is missing.', action: 'Set GITHUB_MCP_BASE_URL in backend/.env' },
    '-32601': { hint: 'MCP tool not found.', action: 'The requested operation may not be supported' },
    '-32602': { hint: 'Invalid MCP parameters.', action: 'Check the request payload format' },
    '-32603': { hint: 'Internal JSON-RPC error.', action: 'Unexpected response format' },
    '401': { hint: 'Unauthorized.', action: 'Check your GitHub token or authentication' },
    '403': { hint: 'Forbidden.', action: 'Insufficient permissions or API rate limit exceeded' },
    '429': { hint: 'Rate limit exceeded.', action: 'Too many requests, please retry later' },
    '500': { hint: 'Internal server error.', action: 'An unexpected error occurred' },
    '502': { hint: 'Bad gateway.', action: 'MCP gateway or upstream service is unavailable' },
    'AI_KEY_MISSING': { hint: 'AI API key is missing.', action: 'Add an API key for your chosen provider in Settings → AI Keys', link: '/dashboard/settings/ai-keys' },
    'MODEL_NOT_ALLOWED': { hint: 'Selected model is not in the allowlist.', action: 'Choose a supported model from the dropdown or update AI_SCRIBE_MODEL_ALLOWLIST', link: '/dashboard/settings/ai-keys' },
    'AI_PROVIDER_ERROR': { hint: 'AI provider returned an error. This usually means the model is not available or the API key is invalid.', action: '1) Verify your API key is valid. 2) Select a supported model. 3) Check provider status.', link: '/dashboard/settings/ai-keys' },
    'AI_RATE_LIMITED': { hint: 'AI provider rate limit reached.', action: 'Wait a few minutes before retrying, or upgrade your API plan' },
    'AI_INVALID_REQUEST': { hint: 'Invalid request to AI provider.', action: 'The model name or parameters may be incorrect. Try a different model.' },
    'AI_MODEL_NOT_FOUND': { hint: 'Requested AI model not found on the provider.', action: 'The model may be deprecated or renamed. Select a supported model.', link: '/dashboard/settings/ai-keys' },
    'AI_CONTEXT_LENGTH': { hint: 'Input too long for the selected model.', action: 'Reduce the scope of your request or use a model with a larger context window' },
    'AI_AUTH_ERROR': { hint: 'Authentication failed with AI provider.', action: 'Your API key may be invalid or expired. Update it in Settings.', link: '/dashboard/settings/ai-keys' },
    'MISSING_DEPENDENCY': { hint: 'A required environment variable or service is not configured on the server.', action: 'Check the error message for details. Common fix: ensure GITHUB_MCP_BASE_URL and GITHUB_TOKEN are set in the staging .env file, then restart the backend.' },
    'GITHUB_NOT_CONNECTED': { hint: 'Your GitHub account is not linked.', action: 'Connect your GitHub account in Agent settings before running jobs.', link: '/agents/scribe' },
  };
  const code = String(errorCode);
  const hintInfo = hints[code] || hints[code.toUpperCase()];
  if (!hintInfo) {
    if (code.startsWith('MCP_')) return { hint: 'MCP Gateway issue detected.', action: 'Run ./scripts/mcp-doctor.sh to diagnose' };
    if (code.startsWith('AI_')) return { hint: 'AI provider issue.', action: 'Check AI configuration in Settings', link: '/dashboard/settings/ai-keys' };
    if (code.startsWith('5')) return { hint: 'Server error.', action: 'Please contact support with the correlation ID' };
  }
  return hintInfo || null;
}

function redactSecrets(text: string): string {
  return text
    .replace(/ghp_[A-Za-z0-9_]+/g, 'ghp_[REDACTED]')
    .replace(/gho_[A-Za-z0-9_]+/g, 'gho_[REDACTED]')
    .replace(/ghs_[A-Za-z0-9_]+/g, 'ghs_[REDACTED]')
    .replace(/sk-[A-Za-z0-9_-]+/g, 'sk-[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/"token":\s*"[^"]+"/gi, '"token": "[REDACTED]"')
    .replace(/"authorization":\s*"[^"]+"/gi, '"authorization": "[REDACTED]"');
}

function formatDuration(startStr: string, endStr?: string): string {
  const start = new Date(startStr).getTime();
  const end = endStr ? new Date(endStr).getTime() : Date.now();
  const ms = end - start;
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r.toFixed(0)}s`;
}

// ============================================================================
// Sub-Components
// ============================================================================

interface SectionTabProps {
  id: SectionId;
  label: string;
  count?: number;
  active: boolean;
  onClick: (id: SectionId) => void;
}

function SectionTab({ id, label, count, active, onClick }: SectionTabProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
        active
          ? 'bg-ak-primary/10 text-ak-primary border border-ak-primary/30'
          : 'text-ak-text-secondary hover:text-ak-text-primary hover:bg-ak-surface-2 border border-transparent'
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
          active ? 'bg-ak-primary/20 text-ak-primary' : 'bg-ak-surface-3 text-ak-text-secondary'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };
  return (
    <button
      onClick={handleCopy}
      className="px-2 py-0.5 text-xs rounded bg-ak-surface-3 hover:bg-ak-surface-2 text-ak-text-secondary hover:text-ak-text-primary transition-colors"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

function EmptyState({ message, testId }: { message: string; testId?: string }) {
  return (
    <div className="text-center py-8 text-ak-text-secondary" data-testid={testId}>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ============================================================================
// Quality Section (Scribe-only) — computed from real data
// ============================================================================

interface QualityBreakdown {
  targetsConfigured: string[];
  targetsProduced: string[];
  filesRead: number;
  filesProduced: number;
  toolCalls: number;
  aiCalls: number;
  docDepth: string;
  docPack: string;
  multiPass: boolean;
  totalTokens: number | null;
  score: number;
  breakdown: { label: string; value: string; points: number }[];
}

function computeScribeQuality(
  job: Job,
  traces: TraceEvent[],
  documentsRead: Artifact[],
  filesProduced: Artifact[],
): QualityBreakdown {
  const payload = (job.payload || {}) as Record<string, unknown>;
  const targetsConfigured = (payload.outputTargets as string[] | undefined) || [];
  const docDepth = (payload.docDepth as string) || 'standard';
  const docPack = (payload.docPack as string) || 'standard';
  const multiPass = docPack === 'full' || docDepth === 'deep';

  const targetsProduced = filesProduced.map(f => {
    const name = f.path.split('/').pop()?.replace(/\.md$/i, '').toUpperCase() || '';
    return name;
  });

  const toolCalls = traces.filter(t =>
    t.eventType === 'tool_call' || t.eventType === 'mcp_call'
  ).length;
  const aiCalls = traces.filter(t => t.eventType === 'ai_call').length;

  const totalTokens = job.ai?.summary?.totalTokens ?? job.aiTotalTokens ?? null;

  // Score: each metric contributes points to a transparent score
  const breakdown: { label: string; value: string; points: number }[] = [];
  let score = 0;

  // Targets coverage
  const targetCoverage = targetsConfigured.length > 0
    ? targetsProduced.filter(t => targetsConfigured.includes(t)).length / targetsConfigured.length
    : 0;
  const targetPoints = Math.round(targetCoverage * 30);
  breakdown.push({ label: 'Target coverage', value: `${targetsProduced.length}/${targetsConfigured.length} targets`, points: targetPoints });
  score += targetPoints;

  // Files analyzed
  const readPoints = Math.min(documentsRead.length * 2, 20);
  breakdown.push({ label: 'Files analyzed', value: `${documentsRead.length} files`, points: readPoints });
  score += readPoints;

  // Output volume
  const outputPoints = Math.min(filesProduced.length * 5, 20);
  breakdown.push({ label: 'Docs generated', value: `${filesProduced.length} files`, points: outputPoints });
  score += outputPoints;

  // Depth bonus
  const depthPoints = docDepth === 'deep' ? 15 : docDepth === 'standard' ? 10 : 5;
  breakdown.push({ label: 'Analysis depth', value: docDepth, points: depthPoints });
  score += depthPoints;

  // Multi-pass bonus
  if (multiPass) {
    breakdown.push({ label: 'Multi-pass review', value: 'Yes', points: 15 });
    score += 15;
  } else {
    breakdown.push({ label: 'Multi-pass review', value: 'No', points: 0 });
  }

  return {
    targetsConfigured,
    targetsProduced,
    filesRead: documentsRead.length,
    filesProduced: filesProduced.length,
    toolCalls,
    aiCalls,
    docDepth,
    docPack,
    multiPass,
    totalTokens,
    score: Math.min(score, 100),
    breakdown,
  };
}

function QualitySection({ quality, suggestions }: { quality: QualityBreakdown; suggestions?: string[] }) {
  const card = 'bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]';

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className={`${card} rounded-2xl p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-ak-text-primary">Documentation Quality</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-ak-primary">{quality.score}</span>
            <span className="text-sm text-ak-text-secondary">/100</span>
          </div>
        </div>
        <p className="text-xs text-ak-text-secondary mb-4">
          Computed from real job data: targets coverage, files analyzed, docs generated, analysis depth, and multi-pass usage.
        </p>

        {/* Breakdown */}
        <div className="space-y-2">
          {quality.breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.03]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-ak-text-primary">{item.label}</span>
                <span className="text-[10px] text-ak-text-secondary">{item.value}</span>
              </div>
              <span className="text-xs font-medium text-ak-primary">+{item.points}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className={`${card} rounded-2xl p-5`}>
          <h3 className="text-sm font-semibold text-ak-text-primary mb-3">💡 Suggestions to Improve</h3>
          <ul className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-ak-text-secondary">
                <span className="text-ak-primary">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Config Summary */}
      <div className={`${card} rounded-2xl p-5`}>
        <h3 className="text-sm font-semibold text-ak-text-primary mb-3">Configuration Used</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-ak-text-secondary">Doc Pack</span>
            <p className="text-ak-text-primary font-medium">{quality.docPack}</p>
          </div>
          <div>
            <span className="text-xs text-ak-text-secondary">Doc Depth</span>
            <p className="text-ak-text-primary font-medium">{quality.docDepth}</p>
          </div>
          <div>
            <span className="text-xs text-ak-text-secondary">Tool Calls</span>
            <p className="text-ak-text-primary font-medium">{quality.toolCalls}</p>
          </div>
          <div>
            <span className="text-xs text-ak-text-secondary">AI Calls</span>
            <p className="text-ak-text-primary font-medium">{quality.aiCalls}</p>
          </div>
          {quality.totalTokens !== null && (
            <div>
              <span className="text-xs text-ak-text-secondary">Total Tokens</span>
              <p className="text-ak-text-primary font-medium">{quality.totalTokens.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string; requestId?: string } | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [requestId, setRequestId] = useState<string | undefined>();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedTab, setAdvancedTab] = useState<'plan' | 'feedback' | 'audit' | 'raw'>('plan');

  // Include flags
  const [includePlan, setIncludePlan] = useState(false);
  const [includeAudit, setIncludeAudit] = useState(false);
  const [includeTrace] = useState(true);
  const [includeArtifacts] = useState(true);

  const [showIssueModal, setShowIssueModal] = useState(false);

  // SSE streaming for running jobs
  const isRunning = job?.state === 'running' || job?.state === 'pending';
  const {
    currentStage,
    stageMessage,
    planSteps,
    traceEvents: streamTraces,
    artifactEvents: streamArtifacts,
    isConnected: streamConnected,
    isEnded: streamEnded,
  } = useJobStream(isRunning ? id ?? null : null, {
    autoConnect: true,
    includeHistory: false,
  });

  const includePlanRef = useRef(includePlan);
  const includeAuditRef = useRef(includeAudit);
  const includeTraceRef = useRef(includeTrace);
  const includeArtifactsRef = useRef(includeArtifacts);
  includePlanRef.current = includePlan;
  includeAuditRef.current = includeAudit;
  includeTraceRef.current = includeTrace;
  includeArtifactsRef.current = includeArtifacts;

  const loadJob = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const include: string[] = [];
      if (includePlanRef.current) include.push('plan');
      if (includeAuditRef.current) include.push('audit');
      if (includeTraceRef.current) include.push('trace');
      if (includeArtifactsRef.current) include.push('artifacts');
      const response = await api.getJob(id, include.length > 0 ? include : undefined);
      setJob(response);
      setRequestId(response.requestId);
    } catch (err: unknown) {
      const apiError = err as { message?: string; code?: string; requestId?: string };
      setError({ message: apiError.message || 'Failed to load job', code: apiError.code, requestId: apiError.requestId });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadJob(); }, [loadJob, includePlan, includeAudit, includeTrace, includeArtifacts]);

  // Auto-refresh for non-terminal jobs
  useEffect(() => {
    loadJob();
  }, [loadJob, includePlan, includeAudit, includeTrace, includeArtifacts]);

  // Auto-refresh if job is not in terminal state
  useEffect(() => {
    if (!job || job.state === 'completed' || job.state === 'failed' || job.state === 'awaiting_approval') {
      return;
    }

    // Progressive backoff: 2s for first 30s, then 5s
    const elapsed = job.createdAt ? Date.now() - new Date(job.createdAt).getTime() : 0;
    const pollInterval = elapsed > 30000 ? 5000 : 2000;

    const interval = setInterval(() => {
      loadJob();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [job, loadJob, streamConnected]);

  // Reload on stream end
  useEffect(() => {
    if (streamEnded) {
      const timeout = setTimeout(() => loadJob(), 500);
      return () => clearTimeout(timeout);
    }
  }, [streamEnded, loadJob]);

  // Merge DB + stream data
  const traces = useMemo(() => {
    const dbTraces = (job?.trace as TraceEvent[] | undefined) || [];
    if (isRunning && streamTraces.length > 0) {
      const liveTraces: TraceEvent[] = streamTraces.map((st: TraceStreamEvent) => ({
        id: `stream-${st.eventId}`,
        eventType: st.eventType,
        stepId: st.stepId,
        title: st.title,
        detail: st.detail,
        durationMs: st.durationMs,
        status: st.status,
        correlationId: st.correlationId,
        errorCode: undefined,
        gatewayUrl: undefined,
        timestamp: st.ts,
        toolName: st.toolName,
        inputSummary: st.inputSummary,
        outputSummary: st.outputSummary,
        reasoningSummary: st.reasoningSummary,
        askedWhat: st.askedWhat,
        didWhat: st.didWhat,
        whyReason: st.whyReason,
      }));
      const dbTraceIds = new Set(dbTraces.map(t => t.id));
      const uniqueLiveTraces = liveTraces.filter(t => !dbTraceIds.has(t.id));
      return [...dbTraces, ...uniqueLiveTraces];
    }
    return dbTraces;
  }, [job, isRunning, streamTraces]);

  const artifacts = useMemo(() => {
    const dbArtifacts = (job?.artifacts as Artifact[] | undefined) || [];
    if (isRunning && streamArtifacts.length > 0) {
      const liveArtifacts: Artifact[] = streamArtifacts.map((sa: ArtifactStreamEvent) => ({
        id: `stream-${sa.eventId}`,
        artifactType: sa.kind === 'doc_read' ? 'doc_read' :
                     sa.kind === 'file' ? (sa.operation === 'create' ? 'file_created' :
                                          sa.operation === 'modify' ? 'file_modified' :
                                          sa.operation === 'preview' ? 'file_preview' : 'file_created') :
                     sa.kind,
        path: sa.path || sa.label,
        operation: sa.operation || 'create',
        sizeBytes: sa.sizeBytes,
        preview: sa.preview,
        metadata: {},
        createdAt: sa.ts,
      }));
      const dbArtifactPaths = new Set(dbArtifacts.map(a => a.path));
      const uniqueLiveArtifacts = liveArtifacts.filter(a => !dbArtifactPaths.has(a.path));
      return [...dbArtifacts, ...uniqueLiveArtifacts];
    }
    return dbArtifacts;
  }, [job, isRunning, streamArtifacts]);

  const documentsRead = useMemo(() => artifacts.filter(a => a.artifactType === 'doc_read'), [artifacts]);
  const filesProduced = useMemo(() => artifacts.filter(a => a.artifactType === 'file_created' || a.artifactType === 'file_modified'), [artifacts]);
  const previewFiles = useMemo(() => artifacts.filter(a => a.artifactType === 'file_preview'), [artifacts]);
  const isDryRun = Boolean((job?.payload as Record<string, unknown>)?.dryRun);
  const showThinkingIndicator = isRunning && (traces.length === 0 || currentStage !== null);
  const isScribe = job?.type === 'scribe';

  // Quality breakdown for Scribe
  const scribeQuality = useMemo(() => {
    if (!job || !isScribe) return null;
    return computeScribeQuality(job, traces, documentsRead as Artifact[], filesProduced as Artifact[]);
  }, [job, isScribe, traces, documentsRead, filesProduced]);

  const mcpStatus = useMemo(() => {
    const mcpEvents = traces.filter(t => t.eventType === 'mcp_connect' || t.eventType === 'mcp_call');
    if (mcpEvents.length === 0) return null;
    const lastMcp = mcpEvents[mcpEvents.length - 1];
    return { healthy: lastMcp.status === 'success', gatewayUrl: lastMcp.gatewayUrl, lastAttempt: lastMcp.timestamp, errorCode: lastMcp.errorCode };
  }, [traces]);

  const containerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

  if (isLoading && !job) {
    return (
      <div className={`${containerClass} py-12`}>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
          <p className="text-sm text-ak-text-secondary">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <>
        <ErrorToast error={error} onClose={() => setError(null)} />
        <div className={`${containerClass} py-12 text-center`}>
          <p className="text-ak-danger">{error.message}</p>
          <Link to="/dashboard/jobs" className="text-ak-primary hover:text-ak-text-primary mt-4 inline-block">Back to Jobs</Link>
        </div>
      </>
    );
  }

  if (!job) {
    return (
      <div className={`${containerClass} py-12 text-center`}>
        <h2 className="text-xl font-semibold text-ak-text-primary mb-2">Job Not Found</h2>
        <p className="text-ak-text-secondary mb-4">The job with ID <code className="text-sm bg-ak-surface-2 px-2 py-1 rounded">{id}</code> could not be found.</p>
        <Link to="/dashboard/jobs" className="text-ak-primary hover:text-ak-text-primary">Back to Jobs</Link>
      </div>
    );
  }

  const payload = (job.payload || {}) as Record<string, unknown>;

  return (
    <div className={containerClass}>
      {job && <IssueReportModal job={job} isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} />}

      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard/jobs" className="text-ak-primary hover:text-ak-text-primary mb-4 inline-flex items-center gap-1 text-sm group">
          <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span> Back to Jobs
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-ak-text-primary">Job Details</h1>
              {job.state === 'running' && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Running
                </span>
              )}
            </div>
            {requestId && (
              <div className="flex items-center gap-2 text-sm text-ak-text-secondary mt-1">
                <span>Request ID:</span>
                <code className="text-xs bg-ak-surface-3 px-1.5 py-0.5 rounded">{requestId}</code>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {job.state === 'failed' && (
              <button onClick={() => setShowIssueModal(true)} className="px-3 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 transition-colors flex items-center gap-1.5">
                Report Issue
              </button>
            )}
            <button onClick={() => loadJob()} disabled={isLoading} className="px-3 py-1.5 text-sm bg-ak-surface-2 hover:bg-ak-surface-3 rounded-lg text-ak-text-primary transition-colors disabled:opacity-50 flex items-center gap-1.5">
              <span className={isLoading ? 'animate-spin' : ''}>&#8635;</span>
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorToast error={error} onClose={() => setError(null)} />}

      {/* Summary Card */}
      <div className="bg-ak-surface-2 shadow rounded-lg p-6 mb-6 border border-ak-border">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider">Status</label>
            <p className="mt-1"><Badge state={job.state} /></p>
          </div>
          <div>
            <label className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider">Type</label>
            <p className="mt-1"><Pill type={job.type} /></p>
          </div>
          <div>
            <label className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider">Created</label>
            <p className="mt-1 text-sm text-ak-text-primary">{new Date(job.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider">Duration</label>
            <p className="mt-1 text-sm text-ak-text-primary">{formatDuration(job.createdAt, job.state === 'completed' || job.state === 'failed' ? job.updatedAt : undefined)}</p>
          </div>
          {typeof payload.owner === 'string' && typeof payload.repo === 'string' && (
            <div>
              <label className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider">Repository</label>
              <p className="mt-1 text-sm text-ak-text-primary truncate">{payload.owner}/{payload.repo}</p>
            </div>
          )}
        </div>

        {/* Correlation ID & MCP Status */}
        <div className="mt-4 pt-4 border-t border-ak-border flex flex-wrap items-center gap-4">
          {job.correlationId && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ak-text-secondary">Correlation ID:</span>
              <code className="text-xs bg-ak-surface-3 px-2 py-1 rounded text-ak-text-primary">{job.correlationId}</code>
              <CopyButton text={job.correlationId} />
            </div>
          )}
          {mcpStatus && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ak-text-secondary">MCP Gateway:</span>
              <span className={`text-xs font-medium ${mcpStatus.healthy ? 'text-green-400' : 'text-red-400'}`}>
                {mcpStatus.healthy ? 'Healthy' : 'Unreachable'}
              </span>
            </div>
          )}
        </div>
      </div>

      <RunSummaryPanel job={job} traces={traces as TraceEventType[]} />

      {/* Error Card */}
      {(job.error || job.errorCode || job.errorMessage) && (
        <div className="mb-6">
          <div className="rounded-lg border border-ak-danger/70 bg-ak-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ak-danger">Error Details</h3>
              {job.errorCode && (
                <span className="px-2 py-1 rounded bg-ak-danger/20 text-sm font-medium text-ak-danger">{job.errorCode}</span>
              )}
            </div>
            {job.errorMessage && <p className="text-ak-danger">{job.errorMessage}</p>}
            {(() => {
              const errorHint = getErrorHint(job.errorCode);
              if (!errorHint) return null;
              return (
                <div className="rounded bg-blue-400/10 px-3 py-2 border-l-4 border-blue-400 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-blue-400">Why: </span>
                    <span className="text-sm text-ak-text-primary">{errorHint.hint}</span>
                  </div>
                  {errorHint.action && (
                    <div>
                      <span className="text-sm font-medium text-blue-400">Action: </span>
                      <span className="text-sm text-ak-text-primary">{errorHint.action}</span>
                    </div>
                  )}
                  {errorHint.link && (
                    <a
                      href={errorHint.link}
                      className="inline-flex items-center gap-1 text-sm font-medium text-ak-primary hover:underline mt-1"
                    >
                      Go to Settings →
                    </a>
                  )}
                  {job.errorCode?.startsWith('MCP') && (
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-ak-surface-3 px-2 py-1 rounded">./scripts/mcp-doctor.sh</code>
                      <CopyButton text="./scripts/mcp-doctor.sh" label="Copy command" />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="border-b border-ak-border mb-6">
        <div className="flex flex-wrap gap-1 -mb-px">
          <SectionTab id="overview" label="Overview" active={activeSection === 'overview'} onClick={setActiveSection} />
          <SectionTab id="activity" label="Activity" count={traces.length} active={activeSection === 'activity'} onClick={setActiveSection} />
          <SectionTab id="outputs" label="Outputs" count={filesProduced.length + previewFiles.length} active={activeSection === 'outputs'} onClick={setActiveSection} />
          {isScribe && (
            <SectionTab id="quality" label="Quality" active={activeSection === 'quality'} onClick={setActiveSection} />
          )}
        </div>
      </div>

      {/* Section Content */}
      <div className="pb-12">
        {/* Overview */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div className={`grid grid-cols-2 gap-4 ${previewFiles.length > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              <div className="bg-ak-surface-2 rounded-lg p-4 border border-ak-border">
                <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">Trace Events</h4>
                <p className="text-2xl font-bold text-ak-text-primary">{traces.length}</p>
              </div>
              <div className="bg-ak-surface-2 rounded-lg p-4 border border-ak-border">
                <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">Documents Read</h4>
                <p className="text-2xl font-bold text-ak-text-primary">{documentsRead.length}</p>
              </div>
              <div className="bg-ak-surface-2 rounded-lg p-4 border border-ak-border">
                <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">Files Produced</h4>
                <p className="text-2xl font-bold text-ak-text-primary">{filesProduced.length}</p>
              </div>
              {previewFiles.length > 0 && (
                <div className="bg-ak-surface-2 rounded-lg p-4 border border-amber-500/30 bg-amber-500/5">
                  <h4 className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2">Preview Files</h4>
                  <p className="text-2xl font-bold text-amber-400">{previewFiles.length}</p>
                  <p className="text-xs text-ak-text-secondary mt-1">Dry run only</p>
                </div>
              )}
            </div>

            {isScribe && (
              <PRMetadataCard
                result={job.result}
                payload={job.payload}
                isDryRun={isDryRun}
                jobState={job.state}
              />
            )}

            {job.payload != null && (
              <details className="border border-ak-border rounded-lg overflow-hidden">
                <summary className="px-4 py-3 bg-ak-surface-2 hover:bg-ak-surface-3 transition-colors cursor-pointer text-sm font-medium text-ak-text-primary">
                  Payload
                </summary>
                <div className="p-4 bg-ak-surface">
                  <CodeBlock data={job.payload as Record<string, unknown>} />
                </div>
              </details>
            )}

            {job.result != null && (
              <details className="border border-ak-border rounded-lg overflow-hidden">
                <summary className="px-4 py-3 bg-ak-surface-2 hover:bg-ak-surface-3 transition-colors cursor-pointer text-sm font-medium text-ak-text-primary">
                  Result
                </summary>
                <div className="p-4 bg-ak-surface">
                  <CodeBlock data={job.result as Record<string, unknown>} />
                </div>
              </details>
            )}
          </div>
        )}

        {/* Activity */}
        {activeSection === 'activity' && (
          <div data-testid="timeline-list">
            {showThinkingIndicator && (
              <div className="mb-6 p-6 bg-ak-surface-2 rounded-lg border border-ak-border">
                <ThinkingIndicator stage={currentStage} message={stageMessage} size="md" isConnected={streamConnected} />
                {planSteps && planSteps.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-ak-border">
                    <h4 className="text-sm font-medium text-ak-text-secondary mb-2">Plan Steps</h4>
                    <div className="space-y-1">
                      {planSteps.map((step, idx) => (
                        <div key={step.id} className={`flex items-center gap-2 text-sm ${idx === 0 ? 'text-ak-primary font-medium' : 'text-ak-text-secondary'}`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${idx === 0 ? 'bg-ak-primary/20 text-ak-primary' : 'bg-ak-surface-3 text-ak-text-secondary'}`}>
                            {idx + 1}
                          </span>
                          <span>{step.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {streamConnected && (
                  <div className="mt-3 text-xs text-ak-text-secondary text-center">
                    Events streaming live &bull; {traces.length} events received
                  </div>
                )}
              </div>
            )}
            <StepTimeline traces={traces as TraceEventType[]} />
          </div>
        )}

        {/* Outputs */}
        {activeSection === 'outputs' && (
          <div className="space-y-6">
            {/* Files Produced */}
            <div>
              <h3 className="text-sm font-semibold text-ak-text-primary mb-3">Files Produced ({filesProduced.length})</h3>
              {filesProduced.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-ak-text-secondary">No files were created or modified</p>
                  {isDryRun && previewFiles.length > 0 && (
                    <p className="text-xs text-ak-text-secondary mt-1">This is a dry-run job. See preview files below.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filesProduced.map(file => (
                    <ArtifactPreview key={file.id} artifact={file as ArtifactType} showFullPath />
                  ))}
                </div>
              )}
            </div>

            {/* Preview Files (Dry Run) */}
            {previewFiles.length > 0 && (
              <div>
                <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm font-medium text-amber-400">Dry Run Preview</p>
                  <p className="text-xs text-ak-text-secondary mt-1">
                    These files were generated but NOT committed to the repository.
                  </p>
                </div>
                <div className="space-y-3">
                  {previewFiles.map(file => (
                    <ArtifactPreview key={file.id} artifact={file as ArtifactType} showFullPath />
                  ))}
                </div>
              </div>
            )}

            {/* Documents Read */}
            <div>
              <h3 className="text-sm font-semibold text-ak-text-primary mb-3">Documents Read ({documentsRead.length})</h3>
              {documentsRead.length === 0 ? (
                <EmptyState testId="documents-empty" message="No documents were read during this job" />
              ) : (
                <div className="space-y-3">
                  {documentsRead.map(doc => (
                    <ArtifactPreview key={doc.id} artifact={doc as ArtifactType} showFullPath />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quality (Scribe-only) */}
        {activeSection === 'quality' && isScribe && scribeQuality && (
          <QualitySection quality={scribeQuality} suggestions={job?.qualitySuggestions || undefined} />
        )}
      </div>

      {/* Advanced Toggle */}
      <div className="border-t border-ak-border pt-4 pb-8">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-ak-text-secondary hover:text-ak-text-primary transition-colors"
        >
          <span>{showAdvanced ? '\u25BC' : '\u25B6'}</span>
          Advanced (Plan, Feedback, Audit, Raw)
        </button>

        {showAdvanced && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-1 mb-4 border-b border-ak-border pb-2">
              {(['plan', 'feedback', 'audit', 'raw'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setAdvancedTab(tab);
                    if (tab === 'plan' && !includePlan) setIncludePlan(true);
                    if (tab === 'audit' && !includeAudit) setIncludeAudit(true);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    advancedTab === tab
                      ? 'bg-ak-surface-2 text-ak-text-primary'
                      : 'text-ak-text-secondary hover:text-ak-text-primary'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {advancedTab === 'plan' && (
              <div>
                {!includePlan ? (
                  <EmptyState message="Loading plan data..." />
                ) : job.plan ? (
                  <PlanView plan={job.plan} jobState={job.state} requiresApproval={job.requiresApproval} />
                ) : (
                  <EmptyState message="No plan data available for this job" />
                )}
              </div>
            )}

            {advancedTab === 'feedback' && <FeedbackTab job={job} />}

            {advancedTab === 'audit' && (
              <div>
                {!includeAudit ? (
                  <EmptyState message="Loading audit data..." />
                ) : job.audit && job.audit.length > 0 ? (
                  <div className="space-y-4">
                    {job.audit.map((entry, index) => (
                      <CodeBlock key={index} data={entry} title={`Phase: ${entry.phase} - ${new Date(entry.createdAt).toLocaleString()}`} />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No audit entries available" />
                )}
              </div>
            )}

            {advancedTab === 'raw' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CopyButton text={redactSecrets(JSON.stringify(job, null, 2))} label="Copy raw payload (redacted)" />
                </div>
                <div className="bg-ak-surface-3 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-ak-text-primary whitespace-pre-wrap">
                    {redactSecrets(JSON.stringify(job, null, 2))}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
