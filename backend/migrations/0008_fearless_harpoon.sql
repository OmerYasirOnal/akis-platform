CREATE TABLE IF NOT EXISTS "agent_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"agent_type" varchar(50) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"repository_owner" varchar(255),
	"repository_name" varchar(255),
	"base_branch" varchar(255) DEFAULT 'main',
	"branch_pattern" varchar(255) DEFAULT 'docs/{agent}-{timestamp}',
	"target_platform" varchar(50),
	"target_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"trigger_mode" varchar(50) DEFAULT 'manual' NOT NULL,
	"schedule_cron" varchar(100),
	"pr_title_template" varchar(500) DEFAULT 'docs({agent}): {summary}',
	"pr_body_template" text,
	"auto_merge" boolean DEFAULT false NOT NULL,
	"include_globs" text[],
	"exclude_globs" text[],
	"job_timeout_seconds" integer DEFAULT 60,
	"max_retries" integer DEFAULT 2,
	"llm_model_override" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_configs" ADD CONSTRAINT "agent_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_agent_configs_user_agent" ON "agent_configs" USING btree ("user_id","agent_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_configs_user_id" ON "agent_configs" USING btree ("user_id");