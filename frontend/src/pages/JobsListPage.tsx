import { useState, useEffect } from 'react';
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

  const loadJobs = async (cursor?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getJobs({
        type: filterType || undefined,
        state: filterState || undefined,
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
  };

  useEffect(() => {
    loadJobs();
  }, [filterType, filterState]);

  const handleLoadMore = () => {
    if (nextCursor) {
      loadJobs(nextCursor);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Jobs</h1>
        <div className="flex gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Types</option>
            <option value="scribe">Scribe</option>
            <option value="trace">Trace</option>
            <option value="proto">Proto</option>
          </select>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value as typeof filterState)}
            className="px-3 py-2 border border-gray-300 rounded-md"
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
        <div className="text-center py-8 text-gray-500">No jobs found</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Link to={`/jobs/${job.id}`} className="text-blue-600 hover:text-blue-800">
                      {job.id.slice(0, 8)}...
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Pill type={job.type} />
                  </TableCell>
                  <TableCell>
                    <Badge state={job.state} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
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
