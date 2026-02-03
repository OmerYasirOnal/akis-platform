DO $$ BEGIN
 CREATE TYPE "public"."knowledge_doc_status" AS ENUM('proposed', 'approved', 'deprecated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."knowledge_doc_type" AS ENUM('repo_doc', 'job_artifact', 'manual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" text,
	"token_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"doc_type" "knowledge_doc_type" NOT NULL,
	"source_path" varchar(1000),
	"commit_sha" varchar(40),
	"agent_type" varchar(50),
	"status" "knowledge_doc_status" DEFAULT 'proposed' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_knowledge_chunks_document" ON "knowledge_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_knowledge_chunks_chunk_index" ON "knowledge_chunks" USING btree ("document_id","chunk_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_knowledge_documents_workspace" ON "knowledge_documents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_knowledge_documents_status" ON "knowledge_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_knowledge_documents_doc_type" ON "knowledge_documents" USING btree ("doc_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_knowledge_documents_agent_type" ON "knowledge_documents" USING btree ("agent_type");