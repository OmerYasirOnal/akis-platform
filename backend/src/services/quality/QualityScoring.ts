/**
 * Quality Scoring Service
 * Computes quality scores for completed jobs based on execution metrics.
 * Pure function: same inputs → same output
 */

export const QUALITY_VERSION = 'v1.1';

export interface QualityBreakdownItem {
  label: string;
  value: string;
  points: number;
}

export interface QualityResult {
  score: number;
  breakdown: QualityBreakdownItem[];
  version: string;
  computedAt: Date;
}

export interface QualityInput {
  jobType: string;
  state: 'completed' | 'failed';
  errorCode?: string | null;
  targetsConfigured: string[];
  targetsProduced: string[];
  documentsRead: number;
  filesProduced: number;
  docDepth: 'lite' | 'standard' | 'deep';
  multiPass: boolean;
  totalTokens?: number | null;
  /** S0.6: Evidence/attribution quality gate */
  contextPackId?: string | null;
  citationCount?: number | null;
  verifiedCitationCount?: number | null;
  /** Trace agent quality metrics */
  traceMetrics?: {
    scenarioCount: number;
    priorityBreakdown?: Record<string, number>;
    layerBreakdown?: Record<string, number>;
    hasPlaywrightCode?: boolean;
    hasRiskAssessment?: boolean;
    hasCoverageMatrix?: boolean;
    repoScanned?: boolean;
    existingTestCount?: number;
  } | null;
}

function normalizeTarget(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  const base = trimmed.includes('/') ? trimmed.split('/').pop() ?? trimmed : trimmed;
  return base.replace(/\.[^.]+$/i, '').toUpperCase();
}

function normalizeTargetList(values: string[]): string[] {
  const dedup = new Set<string>();
  for (const value of values) {
    const normalized = normalizeTarget(value);
    if (normalized.length > 0) {
      dedup.add(normalized);
    }
  }
  return Array.from(dedup);
}

/**
 * Computes a 0–100 quality score for a completed job based on execution metrics.
 * @param input - Job metrics (targets, files, depth, multi-pass, state)
 * @returns Score with detailed breakdown and version tag
 */
export function computeQualityScore(input: QualityInput): QualityResult {
  const breakdown: QualityBreakdownItem[] = [];
  let score = 0;

  if (input.state === 'failed') {
    breakdown.push({
      label: 'Job status',
      value: `Failed: ${input.errorCode || 'unknown'}`,
      points: 0,
    });
    return {
      score: 0,
      breakdown,
      version: QUALITY_VERSION,
      computedAt: new Date(),
    };
  }

  const configuredTargets = normalizeTargetList(input.targetsConfigured);
  const producedTargets = normalizeTargetList(input.targetsProduced);
  const producedCount = Math.max(input.filesProduced, producedTargets.length);
  const configuredCount = configuredTargets.length;

  // Target coverage (30 points max, scope-aware)
  const matchedTargets = configuredCount > 0
    ? configuredTargets.filter((target) => producedTargets.includes(target)).length
    : 0;
  const targetCoverage = configuredCount > 0
    ? matchedTargets / configuredCount
    : producedCount > 0
      ? 1
      : 0;
  const targetPoints = Math.round(targetCoverage * 30);
  breakdown.push({
    label: 'Target coverage',
    value: configuredCount > 0
      ? `${matchedTargets}/${configuredCount} targets`
      : producedCount > 0
        ? `${producedCount} inferred target(s)`
        : '0 inferred targets',
    points: targetPoints,
  });
  score += targetPoints;

  // Files analyzed (20 points max, calibrated by target scope)
  const expectedReads = Math.max(3, configuredCount > 0 ? configuredCount * 2 : 3);
  const readCoverage = Math.min(input.documentsRead / expectedReads, 1);
  const readPoints = Math.round(readCoverage * 20);
  breakdown.push({
    label: 'Files analyzed',
    value: `${input.documentsRead}/${expectedReads} files`,
    points: readPoints,
  });
  score += readPoints;

  // Output volume (20 points max, calibrated by target scope)
  const expectedOutputs = Math.max(1, configuredCount > 0 ? configuredCount : 1);
  const outputCoverage = Math.min(producedCount / expectedOutputs, 1);
  const outputPoints = Math.round(outputCoverage * 20);
  breakdown.push({
    label: 'Docs generated',
    value: `${producedCount}/${expectedOutputs} files`,
    points: outputPoints,
  });
  score += outputPoints;

  // Depth bonus (15 points max)
  const depthPoints = input.docDepth === 'deep' ? 15 : input.docDepth === 'standard' ? 10 : 5;
  breakdown.push({
    label: 'Analysis depth',
    value: input.docDepth,
    points: depthPoints,
  });
  score += depthPoints;

  // Multi-pass bonus (15 points)
  if (input.multiPass) {
    breakdown.push({ label: 'Multi-pass review', value: 'Yes', points: 15 });
    score += 15;
  } else {
    breakdown.push({ label: 'Multi-pass review', value: 'No', points: 0 });
  }

  // Trace agent quality metrics
  if (input.traceMetrics) {
    const tm = input.traceMetrics;
    let traceBonus = 0;

    // Scenario coverage: more scenarios = better coverage
    if (tm.scenarioCount >= 10) {
      traceBonus += 5;
      breakdown.push({ label: 'Test scenarios', value: `${tm.scenarioCount} scenarios (comprehensive)`, points: 5 });
    } else if (tm.scenarioCount >= 5) {
      traceBonus += 3;
      breakdown.push({ label: 'Test scenarios', value: `${tm.scenarioCount} scenarios (good)`, points: 3 });
    } else {
      breakdown.push({ label: 'Test scenarios', value: `${tm.scenarioCount} scenarios`, points: 0 });
    }

    // Multi-layer coverage bonus
    const layers = tm.layerBreakdown ?? {};
    const layersCovered = Object.values(layers).filter(v => v > 0).length;
    if (layersCovered >= 3) {
      traceBonus += 5;
      breakdown.push({ label: 'Test layers', value: 'Unit + Integration + E2E', points: 5 });
    } else if (layersCovered >= 2) {
      traceBonus += 3;
      breakdown.push({ label: 'Test layers', value: `${layersCovered}/3 layers`, points: 3 });
    }

    // P0 coverage: critical tests present
    const p0Count = tm.priorityBreakdown?.P0 ?? 0;
    if (p0Count > 0) {
      traceBonus += 3;
      breakdown.push({ label: 'Critical tests (P0)', value: `${p0Count} P0 tests`, points: 3 });
    }

    // Executable code bonus
    if (tm.hasPlaywrightCode) {
      traceBonus += 3;
      breakdown.push({ label: 'Executable tests', value: 'Playwright code generated', points: 3 });
    }

    // Risk assessment bonus
    if (tm.hasRiskAssessment) {
      traceBonus += 2;
      breakdown.push({ label: 'Risk assessment', value: 'Generated', points: 2 });
    }

    // Repo scan bonus
    if (tm.repoScanned) {
      traceBonus += 2;
      breakdown.push({ label: 'Repo analysis', value: 'Deep scan performed', points: 2 });
    }

    score += traceBonus;
  }

  // S0.6: Evidence/attribution quality gate
  // When a context pack is used, agent output must include citations.
  // Missing citations → penalty; verified citations → bonus.
  if (input.contextPackId) {
    const citations = input.citationCount ?? 0;
    const verified = input.verifiedCitationCount ?? 0;

    if (citations === 0) {
      const penalty = -15;
      breakdown.push({
        label: 'Evidence citations',
        value: 'No citations (knowledge pack used)',
        points: penalty,
      });
      score += penalty;
    } else if (verified > 0) {
      const ratio = Math.min(verified / citations, 1);
      const bonus = Math.round(ratio * 10);
      breakdown.push({
        label: 'Evidence citations',
        value: `${verified}/${citations} verified`,
        points: bonus,
      });
      score += bonus;
    } else {
      breakdown.push({
        label: 'Evidence citations',
        value: `${citations} unverified`,
        points: 0,
      });
    }
  }

  return {
    score: Math.max(0, Math.min(score, 100)),
    breakdown,
    version: QUALITY_VERSION,
    computedAt: new Date(),
  };
}

