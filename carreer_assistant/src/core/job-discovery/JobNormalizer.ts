import { randomUUID } from 'node:crypto';
import type { PlatformType } from '../../config/platforms.js';
import type { NormalizedJob } from '../scoring/types.js';

export interface RawJobData {
  platformJobId: string;
  title: string;
  description: string;
  companyName?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  hourlyRateMin?: number | null;
  hourlyRateMax?: number | null;
  workModel?: string;
  location?: string | null;
  roleLevel?: string;
  techStack?: string[];
  url: string;
  raw?: Record<string, unknown>;
}

export function normalizeJob(platform: PlatformType, raw: RawJobData): NormalizedJob {
  return {
    id: randomUUID(),
    platform,
    platformJobId: raw.platformJobId,
    title: raw.title.trim(),
    description: raw.description.trim(),
    companyName: raw.companyName?.trim() ?? '',
    salaryMin: raw.salaryMin ?? null,
    salaryMax: raw.salaryMax ?? null,
    salaryCurrency: raw.salaryCurrency ?? null,
    hourlyRateMin: raw.hourlyRateMin ?? null,
    hourlyRateMax: raw.hourlyRateMax ?? null,
    workModel: parseWorkModel(raw.workModel ?? '', raw.description),
    location: raw.location ?? null,
    roleLevel: parseRoleLevel(raw.roleLevel ?? '', raw.title, raw.description),
    techStack: raw.techStack ?? extractTechStack(raw.description),
    url: raw.url,
    discoveredAt: new Date().toISOString(),
    state: 'discovered',
    archived: false,
    raw: raw.raw,
  };
}

function parseWorkModel(
  explicit: string,
  description: string,
): NormalizedJob['workModel'] {
  const lower = explicit.toLowerCase();
  if (lower.includes('remote')) return 'remote';
  if (lower.includes('hybrid')) return 'hybrid';
  if (lower.includes('onsite') || lower.includes('on-site') || lower.includes('office')) return 'onsite';

  const desc = description.toLowerCase();
  if (desc.includes('fully remote') || desc.includes('100% remote') || desc.includes('work from anywhere')) return 'remote';
  if (desc.includes('hybrid') || desc.includes('partly remote')) return 'hybrid';
  if (desc.includes('on-site') || desc.includes('in-office') || desc.includes('ofiste')) return 'onsite';

  return 'unknown';
}

function parseRoleLevel(
  explicit: string,
  title: string,
  description: string,
): NormalizedJob['roleLevel'] {
  const combined = `${explicit} ${title} ${description}`.toLowerCase();

  if (combined.includes('intern') || combined.includes('stajyer') || combined.includes('staj')) return 'intern';
  if (combined.includes('junior') || combined.includes('entry-level') || combined.includes('entry level') || combined.includes('yeni mezun')) return 'junior';
  if (combined.includes('senior') || combined.includes('sr.') || combined.includes('kıdemli')) return 'senior';
  if (combined.includes('lead') || combined.includes('principal') || combined.includes('staff')) return 'lead';
  if (combined.includes('mid-level') || combined.includes('mid level') || combined.includes('intermediate')) return 'mid';

  return 'unknown';
}

function extractTechStack(description: string): string[] {
  const lower = description.toLowerCase();
  const allKeywords = [
    'typescript', 'javascript', 'python', 'java', 'go', 'rust', 'c#', 'c++', 'ruby', 'php',
    'react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'nuxt',
    'node.js', 'nodejs', 'express', 'fastify', 'nestjs', 'deno',
    'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'sqlite',
    'docker', 'kubernetes', 'aws', 'gcp', 'azure',
    'graphql', 'rest', 'grpc',
    'tailwind', 'css', 'sass',
    'git', 'github', 'gitlab',
    'vite', 'webpack',
    'drizzle', 'prisma', 'typeorm', 'sequelize',
  ];

  return allKeywords.filter((kw) => lower.includes(kw));
}
