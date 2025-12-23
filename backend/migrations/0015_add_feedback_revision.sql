-- PR-2: Add feedback/revision loop support
-- Migration: 0015_add_feedback_revision
-- Safe: Adds new columns with NULL default, existing data unaffected

-- Add parent job reference for revision chain
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "parent_job_id" uuid REFERENCES "jobs"("id");

-- Add revision note for revision jobs
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "revision_note" text;

-- Add index for revision chain queries
CREATE INDEX IF NOT EXISTS "idx_jobs_parent_job_id" ON "jobs" ("parent_job_id");

-- Create job_comments table for user feedback
CREATE TABLE IF NOT EXISTS "job_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" uuid NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "users"("id"),
  "comment_text" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add index for efficient comment retrieval
CREATE INDEX IF NOT EXISTS "idx_job_comments_job_id" ON "job_comments" ("job_id");
CREATE INDEX IF NOT EXISTS "idx_job_comments_created_at" ON "job_comments" ("created_at");

