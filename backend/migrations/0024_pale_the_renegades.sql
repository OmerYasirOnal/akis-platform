DO $$ BEGIN
 CREATE TYPE "public"."ai_provider" AS ENUM('openai', 'openrouter');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."integration_provider" AS ENUM('jira', 'confluence');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."plan_tier" AS ENUM('free', 'pro', 'pro_plus', 'team', 'enterprise');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'canceled', 'trialing', 'incomplete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('admin', 'member');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "oauth_provider" ADD VALUE 'atlassian';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "billing_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" varchar(50) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integration_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"site_url" varchar(500) NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"encrypted_token" text NOT NULL,
	"token_iv" varchar(64) NOT NULL,
	"token_tag" varchar(64) NOT NULL,
	"key_version" varchar(20) NOT NULL,
	"token_last4" varchar(4) NOT NULL,
	"last_validated_at" timestamp with time zone,
	"is_valid" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_ai_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"call_index" integer NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(255) NOT NULL,
	"purpose" varchar(255),
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"duration_ms" integer,
	"estimated_cost_usd" numeric(12, 6),
	"success" boolean DEFAULT true NOT NULL,
	"error_code" varchar(50),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plans" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"tier" "plan_tier" NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"jobs_per_day" integer DEFAULT 5 NOT NULL,
	"max_token_budget" integer DEFAULT 50000 NOT NULL,
	"max_agents" integer DEFAULT 2 NOT NULL,
	"depth_modes_allowed" text[] NOT NULL,
	"max_output_tokens_per_job" integer DEFAULT 16000 NOT NULL,
	"passes_allowed" integer DEFAULT 1 NOT NULL,
	"priority_queue" boolean DEFAULT false NOT NULL,
	"background_job_history_days" integer DEFAULT 7 NOT NULL,
	"price_monthly" integer DEFAULT 0 NOT NULL,
	"price_yearly" integer DEFAULT 0 NOT NULL,
	"stripe_price_monthly" varchar(255),
	"stripe_price_yearly" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" varchar(50) NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usage_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_key" varchar(10) NOT NULL,
	"period_type" varchar(10) DEFAULT 'daily' NOT NULL,
	"jobs_used" integer DEFAULT 0 NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_billing_overrides" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"monthly_budget_usd" numeric(10, 2),
	"is_unlimited" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_billing_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monthly_budget_usd" numeric(10, 2),
	"soft_threshold_pct" numeric(3, 2) DEFAULT '0.80' NOT NULL,
	"hard_stop_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "ai_provider_resolved" varchar(50);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "ai_model_resolved" varchar(255);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "ai_key_source" varchar(20);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "ai_fallback_reason" varchar(100);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "quality_score" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "quality_breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "quality_version" varchar(20);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "quality_computed_at" timestamp;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD COLUMN "cloud_id" varchar(255);--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD COLUMN "site_url" varchar(500);--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD COLUMN "scopes" text;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD COLUMN "refresh_token_rotated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "active_ai_provider" "ai_provider" DEFAULT 'openrouter';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'member' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "billing_notifications" ADD CONSTRAINT "billing_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_ai_calls" ADD CONSTRAINT "job_ai_calls_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_billing_overrides" ADD CONSTRAINT "user_billing_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_notifications_user" ON "billing_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_billing_notifications_type_date" ON "billing_notifications" USING btree ("type","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_integration_creds_user_provider" ON "integration_credentials" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_integration_creds_user_id" ON "integration_credentials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_job_ai_calls_job_id" ON "job_ai_calls" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_job_ai_calls_job_id_call_index" ON "job_ai_calls" USING btree ("job_id","call_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_id" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripe_customer" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripe_sub" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_usage_user_period" ON "usage_counters" USING btree ("user_id","period_key","period_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usage_counters_user_id" ON "usage_counters" USING btree ("user_id");