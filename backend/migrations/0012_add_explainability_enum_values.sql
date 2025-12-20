-- Migration: Add missing explainability enum values to trace_event_type
-- Purpose: Fix "invalid input value for enum trace_event_type: 'reasoning'" error

-- Add missing enum values for explainability features
-- Note: ALTER TYPE ADD VALUE cannot be run inside a transaction block,
-- but Drizzle runs migrations in transactions, so we use the IF NOT EXISTS clause
-- which is safe to re-run

-- Add tool_call
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tool_call' AND enumtypid = 'trace_event_type'::regtype) THEN
        ALTER TYPE trace_event_type ADD VALUE 'tool_call';
    END IF;
END $$;

-- Add tool_result  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tool_result' AND enumtypid = 'trace_event_type'::regtype) THEN
        ALTER TYPE trace_event_type ADD VALUE 'tool_result';
    END IF;
END $$;

-- Add decision
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'decision' AND enumtypid = 'trace_event_type'::regtype) THEN
        ALTER TYPE trace_event_type ADD VALUE 'decision';
    END IF;
END $$;

-- Add plan_step
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'plan_step' AND enumtypid = 'trace_event_type'::regtype) THEN
        ALTER TYPE trace_event_type ADD VALUE 'plan_step';
    END IF;
END $$;

-- Add reasoning
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reasoning' AND enumtypid = 'trace_event_type'::regtype) THEN
        ALTER TYPE trace_event_type ADD VALUE 'reasoning';
    END IF;
END $$;

-- Add explainability columns to job_traces if they don't exist
ALTER TABLE job_traces 
ADD COLUMN IF NOT EXISTS tool_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS input_summary TEXT,
ADD COLUMN IF NOT EXISTS output_summary TEXT,
ADD COLUMN IF NOT EXISTS reasoning_summary VARCHAR(1000),
ADD COLUMN IF NOT EXISTS asked_what TEXT,
ADD COLUMN IF NOT EXISTS did_what TEXT,
ADD COLUMN IF NOT EXISTS why_reason TEXT;

-- Add diff columns to job_artifacts if they don't exist
ALTER TABLE job_artifacts
ADD COLUMN IF NOT EXISTS diff_preview TEXT,
ADD COLUMN IF NOT EXISTS lines_added INTEGER,
ADD COLUMN IF NOT EXISTS lines_removed INTEGER;

-- Create index for tool_name if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_job_traces_tool_name ON job_traces(tool_name);

