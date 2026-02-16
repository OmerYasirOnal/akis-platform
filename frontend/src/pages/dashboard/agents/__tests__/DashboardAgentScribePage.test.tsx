import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardAgentScribePage from '../DashboardAgentScribePage';
import { githubDiscoveryApi } from '../../../../services/api/github-discovery';
import { integrationsApi } from '../../../../services/api/integrations';
import { I18nContext } from '../../../../i18n/i18n.context';

vi.mock('../../../../services/api/github-discovery', () => ({
  githubDiscoveryApi: {
    getOwners: vi.fn(),
    getRepos: vi.fn(),
    getBranches: vi.fn(),
  },
}));

vi.mock('../../../../services/api/integrations', () => ({
  integrationsApi: {
    getGitHubStatus: vi.fn(),
  },
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <I18nContext.Provider value={{ locale: 'en', availableLocales: ['en', 'tr'], status: 'ready', t: ((key: string) => key) as never, setLocale: async () => {} }}>
      <BrowserRouter>{ui}</BrowserRouter>
    </I18nContext.Provider>
  );
};

describe('DashboardAgentScribePage', () => {
  beforeEach(() => {
    // Guard against timer leaks from other suites when running the full test pack.
    vi.useRealTimers();
    vi.clearAllMocks();

    // Mock GitHub connected with login field (new API response)
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: true,
      login: 'test-user',
      avatarUrl: 'https://example.com/avatar.png',
    });

    // getOwners is still used as fallback if login is not in status
    (githubDiscoveryApi.getOwners as ReturnType<typeof vi.fn>).mockResolvedValue({
      owners: [
        { login: 'test-user', type: 'User', avatarUrl: '' },
        { login: 'demo-team', type: 'Organization', avatarUrl: '' },
      ],
    });

    (githubDiscoveryApi.getRepos as ReturnType<typeof vi.fn>).mockResolvedValue({
      repos: [
        {
          name: 'docs-hub',
          fullName: 'test-user/docs-hub',
          defaultBranch: 'main',
          private: true,
          description: 'Docs repo',
        },
      ],
    });

    (githubDiscoveryApi.getBranches as ReturnType<typeof vi.fn>).mockResolvedValue({
      branches: [{ name: 'main', isDefault: true }],
      defaultBranch: 'main',
    });
  });

  it('renders the Scribe console layout with horizontal configuration bar', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    // Header should show Scribe Console
    await waitFor(() => {
      expect(screen.getByText(/Scribe Console/i)).toBeInTheDocument();
    });

    // Configuration panel should have the Configuration heading
    expect(screen.getByRole('heading', { name: /Configuration/i })).toBeInTheDocument();
    
    // Form labels should be present (using getAllBy for potential duplicates)
    expect(screen.getAllByText(/Owner/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Repository/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Base Branch/i).length).toBeGreaterThan(0);
  });

  it('shows GitHub username as read-only owner field', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      // Owner should be displayed with @ prefix as read-only
      const ownerInput = screen.getByDisplayValue('@test-user');
      expect(ownerInput).toBeInTheDocument();
      expect(ownerInput).toHaveAttribute('readonly');
    });
  });

  it('should NOT show owner as dropdown', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      expect(screen.getByText(/Scribe Console/i)).toBeInTheDocument();
    });

    // Owner should be read-only text, not a searchable dropdown
    const ownerInput = screen.getByDisplayValue('@test-user');
    expect(ownerInput).toBeInTheDocument();
    
    // There should be no dropdown trigger for owner
    // Repository and Branch can have dropdowns, but Owner should be read-only
  });

  it('displays auto-generated branch name preview', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      // Wait for repos and branches to load
      expect(screen.getByDisplayValue('@test-user')).toBeInTheDocument();
    });

    // Wait for branch preview to appear (after repo and branch are selected)
    await waitFor(() => {
      // Branch preview should show pattern like "scribe/docs-YYYYMMDD-HHMMSS"
      const branchPreview = screen.getByText(/Branch will be created:/i);
      expect(branchPreview).toBeInTheDocument();
    });

    // The code element should contain scribe/docs- pattern
    const codeElement = screen.getByText(/scribe\/docs-/i);
    expect(codeElement).toBeInTheDocument();
  });

  it('should NOT show manual branch input anywhere', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      expect(screen.getByText(/Scribe Console/i)).toBeInTheDocument();
    });

    // Expand advanced options
    const advancedButton = screen.getByText(/Advanced Options/i);
    fireEvent.click(advancedButton);

    await waitFor(() => {
      expect(screen.getByText(/Target Path/i)).toBeInTheDocument();
    });

    // Should NOT have a "Feature Branch" or manual branch input
    expect(screen.queryByText(/Feature Branch/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/branch name/i)).not.toBeInTheDocument();
  });

  it('shows not connected notice when GitHub is not connected', async () => {
    // Mock GitHub not connected
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: false,
    });

    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      // Owner should show "Not connected" when GitHub is not connected
      const ownerInput = screen.getByDisplayValue(/Not connected/i);
      expect(ownerInput).toBeInTheDocument();
    });
  });

  it('shows glass box console panel with tabs', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      expect(screen.getByText(/Scribe Console/i)).toBeInTheDocument();
    });

    // Glass box tabs should be present
    expect(screen.getByRole('button', { name: /Logs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Preview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Diff/i })).toBeInTheDocument();
  });

  it('has a Run Scribe button when configuration is complete', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      // Wait for data to load and button to appear
      expect(screen.getByRole('button', { name: /Run Scribe/i })).toBeInTheDocument();
    });
  });

  it('shows error notice when GitHub status fetch fails', async () => {
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Failed to check status')
    );

    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      // Should show connection failure message
      expect(screen.getByText(/GitHub not connected/i)).toBeInTheDocument();
    });
  });

  it('has Advanced Options section with targetPath and dryRun', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      expect(screen.getByText(/Advanced Options/i)).toBeInTheDocument();
    });

    // Click to expand advanced options
    const advancedButton = screen.getByText(/Advanced Options/i);
    fireEvent.click(advancedButton);

    await waitFor(() => {
      expect(screen.getByText(/Target Path/i)).toBeInTheDocument();
      expect(screen.getByText(/Dry run/i)).toBeInTheDocument();
    });
  });

  it('shows LiveAgentCanvas in logs tab when idle', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      expect(screen.getByTestId('live-agent-canvas')).toBeInTheDocument();
    });
  });

  it('renders doc pack configuration controls', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      // i18n t() returns the key itself in test — appears in h3 and label
      expect(screen.getAllByText('agents.scribe.docScope.label').length).toBeGreaterThanOrEqual(1);
    });

    // Pack dropdown: default is auto-detect (empty value), displayed as key
    const packSelect = screen.getByDisplayValue('agents.scribe.docScope.auto');
    expect(packSelect).toBeInTheDocument();

    // Depth buttons (t() returns the key)
    expect(screen.getByRole('button', { name: 'agents.scribe.docDepth.lite' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'agents.scribe.docDepth.standard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'agents.scribe.docDepth.deep' })).toBeInTheDocument();

    // Budget indicator
    expect(screen.getByText(/~16K/)).toBeInTheDocument();
    expect(screen.getByText(/tokens/i)).toBeInTheDocument();

    // Auto-detect hint should be visible (output targets hidden in auto mode)
    expect(screen.getByText('agents.scribe.docScope.autoHint')).toBeInTheDocument();
  });

  it('updates output targets when doc pack changes', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      expect(screen.getAllByText('agents.scribe.docScope.label').length).toBeGreaterThanOrEqual(1);
    });

    // Change to full pack
    const packSelect = screen.getByDisplayValue('agents.scribe.docScope.auto');
    fireEvent.change(packSelect, { target: { value: 'full' } });

    await waitFor(() => {
      // Should show 2-pass badge
      expect(screen.getByText(/2-pass/i)).toBeInTheDocument();
    });

    // Output targets should now be visible (no longer auto-detect)
    expect(screen.getByText('README')).toBeInTheDocument();
  });
});
