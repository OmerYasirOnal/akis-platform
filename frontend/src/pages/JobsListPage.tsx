import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Job } from '../services/api';
import Card from '../components/common/Card';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Pill } from '../components/ui/Pill';
import { Pagination } from '../components/ui/Pagination';
import { ErrorToast } from '../components/ui/ErrorToast';
import { useI18n } from '../i18n/useI18n';

// Icons
const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const EmptyIcon = () => (
  <svg className="h-16 w-16 mx-auto text-ak-text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const JOBS_ERROR_DETAIL_VISIBILITY_STORAGE_KEY = 'akis:jobs-list:show-error-details:v1';
const JOBS_SCOPE_VISIBILITY_STORAGE_KEY = 'akis:jobs-list:show-scope-details:v1';

function redactJobText(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/gh[pousr]_[A-Za-z0-9_]{8,}/g, '[REDACTED_TOKEN]')
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]{8,}/gi, 'Bearer [REDACTED]')
    .replace(/([A-Za-z0-9._%+-]{2})[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, '$1***$2')
    .replace(/(token|secret|password|api[_-]?key)\s*[:=]\s*(['"]?)[^\s'",]+(\2)/gi, '$1=[REDACTED]');
}

function maskHandle(value?: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 2) return `${trimmed[0] ?? '*'}*`;
  return `${trimmed.slice(0, 2)}***`;
}

function getPayloadField(payload: unknown, keys: string[]): string | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined;
  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function resolveScopeLabel(job: Job, showScopeDetails: boolean, hiddenLabel: string): string {
  const owner = getPayloadField(job.payload, ['owner', 'repositoryOwner', 'repoOwner', 'organization']);
  const repo = getPayloadField(job.payload, ['repo', 'repositoryName', 'repository']);
  const targetBaseUrl = getPayloadField(job.payload, ['targetBaseUrl', 'baseUrl', 'url']);
  let host: string | null = null;
  if (targetBaseUrl) {
    try {
      host = new URL(targetBaseUrl).host || null;
    } catch {
      host = null;
    }
  }

  if (!showScopeDetails && (owner || repo || host)) return hiddenLabel;
  if (owner && repo) return `${maskHandle(owner)}/${repo}`;
  if (repo) return repo;
  if (host) return host;
  return '—';
}

function formatDurationCompact(createdAt: string, updatedAt: string): string {
  const start = new Date(createdAt).getTime();
  const end = new Date(updatedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—';
  const diffMs = end - start;
  if (diffMs < 1_000) return `${diffMs}ms`;
  const totalSec = Math.round(diffMs / 1_000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min < 60) return `${min}m ${sec}s`;
  const hrs = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hrs}h ${remMin}m`;
}

function safeLoadErrorDetailVisibility(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(JOBS_ERROR_DETAIL_VISIBILITY_STORAGE_KEY);
    if (raw === null) return false;
    return raw === '1';
  } catch {
    return false;
  }
}

function safeSaveErrorDetailVisibility(value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(JOBS_ERROR_DETAIL_VISIBILITY_STORAGE_KEY, value ? '1' : '0');
  } catch {
    // ignore quota/storage errors
  }
}

function safeLoadScopeVisibility(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(JOBS_SCOPE_VISIBILITY_STORAGE_KEY);
    if (raw === null) return false;
    return raw === '1';
  } catch {
    return false;
  }
}

function safeSaveScopeVisibility(value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(JOBS_SCOPE_VISIBILITY_STORAGE_KEY, value ? '1' : '0');
  } catch {
    // ignore quota/storage errors
  }
}

export default function JobsListPage() {
  const { t } = useI18n();
  const tx = useCallback((key: string) => t(key as never), [t]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string; requestId?: string } | null>(null);
  const [filterType, setFilterType] = useState<'scribe' | 'trace' | 'proto' | ''>('');
  const [filterState, setFilterState] = useState<'pending' | 'running' | 'completed' | 'failed' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(() => safeLoadErrorDetailVisibility());
  const [showScopeDetails, setShowScopeDetails] = useState<boolean>(() => safeLoadScopeVisibility());

  // Use refs for filters to avoid closure issues
  const filterTypeRef = useRef(filterType);
  const filterStateRef = useRef(filterState);
  filterTypeRef.current = filterType;
  filterStateRef.current = filterState;

  const loadJobs = useCallback(async (cursor?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getJobs({
        type: filterTypeRef.current || undefined,
        state: filterStateRef.current || undefined,
        limit: 20,
        cursor,
      });
      if (cursor) {
        setJobs((prev) => [...prev, ...response.items]);
      } else {
        setJobs(response.items);
      }
      setNextCursor(response.nextCursor);
    } catch (err: unknown) {
      const apiError = err as { message?: string; code?: string; requestId?: string };
      setError({
        message: apiError.message || 'Failed to load jobs',
        code: apiError.code,
        requestId: apiError.requestId,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs, filterType, filterState]);

  useEffect(() => {
    safeSaveErrorDetailVisibility(showErrorDetails);
  }, [showErrorDetails]);

  useEffect(() => {
    safeSaveScopeVisibility(showScopeDetails);
  }, [showScopeDetails]);

  const handleLoadMore = useCallback(() => {
    if (nextCursor) {
      loadJobs(nextCursor);
    }
  }, [nextCursor, loadJobs]);

  const handleRefresh = () => {
    loadJobs();
  };

  const toggleStateFilter = useCallback((state: typeof filterState) => {
    setFilterState((prev) => (prev === state ? '' : state));
  }, []);

  // Filter jobs by search query (client-side)
  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.id.toLowerCase().includes(query) ||
      job.type.toLowerCase().includes(query) ||
      job.state.toLowerCase().includes(query) ||
      job.errorMessage?.toLowerCase().includes(query) ||
      job.errorCode?.toLowerCase().includes(query)
    );
  });

  const stateSummary = useMemo(() => {
    const summary = { total: filteredJobs.length, pending: 0, running: 0, completed: 0, failed: 0 };
    for (const job of filteredJobs) {
      if (job.state in summary) {
        summary[job.state as 'pending' | 'running' | 'completed' | 'failed'] += 1;
      }
    }
    return summary;
  }, [filteredJobs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ak-text-primary">Jobs</h1>
          <p className="text-sm text-ak-text-secondary mt-1">
            View and manage your agent job history
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-ak-surface-2 px-4 py-2 text-sm font-medium text-ak-text-primary transition-colors hover:bg-ak-surface disabled:opacity-50"
        >
          <RefreshIcon />
          Refresh
        </button>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={() => setShowScopeDetails((prev) => !prev)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            showScopeDetails
              ? 'border-ak-primary/40 bg-ak-primary/10 text-ak-primary'
              : 'border-ak-border bg-ak-surface text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary'
          }`}
          aria-pressed={showScopeDetails}
        >
          {showScopeDetails ? tx('jobs.scope.hide') : tx('jobs.scope.show')}
        </button>
        <button
          onClick={() => setShowErrorDetails((prev) => !prev)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            showErrorDetails
              ? 'border-ak-primary/40 bg-ak-primary/10 text-ak-primary'
              : 'border-ak-border bg-ak-surface text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary'
          }`}
          aria-pressed={showErrorDetails}
        >
          {showErrorDetails ? 'Hide error details' : 'Show error details'}
        </button>
      </div>

      {/* Filters Card */}
      <Card className="bg-ak-surface p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-ak-border bg-ak-bg py-2 pl-10 pr-4 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary"
              />
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ak-text-secondary">
                <SearchIcon />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="rounded-lg border border-ak-border bg-ak-bg px-4 py-2 text-sm text-ak-text-primary focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary"
            >
              <option value="">All Types</option>
              <option value="scribe">Scribe</option>
              <option value="trace">Trace</option>
              <option value="proto">Proto</option>
            </select>

            {/* State Filter */}
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value as typeof filterState)}
              className="rounded-lg border border-ak-border bg-ak-bg px-4 py-2 text-sm text-ak-text-primary focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary"
            >
              <option value="">All States</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterState('')}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filterState === ''
                  ? 'border-ak-primary/40 bg-ak-primary/10 text-ak-primary'
                  : 'border-ak-border bg-ak-bg text-ak-text-secondary hover:bg-ak-surface-2'
              }`}
              aria-pressed={filterState === ''}
            >
              All ({stateSummary.total})
            </button>
            <button
              onClick={() => toggleStateFilter('running')}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filterState === 'running'
                  ? 'border-blue-400/40 bg-blue-500/10 text-blue-300'
                  : 'border-ak-border bg-ak-bg text-ak-text-secondary hover:bg-ak-surface-2'
              }`}
              aria-pressed={filterState === 'running'}
            >
              Running ({stateSummary.running})
            </button>
            <button
              onClick={() => toggleStateFilter('pending')}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filterState === 'pending'
                  ? 'border-amber-400/40 bg-amber-500/10 text-amber-300'
                  : 'border-ak-border bg-ak-bg text-ak-text-secondary hover:bg-ak-surface-2'
              }`}
              aria-pressed={filterState === 'pending'}
            >
              Pending ({stateSummary.pending})
            </button>
            <button
              onClick={() => toggleStateFilter('completed')}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filterState === 'completed'
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-ak-border bg-ak-bg text-ak-text-secondary hover:bg-ak-surface-2'
              }`}
              aria-pressed={filterState === 'completed'}
            >
              Completed ({stateSummary.completed})
            </button>
            <button
              onClick={() => toggleStateFilter('failed')}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filterState === 'failed'
                  ? 'border-red-400/40 bg-red-500/10 text-red-300'
                  : 'border-ak-border bg-ak-bg text-ak-text-secondary hover:bg-ak-surface-2'
              }`}
              aria-pressed={filterState === 'failed'}
            >
              Failed ({stateSummary.failed})
            </button>
          </div>
        </div>
      </Card>

      {error && <ErrorToast error={error} onClose={() => setError(null)} />}

      {filteredJobs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Card className="bg-ak-surface p-3">
            <p className="text-[11px] uppercase tracking-wide text-ak-text-secondary">Total</p>
            <p className="mt-1 text-lg font-semibold text-ak-text-primary">{stateSummary.total}</p>
          </Card>
          <Card className="bg-ak-surface p-3">
            <p className="text-[11px] uppercase tracking-wide text-ak-text-secondary">Pending</p>
            <p className="mt-1 text-lg font-semibold text-amber-300">{stateSummary.pending}</p>
          </Card>
          <Card className="bg-ak-surface p-3">
            <p className="text-[11px] uppercase tracking-wide text-ak-text-secondary">Running</p>
            <p className="mt-1 text-lg font-semibold text-blue-300">{stateSummary.running}</p>
          </Card>
          <Card className="bg-ak-surface p-3">
            <p className="text-[11px] uppercase tracking-wide text-ak-text-secondary">Completed</p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">{stateSummary.completed}</p>
          </Card>
          <Card className="bg-ak-surface p-3">
            <p className="text-[11px] uppercase tracking-wide text-ak-text-secondary">Failed</p>
            <p className="mt-1 text-lg font-semibold text-red-300">{stateSummary.failed}</p>
          </Card>
        </div>
      )}

      {/* Jobs Table */}
      <Card className="bg-ak-surface overflow-hidden">
        {isLoading && jobs.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
              <p className="text-sm text-ak-text-secondary">Loading jobs...</p>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <EmptyIcon />
            <h3 className="mt-4 text-lg font-medium text-ak-text-primary">No jobs found</h3>
            <p className="mt-1 text-sm text-ak-text-secondary">
              {searchQuery || filterType || filterState
                ? 'Try adjusting your filters'
                : 'Run an agent to create your first job'}
            </p>
            {!searchQuery && !filterType && !filterState && (
              <Link
                to="/agents"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-ak-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ak-primary/90"
              >
                Go to Agents
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id} className="group hover:bg-ak-surface-2 transition-colors">
                      <TableCell>
                        <Link 
                          to={`/dashboard/jobs/${job.id}`} 
                          className="font-mono text-sm text-ak-primary hover:text-ak-text-primary transition-colors"
                        >
                          {job.id.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Pill type={job.type} />
                      </TableCell>
                      <TableCell className="text-sm text-ak-text-secondary">
                        <span className="inline-flex max-w-[16rem] truncate rounded border border-ak-border bg-ak-bg px-2 py-0.5 font-mono text-[11px] text-ak-text-secondary">
                          {resolveScopeLabel(job, showScopeDetails, tx('jobs.scope.hidden'))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge state={job.state} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {job.state === 'failed' && (job.errorCode || job.errorMessage) ? (
                          <div className="max-w-xs">
                            {job.errorCode && (
                              <span className="inline-block rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-400">
                                {job.errorCode}
                              </span>
                            )}
                            {job.errorMessage && showErrorDetails && (
                              <p className="mt-1 truncate text-xs text-ak-text-secondary" title={redactJobText(job.errorMessage)}>
                                {redactJobText(job.errorMessage)}
                              </p>
                            )}
                            {job.errorMessage && !showErrorDetails && (
                              <p className="mt-1 text-xs text-ak-text-secondary/70">Details hidden for privacy</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-ak-text-secondary">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-ak-text-secondary">
                        {new Date(job.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-ak-text-secondary">
                        {new Date(job.updatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-ak-text-secondary">
                        {formatDurationCompact(job.createdAt, job.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination nextCursor={nextCursor} onNext={handleLoadMore} isLoading={isLoading} />
          </>
        )}
      </Card>

      {/* Stats Footer */}
      {filteredJobs.length > 0 && (
        <div className="flex items-center justify-between text-xs text-ak-text-secondary">
          <span>
            Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
            {searchQuery && ` matching "${redactJobText(searchQuery)}"`}
          </span>
          {nextCursor && (
            <span>More jobs available</span>
          )}
        </div>
      )}
    </div>
  );
}
