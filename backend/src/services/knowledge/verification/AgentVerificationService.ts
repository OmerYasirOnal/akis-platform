/**
 * AgentVerificationService — Agent-specific verification gate wiring
 *
 * Integrates VerificationGateEngine with each agent's completion flow.
 * Extracts agent-specific metrics from job results and evaluates them
 * against the appropriate risk profile.
 */

import {
  VerificationGateEngine,
  type GateInput,
  type VerificationResult,
} from './VerificationGateEngine.js';
import { createAgentVerificationEngine } from '../../../config/agentRiskProfiles.js';

// =============================================================================
// Types
// =============================================================================

export type AgentType = 'scribe' | 'trace' | 'proto';

// =============================================================================
// Helpers
// =============================================================================

function asNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function getMetadata(result: unknown): Record<string, unknown> | undefined {
  if (typeof result !== 'object' || result === null) return undefined;
  const obj = result as Record<string, unknown>;
  const meta = obj.metadata;
  if (typeof meta === 'object' && meta !== null) return meta as Record<string, unknown>;
  return undefined;
}

// =============================================================================
// Metric extraction (agent-specific)
// =============================================================================

function extractScribeMetrics(result: unknown): GateInput {
  const meta = getMetadata(result);
  if (!meta) return {};

  const citationCount = asNumber(meta.citationCount);
  const totalClaims = asNumber(meta.totalClaims);
  const citationRate =
    totalClaims != null && totalClaims > 0 && citationCount != null
      ? Math.min(citationCount / totalClaims, 1)
      : asNumber(meta.citationRate);

  const hallucinationRate = asNumber(meta.hallucinationRate);
  const freshnessScore = asNumber(meta.freshnessScore);
  const groundednessScore = asNumber(meta.groundednessScore);
  const weightedGroundednessScore = asNumber(meta.weightedGroundednessScore);
  const topicCoverage = asNumber(meta.topicCoverage);

  const input: GateInput = {};
  if (citationRate != null) input.citationRate = citationRate;
  if (hallucinationRate != null) input.hallucinationRate = hallucinationRate;
  if (freshnessScore != null) input.freshnessScore = freshnessScore;
  if (weightedGroundednessScore != null) input.weightedGroundednessScore = weightedGroundednessScore;
  else if (groundednessScore != null) input.groundednessScore = groundednessScore;
  if (topicCoverage != null) input.topicCoverage = topicCoverage;

  return input;
}

function extractTraceMetrics(result: unknown): GateInput {
  const meta = getMetadata(result);
  if (!meta) return {};

  const scenarioCount = asNumber(meta.scenarioCount) ?? 0;
  const expectedScenarios = asNumber(meta.expectedScenarios) ?? 10;
  const topicCoverage =
    expectedScenarios > 0 ? Math.min(scenarioCount / expectedScenarios, 1) : asNumber(meta.topicCoverage);

  const edgeCaseCount = asNumber(meta.edgeCaseCount) ?? 0;
  const testValidity = asNumber(meta.testValidity);
  const groundednessScore = asNumber(meta.groundednessScore);
  const hallucinationRate = asNumber(meta.hallucinationRate);

  const input: GateInput = {};
  if (topicCoverage != null) input.topicCoverage = topicCoverage;
  if (groundednessScore != null) input.groundednessScore = groundednessScore;
  if (hallucinationRate != null) input.hallucinationRate = hallucinationRate;

  const custom: Record<string, number> = {};
  if (edgeCaseCount > 0) custom.edgeCaseCount = Math.min(edgeCaseCount / 10, 1);
  if (testValidity != null) custom.testValidity = testValidity;
  if (Object.keys(custom).length > 0) input.custom = custom;

  return input;
}

function extractProtoMetrics(result: unknown): GateInput {
  const meta = getMetadata(result);
  if (!meta) return {};

  const buildSuccess = meta.buildSuccess === true ? 1 : meta.buildSuccess === false ? 0 : undefined;
  const securityScanPass = meta.securityScanPass === true ? 1 : meta.securityScanPass === false ? 0 : undefined;
  const conventionAdherence = asNumber(meta.conventionAdherence);
  const groundednessScore = asNumber(meta.groundednessScore);
  const topicCoverage = asNumber(meta.topicCoverage);

  const input: GateInput = {};
  if (groundednessScore != null) input.groundednessScore = groundednessScore;
  if (topicCoverage != null) input.topicCoverage = topicCoverage;

  const custom: Record<string, number> = {};
  if (buildSuccess != null) custom.buildSuccess = buildSuccess;
  if (securityScanPass != null) custom.securityScan = securityScanPass;
  if (conventionAdherence != null) custom.conventionAdherence = conventionAdherence;
  if (Object.keys(custom).length > 0) input.custom = custom;

  return input;
}

function extractMetrics(agentType: AgentType, result: unknown): GateInput {
  switch (agentType) {
    case 'scribe':
      return extractScribeMetrics(result);
    case 'trace':
      return extractTraceMetrics(result);
    case 'proto':
      return extractProtoMetrics(result);
    default:
      return {};
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Evaluate a job result against agent-specific verification gates.
 *
 * @param agentType - The agent that produced the result
 * @param result - The job result (agent output with optional metadata)
 * @returns VerificationResult from the gate engine
 */
export function evaluateAgentResult(
  agentType: AgentType,
  result: unknown
): VerificationResult {
  const { riskProfile, overrides } = createAgentVerificationEngine(agentType);
  const engine = new VerificationGateEngine(riskProfile);

  for (const [gateName, gateOverride] of Object.entries(overrides)) {
    engine.overrideGate(gateName, gateOverride);
  }

  const gateInput = extractMetrics(agentType, result);
  return engine.evaluate(gateInput);
}
