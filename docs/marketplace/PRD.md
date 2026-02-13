# AKIS Workstream PRD

## 1. Problem Statement
AKIS Workstream helps unemployed or displaced professionals find paid freelance gigs quickly through a transparent, human-first marketplace workflow.

## 2. Personas
- Talent: job-seeking professional who needs income quickly.
- Client: company or individual who needs verified freelance support.
- Admin/Ops: monitors trust, quality, and disputes.

## 3. Jobs To Be Done (JTBD)
- Talent: "Help me onboard fast, find relevant gigs, and submit quality proposals without wasting time."
- Client: "Help me find trustworthy candidates with clear matching reasons."
- Admin: "Help me audit algorithmic decisions and resolve disputes."

## 4. Product Goals (MVP)
- Enable profile creation and preference setup.
- Ingest job posts through manual ingest API (MVP-safe).
- Compute deterministic match scores with explainable factors.
- Generate proposal drafts from profile + job data.
- Surface explanations and next-best actions in UI.

## 5. Non-Goals (MVP)
- No escrow/payments execution in MVP.
- No direct platform scraping automation in MVP.
- No autonomous proposal auto-submit to external marketplaces.

## 6. Scope
### MVP Scope (Phase 0)
- Talent onboarding and profile management.
- Job feed ingestion/list.
- Match run + match list + explanation JSON.
- Proposal draft generation.
- Audit logging for automated decisions.

### Later Phases
- Phase 1: payments + escrow + milestone management.
- Phase 2: connector marketplace and integration hardening.
- Phase 3: multi-language/regional compliance packs.

## 7. Core Workflows
### Talent Workflow
1. Sign in.
2. Complete onboarding/profile.
3. Browse jobs.
4. Run matching.
5. Inspect explanation + fit reasons.
6. Generate proposal.

### Client Workflow (MVP-lite)
1. Post or ingest job.
2. View recommended matches.
3. Inspect trust and explanation factors.

### Admin Workflow
1. Review audit log for matching/proposal events.
2. Handle dispute with evidence from event history.

## 8. Trust & Safety Model
- Identity verification: placeholder status fields in profile for future KYC integration.
- Fraud prevention: suspicious activity flags recorded in `audit_log`.
- Rating integrity: event-driven, append-only rating action logs (phase-gated).
- Explainability: every stored match must include machine-readable explanation JSON.
- Human oversight: dispute routes rely on audit entries and decision traces.

## 9. Metrics
- Activation rate (user reaches completed onboarding).
- Match acceptance rate.
- Time-to-first-gig.
- 7/30-day talent retention.
- Proposal-to-interview conversion proxy.

## 10. Research-Backed Product Decisions
- Matching modes and fairness budget design are grounded in `carreer_assistant/marketplace-research/01_MATCHING_MECHANISMS.md`.
- Retrieval/rerank architecture direction is grounded in `carreer_assistant/marketplace-research/02_JOB_RECSYS_AND_SKILLS_MATCHING.md`.
- Explanation schema and transparency requirements are grounded in `carreer_assistant/marketplace-research/03_FAIRNESS_TRANSPARENCY_EXPLAINABILITY.md`.
- Governance, audit, and metric policy are grounded in `carreer_assistant/marketplace-research/04_PLATFORM_WORK_GOVERNANCE_AND_MEASUREMENT.md`.

## 11. Open Questions / TODO
- TODO: Final legal policy per connector platform must be confirmed before any non-manual ingestion mode.
- TODO: Escrow provider selection and regional compliance package.
