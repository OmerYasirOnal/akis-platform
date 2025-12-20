import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Job } from '../services/api';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Pill } from '../components/ui/Pill';
import { CodeBlock } from '../components/ui/CodeBlock';
import { ErrorToast } from '../components/ui/ErrorToast';

/**
 * Get a user-friendly error message for common error codes while preserving technical details
 */
function getErrorHint(errorCode?: string | null): string | null {
  if (!errorCode) return null;

  const hints: Record<string, string> = {
    // MCP Connection errors (new stable codes from backend)
    'MCP_UNREACHABLE': 'MCP Gateway is not running or unreachable. Run: ./scripts/mcp-doctor.sh',
    'MCP_TIMEOUT': 'Connection to MCP Gateway timed out. Check if gateway is healthy.',
    'MCP_DNS_FAILED': 'Cannot resolve MCP Gateway hostname. Check GITHUB_MCP_BASE_URL in backend/.env',
    'MCP_UNAUTHORIZED': 'Invalid or missing GitHub token. Check GITHUB_TOKEN in .env.mcp.local',
    'MCP_FORBIDDEN': 'GitHub token lacks required scopes. Ensure token has: repo, read:org',
    'MCP_RATE_LIMITED': 'GitHub API rate limit exceeded. Wait a few minutes and try again.',
    'MCP_SERVER_ERROR': 'MCP Gateway server error. Check logs: docker compose -f docker-compose.mcp.yml logs',
    'MCP_CONFIG_MISSING': 'MCP configuration is missing. Set GITHUB_MCP_BASE_URL in backend/.env',
    'MCP_PROTOCOL_ERROR': 'MCP protocol error. Check gateway compatibility.',
    'MCP_TOOL_NOT_FOUND': 'MCP tool not found. The requested operation may not be supported.',
    
    // JSON-RPC error codes
    '-32601': 'MCP tool not found - the requested operation may not be supported by the GitHub MCP server',
    '-32602': 'Invalid MCP parameters - check the request payload format',
    '-32603': 'Internal JSON-RPC error - unexpected response format',
    '-32700': 'Invalid JSON-RPC request - malformed request structure',
    '-32000': 'MCP connection failed - gateway may be down or unreachable',
    
    // HTTP status codes
    '401': 'Unauthorized - check your GitHub token or authentication',
    '403': 'Forbidden - insufficient permissions or API rate limit exceeded',
    '404': 'Not found - the requested resource does not exist',
    '422': 'Validation error - the provided data is invalid',
    '429': 'Rate limit exceeded - too many requests, please retry later',
    '500': 'Internal server error - an unexpected error occurred',
    '502': 'Bad gateway - MCP gateway or upstream service is unavailable',
    '503': 'Service unavailable - the service is temporarily down',
    '504': 'Gateway timeout - the request took too long to complete',
    
    // Agent-specific errors
    'GITHUB_NOT_CONNECTED': 'GitHub is not connected. Connect GitHub in the agent setup wizard.',
    'MCP_ERROR': 'MCP Gateway error. Check gateway logs for details.',
    'NOT_FOUND': 'The requested job was not found. It may have been deleted.',
  };

  // Match error codes (case-insensitive for flexibility)
  const code = String(errorCode);
  const hint = hints[code] || hints[code.toUpperCase()];

  if (!hint) {
    // Check for pattern-based hints
    if (code.startsWith('MCP_')) {
      return 'MCP Gateway issue detected. Run ./scripts/mcp-doctor.sh to diagnose.';
    }
    if (code.startsWith('5')) {
      return 'Server error - please contact support with the correlation ID';
    }
    if (code.startsWith('4')) {
      return 'Client error - check your request parameters';
    }
    if (code.startsWith('-326')) {
      return 'JSON-RPC protocol error - invalid request format';
    }
  }

  return hint || null;
}

/**
 * Redact potential secrets from raw error payload (safe-by-default)
 */
