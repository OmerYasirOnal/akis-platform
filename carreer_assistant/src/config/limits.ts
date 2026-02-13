export interface DailyLimits {
  maxDiscoverPerDay: number;
  maxShortlistPerDay: number;
  maxSubmitPerDay: number;
  maxOutreachPerDay: number;
  maxFollowUpPerDay: number;
}

export const DEFAULT_DAILY_LIMITS: DailyLimits = {
  maxDiscoverPerDay: 80,
  maxShortlistPerDay: 10,
  maxSubmitPerDay: 5,
  maxOutreachPerDay: 3,
  maxFollowUpPerDay: 10,
};

export const HARD_MAX_LIMITS: DailyLimits = {
  maxDiscoverPerDay: 200,
  maxShortlistPerDay: 20,
  maxSubmitPerDay: 10,
  maxOutreachPerDay: 5,
  maxFollowUpPerDay: 20,
};

export function loadDailyLimits(): DailyLimits {
  const env = process.env;

  return {
    maxDiscoverPerDay: clamp(
      parseEnvInt(env.MAX_DISCOVER_PER_DAY, DEFAULT_DAILY_LIMITS.maxDiscoverPerDay),
      1,
      HARD_MAX_LIMITS.maxDiscoverPerDay,
    ),
    maxShortlistPerDay: clamp(
      parseEnvInt(env.MAX_SHORTLIST_PER_DAY, DEFAULT_DAILY_LIMITS.maxShortlistPerDay),
      1,
      HARD_MAX_LIMITS.maxShortlistPerDay,
    ),
    maxSubmitPerDay: clamp(
      parseEnvInt(env.MAX_SUBMIT_PER_DAY, DEFAULT_DAILY_LIMITS.maxSubmitPerDay),
      1,
      HARD_MAX_LIMITS.maxSubmitPerDay,
    ),
    maxOutreachPerDay: clamp(
      parseEnvInt(env.MAX_OUTREACH_PER_DAY, DEFAULT_DAILY_LIMITS.maxOutreachPerDay),
      1,
      HARD_MAX_LIMITS.maxOutreachPerDay,
    ),
    maxFollowUpPerDay: clamp(
      parseEnvInt(env.MAX_FOLLOW_UP_PER_DAY, DEFAULT_DAILY_LIMITS.maxFollowUpPerDay),
      1,
      HARD_MAX_LIMITS.maxFollowUpPerDay,
    ),
  };
}

function parseEnvInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
