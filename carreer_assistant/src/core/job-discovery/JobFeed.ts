import { getDb } from '../../db/schema.js';
import type { NormalizedJob, ScoredJob, JobState } from '../scoring/types.js';

export class JobFeed {
  saveJob(job: NormalizedJob): void {
    const db = getDb();
    db.prepare(`
      INSERT OR IGNORE INTO jobs (
        id, platform, platform_job_id, title, description, company_name,
        salary_min, salary_max, salary_currency, hourly_rate_min, hourly_rate_max,
        work_model, location, role_level, tech_stack, url,
        discovered_at, score, score_breakdown, state, archived, raw
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `).run(
      job.id, job.platform, job.platformJobId, job.title, job.description, job.companyName,
      job.salaryMin, job.salaryMax, job.salaryCurrency, job.hourlyRateMin, job.hourlyRateMax,
      job.workModel, job.location, job.roleLevel, JSON.stringify(job.techStack), job.url,
      job.discoveredAt, (job as { score?: number }).score ?? null, null, job.state, job.archived ? 1 : 0,
      job.raw ? JSON.stringify(job.raw) : null,
    );
  }

  saveScoredJob(job: ScoredJob): void {
    const db = getDb();
    db.prepare(`
      UPDATE jobs SET
        score = ?,
        score_breakdown = ?,
        state = ?
      WHERE id = ?
    `).run(
      job.score,
      JSON.stringify(job.scoreBreakdown),
      job.recommendation === 'apply' || job.recommendation === 'consider' ? 'shortlisted' : job.state,
      job.id,
    );
  }

  updateJobState(jobId: string, state: JobState): void {
    const db = getDb();
    db.prepare('UPDATE jobs SET state = ? WHERE id = ?').run(state, jobId);
  }

  getJobsByState(state: JobState, limit = 50): NormalizedJob[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM jobs WHERE state = ? ORDER BY score DESC LIMIT ?').all(state, limit);
    return (rows as JobRow[]).map(rowToJob);
  }

  getJobById(id: string): NormalizedJob | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as JobRow | undefined;
    return row ? rowToJob(row) : null;
  }

  getRecentJobs(limit = 20): NormalizedJob[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM jobs ORDER BY discovered_at DESC LIMIT ?').all(limit);
    return (rows as JobRow[]).map(rowToJob);
  }

  getShortlist(limit = 10): NormalizedJob[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM jobs
      WHERE state = 'shortlisted' AND archived = 0
      ORDER BY score DESC
      LIMIT ?
    `).all(limit);
    return (rows as JobRow[]).map(rowToJob);
  }

  archiveJob(jobId: string): void {
    const db = getDb();
    db.prepare('UPDATE jobs SET archived = 1, state = ? WHERE id = ?').run('archived', jobId);
  }

  getStats(): {
    total: number;
    byState: Record<string, number>;
    byPlatform: Record<string, number>;
    avgScore: number;
  } {
    const db = getDb();

    const total = (db.prepare('SELECT COUNT(*) as c FROM jobs').get() as { c: number }).c;

    const stateRows = db.prepare('SELECT state, COUNT(*) as c FROM jobs GROUP BY state').all() as Array<{ state: string; c: number }>;
    const byState: Record<string, number> = {};
    for (const row of stateRows) byState[row.state] = row.c;

    const platformRows = db.prepare('SELECT platform, COUNT(*) as c FROM jobs GROUP BY platform').all() as Array<{ platform: string; c: number }>;
    const byPlatform: Record<string, number> = {};
    for (const row of platformRows) byPlatform[row.platform] = row.c;

    const avgRow = db.prepare('SELECT AVG(score) as avg FROM jobs WHERE score IS NOT NULL').get() as { avg: number | null };

    return {
      total,
      byState,
      byPlatform,
      avgScore: avgRow.avg ?? 0,
    };
  }
}

interface JobRow {
  id: string;
  platform: string;
  platform_job_id: string;
  title: string;
  description: string;
  company_name: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  work_model: string;
  location: string | null;
  role_level: string;
  tech_stack: string;
  url: string;
  discovered_at: string;
  score: number | null;
  score_breakdown: string | null;
  state: string;
  archived: number;
  raw: string | null;
}

function rowToJob(row: JobRow): NormalizedJob {
  return {
    id: row.id,
    platform: row.platform as NormalizedJob['platform'],
    platformJobId: row.platform_job_id,
    title: row.title,
    description: row.description,
    companyName: row.company_name,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    salaryCurrency: row.salary_currency,
    hourlyRateMin: row.hourly_rate_min,
    hourlyRateMax: row.hourly_rate_max,
    workModel: row.work_model as NormalizedJob['workModel'],
    location: row.location,
    roleLevel: row.role_level as NormalizedJob['roleLevel'],
    techStack: JSON.parse(row.tech_stack) as string[],
    url: row.url,
    discoveredAt: row.discovered_at,
    state: row.state as NormalizedJob['state'],
    archived: row.archived === 1,
    raw: row.raw ? (JSON.parse(row.raw) as Record<string, unknown>) : undefined,
  };
}
