import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JobDetailPage from '../JobDetailPage';
import { api } from '../../services/api';
import { I18nProvider } from '../../i18n/I18nProvider';

vi.mock('../../services/api', () => ({
  api: {
    getJob: vi.fn(),
  },
}));

vi.mock('../../hooks/useJobStream', () => ({
  useJobStream: () => ({
    currentStage: null,
    stageMessage: null,
    planSteps: [],
    traceEvents: [],
    artifactEvents: [],
    isConnected: false,
    isEnded: false,
  }),
}));

function renderJobDetail(jobId = 'test-job-1') {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={[`/dashboard/jobs/${jobId}`]}>
        <Routes>
          <Route path="/dashboard/jobs/:id" element={<JobDetailPage />} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>
  );
}

const baseJob = {
  id: 'test-job-1',
  type: 'scribe' as const,
  state: 'completed' as const,
  createdAt: '2026-01-30T10:00:00Z',
  updatedAt: '2026-01-30T10:05:00Z',
  payload: { owner: 'test-user', repo: 'test-repo', docPack: 'standard', docDepth: 'standard', outputTargets: ['README'] },
  result: null,
  error: null,
  errorCode: null,
  errorMessage: null,
  correlationId: null,
  trace: [
    { id: 't1', eventType: 'tool_call', title: 'Read file', timestamp: '2026-01-30T10:01:00Z' },
    { id: 't2', eventType: 'ai_call', title: 'Generate doc', timestamp: '2026-01-30T10:02:00Z' },
  ],
  artifacts: [
    { id: 'a1', artifactType: 'doc_read', path: 'src/index.ts', operation: 'read', createdAt: '2026-01-30T10:01:00Z' },
    { id: 'a2', artifactType: 'file_created', path: 'docs/NEXT.md', operation: 'create', createdAt: '2026-01-30T10:03:00Z' },
  ],
  ai: { summary: { totalTokens: 5000 } },
};

describe('JobDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getJob as ReturnType<typeof vi.fn>).mockResolvedValue(baseJob);
  });

  it('shows reduced section tabs: Overview, Activity, Outputs, Quality (for Scribe)', async () => {
    renderJobDetail();

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Activity')).toBeInTheDocument();
      expect(screen.getByText('Outputs')).toBeInTheDocument();
      expect(screen.getByText('Quality')).toBeInTheDocument();
    });
  });

  it('does NOT show old tab names (Timeline, Documents Read, Files Produced) as primary tabs', async () => {
    renderJobDetail();

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // These old tabs must not be present as primary navigation
    expect(screen.queryByRole('button', { name: 'Timeline' })).not.toBeInTheDocument();
    // "Documents Read" and "Files Produced" are section headers inside Outputs, not tabs
    expect(screen.queryByRole('button', { name: 'Documents Read' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Files Produced' })).not.toBeInTheDocument();
  });

  it('hides Quality tab for non-Scribe jobs', async () => {
    (api.getJob as ReturnType<typeof vi.fn>).mockResolvedValue({ ...baseJob, type: 'trace' });

    renderJobDetail();

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    expect(screen.queryByText('Quality')).not.toBeInTheDocument();
  });

  it('shows Advanced toggle containing Plan, Feedback, Audit, Raw', async () => {
    renderJobDetail();

    await waitFor(() => {
      expect(screen.getByText(/Advanced/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Advanced/));

    await waitFor(() => {
      expect(screen.getByText('Plan')).toBeInTheDocument();
      expect(screen.getByText('Feedback')).toBeInTheDocument();
      expect(screen.getByText('Audit')).toBeInTheDocument();
      expect(screen.getByText('Raw')).toBeInTheDocument();
    });
  });

  it('shows real duration from job timestamps', async () => {
    renderJobDetail();

    await waitFor(() => {
      // 5 minutes between createdAt and updatedAt
      expect(screen.getByText('5m 0s')).toBeInTheDocument();
    });
  });

  it('shows repository from payload', async () => {
    renderJobDetail();

    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });

    // The summary card should contain the repository info
    const labels = screen.getAllByText('Repository');
    expect(labels.length).toBeGreaterThan(0);
    const container = labels[0].closest('div');
    expect(container?.textContent).toContain('test-user');
    expect(container?.textContent).toContain('test-repo');
  });

  it('shows real trace and artifact counts in Overview', async () => {
    renderJobDetail();

    await waitFor(() => {
      // Trace events count and Documents read count are rendered as numbers
      const numbers = screen.getAllByText('2');
      expect(numbers.length).toBeGreaterThan(0);
    });
  });

  it('Quality section shows score computed from real data (not hardcoded)', async () => {
    renderJobDetail();

    // Wait for job to load, then click Quality tab
    await waitFor(() => {
      expect(screen.getByText('Quality')).toBeInTheDocument();
    });

    // The Quality tab button — find it by its role
    const qualityTab = screen.getAllByText('Quality').find(el => el.tagName === 'BUTTON' || el.closest('button'));
    fireEvent.click(qualityTab!.closest('button') || qualityTab!);

    await waitFor(() => {
      expect(screen.getByText('Documentation Quality')).toBeInTheDocument();
    });

    // Breakdown items from real data
    expect(screen.getByText('Target coverage')).toBeInTheDocument();
    expect(screen.getByText('Files analyzed')).toBeInTheDocument();
    expect(screen.getByText('Docs generated')).toBeInTheDocument();
    expect(screen.getByText('Analysis depth')).toBeInTheDocument();
    expect(screen.getByText('Multi-pass review')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('Quality section shows correct config values from job data', async () => {
    renderJobDetail();

    await waitFor(() => {
      expect(screen.getByText('Quality')).toBeInTheDocument();
    });

    const qualityTab = screen.getAllByText('Quality').find(el => el.tagName === 'BUTTON' || el.closest('button'));
    fireEvent.click(qualityTab!.closest('button') || qualityTab!);

    await waitFor(() => {
      expect(screen.getByText('Documentation Quality')).toBeInTheDocument();
    });

    // Config Summary section
    expect(screen.getByText('Configuration Used')).toBeInTheDocument();
    // multi-pass is "No" for standard/standard
    expect(screen.getByText('No')).toBeInTheDocument();
    // Files analyzed values present (may match multiple)
    expect(screen.getAllByText(/1 files/).length).toBeGreaterThan(0);
  });

  it('renders verification trust signals when verification gates are present', async () => {
    (api.getJob as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseJob,
      verificationGates: {
        status: 'warn',
        blocked: true,
        blockedByPolicy: true,
        rolloutMode: 'enforce_scribe',
        summary: 'Verification warnings detected',
        gates: [
          { name: 'citation', status: 'warn', score: 0.6, threshold: 0.8 },
          { name: 'groundedness', status: 'pass', score: 0.9, threshold: 0.8 },
          { name: 'freshness', status: 'warn', score: 0.5, threshold: 0.7 },
        ],
        riskProfile: 'strict',
      },
    });

    renderJobDetail();

    await waitFor(() => {
      expect(screen.getAllByText('Verification Gates').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Blocked by policy')).toBeInTheDocument();
    expect(screen.getAllByText('Citation').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Confidence').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Freshness').length).toBeGreaterThan(0);
  });
});
