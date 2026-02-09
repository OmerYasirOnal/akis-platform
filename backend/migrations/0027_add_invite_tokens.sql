-- Migration: Add invite_tokens table (WL-1 invite flow)
-- Creates the invite_status enum and invite_tokens table for admin-created invitations.

DO $$ BEGIN
  CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "invite_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token" varchar(64) NOT NULL UNIQUE,
  "email" text NOT NULL,
  "invited_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" "invite_status" DEFAULT 'pending' NOT NULL,
  "accepted_by" uuid REFERENCES "users"("id"),
  "accepted_at" timestamp,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_invite_tokens_token" ON "invite_tokens" USING btree ("token");
CREATE INDEX IF NOT EXISTS "idx_invite_tokens_email" ON "invite_tokens" USING btree ("email");
CREATE INDEX IF NOT EXISTS "idx_invite_tokens_invited_by" ON "invite_tokens" USING btree ("invited_by");
