import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Job } from '../services/api';
import { Badge } from '../components/ui/Badge';
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

  if (isLoading && !job) {
    return <div className={`${containerClass} py-12 text-center`}>Loading...</div>;
  }

  if (error && !job) {
    return (
      <>
        <ErrorToast error={error} onClose={() => setError(null)} />
        <div className={`${containerClass} py-12 text-center`}>
          <p className="text-ak-danger">{error.message}</p>
          <Link to="/jobs" className="text-ak-primary hover:text-ak-text-primary mt-4 inline-block">
            ← Back to Jobs
          </Link>
        </div>
      </>
    );
  }

  if (!job) {
    return <div className={`${containerClass} py-12 text-center`}>Job not found</div>;
  }

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
              <Badge state={job.state} />
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
