DO $$ BEGIN
 CREATE TYPE "public"."trace_event_type" AS ENUM('step_start', 'step_complete', 'step_failed', 'doc_read', 'file_created', 'file_modified', 'mcp_connect', 'mcp_call', 'ai_call', 'ai_parse_error', 'error', 'info', 'tool_call', 'tool_result', 'decision', 'plan_step', 'reasoning');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "job_state" ADD VALUE 'awaiting_approval';--> statement-breakpoint
-- job_artifacts table already exists, add new columns
ALTER TABLE "job_artifacts" ADD COLUMN IF NOT EXISTS "diff_preview" text;
ALTER TABLE "job_artifacts" ADD COLUMN IF NOT EXISTS "lines_added" integer;
ALTER TABLE "job_artifacts" ADD COLUMN IF NOT EXISTS "lines_removed" integer;
--> statement-breakpoint
-- job_traces table already exists, add new columns
ALTER TABLE "job_traces" ADD COLUMN IF NOT EXISTS "tool_name" varchar(100);
ALTER TABLE "job_traces" ADD COLUMN IF NOT EXISTS "input_summary" text;
ALTER TABLE "job_traces" ADD COLUMN IF NOT EXISTS "output_summary" text;
ALTER TABLE "job_traces" ADD COLUMN IF NOT EXISTS "reasoning_summary" varchar(1000);
ALTER TABLE "job_traces" ADD COLUMN IF NOT EXISTS "asked_what" text;
ALTER TABLE "job_traces" ADD COLUMN IF NOT EXISTS "did_what" text;
ALTER TABLE "job_traces" ADD COLUMN IF NOT EXISTS "why_reason" text;
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "requires_approval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "rejected_by" uuid;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "approval_comment" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_artifacts" ADD CONSTRAINT "job_artifacts_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_traces" ADD CONSTRAINT "job_traces_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_job_artifacts_job_id" ON "job_artifacts" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_job_artifacts_type" ON "job_artifacts" USING btree ("artifact_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_job_traces_job_id" ON "job_traces" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_job_traces_event_type" ON "job_traces" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_job_traces_tool_name" ON "job_traces" USING btree ("tool_name");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs" ADD CONSTRAINT "jobs_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs" ADD CONSTRAINT "jobs_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_requires_approval" ON "jobs" USING btree ("requires_approval");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_approved_by" ON "jobs" USING btree ("approved_by");