function redactSecrets(text: string): string {
  if (!text) return text;
  
  // Redact GitHub tokens (ghp_, gho_, ghs_, ghr_, ghu_, github_pat_)
  let redacted = text.replace(/ghp_[a-zA-Z0-9]{36}/g, 'ghp_REDACTED');
  redacted = redacted.replace(/gho_[a-zA-Z0-9]{36}/g, 'gho_REDACTED');
  redacted = redacted.replace(/ghs_[a-zA-Z0-9]{36}/g, 'ghs_REDACTED');
  redacted = redacted.replace(/ghr_[a-zA-Z0-9]{36}/g, 'ghr_REDACTED');
  redacted = redacted.replace(/ghu_[a-zA-Z0-9]{36}/g, 'ghu_REDACTED');
  redacted = redacted.replace(/github_pat_[a-zA-Z0-9_]{82}/g, 'github_pat_REDACTED');
  
  // Redact npm tokens
  redacted = redacted.replace(/ntn_[a-zA-Z0-9]{36}/g, 'ntn_REDACTED');
  
  // Redact bearer tokens in Authorization headers
  redacted = redacted.replace(/"Authorization":\s*"Bearer\s+[^"]+"/g, '"Authorization": "Bearer REDACTED"');
  
  // Redact JWT tokens (anything that looks like base64.base64.base64)
  redacted = redacted.replace(/\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, 'JWT_REDACTED');
  
  return redacted;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string; requestId?: string } | null>(
    null
  );
  const [includePlan, setIncludePlan] = useState(false);
  const [includeAudit, setIncludeAudit] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const [showRawPayload, setShowRawPayload] = useState(false);

  // Use refs for options to avoid closure issues
  const includePlanRef = useRef(includePlan);
  const includeAuditRef = useRef(includeAudit);
  includePlanRef.current = includePlan;
  includeAuditRef.current = includeAudit;

  const loadJob = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const include: string[] = [];
      if (includePlanRef.current) include.push('plan');
      if (includeAuditRef.current) include.push('audit');

      const response = await api.getJob(id, include.length > 0 ? include : undefined);
      setJob(response);
      setRequestId(response.requestId);
    } catch (err: unknown) {
      const apiError = err as { message?: string; code?: string; requestId?: string; status?: number };
      
      // Check for 404 specifically
      const isNotFound = apiError.code === 'NOT_FOUND' || apiError.status === 404 ||
        apiError.message?.toLowerCase().includes('not found');
      
      setError({
        message: apiError.message || 'Failed to load job',
        code: isNotFound ? 'NOT_FOUND' : (apiError.code || 'UNKNOWN'),
        requestId: apiError.requestId,
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob, includePlan, includeAudit]);

  // Auto-refresh if job is not in terminal state
  useEffect(() => {
    if (!job || job.state === 'completed' || job.state === 'failed') {
      return;
    }

    const interval = setInterval(() => {
      loadJob();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [job, loadJob]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const containerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

  // Loading state
  if (isLoading && !job) {
    return (
      <div className={`${containerClass} py-12`}>
        <div className="flex flex-col items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-ak-primary border-t-transparent" />
          <p className="mt-4 text-sm text-ak-text-secondary">Loading job details...</p>
        </div>
      </div>
    );
  }

  // 404 / Not Found state
  if (error?.code === 'NOT_FOUND' && !job) {
    return (
      <div className={`${containerClass} py-12`}>
        <div className="mx-auto max-w-md rounded-lg border border-ak-border bg-ak-surface-2 p-6 text-center">
          {/* Not Found Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ak-text-tertiary/10">
            <svg
              className="h-6 w-6 text-ak-text-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="mb-2 text-lg font-semibold text-ak-text-primary">Job Not Found</h2>
          <p className="mb-4 text-sm text-ak-text-secondary">
            The job you're looking for doesn't exist or has been deleted.
          </p>

          {/* Job ID for reference */}
          {id && (
            <div className="mb-4 rounded bg-ak-surface p-2">
              <p className="text-xs text-ak-text-tertiary">Job ID:</p>
              <p className="font-mono text-sm text-ak-text-primary break-all">{id}</p>
            </div>
          )}

          {/* Request ID if available */}
          {error.requestId && (
            <p className="mb-4 text-xs text-ak-text-tertiary">
              Request ID: {error.requestId}
            </p>
          )}

          <Link
            to="/jobs"
            className="inline-flex items-center justify-center rounded-lg bg-ak-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ak-primary/80"
          >
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  // Generic error state (network errors, server errors, etc.)
  if (error && !job) {
    return (
      <>
        <ErrorToast error={error} onClose={() => setError(null)} />
        <div className={`${containerClass} py-12`}>
          <div className="mx-auto max-w-md rounded-lg border border-ak-danger/30 bg-ak-surface-2 p-6 text-center">
            {/* Error Icon */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ak-danger/10">
              <svg
                className="h-6 w-6 text-ak-danger"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="mb-2 text-lg font-semibold text-ak-text-primary">Failed to Load Job</h2>
            <p className="mb-2 text-sm text-ak-danger">{error.message}</p>
            
            {/* Error code badge */}
            {error.code && (
              <span className="mb-4 inline-block rounded bg-ak-danger/10 px-2 py-1 text-xs font-medium text-ak-danger">
                {error.code}
              </span>
            )}

            {/* Hint */}
            {getErrorHint(error.code) && (
              <div className="mb-4 mt-2 rounded bg-ak-info/10 px-3 py-2 border-l-4 border-ak-info text-left">
                <span className="text-xs font-medium text-ak-info">💡 Hint:</span>
                <p className="text-xs text-ak-text-primary">{getErrorHint(error.code)}</p>
              </div>
            )}

            {/* Request ID */}
            {error.requestId && (
              <p className="mb-4 text-xs text-ak-text-tertiary">
                Request ID: {error.requestId}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to="/jobs"
                className="inline-flex items-center justify-center rounded-lg border border-ak-border bg-ak-surface px-4 py-2 text-sm font-medium text-ak-text-primary transition-colors hover:bg-ak-surface-3"
              >
                ← Back to Jobs
              </Link>
              <button
                onClick={loadJob}
                className="inline-flex items-center justify-center rounded-lg bg-ak-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ak-primary/80"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // No job data (should not happen, but handle gracefully)
  if (!job) {
    return (
      <div className={`${containerClass} py-12 text-center`}>
        <p className="text-ak-text-secondary">No job data available.</p>
        <Link to="/jobs" className="text-ak-primary hover:text-ak-text-primary mt-4 inline-block">
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  // Safe state accessor (prevents crash if state is unexpected)
  const safeState = (job.state && ['pending', 'running', 'completed', 'failed'].includes(job.state))
    ? job.state as 'pending' | 'running' | 'completed' | 'failed'
    : 'pending';

  return (
    <div className={containerClass}>
      <div className="mb-6">
        <Link to="/jobs" className="text-ak-primary hover:text-ak-text-primary mb-4 inline-block">
          ← Back to Jobs
        </Link>
        <h1 className="text-2xl font-bold text-ak-text-primary">Job Details</h1>
        {requestId && <p className="text-sm text-ak-text-secondary mt-1">Request ID: {requestId}</p>}
      </div>

      {error && <ErrorToast error={error} onClose={() => setError(null)} />}

      <div className="bg-ak-surface-2 shadow rounded-lg p-6 mb-6 border border-ak-border">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-ak-text-secondary">ID</label>
            <p className="mt-1 text-sm text-ak-text-primary">{job.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-ak-text-secondary">Type</label>
            <p className="mt-1">
              <Pill type={job.type} />
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-ak-text-secondary">State</label>
            <p className="mt-1">
              <Badge state={safeState} />
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-ak-text-secondary">Created At</label>
            <p className="mt-1 text-sm text-ak-text-primary">{new Date(job.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-ak-text-secondary">Updated At</label>
            <p className="mt-1 text-sm text-ak-text-primary">{new Date(job.updatedAt).toLocaleString()}</p>
          </div>
          {job.correlationId && (
            <div>
              <label className="text-sm font-medium text-ak-text-secondary">Correlation ID</label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-mono text-ak-text-primary">{job.correlationId}</span>
                <button
                  onClick={() => copyToClipboard(job.correlationId ?? '')}
                  className="rounded px-1.5 py-0.5 text-xs bg-ak-surface hover:bg-ak-surface-3 text-ak-text-secondary hover:text-ak-text-primary transition-colors"
                  title="Copy Correlation ID"
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          )}
          {job.mcpGatewayUrl && (
            <div>
              <label className="text-sm font-medium text-ak-text-secondary">MCP Gateway</label>
              <p className="mt-1 text-xs font-mono text-ak-text-primary break-all">{job.mcpGatewayUrl}</p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ak-text-primary">
            <input
              type="checkbox"
              checked={includePlan}
              onChange={(e) => setIncludePlan(e.target.checked)}
              className="h-4 w-4 rounded border-ak-border bg-ak-surface text-ak-primary focus:ring-ak-primary"
            />
            Include Plan
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ak-text-primary">
            <input
              type="checkbox"
              checked={includeAudit}
              onChange={(e) => setIncludeAudit(e.target.checked)}
              className="h-4 w-4 rounded border-ak-border bg-ak-surface text-ak-primary focus:ring-ak-primary"
            />
            Include Audit
          </label>
        </div>
      </div>

      {/* Operations Diagnostics - Show what was actually done */}
      {job.result !== null && typeof job.result === 'object' && 'diagnostics' in (job.result as object) && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-ak-text-primary">Operations</h2>
          <div className="rounded-lg border border-ak-border bg-ak-surface-2 p-4">
            {((): React.ReactNode => {
              try {
                const diagnostics = (job.result as Record<string, unknown>).diagnostics as Record<string, unknown> | undefined;
                const mode = diagnostics?.mode as string | undefined;
                const operations = diagnostics?.operations as Record<string, boolean> | undefined;
                const targets = diagnostics?.targets as Record<string, string> | undefined;

                const isDryRun = mode === 'dry-run';

                return (
                  <div className="space-y-4">
                    {/* Mode Indicator */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-ak-text-secondary">Mode:</span>
                      {isDryRun ? (
                        <StatusBadge variant="warning">
                          🧪 Dry Run (No writes)
                        </StatusBadge>
                      ) : (
                        <StatusBadge variant="success">
                          ✍️ Write Mode (GitHub writes performed)
                        </StatusBadge>
                      )}
                    </div>

                    {/* Operations performed */}
                    {operations && (
                      <div>
                        <span className="text-sm font-medium text-ak-text-secondary block mb-2">GitHub Operations:</span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className={operations.branchCreated ? 'text-green-600 dark:text-green-400' : 'text-ak-text-tertiary'}>
                              {operations.branchCreated ? '✓' : '○'}
                            </span>
                            <span className="text-ak-text-primary">Branch Created</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={operations.fileCommitted ? 'text-green-600 dark:text-green-400' : 'text-ak-text-tertiary'}>
                              {operations.fileCommitted ? '✓' : '○'}
                            </span>
                            <span className="text-ak-text-primary">File Committed</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={operations.prCreated ? 'text-green-600 dark:text-green-400' : 'text-ak-text-tertiary'}>
                              {operations.prCreated ? '✓' : '○'}
                            </span>
                            <span className="text-ak-text-primary">Pull Request Created</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Targets */}
                    {targets && (
                      <div className="mt-3 pt-3 border-t border-ak-border">
                        <span className="text-sm font-medium text-ak-text-secondary block mb-2">Targets:</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {targets.owner && (
                            <div>
                              <span className="text-ak-text-tertiary">Owner: </span>
                              <span className="font-mono text-ak-text-primary">{targets.owner}</span>
                            </div>
                          )}
                          {targets.repo && (
                            <div>
                              <span className="text-ak-text-tertiary">Repo: </span>
                              <span className="font-mono text-ak-text-primary">{targets.repo}</span>
                            </div>
                          )}
                          {targets.branch && (
                            <div>
                              <span className="text-ak-text-tertiary">Branch: </span>
                              <span className="font-mono text-ak-text-primary">{targets.branch}</span>
                            </div>
                          )}
                          {targets.filePath && (
                            <div>
                              <span className="text-ak-text-tertiary">File: </span>
                              <span className="font-mono text-ak-text-primary">{targets.filePath}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dry-run explanation */}
                    {isDryRun && (
                      <div className="mt-3 pt-3 border-t border-ak-border">
                        <p className="text-xs text-ak-text-secondary">
                          💡 This was a <strong>dry-run</strong> - no actual changes were made to GitHub.
                          To create real branches/commits/PRs, click <strong>"Run Now"</strong> instead of <strong>"Run Test Job"</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                );
              } catch {
                // Gracefully handle parsing errors
                return (
                  <p className="text-sm text-ak-text-secondary">
                    Unable to parse diagnostics data.
                  </p>
                );
              }
            })()}
          </div>
        </div>
      )}

      {job.payload != null && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-ak-text-primary">Payload</h2>
          <CodeBlock data={job.payload} />
        </div>
      )}

      {job.result != null && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-ak-text-primary">Result</h2>
          <CodeBlock data={job.result} />
        </div>
      )}

      {(job.error || job.errorCode || job.errorMessage) && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-ak-danger">Error</h2>
          <div className="rounded-lg border border-ak-danger/70 bg-ak-surface p-4 space-y-3">
            {job.correlationId && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ak-text-secondary">Correlation ID:</span>
                <span className="inline-block rounded bg-ak-danger/10 px-2 py-0.5 text-sm font-medium text-ak-danger">
                  {job.correlationId}
                </span>
                <button
                  onClick={() => copyToClipboard(job.correlationId ?? '')}
                  className="ml-2 rounded px-2 py-0.5 text-xs bg-ak-surface-2 hover:bg-ak-surface-3 text-ak-text-secondary hover:text-ak-text-primary transition-colors"
                  title="Copy Correlation ID"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            )}
            {job.errorCode && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ak-text-secondary">Code:</span>
                <span className="inline-block rounded bg-ak-danger/20 px-2 py-0.5 text-sm font-medium text-ak-danger">
                  {job.errorCode}
                </span>
              </div>
            )}
            {job.errorMessage && (
              <div>
                <span className="text-sm font-medium text-ak-text-secondary">Message:</span>
                <p className="mt-1 text-ak-danger">{job.errorMessage}</p>
              </div>
            )}
            {getErrorHint(job.errorCode) && (
              <div className="rounded bg-ak-info/10 px-3 py-2 border-l-4 border-ak-info">
                <span className="text-sm font-medium text-ak-info">💡 Hint:</span>
                <p className="mt-1 text-sm text-ak-text-primary">
                  {getErrorHint(job.errorCode)}
                </p>
              </div>
            )}
            {job.error && job.error !== job.errorMessage && (
              <div>
                <span className="text-sm font-medium text-ak-text-secondary">Details:</span>
                <p className="mt-1 text-sm text-ak-danger/80">{job.error}</p>
              </div>
            )}
            {job.mcpGatewayUrl && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ak-text-secondary">MCP Gateway:</span>
                <span className="inline-block rounded bg-ak-info/10 px-2 py-0.5 text-xs font-mono text-ak-text-primary">
                  {job.mcpGatewayUrl}
                </span>
              </div>
            )}
            {job.rawErrorPayload && (
              <div className="mt-4 pt-4 border-t border-ak-border">
                <button
                  onClick={() => setShowRawPayload(!showRawPayload)}
                  className="flex items-center gap-2 text-sm font-medium text-ak-text-secondary hover:text-ak-text-primary transition-colors"
                >
                  <span>{showRawPayload ? '▼' : '▶'}</span>
                  <span>Raw Error Payload (for debugging)</span>
                </button>
                {showRawPayload && (
                  <div className="mt-3">
                    <div className="relative">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(redactSecrets(job.rawErrorPayload ?? ''));
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="absolute top-2 right-2 rounded px-2 py-1 text-xs bg-ak-surface-2 hover:bg-ak-surface-3 text-ak-text-secondary hover:text-ak-text-primary transition-colors z-10"
                        title="Copy raw payload (redacted)"
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                      <pre className="rounded bg-ak-surface-2 p-4 overflow-x-auto text-xs font-mono text-ak-text-primary max-h-96 overflow-y-auto">
                        {redactSecrets(job.rawErrorPayload)}
                      </pre>
                    </div>
                    <p className="mt-2 text-xs text-ak-text-secondary">
                      ⚠️ Secrets are automatically redacted. Safe to share with support.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {includePlan && job.plan && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-ak-text-primary">Plan</h2>
          <CodeBlock data={job.plan} title="Plan Details" />
        </div>
      )}

      {includeAudit && job.audit && job.audit.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-ak-text-primary">Audit Trail</h2>
          {job.audit.map((entry, index) => (
            <div key={index} className="mb-4">
              <CodeBlock
                data={entry}
                title={`Phase: ${entry.phase} - ${new Date(entry.createdAt).toLocaleString()}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
