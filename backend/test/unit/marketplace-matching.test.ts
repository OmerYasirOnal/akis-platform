import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { scoreMarketplaceMatch } from '../../src/services/marketplace/matching-service.js';
import type { MarketplaceJobContext, MarketplaceProfileContext } from '../../src/services/marketplace/types.js';

const baseProfile: MarketplaceProfileContext = {
  id: 'profile-1',
  userId: 'user-1',
  headline: 'Frontend Engineer',
  bio: 'I build React and TypeScript applications.',
  seniority: 'mid',
  languages: ['en', 'tr'],
  preferredLocations: ['remote', 'istanbul'],
  remoteOnly: false,
  excludedIndustries: [],
};

const baseJob: MarketplaceJobContext = {
  id: 'job-1',
  title: 'React Dashboard Developer',
  description: 'Build dashboard features with React and TypeScript',
  requiredSkills: ['react', 'typescript', 'ui'],
  keywords: ['react', 'typescript', 'dashboard'],
  seniority: 'mid',
  language: 'en',
  location: 'remote',
  remoteAllowed: true,
};

describe('Marketplace matching scoring', () => {
  it('increases score with stronger skill overlap', () => {
    const lowOverlap = scoreMarketplaceMatch({
      profile: baseProfile,
      profileSkills: ['excel'],
      job: baseJob,
    });

    const highOverlap = scoreMarketplaceMatch({
      profile: baseProfile,
      profileSkills: ['react', 'typescript', 'ui'],
      job: baseJob,
    });

    assert.ok(highOverlap.score > lowOverlap.score, 'Expected higher score for stronger overlap');
  });

  it('applies remote mismatch penalty', () => {
    const remoteOnlyProfile: MarketplaceProfileContext = {
      ...baseProfile,
      remoteOnly: true,
    };

    const onSiteJob: MarketplaceJobContext = {
      ...baseJob,
      remoteAllowed: false,
      location: 'ankara',
    };

    const result = scoreMarketplaceMatch({
      profile: remoteOnlyProfile,
      profileSkills: ['react', 'typescript'],
      job: onSiteJob,
    });

    assert.equal(result.explanation.factor_scores.location_remote_fit, 0);
    assert.ok(result.score < 0.8, 'Expected score drop when remote preference cannot be met');
  });

  it('returns deterministic explanation factors', () => {
    const first = scoreMarketplaceMatch({
      profile: baseProfile,
      profileSkills: ['react', 'typescript'],
      job: baseJob,
    });

    const second = scoreMarketplaceMatch({
      profile: baseProfile,
      profileSkills: ['react', 'typescript'],
      job: baseJob,
    });

    assert.deepEqual(first.explanation.top_factors, second.explanation.top_factors);
    assert.deepEqual(first.explanation.factor_scores, second.explanation.factor_scores);
    assert.deepEqual(first.explanation.missing_skills, second.explanation.missing_skills);
  });
});
