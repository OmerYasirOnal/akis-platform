import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Job, JobTraceEvent as TraceEventType, JobArtifact as ArtifactType } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Pill } from '../components/ui/Pill';
import { CodeBlock } from '../components/ui/CodeBlock';
import { ErrorToast } from '../components/ui/ErrorToast';
import { StepTimeline } from '../components/agents/StepTimeline';
import { ArtifactPreview, PRMetadataCard } from '../components/jobs';
import { PlanView } from '../components/jobs/PlanView';

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

type TabId = 'overview' | 'timeline' | 'documents' | 'files' | 'preview' | 'plan' | 'audit' | 'raw';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a user-friendly error message for common error codes
 */
function getErrorHint(errorCode?: string | null): string | null {
  if (!errorCode) return null;

  const hints: Record<string, string> = {
    'MCP_UNREACHABLE': 'MCP Gateway is not running or unreachable. Run: ./scripts/mcp-doctor.sh',
    'MCP_TIMEOUT': 'Connection to MCP Gateway timed out. Check if gateway is healthy.',
    'MCP_DNS_FAILED': 'Cannot resolve MCP Gateway hostname. Check GITHUB_MCP_BASE_URL in backend/.env',
    'MCP_UNAUTHORIZED': 'Invalid or missing GitHub token. Check GITHUB_TOKEN in .env.mcp.local',
    'MCP_FORBIDDEN': 'GitHub token lacks required scopes. Ensure token has: repo, read:org',
    'MCP_RATE_LIMITED': 'GitHub API rate limit exceeded. Wait a few minutes and try again.',
    'MCP_SERVER_ERROR': 'MCP Gateway server error. Check logs: docker compose -f docker-compose.mcp.yml logs',
    'MCP_CONFIG_MISSING': 'MCP configuration is missing. Set GITHUB_MCP_BASE_URL in backend/.env',
    '-32601': 'MCP tool not found - the requested operation may not be supported by the GitHub MCP server',
    '-32602': 'Invalid MCP parameters - check the request payload format',
    '-32603': 'Internal JSON-RPC error - unexpected response format',
    '401': 'Unauthorized - check your GitHub token or authentication',
    '403': 'Forbidden - insufficient permissions or API rate limit exceeded',
    '429': 'Rate limit exceeded - too many requests, please retry later',
    '500': 'Internal server error - an unexpected error occurred',
    '502': 'Bad gateway - MCP gateway or upstream service is unavailable',
  };

  const code = String(errorCode);
  const hint = hints[code] || hints[code.toUpperCase()];

  if (!hint) {
    if (code.startsWith('MCP_')) {
      return 'MCP Gateway issue detected. Run ./scripts/mcp-doctor.sh to diagnose.';
    }
    if (code.startsWith('5')) {
      return 'Server error - please contact support with the correlation ID';
    }
  }

  return hint || null;
}

/**
 * Redact sensitive values from a string
 */
function redactSecrets(text: string): string {
  // Redact common token patterns
  return text
    .replace(/ghp_[A-Za-z0-9_]+/g, 'ghp_[REDACTED]')
    .replace(/gho_[A-Za-z0-9_]+/g, 'gho_[REDACTED]')
    .replace(/ghs_[A-Za-z0-9_]+/g, 'ghs_[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/"token":\s*"[^"]+"/gi, '"token": "[REDACTED]"')
    .replace(/"authorization":\s*"[^"]+"/gi, '"authorization": "[REDACTED]"');
}

// ============================================================================
// Sub-Components
// ============================================================================

interface TabButtonProps {
  id: TabId;
  label: string;
  count?: number;
  active: boolean;
  onClick: (id: TabId) => void;
}

function TabButton({ id, label, count, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        active
          ? 'border-ak-primary text-ak-primary bg-ak-surface-2'
          : 'border-transparent text-ak-text-secondary hover:text-ak-text-primary hover:border-ak-border'
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-ak-surface-3">
          {count}
        </span>
      )}
    </button>
  );
}

interface CopyButtonProps {
  text: string;
  label?: string;
}

function CopyButton({ text, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-2 py-0.5 text-xs rounded bg-ak-surface-3 hover:bg-ak-surface-2 text-ak-text-secondary hover:text-ak-text-primary transition-colors"
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-ak-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-ak-surface-2 hover:bg-ak-surface-3 transition-colors"
      >
        <span className="text-sm font-medium text-ak-text-primary">{title}</span>
        <span className="text-ak-text-secondary">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && <div className="p-4 bg-ak-surface">{children}</div>}
    </div>
  );
}

