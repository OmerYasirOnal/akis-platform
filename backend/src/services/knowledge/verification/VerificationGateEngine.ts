/**
 * VerificationGateEngine — Configurable quality gates for agent outputs
 *
 * M2-VF-1: Provides a configurable gate system that checks agent-generated
 * content against multiple quality dimensions before allowing completion.
 *
 * Gate dimensions:
 * - Groundedness: claim-level evidence verification
 * - Citation: source references present and valid
 * - Freshness: information recency
 * - Hallucination: unsupported claim rate
 * - Coverage: topic completeness
 *
 * Each gate can be in pass/fail/warn state based on thresholds.
 * Risk profiles (P0/P1/P2) determine threshold strictness.
 */

// =============================================================================
// Types
// =============================================================================

export type GateStatus = 'pass' | 'warn' | 'fail';

export interface GateResult {
  name: string;
  status: GateStatus;
  score: number;       // 0-1 actual value
  threshold: number;   // configured threshold
  warnThreshold?: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface VerificationResult {
  /** Overall verdict: pass only if all required gates pass */
  overallStatus: GateStatus;
  /** Individual gate results */
  gates: GateResult[];
  /** Summary for UI display */
  summary: string;
  /** Whether the content should be blocked */
  blocked: boolean;
  /** Gates that failed (if any) */
  failures: GateResult[];
  /** Gates that warned (if any) */
  warnings: GateResult[];
  /** Processing metadata */
  meta: {
    riskProfile: RiskProfile;
    durationMs: number;
    gatesEvaluated: number;
  };
}

export type RiskProfile = 'strict' | 'standard' | 'relaxed';

export interface GateConfig {
  /** Gate name (must match a registered evaluator) */
  name: string;
  /** Minimum score to pass (0-1) */
  passThreshold: number;
  /** Score below which to warn (optional, defaults to passThreshold) */
  warnThreshold?: number;
  /** Whether failure blocks the output */
  blocking: boolean;
  /** Whether this gate is enabled */
  enabled: boolean;
}

export interface VerificationProfile {
  riskProfile: RiskProfile;
  gates: GateConfig[];
}

/** 
 * Input metrics from various analyzers that gates evaluate.
 * Each field is optional — gates skip if their input is missing.
 */
export interface GateInput {
  /** From GroundednessScorer */
  groundednessScore?: number;
  weightedGroundednessScore?: number;
  criticalUnsupported?: number;

  /** Citation metrics */
  citationRate?: number;      // 0-1 (claims with citations / total claims)
  citationsVerified?: number; // 0-1 (valid citations / total citations)

  /** Freshness metrics */
  averageSourceAge?: number;  // months
  oldestSourceAge?: number;   // months
  freshnessScore?: number;    // 0-1

  /** Hallucination metrics */
  hallucinationRate?: number; // 0-1 (unsupported or contradicted / total)
  contradictionCount?: number;

  /** Coverage metrics */
  topicCoverage?: number;     // 0-1
  sectionCompleteness?: number; // 0-1

