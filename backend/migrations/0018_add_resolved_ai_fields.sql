-- Migration: Add resolved AI configuration fields to jobs table
-- These fields track the ACTUAL runtime AI config used, not just the requested values

-- Resolved provider (actual provider used at runtime)
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "ai_provider_resolved" VARCHAR(50);

-- Resolved model (actual model used at runtime, after overrides/fallbacks)
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "ai_model_resolved" VARCHAR(255);

-- Key source: where the API key came from
-- 'user' = user's own stored key, 'env' = environment/server key
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "ai_key_source" VARCHAR(20);

-- Fallback reason: why we fell back to env key (null if no fallback)
-- e.g., 'USER_KEY_MISSING', 'USER_KEY_INVALID', 'PROVIDER_ERROR_FALLBACK'
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "ai_fallback_reason" VARCHAR(100);

-- Add index for querying jobs by key source (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_jobs_ai_key_source ON jobs(ai_key_source);

