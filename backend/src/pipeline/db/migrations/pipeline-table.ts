/**
 * Pipeline table migration.
 * Run via: import { up } from './pipeline-table.js'; await up(sql);
 *
 * This migration creates the pipeline_stage enum and pipelines table.
 * Will be integrated into backend Drizzle migrations in Phase 7.
 */

export const up = `
-- Pipeline stage enum
DO $$ BEGIN
  CREATE TYPE pipeline_stage AS ENUM (
    'scribe_clarifying', 'scribe_generating', 'awaiting_approval',
    'proto_building', 'trace_testing',
    'completed', 'completed_partial', 'failed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage pipeline_stage NOT NULL DEFAULT 'scribe_clarifying',
  title TEXT,
  scribe_conversation JSONB DEFAULT '[]',
  scribe_output JSONB,
  approved_spec JSONB,
  proto_output JSONB,
  trace_output JSONB,
  proto_config JSONB,
  metrics JSONB DEFAULT '{}',
  error JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pipelines_user_id ON pipelines(user_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_stage ON pipelines(stage);
`;

export const down = `
DROP TABLE IF EXISTS pipelines;
DROP TYPE IF EXISTS pipeline_stage;
`;
