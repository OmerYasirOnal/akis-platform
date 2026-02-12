import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardSettingsAiKeysPage from '../DashboardSettingsAiKeysPage';

const getStatusMock = vi.fn();
const saveKeyMock = vi.fn();
const deleteKeyMock = vi.fn();
const setActiveProviderMock = vi.fn();

vi.mock('../../../../services/api/ai-keys', () => ({
  aiKeysApi: {
    getStatus: (...args: unknown[]) => getStatusMock(...args),
    saveKey: (...args: unknown[]) => saveKeyMock(...args),
    deleteKey: (...args: unknown[]) => deleteKeyMock(...args),
    setActiveProvider: (...args: unknown[]) => setActiveProviderMock(...args),
  },
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <DashboardSettingsAiKeysPage />
    </MemoryRouter>,
  );

describe('DashboardSettingsAiKeysPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStatusMock.mockResolvedValue({
      activeProvider: 'openai',
      providers: {
        openai: { configured: true, last4: '1234', updatedAt: new Date().toISOString() },
        openrouter: { configured: false },
      },
    });
  });

  it('renders the page heading after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /AI Provider Keys/i }),
      ).toBeInTheDocument();
    });
  });

  it('renders the security notice', async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText(/Secure Key Storage/i),
      ).toBeInTheDocument();
    });
  });

  it('renders OpenAI provider card', async () => {
    renderPage();
    await waitFor(() => {
      // "OpenAI" appears in both the provider heading and the docs link
      expect(screen.getAllByText('OpenAI').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders OpenRouter provider card', async () => {
    renderPage();
    await waitFor(() => {
      // "OpenRouter" appears in both the provider heading and the docs link
      expect(screen.getAllByText('OpenRouter').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders the page description text', async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText(/Configure your AI provider API keys/i),
      ).toBeInTheDocument();
    });
  });

  it('renders Save buttons for each provider', async () => {
    renderPage();
    await waitFor(() => {
      const saveButtons = screen.getAllByRole('button', { name: /Save/i });
      expect(saveButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders How API Keys Are Used section', async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText(/How API Keys Are Used/i),
      ).toBeInTheDocument();
    });
  });

  it('shows loading spinner initially', () => {
    getStatusMock.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    // The loading spinner is a div with animate-spin class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows error message when status fetch fails', async () => {
    getStatusMock.mockRejectedValueOnce(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load AI provider status/i),
      ).toBeInTheDocument();
    });
  });
});
