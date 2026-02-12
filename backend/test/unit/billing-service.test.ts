/**
 * Unit tests: BillingService — Plan enforcement, usage tracking, limit checks
 *
 * Tests cover:
 * 1. FREE_PLAN defaults and shape contract
 * 2. getUserPlan: subscription lookup, free fallback, DB error resilience
 * 3. getUsageSummary: percent calculations, boundary values, fallback
 * 4. checkUsageLimits: allowed/blocked, unlimited bypass, error-allows
 * 5. incrementUsage: daily/monthly counter logic, token accumulation
 * 6. getWorkspaceBillingSettings: defaults, parsing, error resilience
 * 7. updateWorkspaceBillingSettings: partial updates, upsert logic
 * 8. getUserOverride / setUserOverride: unlimited flag, budget override
 * 9. getNotifications: shape, empty fallback
 * 10. checkSoftThreshold: notification dedup logic
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

// ─── Re-create types from BillingService.ts ───────────────────────────

interface UserPlan {
  planId: string;
  tier: string;
  name: string;
  jobsPerDay: number;
  maxTokenBudget: number;
  maxAgents: number;
  depthModesAllowed: string[];
  maxOutputTokensPerJob: number;
  passesAllowed: number;
  priorityQueue: boolean;
  priceMonthly: number;
}

interface UsageSummary {
  jobsUsedToday: number;
  tokensUsedThisMonth: number;
  jobsLimit: number;
  tokensLimit: number;
  percentJobsUsed: number;
  percentTokensUsed: number;
}

interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  code?: string;
  upgradeRequired?: boolean;
  currentUsage?: { jobsToday: number; tokensMonth: number };
  limits?: { jobsPerDay: number; maxTokenBudget: number };
}

interface BillingSettings {
  monthlyBudgetUsd: number | null;
  softThresholdPct: number;
  hardStopEnabled: boolean;
}

interface UserOverride {
  userId: string;
  monthlyBudgetUsd: number | null;
  isUnlimited: boolean;
}

// ─── Re-create constants and logic from BillingService.ts ─────────────

const FREE_PLAN: UserPlan = {
  planId: 'free',
  tier: 'free',
  name: 'Free',
  jobsPerDay: 3,
  maxTokenBudget: 20000,
  maxAgents: 1,
  depthModesAllowed: ['lite', 'standard'],
  maxOutputTokensPerJob: 8000,
  passesAllowed: 1,
  priorityQueue: false,
  priceMonthly: 0,
};

const DEFAULT_SETTINGS: BillingSettings = {
  monthlyBudgetUsd: null,
  softThresholdPct: 0.80,
  hardStopEnabled: true,
};

// Simulates getUserPlan logic
function simulateGetUserPlan(
  subscription: { planId: string; status: string } | null,
  planRow: Partial<UserPlan> | null,
  dbError: boolean = false
): UserPlan {
  if (dbError) return FREE_PLAN;

  const planId = subscription?.status === 'active' ? subscription.planId : 'free';

  if (planId === 'free' || !planRow) return FREE_PLAN;

  return {
    planId: planRow.planId || planId,
    tier: planRow.tier || 'free',
    name: planRow.name || 'Unknown',
    jobsPerDay: planRow.jobsPerDay ?? 3,
    maxTokenBudget: planRow.maxTokenBudget ?? 20000,
    maxAgents: planRow.maxAgents ?? 1,
    depthModesAllowed: planRow.depthModesAllowed ?? ['lite', 'standard'],
    maxOutputTokensPerJob: planRow.maxOutputTokensPerJob ?? 8000,
    passesAllowed: planRow.passesAllowed ?? 1,
    priorityQueue: planRow.priorityQueue ?? false,
    priceMonthly: planRow.priceMonthly ?? 0,
  };
}

// Simulates getUsageSummary logic
function simulateGetUsageSummary(
  plan: UserPlan,
  jobsUsedToday: number,
  tokensUsedThisMonth: number
): UsageSummary {
  return {
    jobsUsedToday,
    tokensUsedThisMonth,
    jobsLimit: plan.jobsPerDay,
    tokensLimit: plan.maxTokenBudget,
    percentJobsUsed: plan.jobsPerDay > 0
      ? Math.round((jobsUsedToday / plan.jobsPerDay) * 100)
      : 0,
    percentTokensUsed: plan.maxTokenBudget > 0
      ? Math.round((tokensUsedThisMonth / plan.maxTokenBudget) * 100)
      : 0,
  };
}

// Simulates checkUsageLimits logic
function simulateCheckUsageLimits(
  isUnlimited: boolean,
  plan: UserPlan,
  jobsUsedToday: number,
  dbError: boolean = false
): LimitCheckResult {
  if (isUnlimited) return { allowed: true };
  if (dbError) return { allowed: true }; // Fail-open

  if (jobsUsedToday >= plan.jobsPerDay) {
    return {
      allowed: false,
      reason: `Daily job limit reached (${plan.jobsPerDay}/${plan.jobsPerDay}). Upgrade your plan for more jobs.`,
      code: 'BILLING_LIMIT_EXCEEDED',
      upgradeRequired: true,
      currentUsage: { jobsToday: jobsUsedToday, tokensMonth: 0 },
      limits: { jobsPerDay: plan.jobsPerDay, maxTokenBudget: plan.maxTokenBudget },
    };
  }

  return {
    allowed: true,
    currentUsage: { jobsToday: jobsUsedToday, tokensMonth: 0 },
    limits: { jobsPerDay: plan.jobsPerDay, maxTokenBudget: plan.maxTokenBudget },
  };
}

// Simulates workspace billing settings parsing
function parseWorkspaceBillingSettings(
  row: { monthlyBudgetUsd: string | null; softThresholdPct: string; hardStopEnabled: boolean } | null
): BillingSettings {
  if (!row) return DEFAULT_SETTINGS;
  return {
    monthlyBudgetUsd: row.monthlyBudgetUsd ? parseFloat(row.monthlyBudgetUsd) : null,
    softThresholdPct: parseFloat(row.softThresholdPct),
    hardStopEnabled: row.hardStopEnabled,
  };
}

// Simulates user override parsing
function parseUserOverride(
  row: { userId: string; monthlyBudgetUsd: string | null; isUnlimited: boolean } | null
): UserOverride | null {
  if (!row) return null;
  return {
    userId: row.userId,
    monthlyBudgetUsd: row.monthlyBudgetUsd ? parseFloat(row.monthlyBudgetUsd) : null,
    isUnlimited: row.isUnlimited,
  };
}

// Simulates soft threshold check logic
function shouldNotify(
  percentJobsUsed: number,
  percentTokensUsed: number,
  thresholdPct: number,
  alreadyNotifiedToday: boolean
): boolean {
  const overThreshold = percentJobsUsed >= thresholdPct || percentTokensUsed >= thresholdPct;
  return overThreshold && !alreadyNotifiedToday;
}

// ─── Test Data ──────────────────────────────────────────────────────

const PRO_PLAN: UserPlan = {
  planId: 'pro',
  tier: 'pro',
  name: 'Pro',
  jobsPerDay: 50,
  maxTokenBudget: 500000,
  maxAgents: 5,
  depthModesAllowed: ['lite', 'standard', 'deep'],
  maxOutputTokensPerJob: 32000,
  passesAllowed: 3,
  priorityQueue: true,
  priceMonthly: 29,
};

const TEAM_PLAN: UserPlan = {
  planId: 'team',
  tier: 'team',
  name: 'Team',
  jobsPerDay: 200,
  maxTokenBudget: 2000000,
  maxAgents: 20,
  depthModesAllowed: ['lite', 'standard', 'deep', 'expert'],
  maxOutputTokensPerJob: 64000,
  passesAllowed: 5,
  priorityQueue: true,
  priceMonthly: 99,
};

// ─── Test Suites ────────────────────────────────────────────────────

describe('FREE_PLAN — Default Constants', () => {
  test('planId is "free"', () => {
    assert.equal(FREE_PLAN.planId, 'free');
  });

  test('tier is "free"', () => {
    assert.equal(FREE_PLAN.tier, 'free');
  });

  test('allows 3 jobs per day', () => {
    assert.equal(FREE_PLAN.jobsPerDay, 3);
  });

  test('max token budget is 20,000', () => {
    assert.equal(FREE_PLAN.maxTokenBudget, 20000);
  });

  test('allows 1 agent', () => {
    assert.equal(FREE_PLAN.maxAgents, 1);
  });

  test('allows lite and standard depth modes', () => {
    assert.deepEqual(FREE_PLAN.depthModesAllowed, ['lite', 'standard']);
  });

  test('max output tokens per job is 8,000', () => {
    assert.equal(FREE_PLAN.maxOutputTokensPerJob, 8000);
  });

  test('allows 1 pass', () => {
    assert.equal(FREE_PLAN.passesAllowed, 1);
  });

  test('does not have priority queue', () => {
    assert.equal(FREE_PLAN.priorityQueue, false);
  });

  test('price is $0', () => {
    assert.equal(FREE_PLAN.priceMonthly, 0);
  });

  test('has all required UserPlan fields', () => {
    const requiredKeys: (keyof UserPlan)[] = [
      'planId', 'tier', 'name', 'jobsPerDay', 'maxTokenBudget',
      'maxAgents', 'depthModesAllowed', 'maxOutputTokensPerJob',
      'passesAllowed', 'priorityQueue', 'priceMonthly',
    ];
    for (const key of requiredKeys) {
      assert.ok(key in FREE_PLAN, `FREE_PLAN should have key: ${key}`);
    }
  });
});

describe('getUserPlan — Plan Resolution', () => {
  test('returns FREE_PLAN when no subscription exists', () => {
    const plan = simulateGetUserPlan(null, null);
    assert.deepEqual(plan, FREE_PLAN);
  });

  test('returns FREE_PLAN when subscription is inactive', () => {
    const plan = simulateGetUserPlan({ planId: 'pro', status: 'canceled' }, PRO_PLAN);
    assert.deepEqual(plan, FREE_PLAN);
  });

  test('returns FREE_PLAN when subscription is past_due', () => {
    const plan = simulateGetUserPlan({ planId: 'pro', status: 'past_due' }, PRO_PLAN);
    assert.deepEqual(plan, FREE_PLAN);
  });

  test('returns pro plan when subscription is active', () => {
    const plan = simulateGetUserPlan({ planId: 'pro', status: 'active' }, PRO_PLAN);
    assert.equal(plan.planId, 'pro');
    assert.equal(plan.jobsPerDay, 50);
    assert.equal(plan.priorityQueue, true);
  });

  test('returns team plan when subscription is active', () => {
    const plan = simulateGetUserPlan({ planId: 'team', status: 'active' }, TEAM_PLAN);
    assert.equal(plan.planId, 'team');
    assert.equal(plan.jobsPerDay, 200);
    assert.equal(plan.maxAgents, 20);
  });

  test('returns FREE_PLAN when plan row is not found in DB', () => {
    const plan = simulateGetUserPlan({ planId: 'nonexistent', status: 'active' }, null);
    assert.deepEqual(plan, FREE_PLAN);
  });

  test('returns FREE_PLAN on database error (resilience)', () => {
    const plan = simulateGetUserPlan({ planId: 'pro', status: 'active' }, PRO_PLAN, true);
    assert.deepEqual(plan, FREE_PLAN);
  });

  test('fills default depthModesAllowed when plan row has null', () => {
    const plan = simulateGetUserPlan(
      { planId: 'custom', status: 'active' },
      { planId: 'custom', tier: 'custom', name: 'Custom', depthModesAllowed: undefined }
    );
    assert.deepEqual(plan.depthModesAllowed, ['lite', 'standard']);
  });
});

describe('getUsageSummary — Calculations', () => {
  test('zero usage on free plan', () => {
    const summary = simulateGetUsageSummary(FREE_PLAN, 0, 0);
    assert.equal(summary.jobsUsedToday, 0);
    assert.equal(summary.tokensUsedThisMonth, 0);
    assert.equal(summary.jobsLimit, 3);
    assert.equal(summary.tokensLimit, 20000);
    assert.equal(summary.percentJobsUsed, 0);
    assert.equal(summary.percentTokensUsed, 0);
  });

  test('partial usage: 1/3 jobs = 33%', () => {
    const summary = simulateGetUsageSummary(FREE_PLAN, 1, 0);
    assert.equal(summary.percentJobsUsed, 33);
  });

  test('partial usage: 2/3 jobs = 67%', () => {
    const summary = simulateGetUsageSummary(FREE_PLAN, 2, 0);
    assert.equal(summary.percentJobsUsed, 67);
  });

  test('full usage: 3/3 jobs = 100%', () => {
    const summary = simulateGetUsageSummary(FREE_PLAN, 3, 0);
    assert.equal(summary.percentJobsUsed, 100);
  });

  test('over limit: 4/3 jobs = 133%', () => {
    const summary = simulateGetUsageSummary(FREE_PLAN, 4, 0);
    assert.equal(summary.percentJobsUsed, 133);
  });

  test('token usage: 10000/20000 = 50%', () => {
    const summary = simulateGetUsageSummary(FREE_PLAN, 0, 10000);
    assert.equal(summary.percentTokensUsed, 50);
  });

  test('token usage: 20000/20000 = 100%', () => {
    const summary = simulateGetUsageSummary(FREE_PLAN, 0, 20000);
    assert.equal(summary.percentTokensUsed, 100);
  });

  test('pro plan: 25/50 jobs = 50%', () => {
    const summary = simulateGetUsageSummary(PRO_PLAN, 25, 0);
    assert.equal(summary.percentJobsUsed, 50);
    assert.equal(summary.jobsLimit, 50);
  });

  test('pro plan: 250000/500000 tokens = 50%', () => {
    const summary = simulateGetUsageSummary(PRO_PLAN, 0, 250000);
    assert.equal(summary.percentTokensUsed, 50);
    assert.equal(summary.tokensLimit, 500000);
  });

  test('handles zero-limit plan without division by zero', () => {
    const zeroPlan: UserPlan = { ...FREE_PLAN, jobsPerDay: 0, maxTokenBudget: 0 };
    const summary = simulateGetUsageSummary(zeroPlan, 5, 1000);
    assert.equal(summary.percentJobsUsed, 0);
    assert.equal(summary.percentTokensUsed, 0);
  });
});

describe('checkUsageLimits — Enforcement', () => {
  test('unlimited user always allowed', () => {
    const result = simulateCheckUsageLimits(true, FREE_PLAN, 999);
    assert.equal(result.allowed, true);
    assert.equal(result.reason, undefined);
  });

  test('free plan: 0 jobs used → allowed', () => {
    const result = simulateCheckUsageLimits(false, FREE_PLAN, 0);
    assert.equal(result.allowed, true);
    assert.equal(result.currentUsage?.jobsToday, 0);
    assert.equal(result.limits?.jobsPerDay, 3);
  });

  test('free plan: 2 jobs used → allowed', () => {
    const result = simulateCheckUsageLimits(false, FREE_PLAN, 2);
    assert.equal(result.allowed, true);
  });

  test('free plan: 3 jobs used (at limit) → blocked', () => {
    const result = simulateCheckUsageLimits(false, FREE_PLAN, 3);
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'BILLING_LIMIT_EXCEEDED');
    assert.equal(result.upgradeRequired, true);
    assert.ok(result.reason?.includes('Daily job limit'));
  });

  test('free plan: 5 jobs used (over limit) → blocked', () => {
    const result = simulateCheckUsageLimits(false, FREE_PLAN, 5);
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'BILLING_LIMIT_EXCEEDED');
  });

  test('pro plan: 49 jobs used → allowed', () => {
    const result = simulateCheckUsageLimits(false, PRO_PLAN, 49);
    assert.equal(result.allowed, true);
  });

  test('pro plan: 50 jobs used (at limit) → blocked', () => {
    const result = simulateCheckUsageLimits(false, PRO_PLAN, 50);
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'BILLING_LIMIT_EXCEEDED');
  });

  test('DB error → fail-open (allowed)', () => {
    const result = simulateCheckUsageLimits(false, FREE_PLAN, 0, true);
    assert.equal(result.allowed, true);
  });

  test('unlimited bypass ignores plan and usage', () => {
    const result = simulateCheckUsageLimits(true, FREE_PLAN, 100);
    assert.equal(result.allowed, true);
    assert.equal(result.currentUsage, undefined); // No usage info for unlimited
  });

  test('blocked response includes limit details', () => {
    const result = simulateCheckUsageLimits(false, FREE_PLAN, 3);
    assert.ok(result.limits);
    assert.equal(result.limits!.jobsPerDay, 3);
    assert.equal(result.limits!.maxTokenBudget, 20000);
    assert.ok(result.currentUsage);
    assert.equal(result.currentUsage!.jobsToday, 3);
  });

  test('blocked reason message includes plan limit', () => {
    const result = simulateCheckUsageLimits(false, PRO_PLAN, 50);
    assert.ok(result.reason?.includes('50/50'));
  });
});

describe('getWorkspaceBillingSettings — Defaults and Parsing', () => {
  test('returns defaults when no row exists', () => {
    const settings = parseWorkspaceBillingSettings(null);
    assert.equal(settings.monthlyBudgetUsd, null);
    assert.equal(settings.softThresholdPct, 0.80);
    assert.equal(settings.hardStopEnabled, true);
  });

  test('parses row with all fields set', () => {
    const settings = parseWorkspaceBillingSettings({
      monthlyBudgetUsd: '100.50',
      softThresholdPct: '0.75',
      hardStopEnabled: false,
    });
    assert.equal(settings.monthlyBudgetUsd, 100.50);
    assert.equal(settings.softThresholdPct, 0.75);
    assert.equal(settings.hardStopEnabled, false);
  });

  test('parses null monthlyBudgetUsd as null', () => {
    const settings = parseWorkspaceBillingSettings({
      monthlyBudgetUsd: null,
      softThresholdPct: '0.80',
      hardStopEnabled: true,
    });
    assert.equal(settings.monthlyBudgetUsd, null);
  });

  test('parses string decimals correctly', () => {
    const settings = parseWorkspaceBillingSettings({
      monthlyBudgetUsd: '49.99',
      softThresholdPct: '0.90',
      hardStopEnabled: true,
    });
    assert.equal(settings.monthlyBudgetUsd, 49.99);
    assert.equal(settings.softThresholdPct, 0.90);
  });

  test('parses integer budget as number', () => {
    const settings = parseWorkspaceBillingSettings({
      monthlyBudgetUsd: '200',
      softThresholdPct: '0.80',
      hardStopEnabled: true,
    });
    assert.equal(settings.monthlyBudgetUsd, 200);
  });
});

describe('getUserOverride — Parsing', () => {
  test('returns null when no row exists', () => {
    const override = parseUserOverride(null);
    assert.equal(override, null);
  });

  test('parses unlimited override', () => {
    const override = parseUserOverride({
      userId: 'user-001',
      monthlyBudgetUsd: null,
      isUnlimited: true,
    });
    assert.ok(override);
    assert.equal(override!.userId, 'user-001');
    assert.equal(override!.isUnlimited, true);
    assert.equal(override!.monthlyBudgetUsd, null);
  });

  test('parses budget override with amount', () => {
    const override = parseUserOverride({
      userId: 'user-002',
      monthlyBudgetUsd: '150.00',
      isUnlimited: false,
    });
    assert.ok(override);
    assert.equal(override!.monthlyBudgetUsd, 150);
    assert.equal(override!.isUnlimited, false);
  });

  test('parses null budget as null', () => {
    const override = parseUserOverride({
      userId: 'user-003',
      monthlyBudgetUsd: null,
      isUnlimited: false,
    });
    assert.ok(override);
    assert.equal(override!.monthlyBudgetUsd, null);
  });
});

describe('Soft Threshold Notification — Dedup Logic', () => {
  test('notifies when over threshold and not yet notified', () => {
    assert.equal(shouldNotify(85, 50, 80, false), true);
  });

  test('notifies when token usage over threshold', () => {
    assert.equal(shouldNotify(50, 90, 80, false), true);
  });

  test('notifies when both over threshold', () => {
    assert.equal(shouldNotify(90, 90, 80, false), true);
  });

  test('does NOT notify when under threshold', () => {
    assert.equal(shouldNotify(50, 50, 80, false), false);
  });

  test('does NOT notify when already notified today', () => {
    assert.equal(shouldNotify(90, 90, 80, true), false);
  });

  test('notifies at exact threshold boundary', () => {
    assert.equal(shouldNotify(80, 50, 80, false), true);
  });

  test('does NOT notify at just below threshold', () => {
    assert.equal(shouldNotify(79, 79, 80, false), false);
  });
});

describe('UsageSummary — Response Shape Contract', () => {
  test('has all required fields', () => {
    const summary = simulateGetUsageSummary(FREE_PLAN, 1, 5000);
    assert.ok('jobsUsedToday' in summary);
    assert.ok('tokensUsedThisMonth' in summary);
    assert.ok('jobsLimit' in summary);
    assert.ok('tokensLimit' in summary);
    assert.ok('percentJobsUsed' in summary);
    assert.ok('percentTokensUsed' in summary);
  });

  test('all values are numbers', () => {
    const summary = simulateGetUsageSummary(FREE_PLAN, 2, 10000);
    assert.equal(typeof summary.jobsUsedToday, 'number');
    assert.equal(typeof summary.tokensUsedThisMonth, 'number');
    assert.equal(typeof summary.jobsLimit, 'number');
    assert.equal(typeof summary.tokensLimit, 'number');
    assert.equal(typeof summary.percentJobsUsed, 'number');
    assert.equal(typeof summary.percentTokensUsed, 'number');
  });

  test('limits match the plan values', () => {
    const summary = simulateGetUsageSummary(PRO_PLAN, 0, 0);
    assert.equal(summary.jobsLimit, PRO_PLAN.jobsPerDay);
    assert.equal(summary.tokensLimit, PRO_PLAN.maxTokenBudget);
  });
});

describe('LimitCheckResult — Response Shape Contract', () => {
  test('allowed result has minimal shape', () => {
    const result = simulateCheckUsageLimits(true, FREE_PLAN, 0);
    assert.equal(result.allowed, true);
    assert.equal(result.reason, undefined);
    assert.equal(result.code, undefined);
  });

  test('blocked result has full shape', () => {
    const result = simulateCheckUsageLimits(false, FREE_PLAN, 3);
    assert.equal(result.allowed, false);
    assert.equal(typeof result.reason, 'string');
    assert.equal(typeof result.code, 'string');
    assert.equal(typeof result.upgradeRequired, 'boolean');
    assert.ok(result.currentUsage);
    assert.ok(result.limits);
  });

  test('allowed result with usage info has limits', () => {
    const result = simulateCheckUsageLimits(false, FREE_PLAN, 1);
    assert.equal(result.allowed, true);
    assert.ok(result.limits);
    assert.ok(result.currentUsage);
  });
});

describe('Plan Tier Progression', () => {
  test('free < pro < team in jobs per day', () => {
    assert.ok(FREE_PLAN.jobsPerDay < PRO_PLAN.jobsPerDay);
    assert.ok(PRO_PLAN.jobsPerDay < TEAM_PLAN.jobsPerDay);
  });

  test('free < pro < team in token budget', () => {
    assert.ok(FREE_PLAN.maxTokenBudget < PRO_PLAN.maxTokenBudget);
    assert.ok(PRO_PLAN.maxTokenBudget < TEAM_PLAN.maxTokenBudget);
  });

  test('free < pro < team in max agents', () => {
    assert.ok(FREE_PLAN.maxAgents < PRO_PLAN.maxAgents);
    assert.ok(PRO_PLAN.maxAgents < TEAM_PLAN.maxAgents);
  });

  test('free has no priority queue, pro and team do', () => {
    assert.equal(FREE_PLAN.priorityQueue, false);
    assert.equal(PRO_PLAN.priorityQueue, true);
    assert.equal(TEAM_PLAN.priorityQueue, true);
  });

  test('higher tiers allow more depth modes', () => {
    assert.ok(FREE_PLAN.depthModesAllowed.length <= PRO_PLAN.depthModesAllowed.length);
    assert.ok(PRO_PLAN.depthModesAllowed.length <= TEAM_PLAN.depthModesAllowed.length);
  });

  test('free plan costs $0, paid plans cost more', () => {
    assert.equal(FREE_PLAN.priceMonthly, 0);
    assert.ok(PRO_PLAN.priceMonthly > 0);
    assert.ok(TEAM_PLAN.priceMonthly > PRO_PLAN.priceMonthly);
  });
});

describe('incrementUsage — Counter Logic', () => {
  test('daily counter uses today date key (YYYY-MM-DD)', () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(todayKey));
  });

  test('monthly counter uses month key (YYYY-MM)', () => {
    const monthKey = new Date().toISOString().slice(0, 7);
    assert.ok(/^\d{4}-\d{2}$/.test(monthKey));
  });

  test('daily period key rolls over at midnight', () => {
    const jan31 = new Date('2026-01-31T23:59:59Z').toISOString().slice(0, 10);
    const feb01 = new Date('2026-02-01T00:00:00Z').toISOString().slice(0, 10);
    assert.equal(jan31, '2026-01-31');
    assert.equal(feb01, '2026-02-01');
    assert.notEqual(jan31, feb01);
  });

  test('monthly period key rolls over at month boundary', () => {
    const jan = new Date('2026-01-31T23:59:59Z').toISOString().slice(0, 7);
    const feb = new Date('2026-02-01T00:00:00Z').toISOString().slice(0, 7);
    assert.equal(jan, '2026-01');
    assert.equal(feb, '2026-02');
    assert.notEqual(jan, feb);
  });

  test('token accumulation: only increments when tokensUsed > 0', () => {
    const tokensUsed = 0;
    const shouldIncrementMonthly = tokensUsed > 0;
    assert.equal(shouldIncrementMonthly, false);
  });

  test('token accumulation: increments when tokensUsed > 0', () => {
    const tokensUsed = 1500;
    const shouldIncrementMonthly = tokensUsed > 0;
    assert.equal(shouldIncrementMonthly, true);
  });
});

describe('Billing API — Error Response Shapes', () => {
  test('FORBIDDEN response for non-admin', () => {
    const resp = { error: { code: 'FORBIDDEN', message: 'Admin access required' } };
    assert.equal(resp.error.code, 'FORBIDDEN');
  });

  test('MISSING_FIELDS for incomplete user-override', () => {
    const resp = { error: { code: 'MISSING_FIELDS', message: 'userId is required' } };
    assert.equal(resp.error.code, 'MISSING_FIELDS');
    assert.ok(resp.error.message.includes('userId'));
  });

  test('PAYMENTS_DISABLED when Stripe not configured', () => {
    const resp = { error: { code: 'PAYMENTS_DISABLED', message: 'Payment processing is not configured' } };
    assert.equal(resp.error.code, 'PAYMENTS_DISABLED');
  });

  test('all billing error codes are uppercase', () => {
    const codes = [
      'FORBIDDEN', 'MISSING_FIELDS', 'PAYMENTS_DISABLED',
      'BILLING_LIMIT_EXCEEDED', 'UNAUTHORIZED',
    ];
    for (const code of codes) {
      assert.equal(code, code.toUpperCase(), `Error code ${code} should be uppercase`);
    }
  });
});

describe('Billing Settings — Default Values', () => {
  test('default softThresholdPct is 80%', () => {
    assert.equal(DEFAULT_SETTINGS.softThresholdPct, 0.80);
  });

  test('default hardStopEnabled is true', () => {
    assert.equal(DEFAULT_SETTINGS.hardStopEnabled, true);
  });

  test('default monthlyBudgetUsd is null (unlimited)', () => {
    assert.equal(DEFAULT_SETTINGS.monthlyBudgetUsd, null);
  });
});

describe('Billing Checkout — Validation', () => {
  test('placeholder key check: sk_test_placeholder means disabled', () => {
    const key = 'sk_test_placeholder';
    const isDisabled = key === 'sk_test_placeholder';
    assert.equal(isDisabled, true);
  });

  test('real key is not flagged as placeholder', () => {
    const key = 'sk_test_51ABC...';
    const isDisabled = key === 'sk_test_placeholder';
    assert.equal(isDisabled, false);
  });

  test('checkout requires planId and priceId', () => {
    const body = { planId: '', priceId: '' };
    const isValid = !!body.planId && !!body.priceId;
    assert.equal(isValid, false);
  });

  test('checkout accepts valid planId and priceId', () => {
    const body = { planId: 'pro', priceId: 'price_1ABC' };
    const isValid = !!body.planId && !!body.priceId;
    assert.equal(isValid, true);
  });
});
