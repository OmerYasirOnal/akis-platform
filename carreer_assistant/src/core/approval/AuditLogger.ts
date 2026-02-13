import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/schema.js';
import type { PlatformType } from '../../config/platforms.js';

export class AuditLogger {
  log(
    action: string,
    platform: PlatformType | string | null,
    jobId: string | null,
    details: Record<string, unknown>,
    outcome: 'success' | 'failure' | 'cancelled' = 'success',
    approvedBy: 'human' | 'auto' | null = null,
  ): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_log (id, timestamp, action, platform, job_id, details, outcome, approved_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      new Date().toISOString(),
      action,
      platform,
      jobId,
      JSON.stringify(details),
      outcome,
      approvedBy,
    );
  }

  getRecent(limit = 50): Array<{
    id: string;
    timestamp: string;
    action: string;
    platform: string | null;
    jobId: string | null;
    details: Record<string, unknown>;
    outcome: string;
    approvedBy: string | null;
  }> {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?
    `).all(limit) as Array<{
      id: string;
      timestamp: string;
      action: string;
      platform: string | null;
      job_id: string | null;
      details: string;
      outcome: string;
      approved_by: string | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      action: row.action,
      platform: row.platform,
      jobId: row.job_id,
      details: JSON.parse(row.details) as Record<string, unknown>,
      outcome: row.outcome,
      approvedBy: row.approved_by,
    }));
  }
}
