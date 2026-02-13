/**
 * ConflictDetector — Source conflict detection for knowledge integrity
 *
 * M2-KI-3: Detects conflicts between different knowledge sources
 * that provide contradictory information about the same topic.
 *
 * Conflict types:
 * - Direct contradiction: Source A says X, Source B says not-X
 * - Version conflict: Source A says v1.0, Source B says v2.0
 * - Temporal conflict: Source A (2024) says X, Source B (2026) says Y
 * - Scope conflict: Source A says "always X", Source B says "X only when Y"
 */

// =============================================================================
// Types
// =============================================================================

export type ConflictSeverity = 'critical' | 'major' | 'minor';
export type ConflictType = 'direct_contradiction' | 'version_conflict' | 'temporal_conflict' | 'scope_conflict';

export interface ConflictSource {
  id: string;
  content: string;
  origin: string;       // e.g., "knowledge_base", "repo_docs", "web_search"
  timestamp?: Date;
  confidence?: number;  // 0-1
}

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  topic: string;
  sourceA: ConflictSource;
  sourceB: ConflictSource;
  description: string;
  /** Suggested resolution */
  resolution?: string;
  /** Which source is likely more trustworthy */
  preferredSource?: 'A' | 'B' | 'unknown';
}

export interface ConflictDetectionResult {
  conflicts: Conflict[];
  stats: {
    totalConflicts: number;
    critical: number;
    major: number;
    minor: number;
    byType: Record<string, number>;
  };
  /** Whether any critical conflicts exist (should block output) */
  hasCriticalConflicts: boolean;
  meta: {
    durationMs: number;
    sourcesAnalyzed: number;
    pairsChecked: number;
  };
}

// =============================================================================
// Conflict Detection Heuristics
// =============================================================================

interface NegationPattern {
  positive: RegExp;
  negative: RegExp;
}

