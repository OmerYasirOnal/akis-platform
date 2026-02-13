/**
 * Agent Risk Profiles — Maps agent types to verification gate strictness
 *
 * M2-VF-6: Different agents produce different types of content with
 * varying risk levels. This config determines which verification profile
 * each agent uses:
 *
 * - Scribe (documentation) → strict: wrong docs cause confusion
 * - Trace (test plans) → standard: tests should be accurate but exploratory
 * - Proto (code scaffolds) → relaxed: prototypes are meant to be iterated on
 * - Piri (RAG answers) → strict: knowledge engine must be trustworthy
 *
 * Each profile maps to VerificationGateEngine thresholds.
 */

import type { RiskProfile } from '../services/knowledge/verification/VerificationGateEngine.js';

// =============================================================================
// Types
// =============================================================================

export interface AgentRiskConfig {
  /** Agent type identifier */
  agentType: string;
  /** Display name */
  displayName: string;
  /** Risk profile for the VerificationGateEngine */
  riskProfile: RiskProfile;
  /** Optional per-gate overrides */
  gateOverrides?: Record<string, Partial<{
    passThreshold: number;
    warnThreshold: number;
    blocking: boolean;
    enabled: boolean;
  }>>;
  /** Risk rationale (for docs/UI) */
  rationale: string;
}

// =============================================================================
// Default Agent Risk Configurations
// =============================================================================

const SCRIBE_RISK: AgentRiskConfig = {
  agentType: 'scribe',
  displayName: 'Scribe Agent',
  riskProfile: 'strict',
  gateOverrides: {
    citation: { passThreshold: 0.8, blocking: true },
    freshness: { passThreshold: 0.7, blocking: false },
    hallucination: { passThreshold: 0.05, blocking: true },
  },
  rationale: 'Documentation must be accurate and well-sourced. Hallucinated docs cause real developer confusion.',
};

const TRACE_RISK: AgentRiskConfig = {
  agentType: 'trace',
  displayName: 'Trace Agent',
  riskProfile: 'standard',
  gateOverrides: {
    coverage: { passThreshold: 0.9, warnThreshold: 0.7, blocking: false },
    hallucination: { passThreshold: 0.1, blocking: true },
    citation: { passThreshold: 0.5, blocking: false }, // test plans are more exploratory
  },
  rationale: 'Test plans should cover all scenarios but can be somewhat exploratory. Coverage is key.',
};

const PROTO_RISK: AgentRiskConfig = {
  agentType: 'proto',
  displayName: 'Proto Agent',
  riskProfile: 'relaxed',
  gateOverrides: {
    groundedness: { passThreshold: 0.5, blocking: false },
    citation: { enabled: false }, // prototypes don't need citations
    freshness: { enabled: false },
    hallucination: { passThreshold: 0.2, blocking: false }, // prototypes can be creative
  },
  rationale: 'Prototypes are meant for rapid iteration. Verification is lighter to enable speed.',
};

const PIRI_RISK: AgentRiskConfig = {
  agentType: 'piri',
  displayName: 'Piri Knowledge Engine',
  riskProfile: 'strict',
  gateOverrides: {
    groundedness: { passThreshold: 0.85, blocking: true },
    citation: { passThreshold: 0.9, blocking: true },
    hallucination: { passThreshold: 0.03, blocking: true },
    freshness: { passThreshold: 0.8, blocking: true },
  },
  rationale: 'Knowledge engine answers must be extremely trustworthy. Any hallucination undermines the entire system.',
};

// =============================================================================
// Registry
// =============================================================================

const AGENT_RISK_REGISTRY = new Map<string, AgentRiskConfig>([
  ['scribe', SCRIBE_RISK],
  ['trace', TRACE_RISK],
  ['proto', PROTO_RISK],
  ['piri', PIRI_RISK],
]);

/**
 * Get risk configuration for an agent type
 */
export function getAgentRiskConfig(agentType: string): AgentRiskConfig {
  return AGENT_RISK_REGISTRY.get(agentType) ?? {
    agentType,
    displayName: agentType,
    riskProfile: 'standard',
    rationale: 'Default standard profile for unknown agent types.',
  };
}

/**
 * Get all registered agent risk configurations
 */
export function getAllAgentRiskConfigs(): AgentRiskConfig[] {
  return Array.from(AGENT_RISK_REGISTRY.values());
}

/**
 * Register or update an agent risk configuration
 */
export function registerAgentRiskConfig(config: AgentRiskConfig): void {
  AGENT_RISK_REGISTRY.set(config.agentType, config);
}

/**
 * Create a VerificationGateEngine configured for a specific agent
 */
export function createAgentVerificationEngine(agentType: string): {
  riskProfile: RiskProfile;
  overrides: NonNullable<AgentRiskConfig['gateOverrides']>;
} {
  const config = getAgentRiskConfig(agentType);
  return {
    riskProfile: config.riskProfile,
    overrides: config.gateOverrides ?? {},
  };
}
