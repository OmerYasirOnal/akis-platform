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

  it('renders the Scribe console layout', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      expect(screen.getByText(/Scribe Console/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /Setup/i })).toBeInTheDocument();
    expect(screen.getByText(/Scribe Chat/i)).toBeInTheDocument();
  });

  it('requires a new branch name when branch mode is set to create new', async () => {
    renderWithRouter(<DashboardAgentScribePage />);

    const createNewRadio = await screen.findByRole('radio', { name: /Create new branch/i });
    fireEvent.click(createNewRadio);

    const startButton = screen.getByRole('button', { name: /Start Scribe/i });
    expect(startButton).toBeDisabled();

    const autoGenerateButton = screen.getByRole('button', { name: /Auto-generate/i });
    fireEvent.click(autoGenerateButton);

    await waitFor(() => {
      expect(startButton).not.toBeDisabled();
    });
  });

  it('shows a mock notice when GitHub discovery fails', async () => {
    (githubDiscoveryApi.getOwners as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('No GitHub connection')
    );

    renderWithRouter(<DashboardAgentScribePage />);

    await waitFor(() => {
      expect(screen.getByText(/TODO: Connect GitHub/i)).toBeInTheDocument();
    });
  });
});
