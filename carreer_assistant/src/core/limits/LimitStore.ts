import { getDb } from '../../db/schema.js';
import type { DailyCounters } from '../scoring/types.js';

export class LimitStore {
  getHistory(days = 7): DailyCounters[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM daily_counters
      ORDER BY date DESC
      LIMIT ?
    `).all(days) as Array<{
      date: string;
      discovered: number;
      shortlisted: number;
      submitted: number;
      outreach: number;
      follow_ups: number;
    }>;

    return rows.map((row) => ({
      date: row.date,
      discovered: row.discovered,
      shortlisted: row.shortlisted,
      submitted: row.submitted,
      outreach: row.outreach,
      followUps: row.follow_ups,
    }));
  }

  getTotalStats(): {
    totalDiscovered: number;
    totalShortlisted: number;
    totalSubmitted: number;
    totalOutreach: number;
    totalFollowUps: number;
    activeDays: number;
  } {
    const db = getDb();
    const row = db.prepare(`
      SELECT
        COALESCE(SUM(discovered), 0) as total_discovered,
        COALESCE(SUM(shortlisted), 0) as total_shortlisted,
        COALESCE(SUM(submitted), 0) as total_submitted,
        COALESCE(SUM(outreach), 0) as total_outreach,
        COALESCE(SUM(follow_ups), 0) as total_follow_ups,
        COUNT(*) as active_days
      FROM daily_counters
    `).get() as {
      total_discovered: number;
      total_shortlisted: number;
      total_submitted: number;
      total_outreach: number;
      total_follow_ups: number;
      active_days: number;
    };

    return {
      totalDiscovered: row.total_discovered,
      totalShortlisted: row.total_shortlisted,
      totalSubmitted: row.total_submitted,
      totalOutreach: row.total_outreach,
      totalFollowUps: row.total_follow_ups,
      activeDays: row.active_days,
    };
  }
}
