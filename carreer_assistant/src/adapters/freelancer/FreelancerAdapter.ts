import { APIAdapter } from '../base/APIAdapter.js';
import { PLATFORM_CONFIGS } from '../../config/platforms.js';
import type { PlatformAdapter, Proposal, SubmissionResult, PlatformProfile, ProfileUpdate } from '../base/PlatformAdapter.js';
import type { NormalizedJob } from '../../core/scoring/types.js';
import type { JobFilters } from '../../core/job-discovery/JobDiscoveryEngine.js';
import { normalizeJob } from '../../core/job-discovery/JobNormalizer.js';

export class FreelancerAdapter extends APIAdapter implements PlatformAdapter {
  private token: string;
  private apiUrl: string;

  constructor(token?: string) {
    super(PLATFORM_CONFIGS.freelancer);
    this.token = token ?? process.env.FREELANCER_OAUTH_TOKEN ?? '';
    this.apiUrl = process.env.FREELANCER_API_URL ?? 'https://www.freelancer.com/api';
  }

  async initialize(): Promise<void> {
    if (!this.token) {
      throw new Error('Freelancer OAuth token not configured. Set FREELANCER_OAUTH_TOKEN in .env');
    }
  }

  async teardown(): Promise<void> {
    // No persistent connections to clean up
  }

  async searchJobs(filters: JobFilters): Promise<NormalizedJob[]> {
    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    if (filters.skills?.length) params.set('jobs[]', filters.skills.join(','));
    params.set('limit', String(filters.maxResults ?? 20));
    params.set('compact', 'true');
    params.set('project_types[]', 'fixed,hourly');

    const url = `${this.apiUrl}/projects/0.1/projects/active?${params}`;

    const response = await this.rateLimitedFetch(url, {
      headers: this.buildHeaders(this.token),
    });

    if (!response.ok) {
      throw new Error(`Freelancer API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as FreelancerSearchResponse;
    const projects = data.result?.projects ?? [];

    return projects.map((project) =>
      normalizeJob('freelancer', {
        platformJobId: String(project.id),
        title: project.title,
        description: project.preview_description ?? project.description ?? '',
        companyName: project.owner?.display_name ?? '',
        salaryMin: project.budget?.minimum ?? null,
        salaryMax: project.budget?.maximum ?? null,
        salaryCurrency: project.currency?.code ?? 'USD',
        workModel: 'remote',
        location: project.owner?.location?.country?.name ?? null,
        techStack: project.jobs?.map((j) => j.name) ?? [],
        url: `https://www.freelancer.com/projects/${project.seo_url}`,
        raw: project as unknown as Record<string, unknown>,
      }),
    );
  }

  async getJobDetails(jobId: string): Promise<NormalizedJob> {
    const url = `${this.apiUrl}/projects/0.1/projects/${jobId}?full_description=true`;

    const response = await this.rateLimitedFetch(url, {
      headers: this.buildHeaders(this.token),
    });

    if (!response.ok) {
      throw new Error(`Freelancer API error: ${response.status}`);
    }

    const data = await response.json() as { result: FreelancerProject };
    const project = data.result;

    return normalizeJob('freelancer', {
      platformJobId: String(project.id),
      title: project.title,
      description: project.description ?? '',
      companyName: project.owner?.display_name ?? '',
      salaryMin: project.budget?.minimum ?? null,
      salaryMax: project.budget?.maximum ?? null,
      salaryCurrency: project.currency?.code ?? 'USD',
      workModel: 'remote',
      location: project.owner?.location?.country?.name ?? null,
      techStack: project.jobs?.map((j) => j.name) ?? [],
      url: `https://www.freelancer.com/projects/${project.seo_url}`,
      raw: project as unknown as Record<string, unknown>,
    });
  }

  async submitProposal(jobId: string, proposal: Proposal): Promise<SubmissionResult> {
    const url = `${this.apiUrl}/projects/0.1/bids/`;

    const response = await this.rateLimitedFetch(url, {
      method: 'POST',
      headers: this.buildHeaders(this.token),
      body: JSON.stringify({
        project_id: parseInt(jobId, 10),
        description: proposal.coverLetter,
        amount: proposal.bidAmount,
        period: parseInt(proposal.estimatedDuration ?? '7', 10),
        milestone_percentage: 100,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${err}`, platform: 'freelancer' };
    }

    const data = await response.json() as { result?: { id?: number }; status?: string };

    return {
      success: data.status === 'success',
      submissionId: data.result?.id ? String(data.result.id) : undefined,
      platform: 'freelancer',
    };
  }

  async getProfile(): Promise<PlatformProfile> {
    const url = `${this.apiUrl}/users/0.1/self`;

    const response = await this.rateLimitedFetch(url, {
      headers: this.buildHeaders(this.token),
    });

    const data = await response.json() as { result: { id: number; display_name: string; tagline?: string; about?: string; jobs?: Array<{ name: string }>; hourly_rate?: number; profile_url?: string } };
    const user = data.result;

    return {
      platform: 'freelancer',
      profileId: String(user.id),
      displayName: user.display_name,
      title: user.tagline ?? '',
      description: user.about ?? '',
      skills: user.jobs?.map((j) => j.name) ?? [],
      hourlyRate: user.hourly_rate,
      rateCurrency: 'USD',
      profileUrl: user.profile_url ?? `https://www.freelancer.com/u/${user.display_name}`,
      completeness: 100,
    };
  }

  async updateProfile(_updates: ProfileUpdate): Promise<void> {
    throw new Error('Freelancer profile update not yet implemented — use web UI');
  }
}

interface FreelancerProject {
  id: number;
  title: string;
  description?: string;
  preview_description?: string;
  seo_url?: string;
  budget?: { minimum?: number; maximum?: number };
  currency?: { code?: string };
  owner?: { display_name?: string; location?: { country?: { name?: string } } };
  jobs?: Array<{ name: string }>;
}

interface FreelancerSearchResponse {
  status?: string;
  result?: { projects?: FreelancerProject[] };
}
