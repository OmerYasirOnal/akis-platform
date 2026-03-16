-- Add GitHub integration columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_token" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_username" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_avatar_url" text;
