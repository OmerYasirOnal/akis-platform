import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JobsListPage from '../JobsListPage';
import { api } from '../../services/api';
import { I18nProvider } from '../../i18n/I18nProvider';

vi.mock('../../services/api', () => ({
  api: {
    getJobs: vi.fn(),
  },
}));

describe('JobsListPage', () => {
  const renderJobsList = () =>
    render(
      <I18nProvider>
        <BrowserRouter>
          <JobsListPage />
        </BrowserRouter>
      </I18nProvider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('should render loading state initially', () => {
    (api.getJobs as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderJobsList();

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should render jobs list', async () => {
    const mockJobs = [
      {
        id: '1',
        type: 'scribe' as const,
        state: 'completed' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    (api.getJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: mockJobs,
      nextCursor: null,
    });

    renderJobsList();

    await waitFor(() => {
      expect(screen.getByText(/scribe/i)).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    (api.getJobs as ReturnType<typeof vi.fn>).mockRejectedValue({
      message: 'Failed to load jobs',
      code: 'FETCH_ERROR',
    });

    renderJobsList();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load jobs/i)).toBeInTheDocument();
    });
  });

  it('redacts sensitive error tokens in job rows', async () => {
    (api.getJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        {
          id: 'job-sensitive',
          type: 'trace',
          state: 'failed',
          createdAt: '2026-02-16T10:00:00Z',
          updatedAt: '2026-02-16T10:00:05Z',
          errorCode: 'MCP_UNAUTHORIZED',
          errorMessage: 'Bearer ghp_1234567890SUPERSECRET',
        },
      ],
      nextCursor: null,
    });

    renderJobsList();

    await waitFor(() => {
      expect(screen.getByText(/MCP_UNAUTHORIZED/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Details hidden for privacy/i)).toBeInTheDocument();
    expect(screen.queryByText(/Bearer \[REDACTED/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ghp_1234567890SUPERSECRET/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show error details/i }));

    await waitFor(() => {
      expect(screen.getByText(/Bearer \[REDACTED/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/ghp_1234567890SUPERSECRET/i)).not.toBeInTheDocument();
  });

  it('applies quick running filter chip and requests server-side running filter', async () => {
    (api.getJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        {
          id: 'running-job-1234',
          type: 'trace',
          state: 'running',
          createdAt: '2026-02-16T10:00:00Z',
          updatedAt: '2026-02-16T10:00:30Z',
        },
        {
          id: 'completed-job-5678',
          type: 'scribe',
          state: 'completed',
          createdAt: '2026-02-16T09:00:00Z',
          updatedAt: '2026-02-16T09:00:20Z',
        },
      ],
      nextCursor: null,
    });

    renderJobsList();

    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(3);
    });

    fireEvent.click(screen.getByRole('button', { name: /Running \(1\)/i }));

    await waitFor(() => {
      const calls = (api.getJobs as ReturnType<typeof vi.fn>).mock.calls;
      const lastArgs = calls[calls.length - 1]?.[0] as Record<string, unknown> | undefined;
      expect(lastArgs?.state).toBe('running');
    });
  });

  it('keeps scope hidden by default and reveals masked scope on demand', async () => {
    (api.getJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        {
          id: 'job-scope-123',
          type: 'scribe',
          state: 'completed',
          createdAt: '2026-02-16T11:00:00Z',
          updatedAt: '2026-02-16T11:00:03Z',
          payload: {
            owner: 'sensitive-owner',
            repo: 'akis-private-repo',
          },
        },
      ],
      nextCursor: null,
    });

    renderJobsList();

    await waitFor(() => {
      expect(screen.getByText('Scope')).toBeInTheDocument();
    });

    expect(screen.getByText(/Scope hidden for privacy/i)).toBeInTheDocument();
    expect(screen.queryByText(/se\*\*\*\/akis-private-repo/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show scope details/i }));

    expect(screen.getByText(/se\*\*\*\/akis-private-repo/i)).toBeInTheDocument();
    expect(screen.queryByText(/sensitive-owner\/akis-private-repo/i)).not.toBeInTheDocument();
  });
});
