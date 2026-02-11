-- Add runtime control fields to agent_configs (Agent Control Platform v1)
ALTER TABLE "agent_configs"
  ADD COLUMN IF NOT EXISTS "runtime_profile" varchar(20) NOT NULL DEFAULT 'deterministic',
  ADD COLUMN IF NOT EXISTS "temperature_value" numeric(3,2),
  ADD COLUMN IF NOT EXISTS "command_level" integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "allow_command_execution" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "settings_version" integer NOT NULL DEFAULT 1;

-- Backfill derived value for existing rows
UPDATE "agent_configs"
SET "allow_command_execution" = CASE WHEN "command_level" >= 3 THEN true ELSE false END
WHERE "allow_command_execution" IS DISTINCT FROM (CASE WHEN "command_level" >= 3 THEN true ELSE false END);
