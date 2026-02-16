import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { knowledgeSources } from '../../../db/schema.js';
import { McpError, type GitHubMCPService } from '../../mcp/adapters/GitHubMCPService.js';

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

export interface SecurityAdvisorySignal {
  cveId: string;
  ghsaId?: string | null;
  summary: string;
  severity: SecuritySeverity;
  riskScore: number;
  affectedPackage?: string | null;
  sourceUrl: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export interface SecuritySyncSummary {
  syncedAt: string;
  source: 'github_advisories' | 'manual';
  totalSignals: number;
  inserted: number;
  updated: number;
  deduped: number;
  signals: SecurityAdvisorySignal[];
}

export class SecuritySignalCollector {
  constructor(private githubMcp: GitHubMCPService | null) {}

  static normalizeSeverity(input: unknown): SecuritySeverity {
    if (typeof input !== 'string') {
      return 'unknown';
    }
    const value = input.trim().toLowerCase();
    if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') {
      return value;
    }
    return 'unknown';
  }

  static computeRiskScore(severity: SecuritySeverity): number {
    switch (severity) {
      case 'critical':
        return 1;
      case 'high':
        return 0.85;
      case 'medium':
        return 0.6;
      case 'low':
        return 0.3;
      default:
        return 0.2;
    }
  }

  async syncGithubRepo(owner: string, repo: string): Promise<SecuritySyncSummary> {
    const advisories = await this.fetchGitHubSecurityAdvisories(owner, repo);
    return this.persistSignals(advisories, 'github_advisories');
  }

  async syncManual(signals: SecurityAdvisorySignal[]): Promise<SecuritySyncSummary> {
    return this.persistSignals(signals, 'manual');
  }

  private async fetchGitHubSecurityAdvisories(
    owner: string,
    repo: string
  ): Promise<SecurityAdvisorySignal[]> {
    if (!this.githubMcp) {
      return [];
    }

    const attempts: Array<{ tool: string; args: Record<string, unknown> }> = [
      { tool: 'list_security_advisories', args: { owner, repo, per_page: 100, state: 'published' } },
      { tool: 'list_repository_security_advisories', args: { owner, repo, per_page: 100, state: 'published' } },
      { tool: 'list_repo_security_advisories', args: { owner, repo, per_page: 100, state: 'published' } },
    ];

    for (const attempt of attempts) {
      try {
        const payload = await this.githubMcp.callToolRaw<unknown>(attempt.tool, attempt.args);
        return this.parseGitHubAdvisoryPayload(payload);
      } catch (error) {
        if (error instanceof McpError && error.mcpCode === -32601) {
          continue;
        }
        throw error;
      }
    }

    return [];
  }

  private parseGitHubAdvisoryPayload(payload: unknown): SecurityAdvisorySignal[] {
    if (Array.isArray(payload)) {
      return payload
        .map((item) => this.normalizeAdvisory(item))
        .filter((item): item is SecurityAdvisorySignal => item !== null);
    }

    if (!payload || typeof payload !== 'object') {
      return [];
    }

    const record = payload as Record<string, unknown>;
    const advisoriesRaw = Array.isArray(record.advisories)
      ? record.advisories
      : Array.isArray(record.items)
        ? record.items
        : Array.isArray(record.security_advisories)
          ? record.security_advisories
          : [];

    if (advisoriesRaw.length > 0) {
      return advisoriesRaw
        .map((item) => this.normalizeAdvisory(item))
        .filter((item): item is SecurityAdvisorySignal => item !== null);
    }

    const single = this.normalizeAdvisory(record);
    return single ? [single] : [];
  }

  private normalizeAdvisory(payload: unknown): SecurityAdvisorySignal | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const record = payload as Record<string, unknown>;

    const cveId =
      this.readString(record.cve_id) ??
      this.readString(record.cve) ??
      this.readString(record.cveId);
    if (!cveId || !/^CVE-\d{4}-\d{4,}$/i.test(cveId)) {
      return null;
    }

    const severity = SecuritySignalCollector.normalizeSeverity(
      record.severity ??
        record.cvss_severity ??
        this.readNestedString(record, ['cvss', 'severity'])
    );

    const summary =
      this.readString(record.summary) ??
      this.readString(record.description) ??
      'Security advisory';

    const sourceUrl =
      this.readString(record.html_url) ??
      this.readString(record.url) ??
      `https://www.cve.org/CVERecord?id=${cveId.toUpperCase()}`;

    const affectedPackage =
      this.readString(record.package_name) ??
      this.readString(record.affected_package_name) ??
      this.readNestedString(record, ['vulnerabilities', '0', 'package', 'name']) ??
      null;

    return {
      cveId: cveId.toUpperCase(),
      ghsaId: this.readString(record.ghsa_id) ?? this.readString(record.ghsaId) ?? null,
      summary,
      severity,
      riskScore: SecuritySignalCollector.computeRiskScore(severity),
      affectedPackage,
      sourceUrl,
      publishedAt:
        this.readString(record.published_at) ??
        this.readString(record.publishedAt) ??
        null,
      updatedAt:
        this.readString(record.updated_at) ??
        this.readString(record.updatedAt) ??
        null,
    };
  }

  private async persistSignals(
    inputSignals: SecurityAdvisorySignal[],
    source: SecuritySyncSummary['source']
  ): Promise<SecuritySyncSummary> {
    const dedupedMap = new Map<string, SecurityAdvisorySignal>();
    for (const signal of inputSignals) {
      dedupedMap.set(signal.cveId, signal);
    }
    const signals = Array.from(dedupedMap.values());

    let inserted = 0;
    let updated = 0;

    for (const signal of signals) {
      const existing = await db
        .select({ id: knowledgeSources.id })
        .from(knowledgeSources)
        .where(
          and(
            eq(knowledgeSources.domain, 'security'),
            sql`${knowledgeSources.metadata} ->> 'cveId' = ${signal.cveId}`
          )
        )
        .limit(1);

      const metadata = {
        signalType: 'cve',
        cveId: signal.cveId,
        ghsaId: signal.ghsaId,
        summary: signal.summary,
        severity: signal.severity,
        riskScore: signal.riskScore,
        affectedPackage: signal.affectedPackage,
        publishedAt: signal.publishedAt,
        updatedAt: signal.updatedAt,
        source,
        lastSyncedAt: new Date().toISOString(),
      };

      if (existing.length > 0) {
        await db
          .update(knowledgeSources)
          .set({
            name: signal.cveId,
            sourceUrl: signal.sourceUrl,
            metadata,
            refreshIntervalHours: 24,
            updatedAt: new Date(),
          })
          .where(eq(knowledgeSources.id, existing[0].id));
        updated += 1;
        continue;
      }

      await db.insert(knowledgeSources).values({
        name: signal.cveId,
        sourceUrl: signal.sourceUrl,
        licenseType: 'unknown',
        accessMethod: 'api',
        domain: 'security',
        refreshIntervalHours: 24,
        verificationStatus: 'single_source',
        metadata,
      });
      inserted += 1;
    }

    return {
      syncedAt: new Date().toISOString(),
      source,
      totalSignals: signals.length,
      inserted,
      updated,
      deduped: Math.max(0, inputSignals.length - signals.length),
      signals,
    };
  }

  private readString(value: unknown): string | null {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return null;
  }

  private readNestedString(record: Record<string, unknown>, path: string[]): string | null {
    let current: unknown = record;
    for (const segment of path) {
      if (!current || typeof current !== 'object') {
        return null;
      }
      const next = (current as Record<string, unknown>)[segment];
      current = next;
    }
    return this.readString(current);
  }
}
