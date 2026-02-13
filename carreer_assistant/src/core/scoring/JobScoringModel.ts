import {
  TECH_KEYWORDS,
  TECH_POINTS,
  TECH_CAPS,
  AI_KEYWORDS,
  AI_POINTS,
  AI_CAPS,
  KNOWN_GOOD_COMPANIES,
  DEFAULT_SCORING_WEIGHTS,
  getRecommendation,
} from '../../config/scoring.js';
import type { UserProfile } from '../../config/user-profile.js';
import { applyHardFilters } from './HardFilter.js';
import { generateExplanation } from './ScoringExplainer.js';
import type { NormalizedJob, ScoredJob, ScoreBreakdown } from './types.js';

function normalize(text: string): string {
  return text.toLowerCase();
}

function countKeywordMatches(text: string, keywords: readonly string[]): number {
  const lower = normalize(text);
  return keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
}

export function scoreTechStack(job: NormalizedJob): number {
  const text = `${job.title} ${job.description} ${job.techStack.join(' ')}`;

  const tier1Matches = countKeywordMatches(text, TECH_KEYWORDS.tier1);
  const tier2Matches = countKeywordMatches(text, TECH_KEYWORDS.tier2);
  const tier3Matches = countKeywordMatches(text, TECH_KEYWORDS.tier3);

  const tier1Score = Math.min(tier1Matches * TECH_POINTS.tier1, TECH_CAPS.tier1);
  const tier2Score = Math.min(tier2Matches * TECH_POINTS.tier2, TECH_CAPS.tier2);
  const tier3Score = Math.min(tier3Matches * TECH_POINTS.tier3, TECH_CAPS.tier3);

  return Math.min(tier1Score + tier2Score + tier3Score, DEFAULT_SCORING_WEIGHTS.techStackMatch);
}

export function scoreAIKeywords(job: NormalizedJob): number {
  const text = `${job.title} ${job.description}`;

  const highMatches = countKeywordMatches(text, AI_KEYWORDS.high);
  const mediumMatches = countKeywordMatches(text, AI_KEYWORDS.medium);
  const lowMatches = countKeywordMatches(text, AI_KEYWORDS.low);

  const highScore = Math.min(highMatches * AI_POINTS.high, AI_CAPS.high);
  const mediumScore = Math.min(mediumMatches * AI_POINTS.medium, AI_CAPS.medium);
  const lowScore = Math.min(lowMatches * AI_POINTS.low, AI_CAPS.low);

  return Math.min(highScore + mediumScore + lowScore, DEFAULT_SCORING_WEIGHTS.aiKeywords);
}

export function scoreCompanyQuality(job: NormalizedJob): number {
  let score = 0;
  const text = normalize(`${job.companyName} ${job.description}`);

  const isKnownGood = KNOWN_GOOD_COMPANIES.some((c) =>
    text.includes(c.toLowerCase()),
  );
  if (isKnownGood) score += 5;

  const productKeywords = ['product', 'saas', 'platform', 'startup', 'ürün'];
  if (productKeywords.some((kw) => text.includes(kw))) score += 3;

  const fundedKeywords = ['series a', 'series b', 'series c', 'funded', 'yatırım'];
  if (fundedKeywords.some((kw) => text.includes(kw))) score += 3;

  const qualityKeywords = ['payment verified', 'spent', 'hires', '4.5', '4.6', '4.7', '4.8', '4.9', '5.0'];
  if (qualityKeywords.some((kw) => text.includes(kw))) score += 2;

  const repeatKeywords = ['long-term', 'ongoing', 'uzun vadeli'];
  if (repeatKeywords.some((kw) => text.includes(kw))) score += 2;

  return Math.min(score, DEFAULT_SCORING_WEIGHTS.companyQuality);
}

