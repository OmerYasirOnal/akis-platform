-- 0031: Knowledge Source Registry + Provenance + Tags
-- S0.6: Verified Knowledge Acquisition & Source Provenance

-- Enums
DO $$ BEGIN
  CREATE TYPE "knowledge_source_license" AS ENUM (
    'apache-2.0', 'mit', 'bsd-2-clause', 'bsd-3-clause', 'cc-by-4.0', 'cc-by-sa-4.0',
    'cc0-1.0', 'mpl-2.0', 'isc', 'unlicense', 'public-domain', 'custom-open', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "knowledge_source_access" AS ENUM (
    'api', 'git_clone', 'http_scrape', 'rss', 'manual_upload'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "knowledge_verification_status" AS ENUM (
    'unverified', 'single_source', 'cross_verified', 'stale', 'conflicted'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Knowledge Sources (legal data source registry)
CREATE TABLE IF NOT EXISTS "knowledge_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(300) NOT NULL,
  "source_url" varchar(2000) NOT NULL,
  "license_type" "knowledge_source_license" NOT NULL DEFAULT 'unknown',
  "access_method" "knowledge_source_access" NOT NULL,
  "domain" varchar(100) NOT NULL,
  "refresh_interval_hours" integer DEFAULT 168,
  "last_fetched_at" timestamp with time zone,
  "next_fetch_at" timestamp with time zone,
  "content_hash" varchar(64),
  "verification_status" "knowledge_verification_status" NOT NULL DEFAULT 'unverified',
  "stale_at" timestamp with time zone,
  "is_active" boolean NOT NULL DEFAULT true,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_knowledge_sources_domain" ON "knowledge_sources" ("domain");
CREATE INDEX IF NOT EXISTS "idx_knowledge_sources_active" ON "knowledge_sources" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_knowledge_sources_verification" ON "knowledge_sources" ("verification_status");
CREATE INDEX IF NOT EXISTS "idx_knowledge_sources_next_fetch" ON "knowledge_sources" ("next_fetch_at");

-- Knowledge Provenance (links chunks to sources for citation generation)
CREATE TABLE IF NOT EXISTS "knowledge_provenance" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chunk_id" uuid NOT NULL REFERENCES "knowledge_chunks" ("id") ON DELETE CASCADE,
  "source_id" uuid NOT NULL REFERENCES "knowledge_sources" ("id") ON DELETE CASCADE,
  "source_url" varchar(2000) NOT NULL,
  "retrieved_at" timestamp with time zone NOT NULL,
  "content_hash" varchar(64) NOT NULL,
  "license_snapshot" "knowledge_source_license" NOT NULL,
  "verification_status" "knowledge_verification_status" NOT NULL DEFAULT 'unverified',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_knowledge_provenance_chunk" ON "knowledge_provenance" ("chunk_id");
CREATE INDEX IF NOT EXISTS "idx_knowledge_provenance_source" ON "knowledge_provenance" ("source_id");
CREATE INDEX IF NOT EXISTS "idx_knowledge_provenance_verification" ON "knowledge_provenance" ("verification_status");

-- Knowledge Tags (domain labels for agent-specific retrieval)
CREATE TABLE IF NOT EXISTS "knowledge_tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chunk_id" uuid NOT NULL REFERENCES "knowledge_chunks" ("id") ON DELETE CASCADE,
  "tag" varchar(100) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_knowledge_tags_chunk" ON "knowledge_tags" ("chunk_id");
CREATE INDEX IF NOT EXISTS "idx_knowledge_tags_tag" ON "knowledge_tags" ("tag");
CREATE INDEX IF NOT EXISTS "idx_knowledge_tags_chunk_tag" ON "knowledge_tags" ("chunk_id", "tag");
