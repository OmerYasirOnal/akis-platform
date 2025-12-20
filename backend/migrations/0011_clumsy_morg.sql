DO $$ BEGIN
 CREATE TYPE "public"."trace_event_type" AS ENUM('step_start', 'step_complete', 'step_failed', 'doc_read', 'file_created', 'file_modified', 'mcp_connect', 'mcp_call', 'ai_call', 'ai_parse_error', 'error', 'info', 'tool_call', 'tool_result', 'decision', 'plan_step', 'reasoning');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"artifact_type" varchar(50) NOT NULL,
	"path" varchar(1000) NOT NULL,
	"operation" varchar(20) NOT NULL,
	"size_bytes" integer,
	"content_hash" varchar(64),
	"preview" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"diff_preview" text,
	"lines_added" integer,
	"lines_removed" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"event_type" "trace_event_type" NOT NULL,
	"step_id" varchar(100),
	"title" varchar(500) NOT NULL,
	"detail" jsonb,
	"duration_ms" integer,
	"status" varchar(20) DEFAULT 'info',
	"correlation_id" varchar(100),
	"gateway_url" varchar(500),
	"error_code" varchar(50),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"tool_name" varchar(100),
	"input_summary" text,
	"output_summary" text,
	"reasoning_summary" varchar(1000),
	"asked_what" text,
	"did_what" text,
	"why_reason" text
);
--> statement-breakpoint
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
CREATE INDEX IF NOT EXISTS "idx_job_traces_tool_name" ON "job_traces" USING btree ("tool_name");