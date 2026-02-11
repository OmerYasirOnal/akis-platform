-- Studio sessions table for AKIS Studio workspace management
DO $$ BEGIN
  CREATE TYPE studio_session_state AS ENUM ('active', 'paused', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS studio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(256) NOT NULL,
  repo_url VARCHAR(512),
  branch VARCHAR(256),
  state studio_session_state NOT NULL DEFAULT 'active',
  workspace JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_studio_sessions_user ON studio_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_sessions_state ON studio_sessions(state);
