DO $$ BEGIN
 CREATE TYPE "public"."smart_automation_run_status" AS ENUM('pending', 'running', 'success', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "smart_automation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"link" varchar(2000) NOT NULL,
	"link_hash" varchar(64) NOT NULL,
	"excerpt" text,
	"published_at" timestamp with time zone,
	"source" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "smart_automation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" uuid NOT NULL,
	"status" "smart_automation_run_status" DEFAULT 'pending' NOT NULL,
	"output" text,
	"summary" text,
	"item_count" integer DEFAULT 0,
	"error" text,
	"error_code" varchar(50),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"slack_message_ts" varchar(50),
	"slack_sent" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "smart_automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"topics" jsonb NOT NULL,
	"sources" jsonb NOT NULL,
	"schedule_time" varchar(5) DEFAULT '09:00' NOT NULL,
	"timezone" varchar(50) DEFAULT 'Europe/Istanbul' NOT NULL,
	"output_language" varchar(10) DEFAULT 'tr' NOT NULL,
	"style" varchar(50) DEFAULT 'linkedin' NOT NULL,
	"delivery_in_app" boolean DEFAULT true NOT NULL,
	"delivery_slack" boolean DEFAULT false NOT NULL,
	"slack_channel" varchar(100),
	"enabled" boolean DEFAULT true NOT NULL,
	"mode" varchar(50) DEFAULT 'draft_only' NOT NULL,
	"next_run_at" timestamp with time zone,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "smart_automation_items" ADD CONSTRAINT "smart_automation_items_run_id_smart_automation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."smart_automation_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "smart_automation_runs" ADD CONSTRAINT "smart_automation_runs_automation_id_smart_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."smart_automations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "smart_automations" ADD CONSTRAINT "smart_automations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_smart_automation_items_run_id" ON "smart_automation_items" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_smart_automation_items_link_hash" ON "smart_automation_items" USING btree ("link_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_smart_automation_runs_automation_id" ON "smart_automation_runs" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_smart_automation_runs_status" ON "smart_automation_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_smart_automation_runs_created_at" ON "smart_automation_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_smart_automations_user_id" ON "smart_automations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_smart_automations_enabled" ON "smart_automations" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_smart_automations_next_run_at" ON "smart_automations" USING btree ("next_run_at");