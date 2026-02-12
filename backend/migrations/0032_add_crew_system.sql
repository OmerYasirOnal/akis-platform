-- 0032: Crew System (M2: Agent Teams)
-- Parallel multi-agent orchestration: coordinator + workers + shared tasks + messaging
-- Inspired by Claude Code Agent Teams: https://code.claude.com/docs/en/agent-teams

-- Enums
DO $$ BEGIN
  CREATE TYPE "crew_run_status" AS ENUM (
    'planning', 'spawning', 'running', 'merging', 'completed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "crew_task_status" AS ENUM (
    'pending', 'in_progress', 'completed', 'blocked'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "crew_message_type" AS ENUM (
    'chat', 'task_update', 'status_report', 'challenge', 'directive'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Crew Runs (top-level orchestration entity)
CREATE TABLE IF NOT EXISTS "crew_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "status" "crew_run_status" NOT NULL DEFAULT 'planning',
  "goal" text NOT NULL,
  "worker_roles" jsonb NOT NULL,
  "coordinator_job_id" uuid REFERENCES "jobs" ("id") ON DELETE SET NULL,
  "merged_output" jsonb,
  "merge_strategy" varchar(50) NOT NULL DEFAULT 'synthesize',
  "failure_strategy" varchar(50) NOT NULL DEFAULT 'best_effort',
  "auto_approve" boolean NOT NULL DEFAULT false,
  "total_workers" integer NOT NULL DEFAULT 0,
  "completed_workers" integer NOT NULL DEFAULT 0,
  "failed_workers" integer NOT NULL DEFAULT 0,
  "coordinator_reflection" text,
  "total_tokens" integer,
  "total_cost_usd" numeric(12, 6),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_crew_runs_user_id" ON "crew_runs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_crew_runs_status" ON "crew_runs" ("status");
CREATE INDEX IF NOT EXISTS "idx_crew_runs_created_at" ON "crew_runs" ("created_at");

-- Crew Tasks (shared task list — Claude Code's ~/.claude/tasks/ equivalent)
CREATE TABLE IF NOT EXISTS "crew_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "crew_run_id" uuid NOT NULL REFERENCES "crew_runs" ("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "description" text,
  "status" "crew_task_status" NOT NULL DEFAULT 'pending',
  "assigned_to" uuid REFERENCES "jobs" ("id") ON DELETE SET NULL,
  "depends_on" jsonb DEFAULT '[]',
  "priority" integer NOT NULL DEFAULT 0,
  "result" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_crew_tasks_crew_run_id" ON "crew_tasks" ("crew_run_id");
CREATE INDEX IF NOT EXISTS "idx_crew_tasks_status" ON "crew_tasks" ("crew_run_id", "status");
CREATE INDEX IF NOT EXISTS "idx_crew_tasks_assigned_to" ON "crew_tasks" ("assigned_to");

-- Crew Messages (inter-agent mailbox — Claude Code's mailbox equivalent)
CREATE TABLE IF NOT EXISTS "crew_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "crew_run_id" uuid NOT NULL REFERENCES "crew_runs" ("id") ON DELETE CASCADE,
  "from_job_id" uuid REFERENCES "jobs" ("id") ON DELETE SET NULL,
  "to_job_id" uuid REFERENCES "jobs" ("id") ON DELETE SET NULL,
  "from_role" varchar(100) NOT NULL,
  "to_role" varchar(100),
  "content" text NOT NULL,
  "message_type" "crew_message_type" NOT NULL DEFAULT 'chat',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_crew_messages_crew_run_id" ON "crew_messages" ("crew_run_id");
CREATE INDEX IF NOT EXISTS "idx_crew_messages_from_job_id" ON "crew_messages" ("from_job_id");
CREATE INDEX IF NOT EXISTS "idx_crew_messages_to_job_id" ON "crew_messages" ("to_job_id");
CREATE INDEX IF NOT EXISTS "idx_crew_messages_created_at" ON "crew_messages" ("crew_run_id", "created_at");

-- Add crew fields to existing jobs table
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "crew_run_id" uuid REFERENCES "crew_runs" ("id") ON DELETE SET NULL;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "worker_role" varchar(100);
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "worker_index" integer;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "worker_color" varchar(20);

CREATE INDEX IF NOT EXISTS "idx_jobs_crew_run_id" ON "jobs" ("crew_run_id");
