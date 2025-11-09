ALTER TABLE agent_runs
  ADD COLUMN premium_consent boolean DEFAULT false NOT NULL,
  ADD COLUMN premium_consent_at timestamp,
  ADD COLUMN context_tokens integer DEFAULT 0,
  ADD COLUMN notes jsonb DEFAULT '[]'::jsonb;

