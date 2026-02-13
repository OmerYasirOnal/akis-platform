import type { Profile, JobPost } from '../../db/schema.js';

export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'unknown';

export interface MarketplaceProfileContext {
  id: string;
  userId: string;
  headline: string | null;
  bio: string | null;
  seniority: string;
  languages: string[];
  preferredLocations: string[];
  remoteOnly: boolean;
  excludedIndustries: string[];
}

export interface MarketplaceJobContext {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  keywords: string[];
  seniority: string | null;
  language: string | null;
  location: string | null;
  remoteAllowed: boolean;
}

export interface MatchFactorScores {
  skill_overlap: number;
  seniority_fit: number;
  language_fit: number;
  location_remote_fit: number;
  keyword_relevance: number;
}

export interface MatchExplanation {
  top_factors: string[];
  factor_scores: MatchFactorScores;
  missing_skills: string[];
  confidence: number;
  fairness_adjustment_applied: boolean;
  summary: string;
}

export interface MatchResult {
  score: number;
  explanation: MatchExplanation;
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

export interface IngestPayload {
  source: string;
  jobs: IngestJobInput[];
}

export interface ProposalDraft {
  content: string;
  source: 'template' | 'llm';
  metadata: Record<string, unknown>;
}

export function mapProfileRecord(profile: Profile): MarketplaceProfileContext {
  return {
    id: profile.id,
    userId: profile.userId,
    headline: profile.headline,
    bio: profile.bio,
    seniority: profile.seniority,
    languages: Array.isArray(profile.languages) ? (profile.languages as string[]) : [],
    preferredLocations: Array.isArray(profile.preferredLocations) ? (profile.preferredLocations as string[]) : [],
    remoteOnly: profile.remoteOnly,
    excludedIndustries: Array.isArray(profile.excludedIndustries)
      ? (profile.excludedIndustries as string[])
      : [],
  };
}

export function mapJobRecord(job: JobPost): MarketplaceJobContext {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    requiredSkills: Array.isArray(job.requiredSkills) ? (job.requiredSkills as string[]) : [],
    keywords: Array.isArray(job.keywords) ? (job.keywords as string[]) : [],
    seniority: job.seniority,
    language: job.language,
    location: job.location,
    remoteAllowed: job.remoteAllowed,
  };
}
