/**
 * BillingService — Plan enforcement, usage tracking, Stripe integration
 */
import { db } from '../../db/client.js';
import { plans, subscriptions, usageCounters } from '../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

export interface UserPlan {
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

export interface UsageSummary {
  jobsUsedToday: number;
  tokensUsedThisMonth: number;
  jobsLimit: number;
  tokensLimit: number;
  percentJobsUsed: number;
  percentTokensUsed: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentUsage?: { jobsToday: number; tokensMonth: number };
  limits?: { jobsPerDay: number; maxTokenBudget: number };
}

/**
 * Get the active plan for a user. Falls back to 'free' if no subscription.
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  // Find active subscription
  const sub = await db
    .select({
      planId: subscriptions.planId,
      status: subscriptions.status,
    })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1);

  const planId = sub.length > 0 ? sub[0].planId : 'free';

  const plan = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (plan.length === 0) {
    // Fallback to free defaults
    return {
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
  }

  const p = plan[0];
  return {
    planId: p.id,
    tier: p.tier,
    name: p.name,
    jobsPerDay: p.jobsPerDay,
    maxTokenBudget: p.maxTokenBudget,
    maxAgents: p.maxAgents,
    depthModesAllowed: p.depthModesAllowed ?? ['lite', 'standard'],
    maxOutputTokensPerJob: p.maxOutputTokensPerJob,
    passesAllowed: p.passesAllowed,
    priorityQueue: p.priorityQueue,
    priceMonthly: p.priceMonthly,
  };
}

/**
 * Get usage summary for a user
 */
export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const plan = await getUserPlan(userId);

  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const monthKey = new Date().toISOString().slice(0, 7);  // YYYY-MM

  const [dailyUsage] = await db
    .select({ jobsUsed: usageCounters.jobsUsed })
    .from(usageCounters)
    .where(and(
      eq(usageCounters.userId, userId),
      eq(usageCounters.periodKey, todayKey),
      eq(usageCounters.periodType, 'daily'),
    ))
    .limit(1);

  const [monthlyUsage] = await db
    .select({ tokensUsed: usageCounters.tokensUsed })
    .from(usageCounters)
    .where(and(
      eq(usageCounters.userId, userId),
      eq(usageCounters.periodKey, monthKey),
      eq(usageCounters.periodType, 'monthly'),
    ))
    .limit(1);

  const jobsUsedToday = dailyUsage?.jobsUsed ?? 0;
  const tokensUsedThisMonth = monthlyUsage?.tokensUsed ?? 0;

  return {
    jobsUsedToday,
    tokensUsedThisMonth,
    jobsLimit: plan.jobsPerDay,
    tokensLimit: plan.maxTokenBudget,
    percentJobsUsed: plan.jobsPerDay > 0 ? Math.round((jobsUsedToday / plan.jobsPerDay) * 100) : 0,
    percentTokensUsed: plan.maxTokenBudget > 0 ? Math.round((tokensUsedThisMonth / plan.maxTokenBudget) * 100) : 0,
  };
}

/**
 * Check if a user can start a new job (pre-flight limit check)
 */
export async function checkUsageLimits(userId: string): Promise<LimitCheckResult> {
  const plan = await getUserPlan(userId);
  const todayKey = new Date().toISOString().slice(0, 10);

  const [dailyUsage] = await db
    .select({ jobsUsed: usageCounters.jobsUsed })
    .from(usageCounters)
    .where(and(
      eq(usageCounters.userId, userId),
      eq(usageCounters.periodKey, todayKey),
      eq(usageCounters.periodType, 'daily'),
    ))
    .limit(1);

  const jobsToday = dailyUsage?.jobsUsed ?? 0;

  if (jobsToday >= plan.jobsPerDay) {
    return {
      allowed: false,
      reason: `Daily job limit reached (${plan.jobsPerDay}/${plan.jobsPerDay}). Upgrade your plan for more jobs.`,
      upgradeRequired: true,
      currentUsage: { jobsToday, tokensMonth: 0 },
      limits: { jobsPerDay: plan.jobsPerDay, maxTokenBudget: plan.maxTokenBudget },
    };
  }

  return {
    allowed: true,
    currentUsage: { jobsToday, tokensMonth: 0 },
    limits: { jobsPerDay: plan.jobsPerDay, maxTokenBudget: plan.maxTokenBudget },
  };
}

/**
 * Increment usage counters after a job runs
 */
export async function incrementUsage(userId: string, tokensUsed: number = 0): Promise<void> {
  const todayKey = new Date().toISOString().slice(0, 10);
  const monthKey = new Date().toISOString().slice(0, 7);

  // Upsert daily counter (job count)
  await db
    .insert(usageCounters)
    .values({
      userId,
      periodKey: todayKey,
      periodType: 'daily',
      jobsUsed: 1,
      tokensUsed: 0,
    })
    .onConflictDoUpdate({
      target: [usageCounters.userId, usageCounters.periodKey, usageCounters.periodType],
      set: {
        jobsUsed: sql`${usageCounters.jobsUsed} + 1`,
        updatedAt: new Date(),
      },
    });

  // Upsert monthly counter (token usage)
  if (tokensUsed > 0) {
    await db
      .insert(usageCounters)
      .values({
        userId,
        periodKey: monthKey,
        periodType: 'monthly',
        jobsUsed: 0,
        tokensUsed,
      })
      .onConflictDoUpdate({
        target: [usageCounters.userId, usageCounters.periodKey, usageCounters.periodType],
        set: {
          tokensUsed: sql`${usageCounters.tokensUsed} + ${tokensUsed}`,
          updatedAt: new Date(),
        },
      });
  }
}

/**
 * Get all available plans (for pricing page / plan selector)
 */
export async function getAvailablePlans() {
  return db
    .select()
    .from(plans)
    .where(eq(plans.isActive, true))
    .orderBy(plans.sortOrder);
}
