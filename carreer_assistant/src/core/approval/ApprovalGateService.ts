import { randomUUID } from 'node:crypto';
import { getDb } from '../../db/schema.js';
import type { PlatformType } from '../../config/platforms.js';
import { AuditLogger } from './AuditLogger.js';

export type ApprovalActionType =
  | 'submit_application'
  | 'send_message'
  | 'accept_interview'
  | 'update_profile'
  | 'request_payment'
  | 'create_gig';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApprovalRequest {
  id: string;
  createdAt: string;
  actionType: ApprovalActionType;
  jobId: string | null;
  platform: PlatformType | null;
  payload: Record<string, unknown>;
  status: ApprovalStatus;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionReason: string | null;
}

export class ApprovalGateService {
  private audit: AuditLogger;

  constructor() {
    this.audit = new AuditLogger();
  }

  requestApproval(
    actionType: ApprovalActionType,
    payload: Record<string, unknown>,
    jobId?: string,
    platform?: PlatformType,
  ): ApprovalRequest {
    const id = randomUUID();
    const now = new Date().toISOString();
    const db = getDb();

    db.prepare(`
      INSERT INTO approval_queue (id, created_at, action_type, job_id, platform, payload, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, now, actionType, jobId ?? null, platform ?? null, JSON.stringify(payload));

    this.audit.log('approval_requested', platform ?? null, jobId ?? null, {
      actionType,
      approvalId: id,
    });

    return {
      id,
      createdAt: now,
      actionType,
      jobId: jobId ?? null,
      platform: platform ?? null,
      payload,
      status: 'pending',
      decidedAt: null,
      decidedBy: null,
      decisionReason: null,
    };
  }

  approve(approvalId: string, decidedBy = 'human', reason?: string): boolean {
    return this.decide(approvalId, 'approved', decidedBy, reason);
  }

  reject(approvalId: string, decidedBy = 'human', reason?: string): boolean {
    return this.decide(approvalId, 'rejected', decidedBy, reason);
  }

  getPending(): ApprovalRequest[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM approval_queue WHERE status = 'pending' ORDER BY created_at ASC
    `).all();
    return (rows as ApprovalRow[]).map(rowToApproval);
  }

  getById(id: string): ApprovalRequest | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM approval_queue WHERE id = ?').get(id) as ApprovalRow | undefined;
    return row ? rowToApproval(row) : null;
  }

  expireStale(maxAgeHours = 24): number {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
    const db = getDb();
    const result = db.prepare(`
      UPDATE approval_queue
      SET status = 'expired', decided_at = ?, decision_reason = 'Auto-expired after ${maxAgeHours}h'
      WHERE status = 'pending' AND created_at < ?
    `).run(new Date().toISOString(), cutoff);
    return result.changes;
  }

  private decide(approvalId: string, status: ApprovalStatus, decidedBy: string, reason?: string): boolean {
    const db = getDb();
    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE approval_queue
      SET status = ?, decided_at = ?, decided_by = ?, decision_reason = ?
      WHERE id = ? AND status = 'pending'
    `).run(status, now, decidedBy, reason ?? null, approvalId);

    if (result.changes > 0) {
      const request = this.getById(approvalId);
      this.audit.log(
        `approval_${status}`,
        request?.platform ?? null,
        request?.jobId ?? null,
        { approvalId, decidedBy, reason },
        status === 'approved' ? 'success' : 'cancelled',
      );
    }

    return result.changes > 0;
  }
}

interface ApprovalRow {
  id: string;
  created_at: string;
  action_type: string;
  job_id: string | null;
  platform: string | null;
  payload: string;
  status: string;
  decided_at: string | null;
  decided_by: string | null;
  decision_reason: string | null;
}

function rowToApproval(row: ApprovalRow): ApprovalRequest {
  return {
    id: row.id,
    createdAt: row.created_at,
    actionType: row.action_type as ApprovalActionType,
    jobId: row.job_id,
    platform: row.platform as PlatformType | null,
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    status: row.status as ApprovalStatus,
    decidedAt: row.decided_at,
    decidedBy: row.decided_by,
    decisionReason: row.decision_reason,
  };
}
