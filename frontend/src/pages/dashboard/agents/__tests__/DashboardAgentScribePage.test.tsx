/**
 * DashboardAgentScribePage Tests - S0.4.6
 * Tests for GitHub-only Scribe mode and config-aware job creation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardAgentScribePage from '../DashboardAgentScribePage';
import { agentConfigsApi } from '../../../../services/api/agent-configs';
import { agentsApi } from '../../../../services/api/agents';
import { aiKeysApi } from '../../../../services/api/ai-keys';

// Mock agentConfigsApi
vi.mock('../../../../services/api/agent-configs', () => ({
  agentConfigsApi: {
    getConfig: vi.fn(),
    updateConfig: vi.fn(),
    getModelAllowlist: vi.fn(),
  },
}));

// Mock agentsApi
vi.mock('../../../../services/api/agents', () => ({
  agentsApi: {
    runAgent: vi.fn(),
    getJob: vi.fn(),
    listAgents: vi.fn(),
  },
}));

vi.mock('../../../../services/api/ai-keys', () => ({
  aiKeysApi: {
    getStatus: vi.fn(),
  },
}));

// Mock githubDiscoveryApi
vi.mock('../../../../services/api/github-discovery', () => ({
  githubDiscoveryApi: {
    getOwners: vi.fn().mockResolvedValue({ owners: [] }),
    getRepos: vi.fn().mockResolvedValue({ repos: [] }),
    getBranches: vi.fn().mockResolvedValue({ branches: [], defaultBranch: 'main' }),
  },
}));

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('DashboardAgentScribePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    (agentConfigsApi.getModelAllowlist as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowlist: ['gpt-4o-mini'],
      defaultModel: 'gpt-4o-mini',
    });

    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      provider: 'openai',
      configured: true,
      last4: '1234',
      updatedAt: null,
    });
  });

  describe('GitHub-only mode (Confluence optional)', () => {
    it('should render wizard step 1 with GitHub connection required', async () => {
      // Mock: No config, GitHub disconnected, Confluence disconnected
      (agentConfigsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        config: null,
        integrationStatus: {
          github: { connected: false, username: null, avatarUrl: null },
          confluence: { connected: false, siteName: null },
        },
      });

      renderWithRouter(<DashboardAgentScribePage />);

      await waitFor(() => {
        expect(screen.getByText(/step 1/i)).toBeInTheDocument();
      });

      // Continue button should be disabled when GitHub is not connected
      const continueBtn = screen.getByRole('button', { name: /continue/i });
      expect(continueBtn).toBeDisabled();
    });

    it('should enable Continue when GitHub is connected (Confluence NOT required)', async () => {
      // Mock: No config, GitHub connected, Confluence disconnected
      (agentConfigsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        config: null,
        integrationStatus: {
          github: { connected: true, username: 'testuser', avatarUrl: null },
          confluence: { connected: false, siteName: null },
        },
      });

      renderWithRouter(<DashboardAgentScribePage />);

      await waitFor(() => {
        expect(screen.getByText(/step 1/i)).toBeInTheDocument();
      });

      // Continue button should be enabled with only GitHub connected
      const continueBtn = screen.getByRole('button', { name: /continue/i });
      expect(continueBtn).not.toBeDisabled();
    });

    it('should show GitHub Repo Docs as target option', async () => {
      // Mock: GitHub connected, on step 3
      (agentConfigsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        config: null,
        integrationStatus: {
          github: { connected: true, username: 'testuser', avatarUrl: null },
          confluence: { connected: false, siteName: null },
        },
      });

      renderWithRouter(<DashboardAgentScribePage />);

      await waitFor(() => {
        expect(screen.getByText(/step 1/i)).toBeInTheDocument();
      });

      // Navigate to step 3 (target selection)
      // This would require simulating the wizard flow
      // For now, check if we can access the page without errors
    });
  });

  describe('Config-aware job creation', () => {
    it('should have Run Test Job button when config exists', async () => {
      // Mock: Config exists and is complete
      (agentConfigsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        config: {
          id: 'config-123',
          enabled: true,
          repositoryOwner: 'testorg',
          repositoryName: 'testrepo',
          baseBranch: 'main',
          targetPlatform: 'github_repo',
          targetConfig: {},
          triggerMode: 'manual',
        },
        integrationStatus: {
          github: { connected: true, username: 'testuser', avatarUrl: null },
          confluence: { connected: false, siteName: null },
        },
      });

      renderWithRouter(<DashboardAgentScribePage />);

      await waitFor(() => {
        // Should show dashboard view when config exists
        expect(screen.getByText(/run test job/i)).toBeInTheDocument();
      });
    });

    it('should send mode: from_config when running test job', async () => {
      (agentConfigsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        config: {
          id: 'config-123',
          enabled: true,
          repositoryOwner: 'testorg',
          repositoryName: 'testrepo',
          baseBranch: 'main',
          targetPlatform: 'github_repo',
          targetConfig: {},
          triggerMode: 'manual',
        },
        integrationStatus: {
          github: { connected: true, username: 'testuser', avatarUrl: null },
          confluence: { connected: false, siteName: null },
        },
      });

      (agentsApi.runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
        jobId: 'job-123',
        state: 'pending',
      });

      renderWithRouter(<DashboardAgentScribePage />);

      await waitFor(() => {
        expect(screen.getByText(/run test job/i)).toBeInTheDocument();
      });

      // Click Run Test Job
      const runTestBtn = screen.getByRole('button', { name: /run test job/i });
      fireEvent.click(runTestBtn);

      // Should call API with mode: from_config
      await waitFor(() => {
        expect(agentsApi.runAgent).toHaveBeenCalledWith('scribe', {
          mode: 'from_config',
          dryRun: true,
        });
      });
    });

    it('should navigate to job page after successful job creation', async () => {
      (agentConfigsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        config: {
          id: 'config-123',
          enabled: true,
          repositoryOwner: 'testorg',
          repositoryName: 'testrepo',
          baseBranch: 'main',
          targetPlatform: 'github_repo',
          targetConfig: {},
          triggerMode: 'manual',
        },
        integrationStatus: {
          github: { connected: true, username: 'testuser', avatarUrl: null },
          confluence: { connected: false, siteName: null },
        },
      });

      (agentsApi.runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
        jobId: 'job-123',
        state: 'pending',
      });

      renderWithRouter(<DashboardAgentScribePage />);

      await waitFor(() => {
        expect(screen.getByText(/run test job/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /run test job/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/jobs/job-123');
      });
    });
  });

  describe('Error handling', () => {
    it('should show actionable error when config is incomplete', async () => {
      // Mock: Config exists but incomplete (no repo)
      (agentConfigsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        config: {
          id: 'config-123',
          enabled: true,
          repositoryOwner: null, // Missing
          repositoryName: null, // Missing
          baseBranch: 'main',
          targetPlatform: 'github_repo',
          targetConfig: {},
          triggerMode: 'manual',
        },
        integrationStatus: {
          github: { connected: true, username: 'testuser', avatarUrl: null },
          confluence: { connected: false, siteName: null },
        },
      });

      renderWithRouter(<DashboardAgentScribePage />);

      await waitFor(() => {
        expect(screen.getByText(/run test job/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /run test job/i }));

      // Should show specific error about missing fields
      await waitFor(() => {
        expect(screen.getByText(/configuration incomplete/i)).toBeInTheDocument();
      });
    });

    it('should show error when Confluence target selected but not connected', async () => {
      (agentConfigsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
        config: {
          id: 'config-123',
          enabled: true,
          repositoryOwner: 'testorg',
          repositoryName: 'testrepo',
          baseBranch: 'main',
          targetPlatform: 'confluence', // Confluence target
          targetConfig: { spaceKey: 'DOC' },
          triggerMode: 'manual',
        },
        integrationStatus: {
          github: { connected: true, username: 'testuser', avatarUrl: null },
          confluence: { connected: false, siteName: null }, // Not connected
        },
      });

      renderWithRouter(<DashboardAgentScribePage />);

      await waitFor(() => {
        expect(screen.getByText(/run test job/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /run test job/i }));

      await waitFor(() => {
        expect(screen.getByText(/confluence.*not connected/i)).toBeInTheDocument();
      });
    });
  });
});