/**
 * Generates up to 2 actionable improvement suggestions based on a quality result.
 * @param result - The computed quality result
 * @param input - The original quality input for context
 * @returns Array of suggestion strings (max 2)
 */
export function generateQualitySuggestions(result: QualityResult, input: QualityInput): string[] {
  const suggestions: string[] = [];

  if (input.state === 'failed') {
    if (input.errorCode === 'AI_PROVIDER_ERROR') {
      suggestions.push('Check AI provider configuration and supported models in Settings > AI Keys');
    } else if (input.errorCode === 'MCP_UNREACHABLE') {
      suggestions.push('Verify MCP Gateway is running and GitHub integration is connected');
    } else {
      suggestions.push('Review job logs for error details');
    }
    return suggestions;
  }

  const breakdown = Object.fromEntries(result.breakdown.map(b => [b.label, b]));

  if ((breakdown['Target coverage']?.points || 0) < 15) {
    suggestions.push('Increase target scope or add more output targets');
  }

  if ((breakdown['Files analyzed']?.points || 0) < 10) {
    suggestions.push('Expand repository scope to analyze more files');
  }

  if ((breakdown['Docs generated']?.points || 0) < 10) {
    suggestions.push('Consider using "full" doc pack for more comprehensive output');
  }

  if (input.docDepth !== 'deep') {
    suggestions.push('Enable "deep" analysis mode for higher quality');
  }

  if (!input.multiPass) {
    suggestions.push('Enable multi-pass review for better accuracy');
  }

  if (input.contextPackId && (input.citationCount ?? 0) === 0) {
    suggestions.push('Add source citations when using knowledge packs for higher trust scores');
  }

  // Trace-specific suggestions
  if (input.traceMetrics) {
    const tm = input.traceMetrics;
    const layers = tm.layerBreakdown ?? {};
    const layersCovered = Object.values(layers).filter(v => v > 0).length;

    if (layersCovered < 3) {
      suggestions.push('Add tests at all layers (unit, integration, e2e) for comprehensive coverage');
    }
    if ((tm.priorityBreakdown?.P0 ?? 0) === 0) {
      suggestions.push('Add P0 (critical) tests for auth, security, and data integrity');
    }
    if (!tm.hasPlaywrightCode) {
      suggestions.push('Enable executable Playwright code generation for CI-ready tests');
    }
    if (!tm.repoScanned) {
      suggestions.push('Connect a repository for code-aware test generation');
    }
  }

  return suggestions.slice(0, 2);
}
