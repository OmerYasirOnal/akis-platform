import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardAgentsIndexPage from '../DashboardAgentsIndexPage';

vi.mock('../../../state/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      providers: {
        github: ['999999'],
      },
    },
    startGitHubOAuth: vi.fn(),
  }),
}));

vi.mock('../../../i18n/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const runAgentMock = vi.fn();
const resetMock = vi.fn();

vi.mock('../../agents/useAgentRunner', () => ({
  useAgentRunner: () => ({
    runAgent: runAgentMock,
    reset: resetMock,
    run: {
      id: 'run-1',
      status: 'completed',
      agentType: 'scribe',
      repoFullName: 'owner/example-repo',
      branch: 'main',
      modelId: 'deepseek/deepseek-r1:free',
      plan: 'free',
      error: null,
      inputTokens: 10,
      outputTokens: 5,
      contextTokens: 10,
      costUsd: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: ['mock note'],
      job: {
        id: 'job-1',
        state: 'completed',
        result: { ok: true },
        error: null,
        updatedAt: new Date().toISOString(),
      },
    },
    logs: {
      runId: 'run-1',
      plan: {
        steps: [{ id: 'step-1', title: 'Mock step' }],
        rationale: 'mock rationale',
        createdAt: new Date().toISOString(),
      },
      audits: [
        {
          id: 'audit-1',
          phase: 'execute',
          payload: { ok: true },
          createdAt: new Date().toISOString(),
        },
      ],
    },
    error: null,
    isSubmitting: false,
    isPolling: false,
  }),
}));

const listAgentsMock = vi.fn();
const listModelsMock = vi.fn();
const getReposMock = vi.fn();
const getBranchesMock = vi.fn();

vi.mock('../../../services/api/agents', () => ({
  agentsApi: {
    listAgents: (...args: unknown[]) => listAgentsMock(...args),
    listModels: (...args: unknown[]) => listModelsMock(...args),
    getGitHubRepos: (...args: unknown[]) => getReposMock(...args),
    getGitHubBranches: (...args: unknown[]) => getBranchesMock(...args),
    runAgent: vi.fn(),
    getRunStatus: vi.fn(),
    getRunLogs: vi.fn(),
  },
}));

describe('DashboardAgentsIndexPage', () => {
  beforeEach(() => {
    listAgentsMock.mockResolvedValue([
      {
        id: 'scribe',
        name: 'Scribe',
        description: 'Docs',
        capabilities: [],
      },
      {
        id: 'trace',
        name: 'Trace',
        description: 'Tests',
        capabilities: [],
      },
    ]);

    listModelsMock.mockImplementation((plan: 'free' | 'premium' | 'all' = 'all') => {
      const catalog = [
        {
          id: 'deepseek/deepseek-r1:free',
          label: 'DeepSeek R1',
          description: 'Free reasoning',
          contextWindow: 163000,
          plan: 'free' as const,
          recommendedFor: ['scribe'] as const,
          provider: 'DeepSeek · OpenRouter',
          supportsStreaming: true,
          supportsToolUse: false,
          contextClass: 'large' as const,
          privacy: 'Prompts are not stored.',
          notes: 'Large context free model.',
        },
        {
          id: 'openai/gpt-4.1',
          label: 'GPT-4.1',
          description: 'Premium model',
          contextWindow: 128000,
          plan: 'premium' as const,
          recommendedFor: ['proto'] as const,
          provider: 'OpenAI · OpenRouter',
          supportsStreaming: true,
          supportsToolUse: true,
          contextClass: 'large' as const,
          privacy: 'Prompts may be logged for abuse monitoring.',
          notes: 'Requires premium consent.',
          requiresConsent: true,
        },
      ];

      if (plan === 'all') {
        return Promise.resolve(catalog);
      }
      return Promise.resolve(catalog.filter((model) => model.plan === plan));
    });

    getReposMock.mockResolvedValue({
      installationId: '999999',
      repositories: [
        {
          id: 1,
          name: 'repo',
          fullName: 'owner/example-repo',
          private: false,
          defaultBranch: 'main',
        },
      ],
    });

    getBranchesMock.mockResolvedValue({
      installationId: '999999',
      branches: [
        {
          name: 'main',
          commitSha: 'sha',
          protected: false,
        },
      ],
    });

    runAgentMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders model tabs and preserves premium selection', async () => {
    render(<DashboardAgentsIndexPage />);

    await waitFor(() => {
      expect(screen.getByText('DeepSeek R1')).toBeInTheDocument();
    });

    const premiumTab = screen.getByRole('button', { name: /Premium/i });
    fireEvent.click(premiumTab);

    await waitFor(() => {
      expect(screen.getByText('GPT-4.1')).toBeInTheDocument();
    });

    const premiumModelButton = screen.getByText('GPT-4.1');
    fireEvent.click(premiumModelButton);

    const freeTab = screen.getByRole('button', { name: /Önerilen \(Ücretsiz\)/i });
    fireEvent.click(freeTab);

    fireEvent.click(premiumTab);
    await waitFor(() => {
      expect(premiumModelButton).toBeInTheDocument();
    });

    expect(premiumModelButton.parentElement).toHaveClass('border-ak-primary bg-ak-primary/10');
  });

  it('renders repository and branch pickers with mocked API data', async () => {
    render(<DashboardAgentsIndexPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('owner/example-repo')).toBeInTheDocument();
    });

    const branchSelect = await screen.findByDisplayValue('main');
    expect(branchSelect).toBeInTheDocument();
  });

  it('invokes runAgent and renders logs/output when run button is clicked', async () => {
    render(<DashboardAgentsIndexPage />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Yeni özellik için özet notları/i)
      ).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Yeni özellik için özet notları/i);
    fireEvent.change(textarea, { target: { value: 'Yeni dokümantasyon girdisi' } });

    const runButton = screen.getByRole('button', { name: /Agent’ı çalıştır/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(runAgentMock).toHaveBeenCalled();
    });

    expect(runAgentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        agentType: 'scribe',
        tokenEstimate: expect.any(Number),
      })
    );

    expect(screen.getByText('agents.status.result')).toBeInTheDocument();
    expect(screen.getByText('agents.status.notes')).toBeInTheDocument();
  });
});

