-- Add integration_credentials table for Jira/Confluence API tokens
-- Uses same encryption pattern as user_ai_keys (AES-256-GCM)

-- Create enum for integration providers
DO $$ BEGIN
  CREATE TYPE integration_provider AS ENUM ('jira', 'confluence');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create integration_credentials table
CREATE TABLE IF NOT EXISTS integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  site_url VARCHAR(500) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  encrypted_token TEXT NOT NULL,
  token_iv VARCHAR(64) NOT NULL,
  token_tag VARCHAR(64) NOT NULL,
  key_version VARCHAR(20) NOT NULL,
  token_last4 VARCHAR(4) NOT NULL,
  last_validated_at TIMESTAMPTZ,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index for user + provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_creds_user_provider 
  ON integration_credentials(user_id, provider);

-- Create index for user lookup
CREATE INDEX IF NOT EXISTS idx_integration_creds_user_id 
  ON integration_credentials(user_id);