const NEGATION_PATTERNS: NegationPattern[] = [
  { positive: /\bis\s+supported\b/i, negative: /\bis\s+not\s+supported\b/i },
  { positive: /\bis\s+required\b/i, negative: /\bis\s+(?:not\s+required|optional)\b/i },
  { positive: /\bis\s+enabled\b/i, negative: /\bis\s+(?:not\s+enabled|disabled)\b/i },
  { positive: /\bis\s+recommended\b/i, negative: /\bis\s+(?:not\s+recommended|deprecated)\b/i },
  { positive: /\bshould\s+be\b/i, negative: /\bshould\s+not\s+be\b/i },
  { positive: /\bcan\b/i, negative: /\bcannot\b|\bcan\s*(?:'t|not)\b/i },
  { positive: /\btrue\b/i, negative: /\bfalse\b/i },
  { positive: /\byes\b/i, negative: /\bno\b/i },
];

const VERSION_PATTERN = /\bv?(\d+(?:\.\d+)+)\b/g;

// =============================================================================
// ConflictDetector
// =============================================================================

export class ConflictDetector {
  /**
   * Detect conflicts between multiple knowledge sources.
   */
  detect(sources: ConflictSource[]): ConflictDetectionResult {
    const start = Date.now();
    const conflicts: Conflict[] = [];
    let pairsChecked = 0;
    let conflictCounter = 0;

    // Compare each pair of sources
    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        pairsChecked++;
        const found = this.detectPairConflicts(sources[i], sources[j]);
        for (const conflict of found) {
          conflictCounter++;
          conflicts.push({
            ...conflict,
            id: `conflict-${conflictCounter}`,
          });
        }
      }
    }

    const stats = this.computeStats(conflicts);

    return {
      conflicts,
      stats,
      hasCriticalConflicts: stats.critical > 0,
      meta: {
        durationMs: Date.now() - start,
        sourcesAnalyzed: sources.length,
        pairsChecked,
      },
    };
  }

  /**
   * Check a single text against existing sources for conflicts
   */
  checkAgainstSources(
    text: string,
    sources: ConflictSource[],
  ): Conflict[] {
    const newSource: ConflictSource = {
      id: 'new-content',
      content: text,
      origin: 'agent_output',
      timestamp: new Date(),
    };

    const conflicts: Conflict[] = [];
    let counter = 0;

    for (const source of sources) {
      const found = this.detectPairConflicts(newSource, source);
      for (const conflict of found) {
        counter++;
        conflicts.push({
          ...conflict,
          id: `check-conflict-${counter}`,
        });
      }
    }

    return conflicts;
  }

  // ===========================================================================
  // Private
  // ===========================================================================

  private detectPairConflicts(
    sourceA: ConflictSource,
    sourceB: ConflictSource,
  ): Omit<Conflict, 'id'>[] {
    const conflicts: Omit<Conflict, 'id'>[] = [];

    // Check for direct contradictions
    const directConflict = this.checkDirectContradiction(sourceA, sourceB);
    if (directConflict) {
      conflicts.push(directConflict);
    }

    // Check for version conflicts
    const versionConflict = this.checkVersionConflict(sourceA, sourceB);
    if (versionConflict) {
      conflicts.push(versionConflict);
    }

    // Check for temporal conflicts
    const temporalConflict = this.checkTemporalConflict(sourceA, sourceB);
    if (temporalConflict) {
      conflicts.push(temporalConflict);
    }

    return conflicts;
  }

  private checkDirectContradiction(
    sourceA: ConflictSource,
    sourceB: ConflictSource,
  ): Omit<Conflict, 'id'> | null {
    const contentA = sourceA.content.toLowerCase();
    const contentB = sourceB.content.toLowerCase();

    for (const pattern of NEGATION_PATTERNS) {
      const aHasPositive = pattern.positive.test(contentA);
      const bHasNegative = pattern.negative.test(contentB);
      const aHasNegative = pattern.negative.test(contentA);
      const bHasPositive = pattern.positive.test(contentB);

      if ((aHasPositive && bHasNegative) || (aHasNegative && bHasPositive)) {
        // Find overlapping topic (common non-stop words)
        const topic = this.findCommonTopic(contentA, contentB);
        if (topic) {
          return {
            type: 'direct_contradiction',
            severity: 'critical',
            topic,
            sourceA,
            sourceB,
            description: `Sources contradict each other regarding "${topic}"`,
            preferredSource: this.pickPreferred(sourceA, sourceB),
          };
        }
      }
    }

    return null;
  }

  private checkVersionConflict(
    sourceA: ConflictSource,
    sourceB: ConflictSource,
  ): Omit<Conflict, 'id'> | null {
    const versionsA = this.extractVersions(sourceA.content);
    const versionsB = this.extractVersions(sourceB.content);

    // Find common context words near version numbers
    for (const vA of versionsA) {
      for (const vB of versionsB) {
        if (vA.version !== vB.version && vA.context && vB.context) {
          // Check if they refer to the same thing
          const overlap = this.wordOverlap(vA.context, vB.context);
          if (overlap > 0.3) {
            return {
              type: 'version_conflict',
              severity: 'major',
              topic: `${vA.context.substring(0, 50)}: v${vA.version} vs v${vB.version}`,
              sourceA,
              sourceB,
              description: `Version mismatch: "${vA.version}" vs "${vB.version}" for similar context`,
              preferredSource: this.pickPreferred(sourceA, sourceB),
            };
          }
        }
      }
    }

    return null;
  }

  private checkTemporalConflict(
    sourceA: ConflictSource,
    sourceB: ConflictSource,
  ): Omit<Conflict, 'id'> | null {
    if (!sourceA.timestamp || !sourceB.timestamp) { return null; }

    const ageDiffDays = Math.abs(
      (sourceA.timestamp.getTime() - sourceB.timestamp.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Only flag temporal conflicts for sources >180 days apart
    if (ageDiffDays < 180) { return null; }

    // Check if they discuss the same topic
    const topic = this.findCommonTopic(
      sourceA.content.toLowerCase(),
      sourceB.content.toLowerCase(),
    );

    if (!topic) { return null; }

    const newer = sourceA.timestamp > sourceB.timestamp ? sourceA : sourceB;
    const older = sourceA.timestamp > sourceB.timestamp ? sourceB : sourceA;

    return {
      type: 'temporal_conflict',
      severity: 'minor',
      topic,
      sourceA,
      sourceB,
      description: `Sources are ${Math.round(ageDiffDays)} days apart — newer information may supersede`,
      resolution: `Prefer the newer source (${newer.origin})`,
      preferredSource: newer === sourceA ? 'A' : 'B',
    };
  }

  private findCommonTopic(textA: string, textB: string): string | null {
    const STOP_WORDS = new Set([
      'the', 'is', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
      'for', 'of', 'with', 'by', 'from', 'it', 'this', 'that', 'be', 'are',
      'was', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'not', 'will', 'can', 'should', 'would', 'could', 'may', 'might',
    ]);

    const wordsA = new Set(
      textA.split(/\W+/).filter(w => w.length > 2 && !STOP_WORDS.has(w)),
    );
    const wordsB = new Set(
      textB.split(/\W+/).filter(w => w.length > 2 && !STOP_WORDS.has(w)),
    );

    const common = [...wordsA].filter(w => wordsB.has(w));
    if (common.length === 0) { return null; }

    return common.slice(0, 3).join(' ');
  }

  private extractVersions(text: string): Array<{ version: string; context: string }> {
    const results: Array<{ version: string; context: string }> = [];
    const regex = new RegExp(VERSION_PATTERN.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      results.push({
        version: match[1],
        context: text.substring(start, end).trim(),
      });
    }

    return results;
  }

  private wordOverlap(textA: string, textB: string): number {
    const wordsA = new Set(textA.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const wordsB = new Set(textB.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    if (wordsA.size === 0 || wordsB.size === 0) { return 0; }

    const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;
    return intersection / union;
  }

  private pickPreferred(
    sourceA: ConflictSource,
    sourceB: ConflictSource,
  ): 'A' | 'B' | 'unknown' {
    // Prefer higher confidence
    if (sourceA.confidence !== undefined && sourceB.confidence !== undefined) {
      if (sourceA.confidence > sourceB.confidence + 0.1) { return 'A'; }
      if (sourceB.confidence > sourceA.confidence + 0.1) { return 'B'; }
    }

    // Prefer newer timestamp
    if (sourceA.timestamp && sourceB.timestamp) {
      return sourceA.timestamp > sourceB.timestamp ? 'A' : 'B';
    }

    return 'unknown';
  }

  private computeStats(conflicts: Conflict[]): ConflictDetectionResult['stats'] {
    const byType: Record<string, number> = {};
    let critical = 0;
    let major = 0;
    let minor = 0;

    for (const c of conflicts) {
      byType[c.type] = (byType[c.type] || 0) + 1;
      if (c.severity === 'critical') { critical++; }
      else if (c.severity === 'major') { major++; }
      else { minor++; }
    }

    return {
      totalConflicts: conflicts.length,
      critical,
      major,
      minor,
      byType,
    };
  }
}
