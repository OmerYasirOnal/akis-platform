-- PR-1: Add contract-first plan columns to job_plans
-- Migration: 0014_add_plan_contract_columns
-- Safe: Adds new columns with NULL default, existing data unaffected

-- Add plan_markdown column for contract-first plan document
ALTER TABLE "job_plans" ADD COLUMN IF NOT EXISTS "plan_markdown" text;

-- Add plan_json column for structured plan data  
ALTER TABLE "job_plans" ADD COLUMN IF NOT EXISTS "plan_json" jsonb;

-- Add updated_at column for tracking plan modifications
ALTER TABLE "job_plans" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();

-- Make steps column nullable (was required, now optional for new contract-first plans)
ALTER TABLE "job_plans" ALTER COLUMN "steps" DROP NOT NULL;

-- Add index for efficient job plan lookups
CREATE INDEX IF NOT EXISTS "idx_job_plans_job_id" ON "job_plans" ("job_id");

