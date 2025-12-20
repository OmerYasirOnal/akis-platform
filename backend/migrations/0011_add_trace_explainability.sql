-- Migration: Add explainability fields to job_traces table
-- Purpose: Support "Thinking UI" with reasoning summaries and structured tool call info

-- Add new trace event types for explainability
ALTER TYPE trace_event_type ADD VALUE IF NOT EXISTS 'tool_call';
ALTER TYPE trace_event_type ADD VALUE IF NOT EXISTS 'tool_result';
ALTER TYPE trace_event_type ADD VALUE IF NOT EXISTS 'decision';
ALTER TYPE trace_event_type ADD VALUE IF NOT EXISTS 'plan_step';
ALTER TYPE trace_event_type ADD VALUE IF NOT EXISTS 'reasoning';

-- Add explainability columns to job_traces
ALTER TABLE job_traces 
ADD COLUMN IF NOT EXISTS input_summary TEXT,
ADD COLUMN IF NOT EXISTS output_summary TEXT,
ADD COLUMN IF NOT EXISTS reasoning_summary VARCHAR(1000),
ADD COLUMN IF NOT EXISTS tool_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS asked_what TEXT,
ADD COLUMN IF NOT EXISTS did_what TEXT,
ADD COLUMN IF NOT EXISTS why_reason TEXT;

-- Add diff preview column to job_artifacts for file changes
ALTER TABLE job_artifacts
ADD COLUMN IF NOT EXISTS diff_preview TEXT,
ADD COLUMN IF NOT EXISTS lines_added INTEGER,
ADD COLUMN IF NOT EXISTS lines_removed INTEGER;

-- Create index for efficient trace queries by tool_name
CREATE INDEX IF NOT EXISTS idx_job_traces_tool_name ON job_traces(tool_name);

