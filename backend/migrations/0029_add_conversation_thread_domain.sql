-- Conversation thread persistence + plan candidates + trust snapshots

DO $$ BEGIN
  CREATE TYPE "thread_status" AS ENUM (
    'active',
    'awaiting_user_input',
    'awaiting_plan_selection',
    'queued',
    'completed',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "thread_message_role" AS ENUM ('system', 'user', 'agent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "plan_candidate_status" AS ENUM ('unbuilt', 'queued', 'building', 'built', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "thread_task_status" AS ENUM ('pending', 'awaiting_user_input', 'answered', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "conversation_threads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "title" varchar(255) NOT NULL DEFAULT 'New conversation',
  "status" "thread_status" NOT NULL DEFAULT 'active',
  "agent_type" varchar(50) NOT NULL DEFAULT 'scribe',
  "active_runs" integer NOT NULL DEFAULT 0,
  "last_message_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_conversation_threads_user_id"
  ON "conversation_threads" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_conversation_threads_user_status_updated"
  ON "conversation_threads" ("user_id", "status", "updated_at");

CREATE TABLE IF NOT EXISTS "conversation_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "thread_id" uuid NOT NULL REFERENCES "conversation_threads"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "role" "thread_message_role" NOT NULL,
  "agent_type" varchar(50),
  "content" text NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_conversation_messages_thread_created"
  ON "conversation_messages" ("thread_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_conversation_messages_user_created"
  ON "conversation_messages" ("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "thread_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "thread_id" uuid NOT NULL REFERENCES "conversation_threads"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "status" "thread_task_status" NOT NULL DEFAULT 'pending',
  "prompt" text NOT NULL,
  "question" text,
  "answer" text,
  "uncertainty_score" numeric(5,2),
  "resume_token" varchar(100),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "answered_at" timestamp
);

CREATE INDEX IF NOT EXISTS "idx_thread_tasks_thread_status"
  ON "thread_tasks" ("thread_id", "status");
CREATE INDEX IF NOT EXISTS "idx_thread_tasks_user_created"
  ON "thread_tasks" ("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "plan_candidates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "thread_id" uuid NOT NULL REFERENCES "conversation_threads"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "source_message_id" uuid REFERENCES "conversation_messages"("id") ON DELETE set null,
  "title" varchar(255) NOT NULL,
  "summary" text NOT NULL,
  "source_prompt" text NOT NULL,
  "status" "plan_candidate_status" NOT NULL DEFAULT 'unbuilt',
  "selected" boolean NOT NULL DEFAULT false,
  "build_job_id" uuid REFERENCES "jobs"("id") ON DELETE set null,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_plan_candidates_thread_status_updated"
  ON "plan_candidates" ("thread_id", "status", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_plan_candidates_user_created"
  ON "plan_candidates" ("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "plan_candidate_builds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "thread_id" uuid NOT NULL REFERENCES "conversation_threads"("id") ON DELETE cascade,
  "plan_candidate_id" uuid NOT NULL REFERENCES "plan_candidates"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "status" "plan_candidate_status" NOT NULL DEFAULT 'queued',
  "job_id" uuid REFERENCES "jobs"("id") ON DELETE set null,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_plan_candidate_builds_thread_created"
  ON "plan_candidate_builds" ("thread_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_plan_candidate_builds_candidate_created"
  ON "plan_candidate_builds" ("plan_candidate_id", "created_at");

CREATE TABLE IF NOT EXISTS "thread_trust_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "thread_id" uuid NOT NULL REFERENCES "conversation_threads"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "job_id" uuid REFERENCES "jobs"("id") ON DELETE set null,
  "reliability" integer NOT NULL,
  "hallucination_risk" integer NOT NULL,
  "task_success" integer NOT NULL,
  "tool_health" integer NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_thread_trust_snapshots_thread_created"
  ON "thread_trust_snapshots" ("thread_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_thread_trust_snapshots_user_created"
  ON "thread_trust_snapshots" ("user_id", "created_at");
