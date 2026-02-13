import { describe, it, expect } from 'vitest';
import {
  scoreTechStack,
  scoreAIKeywords,
  scoreCompanyQuality,
  scoreSalaryInfo,
  scoreApplicationEase,
  scoreLocationMatch,
} from '../src/core/scoring/JobScoringModel.js';
import { DEFAULT_USER_PROFILE } from '../src/config/user-profile.js';
import type { NormalizedJob } from '../src/core/scoring/types.js';

function makeJob(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    id: 'test-1',
    platform: 'upwork',
    platformJobId: 'up-1',
    title: 'Junior Developer',
    description: 'We need a developer',
    companyName: 'Test Corp',
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    hourlyRateMin: null,
    hourlyRateMax: null,
    workModel: 'remote',
    location: null,
    roleLevel: 'junior',
    techStack: [],
    url: 'https://example.com',
    discoveredAt: new Date().toISOString(),
    state: 'discovered',
    archived: false,
    ...overrides,
  };
}

describe('scoreTechStack', () => {
  it('scores 0 for no tech keywords', () => {
    const job = makeJob({ description: 'Looking for someone to help' });
    expect(scoreTechStack(job)).toBe(0);
  });

  it('scores high for multiple tier1 matches', () => {
    const job = makeJob({
      description: 'Need TypeScript and React developer with Node.js experience',
      techStack: ['typescript', 'react', 'nodejs'],
    });
    const score = scoreTechStack(job);
    expect(score).toBeGreaterThanOrEqual(12);
  });

  it('caps at 30', () => {
    const job = makeJob({
      description: 'TypeScript JavaScript React Node.js Fastify Drizzle PostgreSQL Vite Tailwind Express Docker Git',
      techStack: ['typescript', 'javascript', 'react', 'nodejs', 'fastify', 'drizzle', 'postgresql', 'vite', 'tailwind'],
    });
    expect(scoreTechStack(job)).toBeLessThanOrEqual(30);
  });
});

describe('scoreAIKeywords', () => {
  it('scores 0 for no AI keywords', () => {
    const job = makeJob({ description: 'Build a simple website' });
    expect(scoreAIKeywords(job)).toBe(0);
  });

  it('scores high for AI-focused job', () => {
    const job = makeJob({
      description: 'Build AI agent with LLM integration and workflow automation',
    });
    expect(scoreAIKeywords(job)).toBeGreaterThanOrEqual(10);
  });

  it('caps at 20', () => {
    const job = makeJob({
      description: 'AI agent agentic LLM copilot MCP artificial intelligence machine learning automation workflow chatbot openai gpt claude langchain vector embedding rag prompt engineering',
    });
    expect(scoreAIKeywords(job)).toBeLessThanOrEqual(20);
  });
});

describe('scoreCompanyQuality', () => {
  it('scores 0 for unknown company', () => {
    const job = makeJob({ description: 'Quick job needed' });
    expect(scoreCompanyQuality(job)).toBe(0);
  });

  it('scores for product company indicators', () => {
    const job = makeJob({
      description: 'We are a SaaS platform funded by Series A investors, looking for long-term developer',
    });
    expect(scoreCompanyQuality(job)).toBeGreaterThanOrEqual(5);
  });
});

describe('scoreSalaryInfo', () => {
  it('returns 0 for no salary info', () => {
    const job = makeJob();
    expect(scoreSalaryInfo(job, DEFAULT_USER_PROFILE)).toBe(0);
  });

  it('scores 10 for salary above floor', () => {
    const job = makeJob({ salaryMin: 60000, salaryCurrency: 'TRY' });
    expect(scoreSalaryInfo(job, DEFAULT_USER_PROFILE)).toBe(10);
  });

  it('scores 7 for salary near floor', () => {
    const job = makeJob({ salaryMin: 42000, salaryCurrency: 'TRY' });
    expect(scoreSalaryInfo(job, DEFAULT_USER_PROFILE)).toBe(7);
  });

  it('scores 10 for good hourly rate', () => {
    const job = makeJob({ hourlyRateMin: 20 });
    expect(scoreSalaryInfo(job, DEFAULT_USER_PROFILE)).toBe(10);
  });

  it('scores 5 for competitive mention', () => {
    const job = makeJob({ description: 'Competitive salary and benefits' });
    expect(scoreSalaryInfo(job, DEFAULT_USER_PROFILE)).toBe(5);
  });
});

describe('scoreApplicationEase', () => {
  it('scores 15 for quick apply', () => {
    const job = makeJob({ description: 'Quick Apply available' });
    expect(scoreApplicationEase(job)).toBe(15);
  });

  it('scores 2 for video submission', () => {
    const job = makeJob({ description: 'Video submission required for application' });
    expect(scoreApplicationEase(job)).toBe(2);
  });

  it('returns platform default for generic job', () => {
    const job = makeJob({ platform: 'upwork' });
    expect(scoreApplicationEase(job)).toBe(12);
  });
});

describe('scoreLocationMatch', () => {
  it('scores 10 for fully remote', () => {
    const job = makeJob({ workModel: 'remote' });
    expect(scoreLocationMatch(job)).toBe(10);
  });

  it('scores 3 for US-only remote', () => {
    const job = makeJob({ workModel: 'remote', description: 'US only, united states only' });
    expect(scoreLocationMatch(job)).toBe(3);
  });

  it('scores 7 for Istanbul hybrid', () => {
    const job = makeJob({ workModel: 'hybrid', location: 'Istanbul, Turkey' });
    expect(scoreLocationMatch(job)).toBe(7);
  });

  it('scores lower for non-Istanbul onsite', () => {
    const job = makeJob({ workModel: 'onsite', location: 'Berlin, Germany' });
    expect(scoreLocationMatch(job)).toBe(2);
  });
});
