/**
 * TrustScoringService — computes 4 trust metric bars for agent threads.
 *
 * Bars (each 0–100):
 *   Reliability      — how consistently jobs succeed
 *   Hallucination Risk — inverse of contract adherence + quality pass rate
 *   Task Success     — completion quality (quality score average)
 *   Tool Health      — MCP / integration call success rate
 *
 * Input: recent job history for a thread/user.
 * Output: TrustSnapshot written to thread_trust_snapshots.
 */

export interface JobSignal {
  jobId: string;
  state: 'completed' | 'failed' | 'running' | 'pending';
  qualityScore?: number | null;
  contractViolations?: number;
  toolCallsTotal?: number;
  toolCallsFailed?: number;
  durationMs?: number;
  expectedDurationMs?: number;
}

export interface TrustScores {
  reliability: number;
  hallucinationRisk: number;
  taskSuccess: number;
  toolHealth: number;
  metadata: {
    jobCount: number;
    completedCount: number;
    failedCount: number;
    avgQuality: number | null;
    computedAt: string;
  };
}

const CLAMP = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/**
 * Compute trust scores from a set of recent job signals.
 * Pure function — no side effects.
 */
export function computeTrustScores(jobs: JobSignal[]): TrustScores {
  const now = new Date().toISOString();

  if (jobs.length === 0) {
    return {
      reliability: 50,
      hallucinationRisk: 50,
      taskSuccess: 50,
      toolHealth: 50,
      metadata: { jobCount: 0, completedCount: 0, failedCount: 0, avgQuality: null, computedAt: now },
    };
  }

  const completed = jobs.filter((j) => j.state === 'completed');
  const failed = jobs.filter((j) => j.state === 'failed');
  const total = completed.length + failed.length;

  // --- Reliability: success rate ---
  const reliability = total > 0 ? CLAMP((completed.length / total) * 100) : 50;

  // --- Hallucination Risk: inverse of contract adherence ---
  const violationJobs = jobs.filter((j) => (j.contractViolations ?? 0) > 0);
  const violationRate = total > 0 ? violationJobs.length / total : 0;
  const hallucinationRisk = CLAMP(violationRate * 100);

  // --- Task Success: average quality score ---
  const qualityScores = completed
    .map((j) => j.qualityScore)
    .filter((q): q is number => typeof q === 'number' && q >= 0);
  const avgQuality = qualityScores.length > 0
    ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
    : null;
  const taskSuccess = avgQuality !== null ? CLAMP(avgQuality) : 50;

  // --- Tool Health: tool call success rate ---
  const totalToolCalls = jobs.reduce((sum, j) => sum + (j.toolCallsTotal ?? 0), 0);
  const failedToolCalls = jobs.reduce((sum, j) => sum + (j.toolCallsFailed ?? 0), 0);
  const toolHealth = totalToolCalls > 0
    ? CLAMP(((totalToolCalls - failedToolCalls) / totalToolCalls) * 100)
    : 100; // No tool calls = healthy by default

  return {
    reliability,
    hallucinationRisk,
    taskSuccess,
    toolHealth,
    metadata: {
      jobCount: jobs.length,
      completedCount: completed.length,
      failedCount: failed.length,
      avgQuality,
      computedAt: now,
    },
  };
}

/**
 * Determine if the trust scores indicate the system is healthy.
 * Thresholds are intentionally generous for S0.5.
 */
export function isTrustHealthy(scores: TrustScores): boolean {
  return (
    scores.reliability >= 40 &&
    scores.hallucinationRisk <= 60 &&
    scores.taskSuccess >= 30 &&
    scores.toolHealth >= 50
  );
}
