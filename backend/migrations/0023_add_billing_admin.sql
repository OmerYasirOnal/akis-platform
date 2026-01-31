-- Migration 0023: Add user roles, billing settings, overrides, and notifications
-- Supports admin unlimited mode + workspace budget limits

-- Add role column to users (admin gets unlimited billing)
DO $$ BEGIN
  CREATE TYPE "user_role" AS ENUM('admin', 'member');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "user_role" NOT NULL DEFAULT 'member';

-- First registered user becomes admin (owner)
UPDATE "users" SET "role" = 'admin'
WHERE "id" = (SELECT "id" FROM "users" ORDER BY "created_at" ASC LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM "users" WHERE "role" = 'admin');

-- Workspace-level billing settings (monthly budget, soft threshold, hard stop)
CREATE TABLE IF NOT EXISTS "workspace_billing_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "monthly_budget_usd" numeric(10, 2),
  "soft_threshold_pct" numeric(3, 2) NOT NULL DEFAULT 0.80,
  "hard_stop_enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Per-user billing overrides (admin can set per-user budgets)
CREATE TABLE IF NOT EXISTS "user_billing_overrides" (
  "user_id" uuid PRIMARY KEY NOT NULL REFERENCES "users"("id"),
  "monthly_budget_usd" numeric(10, 2),
  "is_unlimited" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Billing notifications (threshold warnings, limit reached, etc.)
CREATE TABLE IF NOT EXISTS "billing_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id"),
  "type" varchar(50) NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}',
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_billing_notifications_user" ON "billing_notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_billing_notifications_type_date" ON "billing_notifications" ("type", "created_at");

-- Mark admin users as unlimited by default
INSERT INTO "user_billing_overrides" ("user_id", "is_unlimited")
SELECT "id", true FROM "users" WHERE "role" = 'admin'
ON CONFLICT ("user_id") DO UPDATE SET "is_unlimited" = true;
