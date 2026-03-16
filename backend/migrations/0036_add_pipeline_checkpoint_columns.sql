-- Add checkpoint columns to pipelines table for agent quality tracking
ALTER TABLE "pipelines" ADD COLUMN IF NOT EXISTS "intermediate_state" jsonb;
ALTER TABLE "pipelines" ADD COLUMN IF NOT EXISTS "attempt_count" integer DEFAULT 0 NOT NULL;
