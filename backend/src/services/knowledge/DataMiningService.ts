/**
 * DataMiningService — CRISP-DM tabanlı veri madenciliği servisi
 *
 * Agent'ların ürettiği verileri data mining perspektifinden analiz eder.
 * Fine-tuning veri toplama, kalite değerlendirme ve pattern mining.
 */

// ── Tipler ──────────────────────────────────────────────────

export interface MiningEvent {
  eventId: string;
  sessionId: string;
  timestamp: string;
  eventType: 'query' | 'generation' | 'tool_call' | 'feedback' | 'error';
  userIntent: string;
  toolName?: string;
  outcome: 'success' | 'failure' | 'partial';
  errorCode?: string;
  latencyMs: number;
  tokenCount: number;
  modelVersion: string;
}

export interface DataQualityReport {
  overallScore: number;
  completeness: number;
  consistency: number;
  accuracy: number;
  timeliness: number;
  uniqueness: number;
  validity: number;
  totalEvents: number;
  verdict: 'GOOD' | 'FAIR' | 'POOR';
}

export interface ValueAssessment {
  task: string;
  baselineSuccess: number;
  targetSuccess: number;
  gap: number;
  priorityScore: number;
  recommendation: string;
}

export interface PatternReport {
  toolSequences: { sequence: string[]; count: number }[];
  errorDistribution: Record<string, number>;
  successRate: number;
  avgToolsInSuccess: number;
  avgToolsInFailure: number;
}

// ── Servis ──────────────────────────────────────────────────

export class DataMiningService {
  private events: MiningEvent[] = [];

  /**
   * Olay logla (DWH event schema).
   */
  logEvent(event: MiningEvent): void {
    this.events.push(event);
  }

  /**
   * Faz 1: İş değeri değerlendirmesi (Assessing Value).
   */
  assessValue(
    goals: {
      task: string;
      baselineSuccess: number;
      targetSuccess: number;
      wrongOutputCost: 'low' | 'medium' | 'high';
    }[],
  ): ValueAssessment[] {
    const costMultiplier = { low: 1, medium: 2, high: 3 };

    return goals
      .map((goal) => {
        const gap = goal.targetSuccess - goal.baselineSuccess;
        const priority = gap * costMultiplier[goal.wrongOutputCost];

        return {
          task: goal.task,
          baselineSuccess: goal.baselineSuccess,
          targetSuccess: goal.targetSuccess,
          gap: Math.round(gap * 10000) / 10000,
          priorityScore: Math.round(priority * 10000) / 10000,
          recommendation:
            priority > 0.5
              ? 'HIGH priority — large gap + high cost'
              : priority > 0.2
                ? 'MEDIUM priority'
                : 'LOW priority — small improvement expected',
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Faz 2: Veri kalitesi değerlendirmesi (6 boyut).
   */
  assessDataQuality(): DataQualityReport {
    const n = this.events.length;
    if (n === 0) {
      return {
        overallScore: 0,
        completeness: 0,
        consistency: 0,
        accuracy: 0,
        timeliness: 0,
        uniqueness: 0,
        validity: 0,
        totalEvents: 0,
        verdict: 'POOR',
      };
    }

    // Completeness
    const requiredFields: (keyof MiningEvent)[] = [
      'sessionId',
      'eventType',
      'userIntent',
      'outcome',
    ];
    let missingCount = 0;
    for (const e of this.events) {
      for (const f of requiredFields) {
        if (!e[f]) missingCount++;
      }
    }
    const completeness = 1 - missingCount / (n * requiredFields.length);

    // Consistency
    const validOutcomes = new Set(['success', 'failure', 'partial']);
    const inconsistent = this.events.filter(
      (e) => !validOutcomes.has(e.outcome),
    ).length;
    const consistency = 1 - inconsistent / n;

    // Accuracy
    const accuracyIssues = this.events.filter(
      (e) => e.latencyMs < 0 || e.tokenCount < 0,
    ).length;
    const accuracy = 1 - accuracyIssues / n;

    // Timeliness
    const timely = this.events.filter((e) => {
      try {
        return !isNaN(new Date(e.timestamp).getTime());
      } catch {
        return false;
      }
    }).length;
    const timeliness = timely / n;

    // Uniqueness
    const ids = new Set(this.events.map((e) => e.eventId));
    const uniqueness = ids.size / n;

    // Validity (basit PII check)
    const piiPattern = /[\w.-]+@[\w.-]+\.\w+|\b\d{11}\b/;
    const piiLeaks = this.events.filter(
      (e) => piiPattern.test(e.userIntent),
    ).length;
    const validity = 1 - piiLeaks / n;

    const overall =
      completeness * 0.2 +
      consistency * 0.15 +
      accuracy * 0.15 +
      timeliness * 0.15 +
      uniqueness * 0.15 +
      validity * 0.2;

    return {
      overallScore: Math.round(overall * 10000) / 10000,
      completeness: Math.round(completeness * 10000) / 10000,
      consistency: Math.round(consistency * 10000) / 10000,
      accuracy: Math.round(accuracy * 10000) / 10000,
      timeliness: Math.round(timeliness * 10000) / 10000,
      uniqueness: Math.round(uniqueness * 10000) / 10000,
      validity: Math.round(validity * 10000) / 10000,
      totalEvents: n,
      verdict: overall >= 0.8 ? 'GOOD' : overall >= 0.6 ? 'FAIR' : 'POOR',
    };
  }

  /**
   * Faz 4: Pattern mining — tool sequences ve hata örüntüleri.
   */
  minePatterns(): PatternReport {
    // Tool sequence bigrams
    const sessions = new Map<string, string[]>();
    for (const e of this.events) {
      if (e.toolName) {
        const tools = sessions.get(e.sessionId) ?? [];
        tools.push(e.toolName);
        sessions.set(e.sessionId, tools);
      }
    }

    const bigrams = new Map<string, number>();
    for (const tools of sessions.values()) {
      for (let i = 0; i < tools.length - 1; i++) {
        const key = `${tools[i]}→${tools[i + 1]}`;
        bigrams.set(key, (bigrams.get(key) ?? 0) + 1);
      }
    }

    const toolSequences = [...bigrams.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([seq, count]) => ({ sequence: seq.split('→'), count }));

    // Error distribution
    const failures = this.events.filter((e) => e.outcome === 'failure');
    const errorDist: Record<string, number> = {};
    for (const f of failures) {
      const code = f.errorCode ?? 'unknown';
      errorDist[code] = (errorDist[code] ?? 0) + 1;
    }

    // Success patterns
    const sessionOutcomes = new Map<string, boolean>();
    for (const e of this.events) {
      if (e.outcome === 'failure') {
        sessionOutcomes.set(e.sessionId, false);
      } else if (!sessionOutcomes.has(e.sessionId)) {
        sessionOutcomes.set(e.sessionId, true);
      }
    }

    const successSessions = [...sessionOutcomes.values()].filter(Boolean).length;
    const totalSessions = sessionOutcomes.size;

    return {
      toolSequences,
      errorDistribution: errorDist,
      successRate:
        totalSessions > 0
          ? Math.round((successSessions / totalSessions) * 10000) / 10000
          : 0,
      avgToolsInSuccess: 0,
      avgToolsInFailure: 0,
    };
  }

  /**
   * Toplanan olayların sayısını döndür.
   */
  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Tüm olayları temizle.
   */
  clearEvents(): void {
    this.events = [];
  }
}
