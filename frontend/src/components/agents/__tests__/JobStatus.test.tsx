import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { JobStatus } from '../JobStatus';
import type { JobDetail } from '../../../services/api/agents';

// Mock i18n — passthrough
vi.mock('../../../i18n/useI18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

function makeJob(overrides: Partial<JobDetail> = {}): JobDetail {
  return {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    type: 'scribe',
    state: 'running',
    createdAt: new Date(Date.now() - 5000).toISOString(),
    updatedAt: new Date().toISOString(),
    payload: {},
    result: null,
    error: null,
    errorCode: null,
    errorMessage: null,
    trace: [],
    correlationId: 'corr-1',
    aiProvider: 'openai',
    aiModel: 'gpt-4o-mini',
    mcpGatewayUrl: null,
    ...overrides,
  } as JobDetail;
}

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('JobStatus', () => {
  it('renders empty state when job is null', () => {
    render(<JobStatus job={null} isPolling={false} />, { wrapper: Wrapper });
    expect(screen.getByText('agents.status.empty')).toBeInTheDocument();
  });

  it('renders state badge for running job', () => {
    render(<JobStatus job={makeJob()} isPolling={false} />, { wrapper: Wrapper });
    expect(screen.getByText('agents.status.state.running')).toBeInTheDocument();
  });

  it('shows polling indicator when isPolling is true', () => {
    render(<JobStatus job={makeJob()} isPolling={true} />, { wrapper: Wrapper });
    expect(screen.getByText('agents.status.polling')).toBeInTheDocument();
  });

  it('hides polling indicator when isPolling is false', () => {
    render(<JobStatus job={makeJob()} isPolling={false} />, { wrapper: Wrapper });
    expect(screen.queryByText('agents.status.polling')).toBeNull();
  });

  it('displays job metadata: Started, Duration, Type', () => {
    render(<JobStatus job={makeJob()} isPolling={false} />, { wrapper: Wrapper });
    expect(screen.getByText('Started')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('scribe')).toBeInTheDocument();
  });

  it('shows truncated job id', () => {
    render(<JobStatus job={makeJob()} isPolling={false} />, { wrapper: Wrapper });
    expect(screen.getByText('aaaaaaaa...')).toBeInTheDocument();
  });

  it('shows elapsed time for non-final jobs', () => {
    render(<JobStatus job={makeJob()} isPolling={false} />, { wrapper: Wrapper });
    // Should show something like "5.0s elapsed"
    expect(screen.getByText(/elapsed/)).toBeInTheDocument();
  });

  it('does not show elapsed marker for completed jobs', () => {
    const job = makeJob({ state: 'completed' });
    render(<JobStatus job={job} isPolling={false} />, { wrapper: Wrapper });
    expect(screen.queryByText(/elapsed$/)).toBeNull();
  });

  it('shows error section for failed job with errorMessage', () => {
    const job = makeJob({
      state: 'failed',
      errorCode: 'AI_KEY_MISSING',
      errorMessage: 'API key not configured',
    });
    render(<JobStatus job={job} isPolling={false} />, { wrapper: Wrapper });
    expect(screen.getByText('AI_KEY_MISSING')).toBeInTheDocument();
    expect(screen.getByText('API key not configured')).toBeInTheDocument();
  });

  it('shows error hint with action link for AI_KEY_MISSING', () => {
    const job = makeJob({
      state: 'failed',
      errorCode: 'AI_KEY_MISSING',
      errorMessage: 'Missing key',
    });
    render(<JobStatus job={job} isPolling={false} />, { wrapper: Wrapper });
    expect(screen.getByText(/AI API key is missing/)).toBeInTheDocument();
    const link = screen.getByText('Go to Settings →');
    expect(link).toHaveAttribute('href', '/dashboard/settings/ai-keys');
  });

  it('shows "Open Job Details" link for final state', () => {
    const job = makeJob({ state: 'completed' });
    render(<JobStatus job={job} isPolling={false} />, { wrapper: Wrapper });
    const link = screen.getByText('Open Job Details');
    expect(link).toHaveAttribute('href', `/dashboard/jobs/${job.id}`);
  });

  it('shows "Copy Summary" button for final state', () => {
    const job = makeJob({ state: 'failed' });
    render(<JobStatus job={job} isPolling={false} />, { wrapper: Wrapper });
    expect(screen.getByText('Copy Summary')).toBeInTheDocument();
  });

  it('does not show final buttons for running jobs', () => {
    render(<JobStatus job={makeJob()} isPolling={false} />, { wrapper: Wrapper });
    expect(screen.queryByText('Open Job Details')).toBeNull();
    expect(screen.queryByText('Copy Summary')).toBeNull();
  });

  it('toggles result details on Show/Hide click', () => {
    const job = makeJob({ state: 'completed', result: { output: 'test' } });
    render(<JobStatus job={job} isPolling={false} />, { wrapper: Wrapper });

    // Initially details hidden
    expect(screen.queryByText(/"output"/)).toBeNull();

    // Click Show details
    fireEvent.click(screen.getByText('Show details'));
    expect(screen.getByText(/"output"/)).toBeInTheDocument();

    // Click Hide details
    fireEvent.click(screen.getByText('Hide details'));
    expect(screen.queryByText(/"output"/)).toBeNull();
  });
});
