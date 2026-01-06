-- Migration: Add per-user AI keys + AI metrics
-- Purpose: Support encrypted user-scoped OpenAI keys and AI usage totals
-- Safe: Uses IF NOT EXISTS to avoid duplicate operations

CREATE TABLE IF NOT EXISTS "user_ai_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "provider" varchar(50) NOT NULL,
  "encrypted_key" text NOT NULL,
  "key_iv" varchar(64) NOT NULL,
  "key_tag" varchar(64) NOT NULL,
  "key_version" varchar(20) NOT NULL,
  "last4" varchar(4) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "user_ai_keys"
    ADD CONSTRAINT "user_ai_keys_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_ai_keys_user_provider"
  ON "user_ai_keys" USING btree ("user_id", "provider");
CREATE INDEX IF NOT EXISTS "idx_user_ai_keys_user_id"
  ON "user_ai_keys" USING btree ("user_id");

ALTER TABLE "jobs"
  ADD COLUMN IF NOT EXISTS "ai_provider" varchar(50),
  ADD COLUMN IF NOT EXISTS "ai_model" varchar(255),
  ADD COLUMN IF NOT EXISTS "ai_total_duration_ms" integer,
  ADD COLUMN IF NOT EXISTS "ai_input_tokens" integer,
  ADD COLUMN IF NOT EXISTS "ai_output_tokens" integer,
  ADD COLUMN IF NOT EXISTS "ai_total_tokens" integer,
  ADD COLUMN IF NOT EXISTS "ai_estimated_cost_usd" numeric(12, 6);
