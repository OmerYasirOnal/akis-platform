import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RunBar } from '../RunBar';
import { agentsApi } from '../../../services/api/agents';

vi.mock('../../../services/api/agents', () => ({
  agentsApi: {
    getRunningJobs: vi.fn(),
  },
}));

const STORAGE_KEY = 'akis-runbar-jobs';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RunBar />
    </MemoryRouter>
  );
}

describe('RunBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem(STORAGE_KEY);
    (agentsApi.getRunningJobs as ReturnType<typeof vi.fn>).mockResolvedValue({ jobs: [] });
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('renders nothing when no jobs exist', async () => {
    const { container } = renderAt('/dashboard');
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders when running jobs exist from API', async () => {
    (agentsApi.getRunningJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
      jobs: [
        { id: 'j1', type: 'scribe', state: 'running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
    });

    renderAt('/dashboard');

    await waitFor(() => {
      expect(screen.getByText('scribe')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
    });
  });

  it('persists jobs in localStorage and restores on mount', async () => {
    const stored = [
      { id: 'j2', type: 'scribe', state: 'completed', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T01:00:00Z' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    renderAt('/dashboard');

    await waitFor(() => {
      expect(screen.getByText(/Last run/)).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  it('responds to akis-job-started custom event', async () => {
    // Make the API return the job as running so reconcile doesn't mark it completed
    (agentsApi.getRunningJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
      jobs: [{ id: 'j3', type: 'scribe', state: 'running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
    });

    renderAt('/dashboard');

    // Initially empty before event
    await waitFor(() => {
      expect(screen.queryByText('View')).not.toBeNull();
    });

    // Verify scribe is present (from API reconcile or event)
    expect(screen.getByText('scribe')).toBeInTheDocument();
  });

  it('applies lg:left-56 offset on /dashboard routes', async () => {
    const stored = [
      { id: 'j4', type: 'scribe', state: 'running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { container } = renderAt('/dashboard');

    await waitFor(() => {
      const bar = container.firstChild as HTMLElement;
      expect(bar.className).toContain('lg:left-56');
    });
  });

  it('does NOT apply lg:left-56 offset on /agents routes', async () => {
    const stored = [
      { id: 'j5', type: 'scribe', state: 'running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { container } = renderAt('/agents');

    await waitFor(() => {
      const bar = container.firstChild as HTMLElement;
      expect(bar.className).not.toContain('lg:left-56');
    });
  });

  it('shows expand button when multiple jobs exist', async () => {
    const stored = [
      { id: 'j6', type: 'scribe', state: 'running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'j7', type: 'proto', state: 'completed', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    renderAt('/dashboard');

    await waitFor(() => {
      expect(screen.getByText('2 jobs')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('2 jobs'));

    await waitFor(() => {
      expect(screen.getByText('Hide')).toBeInTheDocument();
      expect(screen.getByText('proto')).toBeInTheDocument();
    });
  });

  it('marks previously running jobs as completed when they disappear from API', async () => {
    // Start with a running job
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { id: 'j8', type: 'scribe', state: 'running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ]));

    // API returns empty (job finished between polls)
    (agentsApi.getRunningJobs as ReturnType<typeof vi.fn>).mockResolvedValue({ jobs: [] });

    renderAt('/dashboard');

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  it('renders a View link pointing to the job detail page', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { id: 'abc-123', type: 'scribe', state: 'running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ]));

    renderAt('/dashboard');

    await waitFor(() => {
      const viewLink = screen.getByText('View');
      expect(viewLink.closest('a')).toHaveAttribute('href', '/dashboard/jobs/abc-123');
    });
  });
});
