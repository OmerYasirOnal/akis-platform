import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GettingStartedCard } from '../GettingStartedCard';
import { aiKeysApi } from '../../../services/api/ai-keys';
import { agentsApi } from '../../../services/api/agents';

// Mock the AI keys API
vi.mock('../../../services/api/ai-keys', () => ({
  aiKeysApi: {
    getStatus: vi.fn(),
  },
}));

// Mock the agents API
vi.mock('../../../services/api/agents', () => ({
  agentsApi: {
    listJobs: vi.fn(),
  },
}));

// Mock useI18n to return key as value (passthrough)
vi.mock('../../../i18n/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'onboarding.title': 'Getting Started',
        'onboarding.subtitle': 'Complete these steps to start using AKIS agents.',
        'onboarding.step1.title': 'Configure AI Provider',
        'onboarding.step1.description': 'Add your OpenAI or OpenRouter API key to enable AI agents.',
        'onboarding.step1.link': 'Set up AI Keys',
        'onboarding.step2.title': 'Run Your First Agent',
        'onboarding.step2.description': 'Try Scribe to generate documentation, or Trace to create test plans.',
        'onboarding.step2.link': 'Open Agents Hub',
        'onboarding.step3.title': 'Explore Results',
        'onboarding.step3.description': 'View generated artifacts, logs, and job history.',
        'onboarding.step3.link': 'View Jobs',
      };
      return translations[key] ?? key;
    },
    locale: 'en',
  }),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

const mockNoKeys = {
  activeProvider: null,
  providers: {
    openai: { configured: false, last4: null, updatedAt: null },
    openrouter: { configured: false, last4: null, updatedAt: null },
  },
};

const mockWithKeys = {
  activeProvider: 'openai' as const,
  providers: {
    openai: { configured: true, last4: '1234', updatedAt: '2026-02-08T00:00:00Z' },
    openrouter: { configured: false, last4: null, updatedAt: null },
  },
};

const mockNoJobs = { items: [], nextCursor: null };
const mockWithJobs = {
  items: [{ id: 'job-1', type: 'scribe', state: 'completed', errorCode: null, errorMessage: null, qualityScore: null, createdAt: '2026-02-08', updatedAt: '2026-02-08' }],
  nextCursor: null,
};

describe('GettingStartedCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the getting started card with 3 steps', async () => {
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockNoKeys);
    (agentsApi.listJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockNoJobs);

    renderWithRouter(<GettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    expect(screen.getByText('Configure AI Provider')).toBeInTheDocument();
    expect(screen.getByText('Run Your First Agent')).toBeInTheDocument();
    expect(screen.getByText('Explore Results')).toBeInTheDocument();
  });

  it('shows AI keys step as completed when configured', async () => {
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockWithKeys);
    (agentsApi.listJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockNoJobs);

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
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockNoKeys);
    (agentsApi.listJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockNoJobs);

    renderWithRouter(<GettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('0/3')).toBeInTheDocument();
    });
  });

  it('shows 3/3 when AI keys configured and has run a job', async () => {
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockWithKeys);
    (agentsApi.listJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockWithJobs);

    renderWithRouter(<GettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('3/3')).toBeInTheDocument();
    });

    // No CTA links should be visible since all steps are done
    expect(screen.queryByText('Set up AI Keys')).not.toBeInTheDocument();
    expect(screen.queryByText('Open Agents Hub')).not.toBeInTheDocument();
    expect(screen.queryByText('View Jobs')).not.toBeInTheDocument();
  });

  it('shows steps 2-3 as done when user has run a job', async () => {
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockNoKeys);
    (agentsApi.listJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockWithJobs);

    renderWithRouter(<GettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('2/3')).toBeInTheDocument();
    });

    // Agent hub link should not appear (step 2 done)
    expect(screen.queryByText('Open Agents Hub')).not.toBeInTheDocument();
    // Jobs link should not appear (step 3 done)
    expect(screen.queryByText('View Jobs')).not.toBeInTheDocument();
    // AI keys link should still appear
    expect(screen.getByText('Set up AI Keys')).toBeInTheDocument();
  });

  it('can be dismissed and stays hidden', async () => {
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockNoKeys);
    (agentsApi.listJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockNoJobs);

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
    (agentsApi.listJobs as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    renderWithRouter(<GettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    // Should still render with unconfigured state
    expect(screen.getByText('0/3')).toBeInTheDocument();
  });

  it('has correct navigation links', async () => {
    (aiKeysApi.getStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockNoKeys);
    (agentsApi.listJobs as ReturnType<typeof vi.fn>).mockResolvedValue(mockNoJobs);

    renderWithRouter(<GettingStartedCard />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    const aiKeysLink = screen.getByText('Set up AI Keys').closest('a');
    expect(aiKeysLink).toHaveAttribute('href', '/dashboard/settings/ai-keys');

    const agentsLink = screen.getByText('Open Agents Hub').closest('a');
    expect(agentsLink).toHaveAttribute('href', '/agents');

    const jobsLink = screen.getByText('View Jobs').closest('a');
    expect(jobsLink).toHaveAttribute('href', '/dashboard/jobs');
  });
});
