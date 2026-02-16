import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { FreshnessScheduler } from '../../src/services/knowledge/FreshnessScheduler.js';
import type { GitHubMCPService } from '../../src/services/mcp/adapters/GitHubMCPService.js';

describe('FreshnessScheduler', () => {
  it('computes deterministic freshness scores', () => {
    const scheduler = new FreshnessScheduler({
      intervalMs: 60_000,
      freshnessThresholdDays: 90,
      agingThresholdDays: 45,
    });

    assert.equal(scheduler.computeFreshnessScore(-1), 0);
    assert.equal(scheduler.computeFreshnessScore(10), 1);
    assert.equal(scheduler.computeFreshnessScore(200), 0);

    const mid = scheduler.computeFreshnessScore(80);
    assert.ok(mid > 0 && mid < 1);
  });

  it('returns unknown when GitHub MCP is not configured', async () => {
    const scheduler = new FreshnessScheduler({
      intervalMs: 60_000,
    });

    const result = await scheduler.checkRepoFreshness('openai', 'openai-cookbook');
    assert.equal(result.staleness, 'unknown');
    assert.equal(result.sourceType, 'github_repo');
    assert.match(result.details || '', /not configured/i);
  });

  it('classifies repo as fresh when pushed recently', async () => {
    const scheduler = new FreshnessScheduler({
      githubMcp: {
        callToolRaw: async () => ({
          pushed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Test repository',
        }),
      } as unknown as GitHubMCPService,
      freshnessThresholdDays: 90,
      agingThresholdDays: 45,
    });

    const result = await scheduler.checkRepoFreshness('owner', 'repo');
    assert.equal(result.staleness, 'fresh');
    assert.equal(result.isFresh, true);
    assert.ok(result.ageInDays <= 3);
  });

  it('combines release recency with commit freshness deterministically', async () => {
    const scheduler = new FreshnessScheduler({
      githubMcp: {
        callToolRaw: async () => ({
          pushed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        getLatestRelease: async () => ({
          id: 'release-1',
          tagName: 'v1.0.0',
          name: 'v1.0.0',
          url: 'https://github.com/test/repo/releases/tag/v1.0.0',
          publishedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        }),
      } as unknown as GitHubMCPService,
      freshnessThresholdDays: 90,
      agingThresholdDays: 45,
    });

    const result = await scheduler.checkRepoFreshness('owner', 'repo');
    assert.equal(result.staleness, 'aging');
    assert.equal(result.releaseTag, 'v1.0.0');
    assert.ok(typeof result.score === 'number');
    assert.ok(result.score! > 0 && result.score! < 1);
  });
});
