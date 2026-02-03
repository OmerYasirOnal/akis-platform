/**
 * Smart Automations - Type Definitions
 * Types for RSS fetching, content aggregation, and draft generation
 */

/**
 * Source configuration for RSS/webpage fetching
 */
export interface AutomationSource {
  url: string;
  type: 'rss' | 'webpage';
}

/**
 * Fetched item from RSS/API source
 */
export interface FetchedItem {
  title: string;
  link: string;
  linkHash: string;
  excerpt?: string;
  publishedAt?: Date;
  source: string;
}

/**
 * Draft result from AI generation
 */
export interface DraftResult {
  /** LinkedIn post text */
  draft: string;
  /** Short summary */
  summary: string;
  /** Generated hashtags */
  hashtags: string[];
  /** Source links used */
  sources: string[];
}

/**
 * Automation execution context
 */
export interface ExecutionContext {
  automationId: string;
  userId: string;
  topics: string[];
  sources: AutomationSource[];
  outputLanguage: 'tr' | 'en';
  style: string;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  success: boolean;
  runId: string;
  itemCount: number;
  draft?: DraftResult;
  error?: string;
  errorCode?: string;
}

/**
 * Slack notification payload
 */
export interface SlackNotificationPayload {
  automationName: string;
  draft: string;
  summary: string;
  sources: string[];
  hashtags: string[];
  runId: string;
  automationId: string;
}

/**
 * Slack message response
 */
export interface SlackMessageResponse {
  ok: boolean;
  ts?: string;
  error?: string;
}