export function scoreSalaryInfo(job: NormalizedJob, profile: UserProfile): number {
  if (job.salaryMin !== null && job.salaryCurrency !== null) {
    const monthlySalary = job.salaryMin;
    const currency = job.salaryCurrency.toUpperCase();

    if (currency === 'TRY' || currency === 'TL') {
      if (monthlySalary >= profile.salaryFloorTRY) return 10;
      if (monthlySalary >= profile.salaryFloorTRY * 0.8) return 7;
      return 3;
    }

    if (currency === 'USD' || currency === '$') {
      if (monthlySalary >= 1500) return 10;
      if (monthlySalary >= 1000) return 7;
      return 3;
    }

    if (currency === 'EUR') {
      if (monthlySalary >= 1400) return 10;
      if (monthlySalary >= 900) return 7;
      return 3;
    }
  }

  if (job.hourlyRateMin !== null) {
    if (job.hourlyRateMin >= 15) return 10;
    if (job.hourlyRateMin >= 10) return 7;
    return 3;
  }

  const text = normalize(job.description);
  if (text.includes('competitive') || text.includes('market rate') || text.includes('piyasa')) {
    return 5;
  }

  return 0;
}

export function scoreApplicationEase(job: NormalizedJob): number {
  const text = normalize(`${job.description} ${job.title}`);

  if (text.includes('quick apply') || text.includes('easy apply') || text.includes('1-click')) {
    return 15;
  }

  if (text.includes('video') && (text.includes('submission') || text.includes('required'))) {
    return 2;
  }

  if (text.includes('unpaid test') || text.includes('free trial') || text.includes('assessment required')) {
    return 0;
  }

  if (text.includes('cover letter required') || text.includes('portfolio required')) {
    return 8;
  }

  switch (job.platform) {
    case 'upwork':
      return 12;
    case 'freelancer':
      return 12;
    case 'fiverr':
      return 10;
    case 'bionluk':
      return 10;
    case 'linkedin':
      return 8;
    default:
      return 8;
  }
}

export function scoreLocationMatch(job: NormalizedJob): number {
  if (job.workModel === 'remote') {
    const text = normalize(job.description);
    const usOnly = text.includes('us only') || text.includes('united states only')
      || text.includes('americas only');
    if (usOnly) return 3;

    const tzFriendly = text.includes('utc+') || text.includes('europe')
      || text.includes('emea') || text.includes('flexible timezone');
    if (tzFriendly) return 9;

    return 10;
  }

  if (job.workModel === 'hybrid') {
    const location = normalize(job.location ?? '');
    if (location.includes('istanbul') || location.includes('İstanbul')) return 7;
    if (location.includes('turkey') || location.includes('türkiye')) return 6;
    return 4;
  }

  if (job.workModel === 'onsite') {
    const location = normalize(job.location ?? '');
    if (location.includes('istanbul')) return 5;
    return 2;
  }

  return 5;
}

export function scoreJob(job: NormalizedJob, profile: UserProfile): ScoredJob {
  const filterResult = applyHardFilters(job, profile);
  if (!filterResult.pass) {
    const breakdown: ScoreBreakdown = {
      techStack: 0,
      aiKeywords: 0,
      companyQuality: 0,
      salaryInfo: 0,
      applicationEase: 0,
      locationMatch: 0,
    };
    return {
      ...job,
      score: 0,
      scoreBreakdown: breakdown,
      recommendation: 'skip',
      explanation: `Hard filter failed: ${filterResult.reason}`,
    };
  }

  const breakdown: ScoreBreakdown = {
    techStack: scoreTechStack(job),
    aiKeywords: scoreAIKeywords(job),
    companyQuality: scoreCompanyQuality(job),
    salaryInfo: scoreSalaryInfo(job, profile),
    applicationEase: scoreApplicationEase(job),
    locationMatch: scoreLocationMatch(job),
  };

  const total = Math.min(
    Object.values(breakdown).reduce((a, b) => a + b, 0),
    100,
  );

  const recommendation = getRecommendation(total);

  return {
    ...job,
    score: total,
    scoreBreakdown: breakdown,
    recommendation,
    explanation: generateExplanation(breakdown, total, recommendation),
  };
}

export function scoreAndRankJobs(jobs: NormalizedJob[], profile: UserProfile): ScoredJob[] {
  return jobs
    .map((job) => scoreJob(job, profile))
    .sort((a, b) => b.score - a.score);
}
