import { and, eq } from 'drizzle-orm';

import { db } from '../../db/client.js';
import { matches } from '../../db/schema.js';
import type {
  MarketplaceJobContext,
  MarketplaceProfileContext,
  MatchExplanation,
  MatchFactorScores,
  MatchResult,
} from './types.js';

const WEIGHTS = {
  skill_overlap: 0.4,
  seniority_fit: 0.2,
  language_fit: 0.15,
  location_remote_fit: 0.15,
  keyword_relevance: 0.1,
} as const;

const SENIORITY_ORDER = ['junior', 'mid', 'senior', 'lead'] as const;

function clamp(value: number, min = 0, max = 1): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function normalizeArray(values: string[]): string[] {
  return values.map((value) => normalize(value)).filter(Boolean);
}

function skillOverlap(profileSkills: string[], requiredSkills: string[]): { score: number; missing: string[] } {
  if (requiredSkills.length === 0) {
    return { score: 0.5, missing: [] };
  }

  const profileSet = new Set(normalizeArray(profileSkills));
  const required = normalizeArray(requiredSkills);
  const matched = required.filter((skill) => profileSet.has(skill));
  const missing = required.filter((skill) => !profileSet.has(skill));

  return {
    score: clamp(matched.length / required.length),
    missing,
  };
}

function seniorityFit(profileSeniority: string, jobSeniority: string | null): number {
  if (!jobSeniority) return 0.7;

  const normalizedProfile = normalize(profileSeniority);
  const normalizedJob = normalize(jobSeniority);

  const profileIndex = SENIORITY_ORDER.indexOf(normalizedProfile as (typeof SENIORITY_ORDER)[number]);
  const jobIndex = SENIORITY_ORDER.indexOf(normalizedJob as (typeof SENIORITY_ORDER)[number]);

  if (profileIndex === -1 || jobIndex === -1) {
    return normalizedProfile === normalizedJob ? 1 : 0.6;
  }

  const distance = Math.abs(profileIndex - jobIndex);
  if (distance === 0) return 1;
  if (distance === 1) return 0.7;
  return 0.35;
}

function languageFit(profileLanguages: string[], jobLanguage: string | null): number {
  if (!jobLanguage) return 0.7;
  const supported = new Set(normalizeArray(profileLanguages));
  return supported.has(normalize(jobLanguage)) ? 1 : 0;
}

function locationRemoteFit(
  preferredLocations: string[],
  remoteOnly: boolean,
  jobLocation: string | null,
  jobRemoteAllowed: boolean,
): number {
  if (remoteOnly && !jobRemoteAllowed) return 0;
  if (jobRemoteAllowed) return 1;

  const preferred = new Set(normalizeArray(preferredLocations));
  if (!jobLocation) return 0.5;
  if (preferred.size === 0) return 0.6;

  return preferred.has(normalize(jobLocation)) ? 1 : 0.2;
}

function keywordRelevance(profile: MarketplaceProfileContext, job: MarketplaceJobContext): number {
  const profileText = [profile.headline ?? '', profile.bio ?? ''].join(' ');
  const profileTokens = new Set(tokenize(profileText));

  const keywords = job.keywords.length > 0 ? job.keywords : tokenize(job.description).slice(0, 25);
  if (keywords.length === 0) return 0.5;

  const normalizedKeywords = normalizeArray(keywords);
  const hits = normalizedKeywords.filter((keyword) => profileTokens.has(keyword));
  return clamp(hits.length / normalizedKeywords.length);
}

function topFactors(factors: MatchFactorScores): string[] {
  return Object.entries(factors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);
}

function buildSummary(score: number, factors: MatchFactorScores, missingSkills: string[]): string {
  const tops = topFactors(factors);
  const scorePct = Math.round(score * 100);

  if (missingSkills.length === 0) {
    return `Match score ${scorePct}% with strongest factors: ${tops.join(', ')}.`;
  }

  return `Match score ${scorePct}% with strongest factors: ${tops.join(', ')}. Missing skills: ${missingSkills.join(', ')}.`;
}

export function scoreMarketplaceMatch(input: {
  profile: MarketplaceProfileContext;
  profileSkills: string[];
  job: MarketplaceJobContext;
}): MatchResult {
  const { profile, profileSkills, job } = input;
  const { score: skillScore, missing } = skillOverlap(profileSkills, job.requiredSkills);

  const factorScores: MatchFactorScores = {
    skill_overlap: skillScore,
    seniority_fit: seniorityFit(profile.seniority, job.seniority),
    language_fit: languageFit(profile.languages, job.language),
    location_remote_fit: locationRemoteFit(
      profile.preferredLocations,
      profile.remoteOnly,
      job.location,
      job.remoteAllowed,
    ),
    keyword_relevance: keywordRelevance(profile, job),
  };

  const rawScore =
    factorScores.skill_overlap * WEIGHTS.skill_overlap +
    factorScores.seniority_fit * WEIGHTS.seniority_fit +
    factorScores.language_fit * WEIGHTS.language_fit +
    factorScores.location_remote_fit * WEIGHTS.location_remote_fit +
    factorScores.keyword_relevance * WEIGHTS.keyword_relevance;

  const score = clamp(Number(rawScore.toFixed(4)));

  const explanation: MatchExplanation = {
    top_factors: topFactors(factorScores),
    factor_scores: factorScores,
    missing_skills: missing,
    confidence: Number((0.5 + score * 0.5).toFixed(4)),
    fairness_adjustment_applied: false,
    summary: buildSummary(score, factorScores, missing),
  };

  return {
    score,
    explanation,
  };
}

export async function upsertMatchRecord(input: {
  profileId: string;
  jobPostId: string;
  score: number;
  explanation: MatchExplanation;
}): Promise<void> {
  const { profileId, jobPostId, score, explanation } = input;

  const existing = await db
    .select({ id: matches.id })
    .from(matches)
    .where(and(eq(matches.profileId, profileId), eq(matches.jobPostId, jobPostId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(matches)
      .set({
        score: score.toFixed(4),
        explanation,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, existing[0].id));
    return;
  }

  await db.insert(matches).values({
    profileId,
    jobPostId,
    score: score.toFixed(4),
    explanation,
  });
}
