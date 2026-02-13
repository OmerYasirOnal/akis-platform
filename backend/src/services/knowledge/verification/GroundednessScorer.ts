/**
 * GroundednessScorer — Evidence-based claim verification scoring
 *
 * M2-KI-1: Matches decomposed claims against evidence sources
 * (knowledge base, code analysis, external references) and produces
 * a 0-1 groundedness score per claim and an aggregate score.
 *
 * Scoring approach (inspired by FActScore, Min et al. 2023):
 * 1. Decompose content into atomic claims (via ClaimDecomposer)
 * 2. For each claim, search evidence sources
 * 3. Score each claim: supported / partially-supported / unsupported / contradicted
 * 4. Aggregate into a single groundedness score
 *
 * Evidence matching strategies:
 * - Keyword overlap (TF-IDF-like)
 * - Exact phrase matching
 * - AI-assisted entailment checking (when available)
 */

import {
  ClaimDecomposer,
  type Claim,
  type DecompositionResult,
  type DecomposeOptions,
  type ClaimDecomposerAI,
} from './ClaimDecomposer.js';

// =============================================================================
// Types
// =============================================================================

export type ClaimVerdict =
  | 'supported'           // Evidence directly supports the claim
  | 'partially_supported' // Some evidence, but incomplete
  | 'unsupported'         // No evidence found
  | 'contradicted';       // Evidence contradicts the claim

export interface ClaimScore {
  claim: Claim;
  verdict: ClaimVerdict;
  score: number; // 0-1 (1 = fully supported)
  evidence: EvidenceMatch[];
  reasoning?: string;
}

export interface EvidenceMatch {
  source: string;
  content: string;
  relevance: number; // 0-1
  type: EvidenceType;
}

export type EvidenceType =
  | 'knowledge_base'   // From RAG / knowledge store
  | 'code_analysis'    // From source code
  | 'external'         // From web search / external reference
  | 'manual';          // From human-provided context

export interface GroundednessResult {
  /** Overall groundedness score (0-1) */
  overallScore: number;
  /** Weighted score (critical claims weighted higher) */
  weightedScore: number;
  /** Individual claim scores */
  claimScores: ClaimScore[];
  /** Summary statistics */
  stats: {
    totalClaims: number;
    supported: number;
    partiallySupported: number;
    unsupported: number;
    contradicted: number;
    criticalUnsupported: number;
  };
  /** Whether the content passes the groundedness threshold */
  passed: boolean;
  /** Processing metadata */
  meta: {
    durationMs: number;
    evidenceSourcesSearched: number;
    decompositionMeta: DecompositionResult['meta'];
  };
}

export interface GroundednessOptions {
  /** Minimum overall score to pass (0-1, default 0.7) */
  passThreshold?: number;
  /** Weight multiplier for critical claims (default 2.0) */
  criticalWeight?: number;
  /** Decomposition options */
  decomposeOptions?: DecomposeOptions;
  /** Maximum evidence items to consider per claim */
  maxEvidencePerClaim?: number;
}

/**
 * Interface for evidence sources that the scorer can search
 */
export interface EvidenceSource {
  type: EvidenceType;
  name: string;
  search(query: string, maxResults?: number): Promise<EvidenceMatch[]>;
}

// =============================================================================
// GroundednessScorer
// =============================================================================

export class GroundednessScorer {
  private decomposer: ClaimDecomposer;
  private evidenceSources: EvidenceSource[];

  constructor(
    ai?: ClaimDecomposerAI,
    evidenceSources: EvidenceSource[] = [],
  ) {
    this.decomposer = new ClaimDecomposer(ai);
    this.evidenceSources = evidenceSources;
  }

  /**
   * Score the groundedness of a piece of text
   */
  async score(
    text: string,
    options: GroundednessOptions = {},
  ): Promise<GroundednessResult> {
    const start = Date.now();
    const {
      passThreshold = 0.7,
      criticalWeight = 2.0,
      decomposeOptions = {},
      maxEvidencePerClaim = 5,
    } = options;

    // Step 1: Decompose into claims
    const decomposition = await this.decomposer.decompose(text, decomposeOptions);

    // Step 2: Score each claim against evidence
    const claimScores: ClaimScore[] = [];

    for (const claim of decomposition.claims) {
      const evidence = await this.findEvidence(claim, maxEvidencePerClaim);
      const { verdict, score } = this.scoreClaim(claim, evidence);

      claimScores.push({
        claim,
        verdict,
        score,
        evidence,
      });
    }

    // Step 3: Compute aggregate scores
    const stats = this.computeStats(claimScores);
    const overallScore = this.computeOverallScore(claimScores);
    const weightedScore = this.computeWeightedScore(claimScores, criticalWeight);

    return {
      overallScore,
      weightedScore,
      claimScores,
      stats,
      passed: weightedScore >= passThreshold,
      meta: {
        durationMs: Date.now() - start,
        evidenceSourcesSearched: this.evidenceSources.length,
        decompositionMeta: decomposition.meta,
      },
    };
  }

