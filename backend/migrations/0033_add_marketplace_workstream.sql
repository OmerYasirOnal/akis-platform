-- AKIS Workstream Marketplace MVP schema
-- Non-destructive migration. Creates new marketplace tables.

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  headline varchar(255),
  bio text,
  seniority varchar(50) NOT NULL DEFAULT 'mid',
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_locations jsonb NOT NULL DEFAULT '[]'::jsonb,
  remote_only boolean NOT NULL DEFAULT false,
  salary_floor integer,
  excluded_industries jsonb NOT NULL DEFAULT '[]'::jsonb,
  verification_status varchar(50) NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_verification ON profiles(verification_status);

CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL,
  level integer NOT NULL DEFAULT 3,
  years_experience numeric(4,1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skills_profile_id ON skills(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_profile_name_unique ON skills(profile_id, name);

CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  url varchar(2000),
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_profile_id ON portfolios(profile_id);

CREATE TABLE IF NOT EXISTS job_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  type varchar(50) NOT NULL DEFAULT 'manual',
  base_url varchar(2000),
  is_active boolean NOT NULL DEFAULT true,
  rate_limit_per_minute integer NOT NULL DEFAULT 60,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_sources_type ON job_sources(type);
CREATE INDEX IF NOT EXISTS idx_job_sources_active ON job_sources(is_active);

CREATE TABLE IF NOT EXISTS job_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES job_sources(id) ON DELETE RESTRICT,
  external_id varchar(255),
  title varchar(500) NOT NULL,
  description text NOT NULL,
  required_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  seniority varchar(50),
  language varchar(20),
  location varchar(255),
  remote_allowed boolean NOT NULL DEFAULT true,
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  currency varchar(8) NOT NULL DEFAULT 'USD',
  raw_payload jsonb,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_posts_source_id ON job_posts(source_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_ingested_at ON job_posts(ingested_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_posts_source_external_unique ON job_posts(source_id, external_id);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_post_id uuid NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  score numeric(5,4) NOT NULL,
  explanation jsonb NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'suggested',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_matches_score_range CHECK (score >= 0 AND score <= 1)
);

CREATE INDEX IF NOT EXISTS idx_matches_profile_id ON matches(profile_id);
CREATE INDEX IF NOT EXISTS idx_matches_job_post_id ON matches(job_post_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_profile_job_unique ON matches(profile_id, job_post_id);

CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_post_id uuid NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  source varchar(30) NOT NULL DEFAULT 'template',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_profile_id ON proposals(profile_id);
CREATE INDEX IF NOT EXISTS idx_proposals_job_post_id ON proposals(job_post_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type varchar(100) NOT NULL,
  entity_type varchar(100) NOT NULL,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
