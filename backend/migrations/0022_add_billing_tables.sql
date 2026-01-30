-- Billing: Plans, Subscriptions, Usage Counters
-- Migration 0022

DO $$ BEGIN
  CREATE TYPE "plan_tier" AS ENUM('free', 'pro', 'pro_plus', 'team', 'enterprise');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "subscription_status" AS ENUM('active', 'past_due', 'canceled', 'trialing', 'incomplete');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "plans" (
  "id" varchar(50) PRIMARY KEY NOT NULL,
  "tier" "plan_tier" NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" text,
  "jobs_per_day" integer NOT NULL DEFAULT 5,
  "max_token_budget" integer NOT NULL DEFAULT 50000,
  "max_agents" integer NOT NULL DEFAULT 2,
  "depth_modes_allowed" text[] NOT NULL,
  "max_output_tokens_per_job" integer NOT NULL DEFAULT 16000,
  "passes_allowed" integer NOT NULL DEFAULT 1,
  "priority_queue" boolean NOT NULL DEFAULT false,
  "background_job_history_days" integer NOT NULL DEFAULT 7,
  "price_monthly" integer NOT NULL DEFAULT 0,
  "price_yearly" integer NOT NULL DEFAULT 0,
  "stripe_price_monthly" varchar(255),
  "stripe_price_yearly" varchar(255),
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "plan_id" varchar(50) NOT NULL REFERENCES "plans"("id"),
  "status" "subscription_status" NOT NULL DEFAULT 'active',
  "stripe_customer_id" varchar(255),
  "stripe_subscription_id" varchar(255),
  "current_period_start" timestamp with time zone,
  "current_period_end" timestamp with time zone,
  "cancel_at_period_end" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "usage_counters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "period_key" varchar(10) NOT NULL,
  "period_type" varchar(10) NOT NULL DEFAULT 'daily',
  "jobs_used" integer NOT NULL DEFAULT 0,
  "tokens_used" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_id" ON "subscriptions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripe_customer" ON "subscriptions" ("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripe_sub" ON "subscriptions" ("stripe_subscription_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_usage_user_period" ON "usage_counters" ("user_id", "period_key", "period_type");
CREATE INDEX IF NOT EXISTS "idx_usage_counters_user_id" ON "usage_counters" ("user_id");

-- Seed default plans
INSERT INTO "plans" ("id", "tier", "name", "description", "jobs_per_day", "max_token_budget", "max_agents", "depth_modes_allowed", "max_output_tokens_per_job", "passes_allowed", "priority_queue", "background_job_history_days", "price_monthly", "price_yearly", "sort_order")
VALUES
  ('free', 'free', 'Free', 'Get started with basic documentation generation', 3, 20000, 1, ARRAY['lite', 'standard'], 8000, 1, false, 3, 0, 0, 0),
  ('pro', 'pro', 'Pro', 'For individual developers who need more power', 20, 100000, 3, ARRAY['lite', 'standard', 'deep'], 32000, 2, false, 30, 1900, 19000, 1),
  ('pro_plus', 'pro_plus', 'Pro+', 'Power users with priority access and deep mode', 50, 500000, 5, ARRAY['lite', 'standard', 'deep'], 64000, 2, true, 90, 4900, 49000, 2),
  ('team', 'team', 'Team', 'For teams with shared workspace and audit logs', 100, 1000000, 10, ARRAY['lite', 'standard', 'deep'], 64000, 2, true, 365, 3900, 39000, 3),
  ('enterprise', 'enterprise', 'Enterprise', 'Custom limits, self-host, VPC, SLA', 999, 10000000, 999, ARRAY['lite', 'standard', 'deep'], 64000, 2, true, 999, 0, 0, 4)
ON CONFLICT ("id") DO NOTHING;
