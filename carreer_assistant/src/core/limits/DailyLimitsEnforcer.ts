import { getDb } from '../../db/schema.js';
import type { DailyLimits } from '../../config/limits.js';
import { loadDailyLimits } from '../../config/limits.js';
import type { DailyCounters } from '../scoring/types.js';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export class DailyLimitsEnforcer {
  private limits: DailyLimits;

  constructor(limits?: DailyLimits) {
    this.limits = limits ?? loadDailyLimits();
  }

  getCounters(date?: string): DailyCounters {
    const d = date ?? todayString();
    const db = getDb();
    const row = db.prepare('SELECT * FROM daily_counters WHERE date = ?').get(d) as
      | { date: string; discovered: number; shortlisted: number; submitted: number; outreach: number; follow_ups: number }
      | undefined;

    if (!row) {
      return { date: d, discovered: 0, shortlisted: 0, submitted: 0, outreach: 0, followUps: 0 };
    }

    return {
      date: row.date,
      discovered: row.discovered,
      shortlisted: row.shortlisted,
      submitted: row.submitted,
      outreach: row.outreach,
      followUps: row.follow_ups,
    };
  }

  canDiscover(): boolean {
    const counters = this.getCounters();
    return counters.discovered < this.limits.maxDiscoverPerDay;
  }

  canShortlist(): boolean {
    const counters = this.getCounters();
    return counters.shortlisted < this.limits.maxShortlistPerDay;
  }

  canSubmit(): boolean {
    const counters = this.getCounters();
    return counters.submitted < this.limits.maxSubmitPerDay;
  }

  canOutreach(): boolean {
    const counters = this.getCounters();
    return counters.outreach < this.limits.maxOutreachPerDay;
  }

  canFollowUp(): boolean {
    const counters = this.getCounters();
    return counters.followUps < this.limits.maxFollowUpPerDay;
  }

  remainingToday(): {
    discover: number;
    shortlist: number;
    submit: number;
    outreach: number;
    followUp: number;
  } {
    const counters = this.getCounters();
    return {
      discover: Math.max(0, this.limits.maxDiscoverPerDay - counters.discovered),
      shortlist: Math.max(0, this.limits.maxShortlistPerDay - counters.shortlisted),
      submit: Math.max(0, this.limits.maxSubmitPerDay - counters.submitted),
      outreach: Math.max(0, this.limits.maxOutreachPerDay - counters.outreach),
      followUp: Math.max(0, this.limits.maxFollowUpPerDay - counters.followUps),
    };
  }

  incrementDiscover(count = 1): void {
    this.increment('discovered', count);
  }

  incrementShortlist(count = 1): void {
    this.increment('shortlisted', count);
  }

  incrementSubmit(count = 1): void {
    this.increment('submitted', count);
  }

  incrementOutreach(count = 1): void {
    this.increment('outreach', count);
  }

  incrementFollowUp(count = 1): void {
    this.increment('follow_ups', count);
  }

  getLimits(): DailyLimits {
    return { ...this.limits };
  }

  private increment(column: string, count: number): void {
    const d = todayString();
    const db = getDb();

    db.prepare(`
      INSERT INTO daily_counters (date, ${column})
      VALUES (?, ?)
      ON CONFLICT(date) DO UPDATE SET ${column} = ${column} + ?
    `).run(d, count, count);
  }
}
