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
    getJiraStatus: vi.fn(),
    connectJira: vi.fn(),
    testJira: vi.fn(),
    disconnectJira: vi.fn(),
    getConfluenceStatus: vi.fn(),
    connectConfluence: vi.fn(),
    testConfluence: vi.fn(),
    disconnectConfluence: vi.fn(),
  },
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('DashboardIntegrationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock responses
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: false,
    });
    (integrationsApi.getJiraStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: false,
    });
    (integrationsApi.getConfluenceStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: false,
    });
  });

  it('renders the Integrations page header', async () => {
    renderWithRouter(<DashboardIntegrationsPage />);

    expect(screen.getByText(/Integrations/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Connect AKIS to your development tools and services/i)
    ).toBeInTheDocument();
  });

  it('shows GitHub status as "Not connected" when disconnected', async () => {
    renderWithRouter(<DashboardIntegrationsPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Not connected/i).length).toBeGreaterThan(0);
    });
  });

  it('shows GitHub status as "Connected" when connected', async () => {
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: true,
      login: 'testuser',
    });

    renderWithRouter(<DashboardIntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });

  it('calls startGitHubOAuth when Connect button is clicked', async () => {
    renderWithRouter(<DashboardIntegrationsPage />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /Connect/i });
      expect(buttons.length).toBeGreaterThan(0);
    });

    // First Connect button should be for GitHub
    const connectButtons = screen.getAllByRole('button', { name: /Connect/i });
    fireEvent.click(connectButtons[0]);

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

  it('renders all integration cards', async () => {
    renderWithRouter(<DashboardIntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /GitHub/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Jira/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Confluence/i })).toBeInTheDocument();
    });
  });

  it('shows Jira as connected when status is connected', async () => {
    (integrationsApi.getJiraStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: true,
      siteUrl: 'https://test.atlassian.net',
      userEmail: 'user@test.com',
    });

    renderWithRouter(<DashboardIntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText('user@test.com')).toBeInTheDocument();
    });
  });

  it('shows Confluence as connected when status is connected', async () => {
    (integrationsApi.getConfluenceStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: true,
      siteUrl: 'https://test.atlassian.net',
      userEmail: 'confluence@test.com',
    });

    renderWithRouter(<DashboardIntegrationsPage />);

    await waitFor(() => {
      expect(screen.getByText('confluence@test.com')).toBeInTheDocument();
    });
  });
});
