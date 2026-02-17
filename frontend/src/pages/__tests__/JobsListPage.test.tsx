import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JobsListPage from '../JobsListPage';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    getJobs: vi.fn(),
  },
}));

describe('JobsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (api.getJobs as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <JobsListPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('jobs-loading-skeleton')).toBeInTheDocument();
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

    render(
      <BrowserRouter>
        <JobsListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/scribe/i)).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    (api.getJobs as ReturnType<typeof vi.fn>).mockRejectedValue({
      message: 'Failed to load jobs',
      code: 'FETCH_ERROR',
    });

    render(
      <BrowserRouter>
        <JobsListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load jobs/i)).toBeInTheDocument();
    });
  });
});
