-- Migration: Add active_ai_provider column to users table
-- This allows users to select their preferred AI provider (OpenAI or OpenRouter)

-- Create the enum type for AI providers
DO $$ BEGIN
  CREATE TYPE "ai_provider" AS ENUM('openai', 'openrouter');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add the column with a default of 'openrouter' (matches env default)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "active_ai_provider" "ai_provider" DEFAULT 'openrouter';

