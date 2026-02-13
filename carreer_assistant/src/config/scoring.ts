export interface ScoringWeights {
  techStackMatch: number;
  aiKeywords: number;
  companyQuality: number;
  salaryInfo: number;
  applicationEase: number;
  locationMatch: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  techStackMatch: 30,
  aiKeywords: 20,
  companyQuality: 15,
  salaryInfo: 10,
  applicationEase: 15,
  locationMatch: 10,
};

export interface ScoringThresholds {
  apply: number;
  consider: number;
}

export const DEFAULT_THRESHOLDS: ScoringThresholds = {
  apply: 70,
  consider: 50,
};

export type Recommendation = 'apply' | 'consider' | 'skip';

export function getRecommendation(score: number, thresholds = DEFAULT_THRESHOLDS): Recommendation {
  if (score >= thresholds.apply) return 'apply';
  if (score >= thresholds.consider) return 'consider';
  return 'skip';
}

export const TECH_KEYWORDS = {
  tier1: ['typescript', 'javascript', 'nodejs', 'node.js', 'react', 'reactjs'],
  tier2: ['fastify', 'drizzle', 'postgresql', 'postgres', 'vite', 'tailwind', 'tailwindcss'],
  tier3: [
    'express', 'next.js', 'nextjs', 'vue', 'angular', 'sql', 'graphql',
    'rest', 'api', 'docker', 'git', 'github', 'css', 'html',
  ],
} as const;

export const TECH_POINTS = {
  tier1: 4,
  tier2: 3,
  tier3: 1,
} as const;

export const TECH_CAPS = {
  tier1: 20,
  tier2: 15,
  tier3: 5,
} as const;

export const AI_KEYWORDS = {
  high: ['ai agent', 'agentic', 'llm', 'large language model', 'copilot', 'mcp'],
  medium: ['artificial intelligence', 'machine learning', 'automation', 'workflow automation', 'chatbot'],
  low: ['openai', 'gpt', 'claude', 'langchain', 'vector', 'embedding', 'rag', 'prompt engineering'],
} as const;

export const AI_POINTS = {
  high: 6,
  medium: 4,
  low: 2,
} as const;

export const AI_CAPS = {
  high: 18,
  medium: 12,
  low: 6,
} as const;

export const ROLE_PASS_KEYWORDS = [
  'intern', 'junior', 'entry-level', 'entry level', 'graduate',
  'early career', '0-2 years', '0-1 years', '1-2 years',
  'stajyer', 'yeni mezun', 'başlangıç',
];

export const ROLE_FAIL_KEYWORDS = [
  'senior', 'lead', 'principal', 'staff', 'manager', 'director',
  'architect', 'head of', 'vp', 'vice president',
  '5+ years', '7+ years', '10+ years', '5-7 years', '7-10 years',
];

export const ROLE_TYPE_PASS_KEYWORDS = [
  'developer', 'engineer', 'programmer', 'full-stack', 'fullstack',
  'frontend', 'front-end', 'backend', 'back-end', 'software',
  'web developer', 'yazılımcı', 'geliştirici', 'mühendis',
];

export const ROLE_TYPE_FAIL_KEYWORDS = [
  'project manager', 'product manager', 'scrum master',
  'system admin', 'network engineer', 'data analyst',
  'marketing', 'sales', 'hr ', 'human resources',
];

export const KNOWN_GOOD_COMPANIES: string[] = [
  // Can be expanded with curated company list
];
