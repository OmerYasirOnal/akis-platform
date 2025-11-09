CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" varchar(255) NOT NULL,
    "username" varchar(120),
    "password_hash" varchar(255),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email_unique" ON "users" ("email");

CREATE TABLE IF NOT EXISTS "sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "jwt_id" varchar(128) NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_jwt_id" ON "sessions" ("jwt_id");

CREATE TABLE IF NOT EXISTS "oauth_accounts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "provider" varchar(32) NOT NULL,
    "provider_user_id" varchar(128) NOT NULL,
    "installation_id" varchar(64),
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_oauth_accounts_provider_user_installation"
    ON "oauth_accounts" ("provider", "provider_user_id", "installation_id");

CREATE INDEX IF NOT EXISTS "idx_oauth_accounts_user_installation"
    ON "oauth_accounts" ("user_id", "installation_id");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_run_status') THEN
        CREATE TYPE "agent_run_status" AS ENUM ('queued', 'running', 'completed', 'failed');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS "agent_runs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "job_id" uuid REFERENCES "jobs"("id") ON DELETE SET NULL,
    "agent_type" varchar(32) NOT NULL,
    "repo_full_name" varchar(255) NOT NULL,
    "branch" varchar(120) NOT NULL,
    "model_id" varchar(120) NOT NULL,
    "plan" varchar(16) DEFAULT 'free' NOT NULL,
    "status" agent_run_status DEFAULT 'queued' NOT NULL,
    "input_tokens" integer DEFAULT 0,
    "output_tokens" integer DEFAULT 0,
    "cost_usd" numeric(12,6) DEFAULT 0,
    "error" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_agent_runs_user_created"
    ON "agent_runs" ("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "idx_agent_runs_model"
    ON "agent_runs" ("model_id");