interface EmptyStateProps {
  message: string;
  testId?: string;
}

function EmptyState({ message, testId }: EmptyStateProps) {
  return (
    <div className="text-center py-8 text-ak-text-secondary" data-testid={testId}>
      <p className="text-sm">{message}</p>
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
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [requestId, setRequestId] = useState<string | undefined>();

  // Include flags for data fetching
  const [includePlan, setIncludePlan] = useState(false);
  const [includeAudit, setIncludeAudit] = useState(false);
  const [includeTrace] = useState(true); // Always include trace by default
  const [includeArtifacts] = useState(true); // Always include artifacts by default

  // Use refs for options to avoid closure issues
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
      setError({
        message: apiError.message || 'Failed to load job',
        code: apiError.code,
        requestId: apiError.requestId,
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob, includePlan, includeAudit, includeTrace, includeArtifacts]);

  // Auto-refresh if job is not in terminal state
  useEffect(() => {
    if (!job || job.state === 'completed' || job.state === 'failed') {
      return;
    }

    const interval = setInterval(() => {
      loadJob();
    }, 2000);

    return () => clearInterval(interval);
  }, [job, loadJob]);

  // Derived data
  const traces = useMemo(() => (job?.trace as TraceEvent[] | undefined) || [], [job]);
  const artifacts = useMemo(() => (job?.artifacts as Artifact[] | undefined) || [], [job]);
  const documentsRead = useMemo(
    () => artifacts.filter((a) => a.artifactType === 'doc_read'),
    [artifacts]
  );
  const filesProduced = useMemo(
    () => artifacts.filter((a) => a.artifactType === 'file_created' || a.artifactType === 'file_modified'),
    [artifacts]
  );
  const previewFiles = useMemo(
    () => artifacts.filter((a) => a.artifactType === 'file_preview'),
    [artifacts]
  );
  const isDryRun = Boolean((job?.payload as Record<string, unknown>)?.dryRun);

  // MCP status derived from traces
  const mcpStatus = useMemo(() => {
    const mcpEvents = traces.filter((t) => t.eventType === 'mcp_connect' || t.eventType === 'mcp_call');
    if (mcpEvents.length === 0) return null;
    const lastMcp = mcpEvents[mcpEvents.length - 1];
    return {
      healthy: lastMcp.status === 'success',
      gatewayUrl: lastMcp.gatewayUrl,
      lastAttempt: lastMcp.timestamp,
      errorCode: lastMcp.errorCode,
    };
  }, [traces]);

  const containerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

  if (isLoading && !job) {
    return <div className={`${containerClass} py-12 text-center`}>Loading...</div>;
  }

  if (error && !job) {
    return (
      <>
        <ErrorToast error={error} onClose={() => setError(null)} />
        <div className={`${containerClass} py-12 text-center`}>
          <p className="text-ak-danger">{error.message}</p>
          <Link to="/dashboard/jobs" className="text-ak-primary hover:text-ak-text-primary mt-4 inline-block">
            ← Back to Jobs
          </Link>
        </div>
      </>
    );
  }

  if (!job) {
    return (
      <div className={`${containerClass} py-12 text-center`}>
        <h2 className="text-xl font-semibold text-ak-text-primary mb-2">Job Not Found</h2>
        <p className="text-ak-text-secondary mb-4">The job with ID <code className="text-sm bg-ak-surface-2 px-2 py-1 rounded">{id}</code> could not be found.</p>
        <Link to="/dashboard/jobs" className="text-ak-primary hover:text-ak-text-primary">
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard/jobs" className="text-ak-primary hover:text-ak-text-primary mb-4 inline-flex items-center gap-1 text-sm group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Jobs
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-ak-text-primary">Job Details</h1>
              {job.state === 'running' && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
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
            <button
              onClick={() => loadJob()}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm bg-ak-surface-2 hover:bg-ak-surface-3 rounded-lg text-ak-text-primary transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <span className={isLoading ? 'animate-spin' : ''}>↻</span>
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorToast error={error} onClose={() => setError(null)} />}

      {/* Summary Card */}
      <div className="bg-ak-surface-2 shadow rounded-lg p-6 mb-6 border border-ak-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider">Status</label>
            <p className="mt-1">
              <Badge state={job.state} />
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider">Type</label>
            <p className="mt-1">
              <Pill type={job.type} />
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider">Created</label>
            <p className="mt-1 text-sm text-ak-text-primary">
              {new Date(job.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider">Updated</label>
            <p className="mt-1 text-sm text-ak-text-primary">
              {new Date(job.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Correlation ID & MCP Status Row */}
        <div className="mt-4 pt-4 border-t border-ak-border flex flex-wrap items-center gap-4">
          {job.correlationId && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ak-text-secondary">Correlation ID:</span>
              <code className="text-xs bg-ak-surface-3 px-2 py-1 rounded text-ak-text-primary">
                {job.correlationId}
              </code>
              <CopyButton text={job.correlationId} />
            </div>
          )}
          {mcpStatus && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ak-text-secondary">MCP Gateway:</span>
              <span className={`text-xs font-medium ${mcpStatus.healthy ? 'text-green-400' : 'text-red-400'}`}>
                {mcpStatus.healthy ? '● Healthy' : '● Unreachable'}
              </span>
              {mcpStatus.gatewayUrl && (
                <code className="text-xs bg-ak-surface-3 px-2 py-1 rounded text-ak-text-secondary">
                  {mcpStatus.gatewayUrl}
                </code>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Card (if failed) */}
      {(job.error || job.errorCode || job.errorMessage) && (
        <div className="mb-6">
          <div className="rounded-lg border border-ak-danger/70 bg-ak-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ak-danger">Error Details</h3>
            {job.errorCode && (
                <span className="px-2 py-1 rounded bg-ak-danger/20 text-sm font-medium text-ak-danger">
                  {job.errorCode}
                </span>
              )}
              </div>
            {job.errorMessage && (
              <p className="text-ak-danger">{job.errorMessage}</p>
            )}
            {getErrorHint(job.errorCode) && (
              <div className="rounded bg-ak-info/10 px-3 py-2 border-l-4 border-ak-info">
                <span className="text-sm font-medium text-ak-info">💡 Hint:</span>
                <p className="mt-1 text-sm text-ak-text-primary">{getErrorHint(job.errorCode)}</p>
                {job.errorCode?.startsWith('MCP') && (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="text-xs bg-ak-surface-3 px-2 py-1 rounded">./scripts/mcp-doctor.sh</code>
                    <CopyButton text="./scripts/mcp-doctor.sh" label="Copy command" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-ak-border mb-6">
        <div className="flex flex-wrap gap-1 -mb-px">
          <TabButton id="overview" label="Overview" active={activeTab === 'overview'} onClick={setActiveTab} />
          <TabButton id="timeline" label="Timeline" count={traces.length} active={activeTab === 'timeline'} onClick={setActiveTab} />
          <TabButton id="documents" label="Documents Read" count={documentsRead.length} active={activeTab === 'documents'} onClick={setActiveTab} />
          <TabButton id="files" label="Files Produced" count={filesProduced.length} active={activeTab === 'files'} onClick={setActiveTab} />
          {previewFiles.length > 0 && (
            <TabButton id="preview" label="Preview Files" count={previewFiles.length} active={activeTab === 'preview'} onClick={setActiveTab} />
          )}
          <TabButton id="plan" label="Plan" active={activeTab === 'plan'} onClick={setActiveTab} />
          <TabButton id="audit" label="Audit" active={activeTab === 'audit'} onClick={setActiveTab} />
          <TabButton id="raw" label="Raw" active={activeTab === 'raw'} onClick={setActiveTab} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="pb-12">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className={`grid grid-cols-1 gap-4 ${previewFiles.length > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
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

            {/* PR/Branch/Commit Metadata - Prominent display for Scribe jobs */}
            {job.type === 'scribe' && (
              <PRMetadataCard
                result={job.result}
                payload={job.payload}
                isDryRun={Boolean((job.payload as Record<string, unknown>)?.dryRun)}
                jobState={job.state}
              />
            )}

            {job.payload != null && (
              <CollapsibleSection title="Payload" defaultOpen>
                <CodeBlock data={job.payload as Record<string, unknown>} />
              </CollapsibleSection>
            )}

            {job.result != null && (
              <CollapsibleSection title="Result" defaultOpen>
                <CodeBlock data={job.result as Record<string, unknown>} />
              </CollapsibleSection>
            )}
          </div>
        )}

        {/* Timeline Tab - S1.1: Explainability UI with Step Grouping */}
        {activeTab === 'timeline' && (
          <div data-testid="timeline-list">
            <StepTimeline traces={traces as TraceEventType[]} />
          </div>
        )}

        {/* Documents Read Tab */}
        {activeTab === 'documents' && (
          <div data-testid="documents-list">
            {documentsRead.length === 0 ? (
              <EmptyState testId="documents-empty" message="No documents were read during this job" />
            ) : (
              <div className="space-y-3">
                {documentsRead.map((doc) => (
                  <ArtifactPreview 
                    key={doc.id} 
                    artifact={doc as ArtifactType} 
                    showFullPath 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Files Produced Tab */}
        {activeTab === 'files' && (
          <div data-testid="files-list">
            {filesProduced.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-ak-text-secondary mb-2">
                  No files were created or modified during this job
                </p>
                {isDryRun && previewFiles.length > 0 && (
                  <p className="text-xs text-ak-text-secondary">
                    💡 This is a dry-run job. Check the{' '}
                    <button 
                      onClick={() => setActiveTab('preview')} 
                      className="text-ak-primary hover:underline"
                    >
                      Preview Files
                    </button>{' '}
                    tab to see what would have been created.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filesProduced.map((file) => (
                  <ArtifactPreview 
                    key={file.id} 
                    artifact={file as ArtifactType} 
                    showFullPath 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview Files Tab (Dry Run) */}
        {activeTab === 'preview' && (
          <div data-testid="preview-files-list">
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-lg">🔬</span>
                <div>
                  <p className="text-sm font-medium text-amber-400">Dry Run Preview</p>
                  <p className="text-xs text-ak-text-secondary mt-1">
                    These files were generated but NOT committed to the repository. 
                    This is a preview of what would have been created.
                  </p>
                </div>
              </div>
            </div>
            {previewFiles.length === 0 ? (
              <EmptyState testId="preview-empty" message="No preview files available" />
            ) : (
              <div className="space-y-3">
                {previewFiles.map((file) => (
                  <ArtifactPreview 
                    key={file.id} 
                    artifact={file as ArtifactType} 
                    showFullPath 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Plan Tab - PR-1: Contract-first plan view */}
        {activeTab === 'plan' && (
          <div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-ak-text-primary">
                <input
                  type="checkbox"
                  checked={includePlan}
                  onChange={(e) => setIncludePlan(e.target.checked)}
                  className="h-4 w-4 rounded border-ak-border bg-ak-surface text-ak-primary focus:ring-ak-primary"
                />
                Load plan data
              </label>
            </div>
            {!includePlan ? (
              <EmptyState message="Check 'Load plan data' to view the plan" />
            ) : job.plan ? (
              <PlanView
                plan={job.plan}
                jobState={job.state}
                requiresApproval={job.requiresApproval}
              />
            ) : (
              <EmptyState message="No plan data available for this job" />
            )}
        </div>
      )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-ak-text-primary">
                <input
                  type="checkbox"
                  checked={includeAudit}
                  onChange={(e) => setIncludeAudit(e.target.checked)}
                  className="h-4 w-4 rounded border-ak-border bg-ak-surface text-ak-primary focus:ring-ak-primary"
                />
                Load audit data
              </label>
            </div>
            {!includeAudit ? (
              <EmptyState message="Check 'Load audit data' to view the audit trail" />
            ) : job.audit && job.audit.length > 0 ? (
              <div className="space-y-4">
          {job.audit.map((entry, index) => (
              <CodeBlock
                    key={index}
                data={entry}
                title={`Phase: ${entry.phase} - ${new Date(entry.createdAt).toLocaleString()}`}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No audit entries available for this job" />
            )}
          </div>
        )}

        {/* Raw Tab */}
        {activeTab === 'raw' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CopyButton 
                text={redactSecrets(JSON.stringify(job, null, 2))} 
                label="Copy raw payload (redacted)" 
              />
            </div>
            <div className="bg-ak-surface-3 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-ak-text-primary whitespace-pre-wrap">
                {redactSecrets(JSON.stringify(job, null, 2))}
              </pre>
            </div>
        </div>
      )}
      </div>
    </div>
  );
}
