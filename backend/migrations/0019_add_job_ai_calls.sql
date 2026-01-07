-- Migration: Create job_ai_calls table for per-call AI trace persistence
-- This enables detailed breakdown of AI usage per job (tokens, cost, duration per call)

CREATE TABLE IF NOT EXISTS "job_ai_calls" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" UUID NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
  "call_index" INTEGER NOT NULL,
  "provider" VARCHAR(50) NOT NULL,
  "model" VARCHAR(255) NOT NULL,
  "purpose" VARCHAR(255),
  "input_tokens" INTEGER,
  "output_tokens" INTEGER,
  "total_tokens" INTEGER,
  "duration_ms" INTEGER,
  "estimated_cost_usd" NUMERIC(12,6),
  "success" BOOLEAN NOT NULL DEFAULT true,
  "error_code" VARCHAR(50),
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for efficient job-level queries
CREATE INDEX IF NOT EXISTS idx_job_ai_calls_job_id ON job_ai_calls(job_id);

-- Index for ordering calls within a job
CREATE INDEX IF NOT EXISTS idx_job_ai_calls_job_id_call_index ON job_ai_calls(job_id, call_index);