  /** Custom metrics (agent-specific) */
  custom?: Record<string, number>;
}

// =============================================================================
// Default Profiles
// =============================================================================

const STRICT_PROFILE: VerificationProfile = {
  riskProfile: 'strict',
  gates: [
    { name: 'groundedness', passThreshold: 0.8, warnThreshold: 0.7, blocking: true, enabled: true },
    { name: 'citation', passThreshold: 0.8, warnThreshold: 0.6, blocking: true, enabled: true },
    { name: 'freshness', passThreshold: 0.7, warnThreshold: 0.5, blocking: false, enabled: true },
    { name: 'hallucination', passThreshold: 0.05, warnThreshold: 0.1, blocking: true, enabled: true },
    { name: 'coverage', passThreshold: 0.8, warnThreshold: 0.6, blocking: false, enabled: true },
  ],
};

const STANDARD_PROFILE: VerificationProfile = {
  riskProfile: 'standard',
  gates: [
    { name: 'groundedness', passThreshold: 0.7, warnThreshold: 0.5, blocking: true, enabled: true },
    { name: 'citation', passThreshold: 0.6, warnThreshold: 0.4, blocking: false, enabled: true },
    { name: 'freshness', passThreshold: 0.5, warnThreshold: 0.3, blocking: false, enabled: true },
    { name: 'hallucination', passThreshold: 0.1, warnThreshold: 0.2, blocking: true, enabled: true },
    { name: 'coverage', passThreshold: 0.7, warnThreshold: 0.5, blocking: false, enabled: true },
  ],
};

const RELAXED_PROFILE: VerificationProfile = {
  riskProfile: 'relaxed',
  gates: [
    { name: 'groundedness', passThreshold: 0.5, warnThreshold: 0.3, blocking: false, enabled: true },
    { name: 'citation', passThreshold: 0.3, warnThreshold: 0.1, blocking: false, enabled: true },
    { name: 'freshness', passThreshold: 0.3, blocking: false, enabled: false },
    { name: 'hallucination', passThreshold: 0.2, warnThreshold: 0.3, blocking: true, enabled: true },
    { name: 'coverage', passThreshold: 0.5, blocking: false, enabled: false },
  ],
};

const PROFILES: Record<RiskProfile, VerificationProfile> = {
  strict: STRICT_PROFILE,
  standard: STANDARD_PROFILE,
  relaxed: RELAXED_PROFILE,
};

// =============================================================================
// Gate Evaluators
// =============================================================================

type GateEvaluator = (input: GateInput, config: GateConfig) => GateResult | null;

function evaluateGroundedness(input: GateInput, config: GateConfig): GateResult | null {
  const score = input.weightedGroundednessScore ?? input.groundednessScore;
  if (score === undefined) { return null; }

  const status = getStatus(score, config);
  return {
    name: 'groundedness',
    status,
    score,
    threshold: config.passThreshold,
    warnThreshold: config.warnThreshold,
    message: status === 'pass'
      ? `Groundedness ${(score * 100).toFixed(0)}% — claims are well-supported`
      : status === 'warn'
        ? `Groundedness ${(score * 100).toFixed(0)}% — some claims lack evidence`
        : `Groundedness ${(score * 100).toFixed(0)}% — too many unsupported claims`,
    details: { criticalUnsupported: input.criticalUnsupported },
  };
}

function evaluateCitation(input: GateInput, config: GateConfig): GateResult | null {
  const score = input.citationRate;
  if (score === undefined) { return null; }

  const status = getStatus(score, config);
  return {
    name: 'citation',
    status,
    score,
    threshold: config.passThreshold,
    warnThreshold: config.warnThreshold,
    message: status === 'pass'
      ? `Citation rate ${(score * 100).toFixed(0)}% — sources properly referenced`
      : `Citation rate ${(score * 100).toFixed(0)}% — insufficient source references`,
    details: { citationsVerified: input.citationsVerified },
  };
}

function evaluateFreshness(input: GateInput, config: GateConfig): GateResult | null {
  const score = input.freshnessScore;
  if (score === undefined) { return null; }

  const status = getStatus(score, config);
  return {
    name: 'freshness',
    status,
    score,
    threshold: config.passThreshold,
    warnThreshold: config.warnThreshold,
    message: status === 'pass'
      ? `Freshness ${(score * 100).toFixed(0)}% — information is current`
      : `Freshness ${(score * 100).toFixed(0)}% — some sources may be outdated`,
    details: {
      averageSourceAge: input.averageSourceAge,
      oldestSourceAge: input.oldestSourceAge,
    },
  };
}

function evaluateHallucination(input: GateInput, config: GateConfig): GateResult | null {
  const rate = input.hallucinationRate;
  if (rate === undefined) { return null; }

  // For hallucination, LOWER is better — invert the logic
  const status: GateStatus =
    rate <= config.passThreshold ? 'pass' :
    config.warnThreshold !== undefined && rate <= config.warnThreshold ? 'warn' :
    'fail';

  return {
    name: 'hallucination',
    status,
    score: rate,
    threshold: config.passThreshold,
    warnThreshold: config.warnThreshold,
    message: status === 'pass'
      ? `Hallucination rate ${(rate * 100).toFixed(1)}% — within acceptable limits`
      : `Hallucination rate ${(rate * 100).toFixed(1)}% — too many ungrounded claims`,
    details: { contradictionCount: input.contradictionCount },
  };
}

function evaluateCoverage(input: GateInput, config: GateConfig): GateResult | null {
  const score = input.topicCoverage ?? input.sectionCompleteness;
  if (score === undefined) { return null; }

  const status = getStatus(score, config);
  return {
    name: 'coverage',
    status,
    score,
    threshold: config.passThreshold,
    warnThreshold: config.warnThreshold,
    message: status === 'pass'
      ? `Coverage ${(score * 100).toFixed(0)}% — topics adequately covered`
      : `Coverage ${(score * 100).toFixed(0)}% — some topics may be missing`,
  };
}

function getStatus(score: number, config: GateConfig): GateStatus {
  if (score >= config.passThreshold) { return 'pass'; }
  if (config.warnThreshold !== undefined && score >= config.warnThreshold) { return 'warn'; }
  return 'fail';
}

const EVALUATORS: Record<string, GateEvaluator> = {
  groundedness: evaluateGroundedness,
  citation: evaluateCitation,
  freshness: evaluateFreshness,
  hallucination: evaluateHallucination,
  coverage: evaluateCoverage,
};

// =============================================================================
// VerificationGateEngine
// =============================================================================

export class VerificationGateEngine {
  private profile: VerificationProfile;

