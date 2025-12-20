ALTER TABLE "jobs" ADD COLUMN "raw_error_payload" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "mcp_gateway_url" varchar(255);--> statement-breakpoint
ALTER TABLE "oauth_accounts" DROP COLUMN IF EXISTS "provider_username";