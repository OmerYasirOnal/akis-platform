import type { TraceRunResult } from './TraceAutomationRunner.js';

export type ScenarioFlakinessRisk = 'low' | 'medium' | 'high';
export type ScenarioPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface FlakyScenarioInput {
  name: string;
  priority: ScenarioPriority;
  flakinessRisk: ScenarioFlakinessRisk;
}

export interface FlakySummary {
  pfsLite: number;
  retryCount: number;
  quarantinedScenarios: string[];
  flakyPassedScenarios: string[];
  scenarioScores: Record<string, number>;
}

export interface FlakyEvaluationResult {
  finalRun: TraceRunResult;
  flaky: FlakySummary;
}

export interface FlakyEvaluationOptions {
  strictness?: 'fast' | 'balanced' | 'strict';
  quarantineThreshold?: number;
}

const BASE_RISK_SCORE: Record<ScenarioFlakinessRisk, number> = {
  low: 0.15,
  medium: 0.45,
  high: 0.75,
};

function getRetryLimit(strictness: FlakyEvaluationOptions['strictness']): number {
  if (strictness === 'fast') return 0;
  return 1;
}

function toFailureSet(run: TraceRunResult): Set<string> {
  return new Set(run.failures.map((failure) => failure.scenario));
}

function toScore(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

export class FlakyTestManager {
  async evaluate(
    runOnce: () => Promise<TraceRunResult>,
    scenarios: FlakyScenarioInput[],
    options: FlakyEvaluationOptions = {}
  ): Promise<FlakyEvaluationResult> {
    const retryLimit = getRetryLimit(options.strictness);
    const quarantineThreshold = options.quarantineThreshold ?? 0.75;

    const firstRun = await runOnce();
    let finalRun = firstRun;
    let retryCount = 0;

    if (firstRun.failedScenarios > 0 && retryLimit > 0) {
      retryCount = 1;
      finalRun = await runOnce();
    }

    const firstFail = toFailureSet(firstRun);
    const secondFail = toFailureSet(finalRun);

    const scenarioScores: Record<string, number> = {};
    const quarantinedScenarios: string[] = [];
    const flakyPassedScenarios: string[] = [];

    for (const scenario of scenarios) {
      const base = BASE_RISK_SCORE[scenario.flakinessRisk];
      const failedInitially = firstFail.has(scenario.name);
      const failedFinally = secondFail.has(scenario.name);
      const flakyPassed = failedInitially && !failedFinally;

      let score = base;
      if (failedInitially) score += 0.2;
      if (failedFinally) score += 0.15;
      if (flakyPassed) score += 0.1;

      const normalized = toScore(score);
      scenarioScores[scenario.name] = normalized;

      if (flakyPassed) {
        flakyPassedScenarios.push(scenario.name);
      }

      const lowCriticality = scenario.priority === 'P2' || scenario.priority === 'P3';
      if (lowCriticality && normalized >= quarantineThreshold) {
        quarantinedScenarios.push(scenario.name);
      }
    }

    flakyPassedScenarios.sort((a, b) => a.localeCompare(b, 'en'));
    quarantinedScenarios.sort((a, b) => a.localeCompare(b, 'en'));

    const scenarioCount = Math.max(1, scenarios.length);
    const pfsLite = toScore(
      Object.values(scenarioScores).reduce((sum, value) => sum + value, 0) / scenarioCount
    );

    return {
      finalRun,
      flaky: {
        pfsLite,
        retryCount,
        quarantinedScenarios,
        flakyPassedScenarios,
        scenarioScores,
      },
    };
  }
}
