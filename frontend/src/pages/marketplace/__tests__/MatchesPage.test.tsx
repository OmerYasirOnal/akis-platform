import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import MatchesPage from '../app/MatchesPage';
import { marketplaceApi } from '../../../services/api/marketplace';

vi.mock('../../../services/api/marketplace', () => ({
  marketplaceApi: {
    listMatches: vi.fn(),
    runMatch: vi.fn(),
  },
}));

vi.mock('../../../i18n/useI18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe('Marketplace MatchesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders explanation summary and json section', async () => {
    (marketplaceApi.listMatches as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        {
          id: 'match-1',
          profileId: 'profile-1',
          jobPostId: 'job-1',
          score: 0.82,
          status: 'suggested',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          jobTitle: 'React Developer',
          jobLocation: 'remote',
          remoteAllowed: true,
          jobLanguage: 'en',
          explanation: {
            summary: 'Strong skill overlap',
            top_factors: ['skill_overlap', 'language_fit'],
            missing_skills: ['nodejs'],
            confidence: 0.91,
            factor_scores: {
              skill_overlap: 0.8,
              language_fit: 1,
            },
          },
        },
      ],
      total: 1,
    });

    render(
      <MemoryRouter>
        <MatchesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
      expect(screen.getByText('Strong skill overlap')).toBeInTheDocument();
      expect(screen.getByText('nodejs')).toBeInTheDocument();
    });

    expect(screen.getByText('marketplace.matches.viewJson')).toBeInTheDocument();
  });

  it('runs matching when button is clicked', async () => {
    (marketplaceApi.listMatches as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [],
      total: 0,
    });
    (marketplaceApi.runMatch as ReturnType<typeof vi.fn>).mockResolvedValue({ created: 0 });

    render(
      <MemoryRouter>
        <MatchesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(marketplaceApi.listMatches).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'marketplace.matches.actions.run' }));

    await waitFor(() => {
      expect(marketplaceApi.runMatch).toHaveBeenCalledTimes(1);
      expect(marketplaceApi.listMatches).toHaveBeenCalledTimes(2);
    });
  });
});
