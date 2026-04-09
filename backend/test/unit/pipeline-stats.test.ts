import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pipeline Stats — Success Rate Logic
 *
 * The pipeline-stats route (api/settings/pipeline-stats.ts) computes
 * success rate and aggregations. Since SKIP_DB_TESTS=true excludes
 * real DB access, we test the pure computation logic and response
 * contract here.
 */

// Extracted computation logic matching pipeline-stats.ts:65-67
function computeSuccessRate(totalPipelines: number, successCount: number): number {
  return totalPipelines > 0
    ? Math.round((successCount / totalPipelines) * 100)
    : 0;
}

// Response builder matching pipeline-stats.ts:83-99
function buildStatsResponse(
  agg: { totalPipelines: number; successCount: number; avgScribeMs: number | null; avgProtoMs: number | null; avgTraceMs: number | null; avgTotalMs: number | null },
  recent: Array<{ id: string; title: string; stage: string; createdAt: Date; durationMs: number | null }>,
) {
  const successRate = computeSuccessRate(agg.totalPipelines, agg.successCount);
  return {
    totalPipelines: agg.totalPipelines,
    successRate,
    avgDurations: {
      scribeMs: agg.avgScribeMs ?? null,
      protoMs: agg.avgProtoMs ?? null,
      traceMs: agg.avgTraceMs ?? null,
      totalMs: agg.avgTotalMs ?? null,
    },
    recentPipelines: recent.map((r) => ({
      id: r.id,
      title: r.title,
      stage: r.stage,
      createdAt: r.createdAt.toISOString(),
      durationMs: r.durationMs,
    })),
  };
}

// ─── Success Rate ────────────────────────────────

describe('Pipeline Stats — Success rate calculation', () => {
  it('returns 0 when no pipelines', () => {
    assert.equal(computeSuccessRate(0, 0), 0);
  });

  it('returns 100 when all succeed', () => {
    assert.equal(computeSuccessRate(5, 5), 100);
  });

  it('returns 50 when half succeed', () => {
    assert.equal(computeSuccessRate(10, 5), 50);
  });

  it('rounds to nearest integer', () => {
    assert.equal(computeSuccessRate(3, 1), 33); // 33.33... → 33
    assert.equal(computeSuccessRate(3, 2), 67); // 66.66... → 67
  });

  it('handles single pipeline', () => {
    assert.equal(computeSuccessRate(1, 1), 100);
    assert.equal(computeSuccessRate(1, 0), 0);
  });
});

// ─── Response Contract ───────────────────────────

describe('Pipeline Stats — Response structure', () => {
  it('builds correct response with data', () => {
    const agg = {
      totalPipelines: 10,
      successCount: 8,
      avgScribeMs: 5000,
      avgProtoMs: 3000,
      avgTraceMs: 2000,
      avgTotalMs: 10000,
    };
    const recent = [
      { id: 'p-1', title: 'Todo App', stage: 'completed', createdAt: new Date('2026-01-15T10:00:00Z'), durationMs: 9000 },
      { id: 'p-2', title: 'Chat App', stage: 'failed', createdAt: new Date('2026-01-14T10:00:00Z'), durationMs: null },
    ];

    const result = buildStatsResponse(agg, recent);

    assert.equal(result.totalPipelines, 10);
    assert.equal(result.successRate, 80);
    assert.deepEqual(result.avgDurations, {
      scribeMs: 5000,
      protoMs: 3000,
      traceMs: 2000,
      totalMs: 10000,
    });
    assert.equal(result.recentPipelines.length, 2);
    assert.equal(result.recentPipelines[0].id, 'p-1');
    assert.equal(result.recentPipelines[0].createdAt, '2026-01-15T10:00:00.000Z');
    assert.equal(result.recentPipelines[1].durationMs, null);
  });

  it('builds response with null durations', () => {
    const agg = {
      totalPipelines: 2,
      successCount: 0,
      avgScribeMs: null,
      avgProtoMs: null,
      avgTraceMs: null,
      avgTotalMs: null,
    };

    const result = buildStatsResponse(agg, []);

    assert.equal(result.successRate, 0);
    assert.deepEqual(result.avgDurations, {
      scribeMs: null,
      protoMs: null,
      traceMs: null,
      totalMs: null,
    });
    assert.deepEqual(result.recentPipelines, []);
  });

  it('builds empty response for new user', () => {
    const agg = {
      totalPipelines: 0,
      successCount: 0,
      avgScribeMs: null,
      avgProtoMs: null,
      avgTraceMs: null,
      avgTotalMs: null,
    };

    const result = buildStatsResponse(agg, []);

    assert.equal(result.totalPipelines, 0);
    assert.equal(result.successRate, 0);
    assert.equal(result.recentPipelines.length, 0);
  });
});
