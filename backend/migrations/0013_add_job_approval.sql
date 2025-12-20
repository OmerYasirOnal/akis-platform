-- Migration: Add approval system for jobs
-- Purpose: Support "Approve → Execute" policy for PLAN_ONLY jobs

-- Add new job state for awaiting approval (safely handles if already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'awaiting_approval' AND enumtypid = 'job_state'::regtype) THEN
        ALTER TYPE job_state ADD VALUE 'awaiting_approval';
    END IF;
END $$;

-- Add approval-related columns to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approval_comment TEXT;

-- Create index for approval queries
CREATE INDEX IF NOT EXISTS idx_jobs_requires_approval ON jobs(requires_approval) WHERE requires_approval = true;
CREATE INDEX IF NOT EXISTS idx_jobs_approved_by ON jobs(approved_by) WHERE approved_by IS NOT NULL;
