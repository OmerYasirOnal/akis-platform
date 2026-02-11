import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeTrustScores, isTrustHealthy, type JobSignal } from '../../src/services/trust/TrustScoringService.js';

describe('TrustScoringService', () => {
  it('returns neutral scores for empty job list', () => {
    const scores = computeTrustScores([]);
    assert.equal(scores.reliability, 50);
    assert.equal(scores.hallucinationRisk, 50);
    assert.equal(scores.taskSuccess, 50);
    assert.equal(scores.toolHealth, 50);
    assert.equal(scores.metadata.jobCount, 0);
    assert.equal(scores.metadata.avgQuality, null);
  });

  it('computes 100% reliability for all-completed jobs', () => {
    const jobs: JobSignal[] = [
      { jobId: '1', state: 'completed', qualityScore: 85 },
      { jobId: '2', state: 'completed', qualityScore: 90 },
    ];
    const scores = computeTrustScores(jobs);
    assert.equal(scores.reliability, 100);
    assert.equal(scores.metadata.completedCount, 2);
    assert.equal(scores.metadata.failedCount, 0);
  });

  it('computes 50% reliability for half-failed jobs', () => {
    const jobs: JobSignal[] = [
      { jobId: '1', state: 'completed', qualityScore: 80 },
      { jobId: '2', state: 'failed' },
    ];
    const scores = computeTrustScores(jobs);
    assert.equal(scores.reliability, 50);
  });

  it('computes hallucination risk from contract violations', () => {
    const jobs: JobSignal[] = [
      { jobId: '1', state: 'completed', contractViolations: 2 },
      { jobId: '2', state: 'completed', contractViolations: 0 },
      { jobId: '3', state: 'completed', contractViolations: 0 },
    ];
    const scores = computeTrustScores(jobs);
    // 1 out of 3 jobs had violations = 33%
    assert.equal(scores.hallucinationRisk, 33);
  });

  it('computes task success from average quality score', () => {
    const jobs: JobSignal[] = [
      { jobId: '1', state: 'completed', qualityScore: 80 },
      { jobId: '2', state: 'completed', qualityScore: 60 },
    ];
    const scores = computeTrustScores(jobs);
    assert.equal(scores.taskSuccess, 70); // (80+60)/2
    assert.equal(scores.metadata.avgQuality, 70);
  });

  it('returns default taskSuccess when no quality scores available', () => {
    const jobs: JobSignal[] = [
      { jobId: '1', state: 'completed' },
      { jobId: '2', state: 'failed' },
    ];
    const scores = computeTrustScores(jobs);
    assert.equal(scores.taskSuccess, 50); // default
  });

  it('computes tool health from tool call success rate', () => {
    const jobs: JobSignal[] = [
      { jobId: '1', state: 'completed', toolCallsTotal: 10, toolCallsFailed: 2 },
      { jobId: '2', state: 'completed', toolCallsTotal: 5, toolCallsFailed: 0 },
    ];
    const scores = computeTrustScores(jobs);
    // 15 total, 2 failed → 13/15 = 87%
    assert.equal(scores.toolHealth, 87);
  });

  it('returns 100 tool health when no tool calls recorded', () => {
    const jobs: JobSignal[] = [
      { jobId: '1', state: 'completed' },
    ];
    const scores = computeTrustScores(jobs);
    assert.equal(scores.toolHealth, 100);
  });

  it('clamps scores to 0-100 range', () => {
    const jobs: JobSignal[] = [
      { jobId: '1', state: 'completed', qualityScore: 150 }, // over 100
    ];
    const scores = computeTrustScores(jobs);
    assert.equal(scores.taskSuccess, 100);
  });

  it('isTrustHealthy returns true for healthy scores', () => {
    const scores = computeTrustScores([
      { jobId: '1', state: 'completed', qualityScore: 80, toolCallsTotal: 5, toolCallsFailed: 0 },
    ]);
    assert.equal(isTrustHealthy(scores), true);
  });

  it('isTrustHealthy returns false when reliability is too low', () => {
    const scores = computeTrustScores([
      { jobId: '1', state: 'failed' },
      { jobId: '2', state: 'failed' },
      { jobId: '3', state: 'failed' },
    ]);
    assert.equal(scores.reliability, 0);
    assert.equal(isTrustHealthy(scores), false);
  });
});
