import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Job } from '../services/api';
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

export default function JobsListPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string; requestId?: string } | null>(
    null
  );
  const [filterType, setFilterType] = useState<'scribe' | 'trace' | 'proto' | ''>('');
  const [filterState, setFilterState] = useState<
    'pending' | 'running' | 'completed' | 'failed' | ''
  >('');

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

  const handleLoadMore = useCallback(() => {
    if (nextCursor) {
      loadJobs(nextCursor);
    }
  }, [nextCursor, loadJobs]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ak-text-primary mb-4">Jobs</h1>
        <div className="flex gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-3 py-2 bg-ak-surface border border-ak-border text-ak-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg"
          >
            <option value="">All Types</option>
            <option value="scribe">Scribe</option>
            <option value="trace">Trace</option>
            <option value="proto">Proto</option>
          </select>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value as typeof filterState)}
            className="px-3 py-2 bg-ak-surface border border-ak-border text-ak-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg"
          >
            <option value="">All States</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {error && <ErrorToast error={error} onClose={() => setError(null)} />}

      {isLoading && jobs.length === 0 ? (
        <div className="text-center py-8">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-8 text-ak-text-secondary">No jobs found</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-ak-surface">
                  <TableCell>
                    <Link to={`/dashboard/jobs/${job.id}`} className="text-ak-primary hover:text-ak-text-primary transition-colors">
                      {job.id.slice(0, 8)}...
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Pill type={job.type} />
                  </TableCell>
                  <TableCell>
                    <Badge state={job.state} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {job.state === 'failed' && (job.errorCode || job.errorMessage) ? (
                      <div className="max-w-xs">
                        {job.errorCode && (
                          <span className="inline-block rounded bg-ak-danger/20 px-1.5 py-0.5 text-xs font-medium text-ak-danger">
                            {job.errorCode}
                          </span>
                        )}
                        {job.errorMessage && (
                          <p className="mt-1 truncate text-xs text-ak-text-secondary" title={job.errorMessage}>
                            {job.errorMessage}
                          </p>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination nextCursor={nextCursor} onNext={handleLoadMore} isLoading={isLoading} />
        </>
      )}
    </div>
  );
}
