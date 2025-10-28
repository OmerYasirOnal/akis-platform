import "server-only";

/**
 * LLM Token Usage Tracker & Budget Enforcer
 * 
 * Features:
 * - Track daily token usage (prompt + completion)
 * - Enforce daily budget cap
 * - Reset counter at midnight (server timezone)
 * - Warn at 80% threshold
 * - In-memory storage (for simple deployments)
 * 
 * Environment Variables:
 * - LLM_BUDGET_DAILY_TOKENS: Max tokens per day (default: 200000)
 * - ALLOW_LLM_OVER_BUDGET: Allow exceeding budget (default: false)
 */

import { logger } from "@/shared/lib/utils/logger";

interface UsageStats {
  date: string; // YYYY-MM-DD
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
}

// In-memory storage (reset on server restart)
let currentStats: UsageStats = {
  date: getCurrentDateString(),
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  requestCount: 0,
};

/**
 * Get current date as YYYY-MM-DD string (server timezone)
 */
function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get daily budget from env
 */
function getDailyBudget(): number {
  const budget = parseInt(process.env.LLM_BUDGET_DAILY_TOKENS || '200000');
  return budget;
}

/**
 * Check if over-budget is allowed
 */
function isOverBudgetAllowed(): boolean {
  return process.env.ALLOW_LLM_OVER_BUDGET === 'true';
}

/**
 * Reset stats if date changed
 */
function checkAndResetIfNeeded() {
  const today = getCurrentDateString();
  
  if (currentStats.date !== today) {
    logger.info('LLMUsage', `📅 New day detected, resetting stats (was: ${currentStats.date}, now: ${today})`);
    
    // Log previous day stats before reset
    logger.info('LLMUsage', `Yesterday's usage: ${currentStats.totalTokens} tokens (${currentStats.requestCount} requests)`);
    
    currentStats = {
      date: today,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      requestCount: 0,
    };
  }
}

/**
 * Track token usage
 * @throws Error if budget exceeded and ALLOW_LLM_OVER_BUDGET is false
 */
export function trackLLMUsage(usage: {
  promptTokens: number;
  completionTokens: number;
  model?: string;
  requestId?: string;
}): void {
  checkAndResetIfNeeded();

  const { promptTokens, completionTokens, model, requestId } = usage;
  const totalForRequest = promptTokens + completionTokens;
  const budget = getDailyBudget();

  // Update stats
  currentStats.promptTokens += promptTokens;
  currentStats.completionTokens += completionTokens;
  currentStats.totalTokens += totalForRequest;
  currentStats.requestCount += 1;

  const percentUsed = Math.round((currentStats.totalTokens / budget) * 100);
  const rid = requestId ? `[${requestId}]` : '';

  // Log current request
  logger.info(
    'LLMUsage',
    `${rid} ${model || 'unknown'}: +${totalForRequest} tokens (${promptTokens}p + ${completionTokens}c) | Daily: ${currentStats.totalTokens}/${budget} (${percentUsed}%)`
  );

  // Warn at 80%
  if (percentUsed >= 80 && percentUsed < 100) {
    logger.warn(
      'LLMUsage',
      `⚠️ ${rid} Daily LLM budget at ${percentUsed}%! Remaining: ${budget - currentStats.totalTokens} tokens`
    );
  }

  // Check if over budget
  if (currentStats.totalTokens > budget) {
    const overBudget = currentStats.totalTokens - budget;
    const errorMsg = `Daily LLM token budget exceeded! Used: ${currentStats.totalTokens}, Budget: ${budget}, Over by: ${overBudget}`;

    if (!isOverBudgetAllowed()) {
      logger.error('LLMUsage', `❌ ${rid} ${errorMsg} (ALLOW_LLM_OVER_BUDGET=false)`);
      throw new Error(`LLM Budget Exceeded: ${errorMsg}. Set ALLOW_LLM_OVER_BUDGET=true to bypass.`);
    } else {
      logger.warn('LLMUsage', `⚠️ ${rid} ${errorMsg} (ALLOW_LLM_OVER_BUDGET=true, continuing...)`);
    }
  }
}

/**
 * Estimate token count for text (rough approximation: 1 token ≈ 4 chars)
 * Use this as fallback if API doesn't return token counts
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get current usage stats (for monitoring/debugging)
 */
export function getUsageStats(): UsageStats {
  checkAndResetIfNeeded();
  return { ...currentStats };
}

/**
 * Reset stats manually (for testing)
 */
export function resetUsageStats(): void {
  currentStats = {
    date: getCurrentDateString(),
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requestCount: 0,
  };
  logger.info('LLMUsage', '🔄 Stats manually reset');
}

