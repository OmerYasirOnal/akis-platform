import { HttpClient } from './HttpClient';
import { getApiBaseUrl } from './config';

const httpClient = new HttpClient(getApiBaseUrl());

const withCredentials = {
  credentials: 'include' as const,
};

export interface ProfileSkillInput {
  name: string;
  level?: number;
  yearsExperience?: number;
}

export interface PortfolioInput {
  title: string;
  description?: string;
  url?: string;
  tags?: string[];
}

export interface ProfileInput {
  headline?: string;
  bio?: string;
  seniority?: string;
  languages?: string[];
  preferredLocations?: string[];
  remoteOnly?: boolean;
  salaryFloor?: number;
  excludedIndustries?: string[];
  skills?: ProfileSkillInput[];
  portfolios?: PortfolioInput[];
}

export interface IngestJobInput {
  externalId?: string;
  title: string;
  description: string;
  requiredSkills?: string[];
  seniority?: string;
  language?: string;
  location?: string;
  remoteAllowed?: boolean;
  keywords?: string[];
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  rawPayload?: Record<string, unknown>;
}

export interface JobPostItem {
  id: string;
  sourceId: string;
  externalId?: string | null;
  title: string;
  description: string;
  requiredSkills: string[];
  keywords: string[];
  seniority?: string | null;
  language?: string | null;
  location?: string | null;
  remoteAllowed: boolean;
  budgetMin?: string | null;
  budgetMax?: string | null;
  currency: string;
  ingestedAt: string;
}

export interface MatchItem {
  id: string;
  profileId: string;
  jobPostId: string;
  score: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  jobTitle: string;
  jobLocation?: string | null;
  remoteAllowed: boolean;
  jobLanguage?: string | null;
  explanation: {
    summary: string;
    top_factors: string[];
    missing_skills: string[];
    confidence: number;
    factor_scores?: Record<string, number>;
  };
}

export interface ProposalItem {
  id: string;
  profileId: string;
  jobPostId: string;
  content: string;
  source: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const marketplaceApi = {
  upsertProfile: async (payload: ProfileInput): Promise<{
    profile: unknown;
    skills: unknown[];
    portfolios: unknown[];
  }> => {
    return httpClient.post('/api/profile', payload, withCredentials);
  },

  listJobs: async (params?: { limit?: number; offset?: number }): Promise<{ items: JobPostItem[]; total: number }> => {
    const query = new URLSearchParams();
    if (typeof params?.limit === 'number') query.set('limit', String(params.limit));
    if (typeof params?.offset === 'number') query.set('offset', String(params.offset));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return httpClient.get(`/api/jobs${suffix}`, withCredentials);
  },

  ingestJobs: async (payload: { source: string; jobs: IngestJobInput[] }): Promise<{ ingested: number }> => {
    return httpClient.post('/api/jobs/ingest', payload, withCredentials);
  },

  runMatch: async (payload?: { jobIds?: string[] }): Promise<{ created: number }> => {
    return httpClient.post('/api/match/run', payload ?? {}, withCredentials);
  },

  listMatches: async (params?: { limit?: number; offset?: number }): Promise<{ items: MatchItem[]; total: number }> => {
    const query = new URLSearchParams();
    if (typeof params?.limit === 'number') query.set('limit', String(params.limit));
    if (typeof params?.offset === 'number') query.set('offset', String(params.offset));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return httpClient.get(`/api/match${suffix}`, withCredentials);
  },

  generateProposal: async (jobPostId: string): Promise<{ proposal: ProposalItem }> => {
    return httpClient.post('/api/proposals/generate', { jobPostId }, withCredentials);
  },
};
