import Database from 'better-sqlite3';
import { resolve } from 'node:path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH ?? './data/career.db';
  const resolvedPath = resolve(dbPath);

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initializeSchema(db);

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function initializeSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      platform_job_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      company_name TEXT NOT NULL DEFAULT '',
      salary_min INTEGER,
      salary_max INTEGER,
      salary_currency TEXT,
      hourly_rate_min REAL,
      hourly_rate_max REAL,
      work_model TEXT NOT NULL DEFAULT 'unknown',
      location TEXT,
      role_level TEXT NOT NULL DEFAULT 'unknown',
      tech_stack TEXT NOT NULL DEFAULT '[]',
      url TEXT NOT NULL DEFAULT '',
      discovered_at TEXT NOT NULL,
      score INTEGER,
      score_breakdown TEXT,
      state TEXT NOT NULL DEFAULT 'discovered',
      archived INTEGER NOT NULL DEFAULT 0,
      raw TEXT,
      UNIQUE(platform, platform_job_id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      proposal_text TEXT NOT NULL DEFAULT '',
      cover_letter TEXT,
      submitted_at TEXT,
      response_at TEXT,
      response_type TEXT,
      interview_at TEXT,
      outcome TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_counters (
      date TEXT PRIMARY KEY,
      discovered INTEGER NOT NULL DEFAULT 0,
      shortlisted INTEGER NOT NULL DEFAULT 0,
      submitted INTEGER NOT NULL DEFAULT 0,
      outreach INTEGER NOT NULL DEFAULT 0,
      follow_ups INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      platform TEXT,
      job_id TEXT,
      details TEXT NOT NULL DEFAULT '{}',
      outcome TEXT NOT NULL DEFAULT 'success',
      approved_by TEXT
    );

    CREATE TABLE IF NOT EXISTS approval_queue (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      action_type TEXT NOT NULL,
      job_id TEXT,
      platform TEXT,
      payload TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      decided_at TEXT,
      decided_by TEXT,
      decision_reason TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_platform ON jobs(platform);
    CREATE INDEX IF NOT EXISTS idx_jobs_state ON jobs(state);
    CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(score);
    CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_approval_queue_status ON approval_queue(status);
  `);
}
