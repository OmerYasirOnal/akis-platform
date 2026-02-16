export interface TraceScenario {
  name: string;
  steps: string[];
}

export interface FlowCoverageSummary {
  totalFlows: number;
  coveredFlows: number;
  coverageRate: number;
  criticalFlows: number;
  criticalCoveredFlows: number;
  criticalCoverageRate: number;
  missingFlows: string[];
  coveredFlowNames: string[];
}

const CRITICAL_FLOW_KEYWORDS = [
  'auth',
  'login',
  'password',
  'session',
  'rbac',
  'role',
  'permission',
  'payment',
  'billing',
  'delete',
  'admin',
  'token',
] as const;

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function isCriticalFlow(scenario: TraceScenario): boolean {
  const haystack = normalize(`${scenario.name} ${scenario.steps.join(' ')}`);
  return CRITICAL_FLOW_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function getFlowName(scenario: TraceScenario): string {
  const fromName = normalize(scenario.name);
  if (fromName.length > 0) {
    return fromName;
  }
  const firstStep = normalize(scenario.steps[0] ?? 'unnamed-flow');
  return firstStep.length > 0 ? firstStep : 'unnamed-flow';
}

function hasExecutableSignal(scenario: TraceScenario): boolean {
  if (scenario.steps.length < 2) return false;
  return scenario.steps.every((step) => normalize(step).length >= 5);
}

export function computeFlowCoverage(scenarios: TraceScenario[]): FlowCoverageSummary {
  const sortedFlows = [...scenarios]
    .map((scenario) => ({
      scenario,
      flowName: getFlowName(scenario),
      executable: hasExecutableSignal(scenario),
      critical: isCriticalFlow(scenario),
    }))
    .sort((a, b) => a.flowName.localeCompare(b.flowName, 'en'));

  const totalFlows = sortedFlows.length;
  const coveredFlowNames = sortedFlows
    .filter((flow) => flow.executable)
    .map((flow) => flow.flowName);
  const missingFlows = sortedFlows
    .filter((flow) => !flow.executable)
    .map((flow) => flow.flowName);

  const criticalFlows = sortedFlows.filter((flow) => flow.critical).length;
  const criticalCoveredFlows = sortedFlows.filter((flow) => flow.critical && flow.executable).length;

  const coveredFlows = coveredFlowNames.length;
  const coverageRate = totalFlows > 0 ? coveredFlows / totalFlows : 1;
  const criticalCoverageRate = criticalFlows > 0 ? criticalCoveredFlows / criticalFlows : 1;

  return {
    totalFlows,
    coveredFlows,
    coverageRate,
    criticalFlows,
    criticalCoveredFlows,
    criticalCoverageRate,
    missingFlows,
    coveredFlowNames,
  };
}
