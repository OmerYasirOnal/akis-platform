/**
 * FreshnessScheduler — Cron-based stale knowledge detection
 *
 * M2-FP-1: Periodically scans knowledge sources and flags stale ones.
 * Uses GitHub MCP adapter to check for new releases, commits, and doc updates.
 *
 * Schedule: Every 6 hours (configurable)
 * Staleness threshold: configurable per source type (default 90 days)
 */

import type { GitHubMCPService } from '../mcp/adapters/GitHubMCPService.js';

// =============================================================================
// Types
// =============================================================================

export interface FreshnessCheckResult {
  sourceId: string;
  sourceName: string;
  sourceType: 'github_repo' | 'documentation' | 'manual';
  lastChecked: Date;
  lastUpdated?: Date;
  isFresh: boolean;
  ageInDays: number;
  staleness: 'fresh' | 'aging' | 'stale' | 'unknown';
  details?: string;
}

export interface FreshnessSchedulerConfig {
  /** GitHub MCP service for checking repo freshness */
  githubMcp: GitHubMCPService;
  /** Check interval in milliseconds (default: 6 hours) */
  intervalMs?: number;
  /** Freshness threshold in days (default: 90) */
  freshnessThresholdDays?: number;
  /** Aging threshold in days (default: 45) */
  agingThresholdDays?: number;
}

// =============================================================================
// FreshnessScheduler
// =============================================================================

export class FreshnessScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private githubMcp: GitHubMCPService;
  private intervalMs: number;
  private freshnessThresholdDays: number;
  private agingThresholdDays: number;
  private lastResults: FreshnessCheckResult[] = [];
  private running = false;

  constructor(config: FreshnessSchedulerConfig) {
    this.githubMcp = config.githubMcp;
    this.intervalMs = config.intervalMs ?? 6 * 60 * 60 * 1000; // 6 hours
    this.freshnessThresholdDays = config.freshnessThresholdDays ?? 90;
    this.agingThresholdDays = config.agingThresholdDays ?? 45;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.timer) { return; } // already running

    console.log(`[FreshnessScheduler] Starting (interval: ${this.intervalMs / 1000 / 60}min, threshold: ${this.freshnessThresholdDays}d)`);

    // Run immediately, then on interval
    this.runCheck().catch(err => {
      console.warn('[FreshnessScheduler] Initial check failed:', err);
    });

    this.timer = setInterval(() => {
      this.runCheck().catch(err => {
        console.warn('[FreshnessScheduler] Scheduled check failed:', err);
      });
    }, this.intervalMs);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[FreshnessScheduler] Stopped');
    }
  }

  /**
   * Get results from the last check
   */
  getLastResults(): readonly FreshnessCheckResult[] {
    return this.lastResults;
  }

  /**
   * Get stale sources from the last check
   */
  getStaleSources(): FreshnessCheckResult[] {
    return this.lastResults.filter(r => r.staleness === 'stale');
  }

  /**
   * Check freshness of a specific GitHub repository
   */
  async checkRepoFreshness(owner: string, repo: string): Promise<FreshnessCheckResult> {
    const now = new Date();
    const sourceId = `github:${owner}/${repo}`;

    try {
      // Use MCP adapter to get repo info
      const repoInfo = await this.githubMcp.callToolRaw('get_repository', {
        owner,
        repo,
      });

      let lastUpdated: Date | undefined;
      let details: string | undefined;

      // Extract last push/update date from repo info
      if (repoInfo && typeof repoInfo === 'object') {
        const info = repoInfo as Record<string, unknown>;
        if (typeof info.pushed_at === 'string') {
          lastUpdated = new Date(info.pushed_at);
        } else if (typeof info.updated_at === 'string') {
          lastUpdated = new Date(info.updated_at);
        }

        if (typeof info.description === 'string') {
          details = info.description;
        }
      }

      const ageInDays = lastUpdated
        ? Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
        : -1;

      const staleness = this.classifyStaleness(ageInDays);

      return {
        sourceId,
        sourceName: `${owner}/${repo}`,
        sourceType: 'github_repo',
        lastChecked: now,
        lastUpdated,
        isFresh: staleness === 'fresh',
        ageInDays: Math.max(0, ageInDays),
        staleness,
        details,
      };
    } catch (error) {
      return {
        sourceId,
        sourceName: `${owner}/${repo}`,
        sourceType: 'github_repo',
        lastChecked: now,
        isFresh: false,
        ageInDays: -1,
        staleness: 'unknown',
        details: `Check failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  }

  /**
   * Compute a 0-1 freshness score from age in days
   */
  computeFreshnessScore(ageInDays: number): number {
    if (ageInDays < 0) { return 0; }
    if (ageInDays <= this.agingThresholdDays) { return 1.0; }
    if (ageInDays >= this.freshnessThresholdDays * 2) { return 0; }

    // Linear decay from aging threshold to 2x freshness threshold
    const range = this.freshnessThresholdDays * 2 - this.agingThresholdDays;
    const position = ageInDays - this.agingThresholdDays;
    return Math.max(0, Math.round((1 - position / range) * 100) / 100);
  }

  // ===========================================================================
  // Private
  // ===========================================================================

  private async runCheck(): Promise<void> {
    if (this.running) { return; } // prevent overlapping checks
    this.running = true;

    try {
      console.log('[FreshnessScheduler] Running freshness check...');
      const results: FreshnessCheckResult[] = [];

      // TODO: In the future, read tracked repos from DB
      // For now, this is a stub that can be extended
      // The scheduler is started idempotently from server.app.ts

      this.lastResults = results;
      console.log(`[FreshnessScheduler] Check complete: ${results.length} sources checked`);
    } finally {
      this.running = false;
    }
  }

  private classifyStaleness(ageInDays: number): FreshnessCheckResult['staleness'] {
    if (ageInDays < 0) { return 'unknown'; }
    if (ageInDays <= this.agingThresholdDays) { return 'fresh'; }
    if (ageInDays <= this.freshnessThresholdDays) { return 'aging'; }
    return 'stale';
  }
}
