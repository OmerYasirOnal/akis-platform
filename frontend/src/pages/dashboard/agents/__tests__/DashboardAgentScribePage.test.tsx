import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardAgentScribePage from '../DashboardAgentScribePage';
import { githubDiscoveryApi } from '../../../../services/api/github-discovery';

vi.mock('../../../../services/api/github-discovery', () => ({
  githubDiscoveryApi: {
    getOwners: vi.fn(),
    getRepos: vi.fn(),
    getBranches: vi.fn(),
  },
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('DashboardAgentScribePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (githubDiscoveryApi.getOwners as ReturnType<typeof vi.fn>).mockResolvedValue({
      owners: [{ login: 'demo-team', type: 'Organization', avatarUrl: '' }],
    });

    (githubDiscoveryApi.getRepos as ReturnType<typeof vi.fn>).mockResolvedValue({
      repos: [
        {
          name: 'docs-hub',
          fullName: 'demo-team/docs-hub',
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

  it('renders the Scribe console layout with configuration panel', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    // Header should show Scribe Console
    await waitFor(() => {
      expect(screen.getByText(/Scribe Console/i)).toBeInTheDocument();
    });

    // Configuration panel should have the Configuration heading
    expect(screen.getByRole('heading', { name: /Configuration/i })).toBeInTheDocument();
    
    // Form labels should be present (using getAllByText for potential duplicates)
    const ownerLabels = screen.getAllByText(/Owner/i);
    expect(ownerLabels.length).toBeGreaterThan(0);
    
    const repoLabels = screen.getAllByText(/Repository/i);
    expect(repoLabels.length).toBeGreaterThan(0);
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

  it('shows demo mode notice when GitHub discovery fails', async () => {
    (githubDiscoveryApi.getOwners as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('No GitHub connection')
    );

    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      // Should show demo mode indicator in the glass box console
      expect(screen.getByText(/Demo mode active/i)).toBeInTheDocument();
    });
  });

  it('populates owner dropdown from API', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      // The owner should be populated
      expect(screen.getByText('demo-team')).toBeInTheDocument();
    });
  });

  it('has Advanced Options section', async () => {
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
});
