import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_DAILY_LIMITS, HARD_MAX_LIMITS, loadDailyLimits } from '../src/config/limits.js';
import { getRecommendation, DEFAULT_THRESHOLDS } from '../src/config/scoring.js';

describe('DEFAULT_DAILY_LIMITS', () => {
  it('has correct default values', () => {
    expect(DEFAULT_DAILY_LIMITS.maxDiscoverPerDay).toBe(80);
    expect(DEFAULT_DAILY_LIMITS.maxShortlistPerDay).toBe(10);
    expect(DEFAULT_DAILY_LIMITS.maxSubmitPerDay).toBe(5);
    expect(DEFAULT_DAILY_LIMITS.maxOutreachPerDay).toBe(3);
    expect(DEFAULT_DAILY_LIMITS.maxFollowUpPerDay).toBe(10);
  });
});

describe('HARD_MAX_LIMITS', () => {
  it('hard max is always >= default', () => {
    expect(HARD_MAX_LIMITS.maxDiscoverPerDay).toBeGreaterThanOrEqual(DEFAULT_DAILY_LIMITS.maxDiscoverPerDay);
    expect(HARD_MAX_LIMITS.maxShortlistPerDay).toBeGreaterThanOrEqual(DEFAULT_DAILY_LIMITS.maxShortlistPerDay);
    expect(HARD_MAX_LIMITS.maxSubmitPerDay).toBeGreaterThanOrEqual(DEFAULT_DAILY_LIMITS.maxSubmitPerDay);
    expect(HARD_MAX_LIMITS.maxOutreachPerDay).toBeGreaterThanOrEqual(DEFAULT_DAILY_LIMITS.maxOutreachPerDay);
    expect(HARD_MAX_LIMITS.maxFollowUpPerDay).toBeGreaterThanOrEqual(DEFAULT_DAILY_LIMITS.maxFollowUpPerDay);
  });
});

describe('loadDailyLimits', () => {
  beforeEach(() => {
    delete process.env.MAX_DISCOVER_PER_DAY;
    delete process.env.MAX_SHORTLIST_PER_DAY;
    delete process.env.MAX_SUBMIT_PER_DAY;
    delete process.env.MAX_OUTREACH_PER_DAY;
    delete process.env.MAX_FOLLOW_UP_PER_DAY;
  });

  it('returns defaults when no env vars set', () => {
    const limits = loadDailyLimits();
    expect(limits.maxDiscoverPerDay).toBe(80);
    expect(limits.maxSubmitPerDay).toBe(5);
  });

  it('respects env var overrides', () => {
    process.env.MAX_DISCOVER_PER_DAY = '50';
    process.env.MAX_SUBMIT_PER_DAY = '3';
    const limits = loadDailyLimits();
    expect(limits.maxDiscoverPerDay).toBe(50);
    expect(limits.maxSubmitPerDay).toBe(3);
  });

  it('clamps to hard max', () => {
    process.env.MAX_DISCOVER_PER_DAY = '999';
    const limits = loadDailyLimits();
    expect(limits.maxDiscoverPerDay).toBe(HARD_MAX_LIMITS.maxDiscoverPerDay);
  });

  it('clamps to minimum of 1', () => {
    process.env.MAX_SUBMIT_PER_DAY = '0';
    const limits = loadDailyLimits();
    expect(limits.maxSubmitPerDay).toBe(1);
  });
});

describe('getRecommendation', () => {
  it('returns apply for score >= 70', () => {
    expect(getRecommendation(70)).toBe('apply');
    expect(getRecommendation(85)).toBe('apply');
    expect(getRecommendation(100)).toBe('apply');
  });

  it('returns consider for score 50-69', () => {
    expect(getRecommendation(50)).toBe('consider');
    expect(getRecommendation(60)).toBe('consider');
    expect(getRecommendation(69)).toBe('consider');
  });

  it('returns skip for score < 50', () => {
    expect(getRecommendation(0)).toBe('skip');
    expect(getRecommendation(30)).toBe('skip');
    expect(getRecommendation(49)).toBe('skip');
  });

  it('uses custom thresholds', () => {
    expect(getRecommendation(60, { apply: 60, consider: 40 })).toBe('apply');
    expect(getRecommendation(50, { apply: 60, consider: 40 })).toBe('consider');
    expect(getRecommendation(30, { apply: 60, consider: 40 })).toBe('skip');
  });
});

describe('DEFAULT_THRESHOLDS', () => {
  it('has correct values', () => {
    expect(DEFAULT_THRESHOLDS.apply).toBe(70);
    expect(DEFAULT_THRESHOLDS.consider).toBe(50);
  });
});
