import { APIAdapter } from '../base/APIAdapter.js';
import { PLATFORM_CONFIGS } from '../../config/platforms.js';
import type { PlatformAdapter, Proposal, SubmissionResult, PlatformProfile, ProfileUpdate } from '../base/PlatformAdapter.js';
import type { NormalizedJob } from '../../core/scoring/types.js';
import type { JobFilters } from '../../core/job-discovery/JobDiscoveryEngine.js';
import { normalizeJob } from '../../core/job-discovery/JobNormalizer.js';

export class UpworkAdapter extends APIAdapter implements PlatformAdapter {
  private accessToken: string;

  constructor(accessToken?: string) {
    super(PLATFORM_CONFIGS.upwork);
    this.accessToken = accessToken ?? process.env.UPWORK_ACCESS_TOKEN ?? '';
  }

  async initialize(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Upwork access token not configured. Set UPWORK_ACCESS_TOKEN in .env');
    }
  }

  async teardown(): Promise<void> {
    // No persistent connections to clean up for API adapter
  }

  async searchJobs(filters: JobFilters): Promise<NormalizedJob[]> {
    const query = buildSearchQuery(filters);

    const response = await this.rateLimitedFetch(this.config.baseUrl, {
      method: 'POST',
      headers: this.buildHeaders(this.accessToken),
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Upwork API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as UpworkSearchResponse;
    const jobs = data?.data?.jobSearch?.edges ?? [];

    return jobs.map((edge) =>
      normalizeJob('upwork', {
        platformJobId: edge.node.id,
        title: edge.node.title,
        description: edge.node.description ?? '',
        companyName: edge.node.client?.companyName ?? '',
        hourlyRateMin: edge.node.budget?.min ?? null,
        hourlyRateMax: edge.node.budget?.max ?? null,
        workModel: 'remote',
        location: edge.node.client?.location?.country ?? null,
        techStack: edge.node.skills?.map((s) => s.name) ?? [],
        url: `https://www.upwork.com/jobs/${edge.node.id}`,
        raw: edge.node as unknown as Record<string, unknown>,
      }),
    );
  }

  async getJobDetails(jobId: string): Promise<NormalizedJob> {
    const query = `
      query GetJob($id: ID!) {
        job(id: $id) {
          id title description
          budget { min max type }
          client { companyName location { country } }
          skills { name }
          category { name }
        }
      }
    `;

    const response = await this.rateLimitedFetch(this.config.baseUrl, {
      method: 'POST',
      headers: this.buildHeaders(this.accessToken),
      body: JSON.stringify({ query, variables: { id: jobId } }),
    });

    if (!response.ok) {
      throw new Error(`Upwork API error: ${response.status}`);
    }

    const data = await response.json() as { data: { job: UpworkJobNode } };
    const node = data.data.job;

    return normalizeJob('upwork', {
      platformJobId: node.id,
      title: node.title,
      description: node.description ?? '',
      companyName: node.client?.companyName ?? '',
      hourlyRateMin: node.budget?.min ?? null,
      hourlyRateMax: node.budget?.max ?? null,
      workModel: 'remote',
      location: node.client?.location?.country ?? null,
      techStack: node.skills?.map((s) => s.name) ?? [],
      url: `https://www.upwork.com/jobs/${node.id}`,
      raw: node as unknown as Record<string, unknown>,
    });
  }

  async submitProposal(jobId: string, proposal: Proposal): Promise<SubmissionResult> {
    // Upwork proposal submission via API
    const mutation = `
      mutation SubmitProposal($input: ProposalInput!) {
        submitProposal(input: $input) {
          id status
        }
      }
    `;

    const response = await this.rateLimitedFetch(this.config.baseUrl, {
      method: 'POST',
      headers: this.buildHeaders(this.accessToken),
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            jobId,
            coverLetter: proposal.coverLetter,
            chargeRate: proposal.bidAmount,
            estimatedDuration: proposal.estimatedDuration,
          },
        },
      }),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, platform: 'upwork' };
    }

    const data = await response.json() as { data?: { submitProposal?: { id: string } }; errors?: Array<{ message: string }> };

    if (data.errors?.length) {
      return { success: false, error: data.errors[0].message, platform: 'upwork' };
    }

    return {
      success: true,
      submissionId: data.data?.submitProposal?.id,
      platform: 'upwork',
    };
  }

  async getProfile(): Promise<PlatformProfile> {
    const query = `
      query {
        freelancer {
          id name title description
          skills { name }
          hourlyRate { amount currency }
          profileUrl
        }
      }
    `;

    const response = await this.rateLimitedFetch(this.config.baseUrl, {
      method: 'POST',
      headers: this.buildHeaders(this.accessToken),
      body: JSON.stringify({ query }),
    });

    const data = await response.json() as { data: { freelancer: { id: string; name: string; title: string; description: string; skills: Array<{ name: string }>; hourlyRate?: { amount: number; currency: string }; profileUrl: string } } };
    const f = data.data.freelancer;

    return {
      platform: 'upwork',
      profileId: f.id,
      displayName: f.name,
      title: f.title,
      description: f.description,
      skills: f.skills.map((s) => s.name),
      hourlyRate: f.hourlyRate?.amount,
      rateCurrency: f.hourlyRate?.currency,
      profileUrl: f.profileUrl,
      completeness: 100,
    };
  }

  async updateProfile(_updates: ProfileUpdate): Promise<void> {
    // Profile update requires specific Upwork API mutations
    throw new Error('Upwork profile update not yet implemented — use web UI');
  }
}

function buildSearchQuery(filters: JobFilters): string {
  const skills = filters.skills?.slice(0, 5).join(' ') ?? 'typescript react';
  const queryText = filters.query ?? skills;

  return `
    query SearchJobs {
      jobSearch(
        query: "${queryText}"
        paging: { first: ${filters.maxResults ?? 20} }
      ) {
        edges {
          node {
            id title description
            budget { min max type }
            client { companyName location { country } rating }
            skills { name }
            category { name }
            publishedDate
          }
        }
      }
    }
  `;
}

interface UpworkJobNode {
  id: string;
  title: string;
  description?: string;
  budget?: { min?: number; max?: number; type?: string };
  client?: { companyName?: string; location?: { country?: string }; rating?: number };
  skills?: Array<{ name: string }>;
  category?: { name?: string };
  publishedDate?: string;
}

interface UpworkSearchResponse {
  data?: {
    jobSearch?: {
      edges: Array<{ node: UpworkJobNode }>;
    };
  };
  errors?: Array<{ message: string }>;
}
