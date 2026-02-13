import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { generateProposalDraft, renderProposalTemplate } from '../../src/services/marketplace/proposal-service.js';
import type { MarketplaceJobContext, MarketplaceProfileContext } from '../../src/services/marketplace/types.js';

const profile: MarketplaceProfileContext = {
  id: 'profile-1',
  userId: 'user-1',
  headline: 'Frontend Engineer',
  bio: 'I focus on product delivery and quality.',
  seniority: 'mid',
  languages: ['en'],
  preferredLocations: ['remote'],
  remoteOnly: false,
  excludedIndustries: [],
};

const job: MarketplaceJobContext = {
  id: 'job-1',
  title: 'React Developer',
  description: 'Need support for React + TypeScript dashboard work.',
  requiredSkills: ['react', 'typescript'],
  keywords: ['react', 'typescript'],
  seniority: 'mid',
  language: 'en',
  location: 'remote',
  remoteAllowed: true,
};

describe('Marketplace proposal generator', () => {
  it('renders template with required context', () => {
    const content = renderProposalTemplate({
      profile,
      job,
      skills: ['react', 'typescript'],
      missingSkills: [],
    });

    assert.match(content, /React Developer/);
    assert.match(content, /react, typescript/i);
    assert.match(content, /Best regards/);
  });

  it('falls back safely when profile fields are missing', async () => {
    const sparseProfile: MarketplaceProfileContext = {
      ...profile,
      headline: null,
      bio: null,
    };

    const draft = await generateProposalDraft({
      profile: sparseProfile,
      job,
      skills: [],
      missingSkills: ['nodejs'],
    });

    assert.equal(draft.source, 'template');
    assert.match(draft.content, /Freelance Professional/);
    assert.match(draft.content, /nodejs/i);
  });

  it('sanitizes unsafe llm output when llm mode is enabled', async () => {
    const previous = process.env.MARKETPLACE_PROPOSAL_LLM_ENABLED;
    process.env.MARKETPLACE_PROPOSAL_LLM_ENABLED = 'true';

    const draft = await generateProposalDraft({
      profile,
      job,
      skills: ['react'],
      missingSkills: [],
      llmGenerate: async () => '<script>alert(1)</script>Hello <b>Team</b>',
    });

    assert.equal(draft.source, 'llm');
    assert.doesNotMatch(draft.content, /<script>/i);
    assert.doesNotMatch(draft.content, /<b>/i);

    if (previous === undefined) {
      delete process.env.MARKETPLACE_PROPOSAL_LLM_ENABLED;
    } else {
      process.env.MARKETPLACE_PROPOSAL_LLM_ENABLED = previous;
    }
  });
});
