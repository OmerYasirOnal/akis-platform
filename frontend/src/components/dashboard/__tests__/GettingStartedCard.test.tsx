import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GettingStartedCard } from '../GettingStartedCard';
import { aiKeysApi } from '../../../services/api/ai-keys';

// Mock the AI keys API
vi.mock('../../../services/api/ai-keys', () => ({
  aiKeysApi: {
    getStatus: vi.fn(),
  },
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('GettingStartedCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the getting started card with 3 steps', async () => {
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      activeProvider: null,
      providers: {
        openai: { configured: false, last4: null, updatedAt: null },
        openrouter: { configured: false, last4: null, updatedAt: null },
      },
    });

    renderWithRouter(<GettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    expect(screen.getByText('Configure AI Provider')).toBeInTheDocument();
    expect(screen.getByText('Run Your First Agent')).toBeInTheDocument();
    expect(screen.getByText('Explore Results')).toBeInTheDocument();
  });

  it('shows AI keys step as completed when configured', async () => {
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      activeProvider: 'openai',
      providers: {
        openai: { configured: true, last4: '1234', updatedAt: '2026-02-08T00:00:00Z' },
        openrouter: { configured: false, last4: null, updatedAt: null },
      },
    });

    renderWithRouter(<GettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    // Progress should show 1/3
    expect(screen.getByText('1/3')).toBeInTheDocument();

    // "Set up AI Keys" link should not appear (step done)
    expect(screen.queryByText('Set up AI Keys')).not.toBeInTheDocument();
  });

  it('shows progress 0/3 when nothing is configured', async () => {
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      activeProvider: null,
      providers: {
        openai: { configured: false, last4: null, updatedAt: null },
        openrouter: { configured: false, last4: null, updatedAt: null },
      },
    });

    renderWithRouter(<GettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('0/3')).toBeInTheDocument();
    });
  });

  it('can be dismissed and stays hidden', async () => {
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      activeProvider: null,
      providers: {
        openai: { configured: false, last4: null, updatedAt: null },
        openrouter: { configured: false, last4: null, updatedAt: null },
      },
    });

    const { unmount } = renderWithRouter(<GettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    // Click dismiss
    fireEvent.click(screen.getByLabelText('Dismiss getting started'));

    // Card should vanish
    expect(screen.queryByText('Getting Started')).not.toBeInTheDocument();

    // localStorage persists the dismissal
    expect(localStorage.getItem('akis-getting-started-dismissed')).toBe('true');

    // Re-render — card should still be hidden
    unmount();
    renderWithRouter(<GettingStartedCard />);
    expect(screen.queryByText('Getting Started')).not.toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    renderWithRouter(<GettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    // Should still render with unconfigured state
    expect(screen.getByText('0/3')).toBeInTheDocument();
  });

  it('has correct navigation links', async () => {
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      activeProvider: null,
      providers: {
        openai: { configured: false, last4: null, updatedAt: null },
        openrouter: { configured: false, last4: null, updatedAt: null },
      },
    });

    renderWithRouter(<GettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    const aiKeysLink = screen.getByText('Set up AI Keys').closest('a');
    expect(aiKeysLink).toHaveAttribute('href', '/dashboard/settings/ai-keys');

    const scribeLink = screen.getByText('Open Scribe').closest('a');
    expect(scribeLink).toHaveAttribute('href', '/dashboard/scribe');

    const jobsLink = screen.getByText('View Jobs').closest('a');
    expect(jobsLink).toHaveAttribute('href', '/dashboard/jobs');
  });
});
