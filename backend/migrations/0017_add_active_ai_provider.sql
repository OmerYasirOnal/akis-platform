-- Migration: Add active_ai_provider column to users table
-- This allows users to select their preferred AI provider (OpenAI or OpenRouter)

-- Create the enum type for AI providers (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_provider') THEN
    CREATE TYPE "ai_provider" AS ENUM('openai', 'openrouter');
  END IF;
END $$;

-- Add the column with a default of 'openrouter' (matches env default)
-- Column is nullable to allow gradual migration
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "active_ai_provider" "ai_provider" DEFAULT 'openrouter';

