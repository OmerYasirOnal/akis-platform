-- Migration: Add Atlassian OAuth 2.0 (3LO) support
-- This migration adds 'atlassian' to oauth_provider enum and adds
-- Atlassian-specific columns to oauth_accounts table.

-- Add 'atlassian' to oauth_provider enum
-- Using DO block to handle case where value already exists
DO $$ BEGIN
  ALTER TYPE oauth_provider ADD VALUE IF NOT EXISTS 'atlassian';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add Atlassian-specific columns to oauth_accounts
-- These columns are nullable to maintain backwards compatibility with existing providers

-- cloud_id: Atlassian Cloud ID for API calls
ALTER TABLE oauth_accounts
  ADD COLUMN IF NOT EXISTS cloud_id VARCHAR(255);

-- site_url: Atlassian site URL (e.g., https://your-domain.atlassian.net)
ALTER TABLE oauth_accounts
  ADD COLUMN IF NOT EXISTS site_url VARCHAR(500);

-- scopes: Granted OAuth scopes (space-separated string)
ALTER TABLE oauth_accounts
  ADD COLUMN IF NOT EXISTS scopes TEXT;

-- refresh_token_rotated_at: Timestamp of last refresh token rotation
-- Important for Atlassian's rotating refresh token mechanism
ALTER TABLE oauth_accounts
  ADD COLUMN IF NOT EXISTS refresh_token_rotated_at TIMESTAMPTZ;

-- Create partial index for efficient Atlassian OAuth lookups
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_atlassian_user
  ON oauth_accounts(user_id) WHERE provider = 'atlassian';

-- Add comment for documentation
COMMENT ON COLUMN oauth_accounts.cloud_id IS 'Atlassian Cloud ID for API calls (Atlassian OAuth only)';
COMMENT ON COLUMN oauth_accounts.site_url IS 'Atlassian site URL, e.g., https://your-domain.atlassian.net (Atlassian OAuth only)';
COMMENT ON COLUMN oauth_accounts.scopes IS 'Granted OAuth scopes, space-separated (Atlassian OAuth only)';
COMMENT ON COLUMN oauth_accounts.refresh_token_rotated_at IS 'Timestamp of last refresh token rotation for rotating token support (Atlassian OAuth only)';