  constructor(riskProfile: RiskProfile = 'standard') {
    this.profile = PROFILES[riskProfile];
  }

  /**
   * Switch to a different risk profile
   */
  setProfile(riskProfile: RiskProfile): void {
    this.profile = PROFILES[riskProfile];
  }

  /**
   * Override specific gate thresholds
   */
  overrideGate(gateName: string, overrides: Partial<GateConfig>): void {
    const gate = this.profile.gates.find(g => g.name === gateName);
    if (gate) {
      Object.assign(gate, overrides);
    }
  }

  /**
   * Register a custom gate evaluator
   */
  registerEvaluator(name: string, evaluator: GateEvaluator): void {
    EVALUATORS[name] = evaluator;
  }

  /**
   * Evaluate all gates against the provided input metrics
   */
  evaluate(input: GateInput): VerificationResult {
    const start = Date.now();
    const gates: GateResult[] = [];

    for (const config of this.profile.gates) {
      if (!config.enabled) { continue; }

      const evaluator = EVALUATORS[config.name];
      if (!evaluator) { continue; }

      const result = evaluator(input, config);
      if (result) {
        gates.push(result);
      }
    }

    // Also evaluate custom metrics
    if (input.custom) {
      for (const [key, value] of Object.entries(input.custom)) {
        const config = this.profile.gates.find(g => g.name === key);
        if (config && config.enabled) {
          const status = getStatus(value, config);
          gates.push({
            name: key,
            status,
            score: value,
            threshold: config.passThreshold,
            warnThreshold: config.warnThreshold,
            message: `${key}: ${(value * 100).toFixed(0)}%`,
          });
        }
      }
    }

    const failures = gates.filter(g => g.status === 'fail');
    const warnings = gates.filter(g => g.status === 'warn');
    const blockingFailures = failures.filter(g => {
      const cfg = this.profile.gates.find(c => c.name === g.name);
      return cfg?.blocking;
    });

    const overallStatus: GateStatus =
      blockingFailures.length > 0 ? 'fail' :
      failures.length > 0 || warnings.length > 0 ? 'warn' :
      'pass';

    const summary = this.buildSummary(gates, overallStatus);

    return {
      overallStatus,
      gates,
      summary,
      blocked: blockingFailures.length > 0,
      failures,
      warnings,
      meta: {
        riskProfile: this.profile.riskProfile,
        durationMs: Date.now() - start,
        gatesEvaluated: gates.length,
      },
    };
  }

  /**
   * Get the current profile configuration (for UI display)
   */
  getProfileConfig(): VerificationProfile {
    return { ...this.profile, gates: this.profile.gates.map(g => ({ ...g })) };
  }

  /**
   * Get all available risk profiles
   */
  static getAvailableProfiles(): RiskProfile[] {
    return ['strict', 'standard', 'relaxed'];
  }

  private buildSummary(gates: GateResult[], overall: GateStatus): string {
    const passed = gates.filter(g => g.status === 'pass').length;
    const total = gates.length;

    if (overall === 'pass') {
      return `All ${total} verification gates passed.`;
    }

    if (overall === 'warn') {
      return `${passed}/${total} gates passed. Some gates have warnings — review recommended.`;
    }

    const failedNames = gates
      .filter(g => g.status === 'fail')
      .map(g => g.name)
      .join(', ');

    return `Verification failed: ${failedNames}. ${passed}/${total} gates passed.`;
  }
}
