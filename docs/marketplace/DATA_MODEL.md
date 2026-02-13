# AKIS Workstream Data Model

## 1. Entities
- `users` (existing AKIS auth user table)
- `profiles`: talent profile and preferences.
- `skills`: normalized skill records linked to profile.
- `portfolios`: portfolio/project evidence records.
- `job_sources`: source metadata (manual/API/partner).
- `job_posts`: ingested job posts.
- `matches`: computed match records with score + explanation JSON.
- `proposals`: generated proposal drafts.
- `audit_log`: append-only event records for explainability and disputes.

## 2. Key Relationships
- `profiles.user_id -> users.id` (1:1 target model).
- `skills.profile_id -> profiles.id` (1:N).
- `portfolios.profile_id -> profiles.id` (1:N).
- `job_posts.source_id -> job_sources.id` (N:1).
- `matches.profile_id -> profiles.id` (N:1).
- `matches.job_post_id -> job_posts.id` (N:1).
- `proposals.profile_id -> profiles.id` (N:1).
- `proposals.job_post_id -> job_posts.id` (N:1).
- `audit_log.user_id -> users.id` (N:1, nullable for system events).

## 3. Match Explanation Contract
`matches.explanation` JSONB contains:
- `top_factors: string[]`
- `factor_scores: Record<string, number>`
- `missing_skills: string[]`
- `confidence: number`
- `fairness_adjustment_applied: boolean`
- `summary: string`

## 4. Audit/Event Log Strategy
`audit_log` is append-only and stores:
- `event_type` (profile_updated, jobs_ingested, match_run, proposal_generated)
- `entity_type` / `entity_id`
- `payload` JSONB with input/output digest
- `created_at`

This supports:
- Explainability replay
- Dispute resolution evidence
- Governance reporting

## 5. Constraints
- `matches.score` numeric range [0, 1].
- `matches.explanation` must be non-null.
- `job_posts.external_id` unique per source when provided.
- `profiles.user_id` unique.

## 6. Migration Notes
- Existing `users` table is reused.
- No destructive migration in MVP.