  /**
   * Quick score without detailed evidence matching (heuristic only)
   */
  quickScore(text: string): number {
    const claims = this.decomposer.heuristicDecompose(text);
    if (claims.length === 0) { return 1.0; }

    // Heuristic: high factuality claims with citations score well
    let total = 0;
    for (const claim of claims) {
      let claimScore = claim.factuality;
      if (claim.citations && claim.citations.length > 0) {
        claimScore = Math.min(1, claimScore + 0.2);
      }
      total += claimScore;
    }

    return Math.round((total / claims.length) * 100) / 100;
  }

  /**
   * Add an evidence source to search against
   */
  addEvidenceSource(source: EvidenceSource): void {
    this.evidenceSources.push(source);
  }

  // ===========================================================================
  // Private methods
  // ===========================================================================

  private async findEvidence(
    claim: Claim,
    maxResults: number,
  ): Promise<EvidenceMatch[]> {
    if (this.evidenceSources.length === 0) {
      return [];
    }

    const allMatches: EvidenceMatch[] = [];

    for (const source of this.evidenceSources) {
      try {
        const matches = await source.search(claim.text, maxResults);
        allMatches.push(...matches.map(m => ({
          ...m,
          type: source.type,
        })));
      } catch {
        // Skip failed sources
      }
    }

    // Sort by relevance, take top N
    return allMatches
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxResults);
  }

  private scoreClaim(
    claim: Claim,
    evidence: EvidenceMatch[],
  ): { verdict: ClaimVerdict; score: number } {
    if (evidence.length === 0) {
      // No evidence: use factuality as a soft signal
      // High factuality claims without evidence = likely unsupported
      // Low factuality claims without evidence = likely opinion (less concerning)
      return {
        verdict: 'unsupported',
        score: claim.factuality < 0.5 ? 0.3 : 0.1,
      };
    }

    const maxRelevance = Math.max(...evidence.map(e => e.relevance));
    const avgRelevance = evidence.reduce((s, e) => s + e.relevance, 0) / evidence.length;

    // Check for contradiction indicators
    const hasContradiction = evidence.some(e =>
      this.containsContradiction(claim.text, e.content),
    );

    if (hasContradiction) {
      return { verdict: 'contradicted', score: 0 };
    }

    // Score based on evidence relevance
    if (maxRelevance >= 0.8) {
      return { verdict: 'supported', score: Math.min(1, 0.7 + avgRelevance * 0.3) };
    }

    if (maxRelevance >= 0.5) {
      return { verdict: 'partially_supported', score: 0.4 + avgRelevance * 0.3 };
    }

    return { verdict: 'unsupported', score: avgRelevance * 0.3 };
  }

  private containsContradiction(claimText: string, evidenceText: string): boolean {
    const lower = claimText.toLowerCase();
    const evidenceLower = evidenceText.toLowerCase();

    // Simple heuristic: check for negation patterns in evidence relative to claim
    const negationPairs = [
      ['does not', 'does'],
      ['is not', 'is'],
      ['cannot', 'can'],
      ['never', 'always'],
      ['deprecated', 'recommended'],
      ['removed', 'added'],
      ['false', 'true'],
    ];

    for (const [neg, pos] of negationPairs) {
      if (lower.includes(pos) && evidenceLower.includes(neg)) { return true; }
      if (lower.includes(neg) && evidenceLower.includes(pos)) { return true; }
    }

    return false;
  }

  private computeOverallScore(claimScores: ClaimScore[]): number {
    if (claimScores.length === 0) { return 1.0; }

    const total = claimScores.reduce((sum, cs) => sum + cs.score, 0);
    return Math.round((total / claimScores.length) * 100) / 100;
  }

  private computeWeightedScore(
    claimScores: ClaimScore[],
    criticalWeight: number,
  ): number {
    if (claimScores.length === 0) { return 1.0; }

    let totalWeight = 0;
    let weightedSum = 0;

    for (const cs of claimScores) {
      const weight = cs.claim.critical ? criticalWeight : 1.0;
      totalWeight += weight;
      weightedSum += cs.score * weight;
    }

    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }

  private computeStats(claimScores: ClaimScore[]): GroundednessResult['stats'] {
    const stats = {
      totalClaims: claimScores.length,
      supported: 0,
      partiallySupported: 0,
      unsupported: 0,
      contradicted: 0,
      criticalUnsupported: 0,
    };

    for (const cs of claimScores) {
      stats[cs.verdict === 'partially_supported' ? 'partiallySupported' : cs.verdict]++;
      if (cs.claim.critical && (cs.verdict === 'unsupported' || cs.verdict === 'contradicted')) {
        stats.criticalUnsupported++;
      }
    }

    return stats;
  }
}
