export type TracePriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface RiskInputScenario {
  name: string;
  priority: TracePriority;
  steps: string[];
}

export interface RiskBucketSummary {
  weight: number;
  total: number;
  covered: number;
  weightedTotal: number;
  weightedCovered: number;
}

export interface RiskWeightedCoverageSummary {
  rawCoverage: number;
  weightedCoverage: number;
  coveredRiskPoints: number;
  maxRiskPoints: number;
  buckets: Record<TracePriority, RiskBucketSummary>;
}

const PRIORITY_WEIGHTS: Record<TracePriority, number> = {
  P0: 1,
  P1: 0.75,
  P2: 0.5,
  P3: 0.25,
};

function scenarioCovered(steps: string[]): boolean {
  if (steps.length < 2) return false;
  return steps.every((step) => step.trim().length >= 5);
}

export function computeRiskWeightedCoverage(scenarios: RiskInputScenario[]): RiskWeightedCoverageSummary {
  const buckets: Record<TracePriority, RiskBucketSummary> = {
    P0: { weight: PRIORITY_WEIGHTS.P0, total: 0, covered: 0, weightedTotal: 0, weightedCovered: 0 },
    P1: { weight: PRIORITY_WEIGHTS.P1, total: 0, covered: 0, weightedTotal: 0, weightedCovered: 0 },
    P2: { weight: PRIORITY_WEIGHTS.P2, total: 0, covered: 0, weightedTotal: 0, weightedCovered: 0 },
    P3: { weight: PRIORITY_WEIGHTS.P3, total: 0, covered: 0, weightedTotal: 0, weightedCovered: 0 },
  };

  let covered = 0;
  let total = 0;

  for (const scenario of scenarios) {
    const bucket = buckets[scenario.priority];
    const isCovered = scenarioCovered(scenario.steps);

    bucket.total += 1;
    bucket.weightedTotal += bucket.weight;
    total += 1;

    if (isCovered) {
      bucket.covered += 1;
      bucket.weightedCovered += bucket.weight;
      covered += 1;
    }
  }

  const maxRiskPoints = Object.values(buckets).reduce((sum, bucket) => sum + bucket.weightedTotal, 0);
  const coveredRiskPoints = Object.values(buckets).reduce((sum, bucket) => sum + bucket.weightedCovered, 0);

  return {
    rawCoverage: total > 0 ? covered / total : 1,
    weightedCoverage: maxRiskPoints > 0 ? coveredRiskPoints / maxRiskPoints : 1,
    coveredRiskPoints,
    maxRiskPoints,
    buckets,
  };
}
