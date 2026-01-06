import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardIntegrationsPage from '../DashboardIntegrationsPage';
import { integrationsApi } from '../../../services/api/integrations';

vi.mock('../../../services/api/integrations', () => ({
  integrationsApi: {
    getGitHubStatus: vi.fn(),
    connectGitHubToken: vi.fn(),
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

  it('opens token modal when Connect button is clicked', async () => {
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: false,
    });

    renderWithRouter(<DashboardIntegrationsPage />);

    let connectButton: HTMLElement;
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /Connect/i });
      // First Connect button should be for GitHub (not the "Connect" button in modal)
      connectButton = buttons[0];
      expect(connectButton).toBeInTheDocument();
    });

    fireEvent.click(connectButton!);

    // Check for the input field with placeholder instead
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ghp_/i)).toBeInTheDocument();
    });
  });

  it('calls connectGitHubToken API when token is submitted', async () => {
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: false,
    });
    (integrationsApi.connectGitHubToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: true,
      login: 'testuser',
    });

    renderWithRouter(<DashboardIntegrationsPage />);

    let connectButton: HTMLElement;
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /Connect/i });
      connectButton = buttons[0];
      expect(connectButton).toBeInTheDocument();
    });

    fireEvent.click(connectButton!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ghp_/i)).toBeInTheDocument();
    });

    const tokenInput = screen.getByPlaceholderText(/ghp_/i);
    fireEvent.change(tokenInput, { target: { value: 'test_token_123' } });

    const submitButtons = screen.getAllByRole('button', { name: /^Connect$/i });
    // Second Connect button should be the submit button in modal
    const submitButton = submitButtons[1];
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(integrationsApi.connectGitHubToken).toHaveBeenCalledWith('test_token_123');
    });
  });

  it('shows error when token is empty', async () => {
    (integrationsApi.getGitHubStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      connected: false,
    });

    renderWithRouter(<DashboardIntegrationsPage />);

    let connectButton: HTMLElement;
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /Connect/i });
      connectButton = buttons[0];
      expect(connectButton).toBeInTheDocument();
    });

    fireEvent.click(connectButton!);

    await waitFor(() => {
      const submitButtons = screen.getAllByRole('button', { name: /^Connect$/i });
      expect(submitButtons[1]).toBeInTheDocument();
    });

    const submitButtons = screen.getAllByRole('button', { name: /^Connect$/i });
    const submitButton = submitButtons[1];
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Token is required/i)).toBeInTheDocument();
    });
  });

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

