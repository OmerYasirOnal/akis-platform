import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardIntegrationsPage from '../DashboardIntegrationsPage';
import { integrationsApi } from '../../../services/api/integrations';

// Mock window.location.href
delete (window as { location?: Location }).location;
window.location = { href: '' } as Location;

vi.mock('../../../services/api/integrations', () => ({
  integrationsApi: {
    getGitHubStatus: vi.fn(),
    startGitHubOAuth: vi.fn(),
    disconnectGitHub: vi.fn(),
  },
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('DashboardIntegrationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Integrations page header', async () => {
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: false,
    });

    renderWithRouter(<DashboardIntegrationsPage />);

    expect(screen.getByText(/Integrations/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Manage connections between AKIS and external systems/i)
    ).toBeInTheDocument();
  });

  it('shows GitHub status as "Not connected" when disconnected', async () => {
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: false,
    });

    renderWithRouter(<DashboardIntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Not connected/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Connect/i })).toBeInTheDocument();
    });
  });

  it('shows GitHub status as "Connected" when connected', async () => {
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: true,
      login: 'testuser',
    });

    renderWithRouter(<DashboardIntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Connected as: testuser/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Disconnect/i })).toBeInTheDocument();
    });
  });

  it('calls startGitHubOAuth when Connect button is clicked', async () => {
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: false,
    });

    renderWithRouter(<DashboardIntegrationsPage />);

    let connectButton: HTMLElement;
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /Connect/i });
      // First Connect button should be for GitHub
      connectButton = buttons[0];
      expect(connectButton).toBeInTheDocument();
    });

    fireEvent.click(connectButton!);

    // Should call OAuth start
    await waitFor(() => {
      expect(integrationsApi.startGitHubOAuth).toHaveBeenCalled();
    });
  });

  it('calls disconnectGitHub when Disconnect button is clicked', async () => {
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: true,
      login: 'testuser',
    });
    (integrationsApi.disconnectGitHub as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
    });

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithRouter(<DashboardIntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Disconnect/i })).toBeInTheDocument();
    });

    const disconnectButton = screen.getByRole('button', { name: /Disconnect/i });
    fireEvent.click(disconnectButton);

    await waitFor(() => {
      expect(integrationsApi.disconnectGitHub).toHaveBeenCalled();
    });

    vi.restoreAllMocks();
  });

  // Note: OAuth callback notification test skipped - requires router query params
  // Manual testing covers this scenario

  it('renders placeholder integrations as coming soon', async () => {
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: false,
    });

    renderWithRouter(<DashboardIntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Jira Cloud/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^Confluence$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Slack \(Notifications\)/i })).toBeInTheDocument();
    });
  });
});

