# Context Upload Pack — External Review

> **Purpose:** Minimal, high-signal document set for external reviewers (AI agents, new developers, stakeholders)
> **Created:** 2026-01-28 (Phase Gate 7)
> **Branch:** `docs/restructure-2026-01`
> **Usage:** Load these documents in priority order for maximum context efficiency

---

## Reading Order (Recommended)

**Read in this sequence for optimal context building:**

1. **Planning Chain** (MUST-HAVE) — Current execution state
2. **Context Docs** (MUST-HAVE) — Architecture mandates and scope
3. **Backend Core** (MUST-HAVE) — API contracts and authentication
4. **UI/UX Design** (MUST-HAVE) — Frontend patterns and brand
5. **QA Evidence** (MUST-HAVE) — What's been verified
6. **Strategy Docs** (NICE-TO-HAVE) — Future direction
7. **Supporting Docs** (NICE-TO-HAVE) — Additional context

---

## 1. MUST-HAVE Documents

### Canonical Planning Chain (Synchronized Hierarchy)
**Priority:** CRITICAL — Read these first to understand project state

| File | Purpose | Last Updated | Why It's Critical |
|------|---------|--------------|-------------------|
| `docs/PROJECT_TRACKING_BASELINE.md` | Canonical schedule anchor (derived from spreadsheet) | 2026-01-28 (Gate 4 + Patch) | Single source of truth for phases, sprints, dates, status |
| `docs/ROADMAP.md` | Phase overview and milestones | 2026-01-28 (Gate 3) | High-level phase structure, human-readable names |
| `docs/NEXT.md` | Immediate actions + execution order | 2026-01-28 (Gate 3) | What to do next, current blockers, verified vs claimed status |

**Why This Order:** BASELINE (canonical) → ROADMAP (phases) → NEXT (immediate actions)

**Freshness Check:** All three updated 2026-01-28 with Gate 3/4/Patch reconciliation

### .cursor/context/ (Architecture & Scope Mandates)
**Priority:** CRITICAL — Read after planning chain

| File | Purpose | Last Updated | Why It's Critical |
|------|---------|--------------|-------------------|
| `.cursor/context/CONTEXT_ARCHITECTURE.md` | Technical architecture mandates (Fastify, Drizzle, MCP-only) | 2026-01-28 (Gate 4 + Patch) | Defines stack reality (NOT Next.js), MCP-only integration rule |
| `.cursor/context/CONTEXT_SCOPE.md` | Project scope & requirements | 2026-01-28 (Gate 4 + Patch) | What exists now, what's planned, OAuth status |

**Why Critical:** These docs define architecture constraints and prevent violating mandates (e.g., don't store GitHub tokens in backend)

**Evidence-Based Corrections Applied:** Gate 4 Patch verified stack reality from package.json (Fastify + Drizzle + React/Vite ALREADY implemented)

### Backend Core Documentation
**Priority:** CRITICAL — Read before touching backend code

| File | Purpose | Last Updated | Why It's Critical |
|------|---------|--------------|-------------------|
| `backend/docs/Auth.md` | Canonical authentication architecture | 2025-12-23 | Email/password + verification PRIMARY, OAuth available, JWT patterns |
| `backend/docs/API_SPEC.md` | REST API contracts | 2026-01-10 | All endpoints, request/response formats, error codes |
| `backend/docs/AGENT_WORKFLOWS.md` | Agent execution patterns | 2025-11-26 | How agents work, scribe pipeline, orchestrator |

**Why Critical:** Auth.md prevents redesigning auth flows (violation of Gate 4 constraint), API_SPEC defines contracts

### UI/UX Design System
**Priority:** CRITICAL — Read before frontend work

| File | Purpose | Last Updated | Why It's Critical |
|------|---------|--------------|-------------------|
| `docs/UI_DESIGN_SYSTEM.md` | Comprehensive UI patterns, components, theming | Updated | All UI components, color system, typography, spacing |
| `docs/WEB_INFORMATION_ARCHITECTURE.md` | Site navigation and page hierarchy | Updated | How pages connect, routing structure |
| `docs/BRAND_GUIDE.md` | Brand identity (logo, colors, voice) | Updated | AKIS brand assets, tone of voice |
| `docs/ux/AKIS_CURSOR_UI_MASTER_PLAN.md` | Cursor-inspired UI vision | 2026-01-10 | S2.0.1 Cursor UI implementation plan |
| `docs/ux/AKIS_LIQUID_NEON_LAYER.md` | Liquid Neon design layer | Updated | Visual effects, animations |

**Why Critical:** UI_DESIGN_SYSTEM defines all frontend patterns, WEB_IA shows navigation structure

### QA Evidence (Verified Reality)
**Priority:** CRITICAL — Trust QA evidence over claimed status

| File | Purpose | Date | Status | Location |
|------|---------|------|--------|----------|
| `docs/qa/QA_EVIDENCE_S0.4.6.md` | S0.4.6 Steps 1-5 verification | 2025-12-27 | PASS | docs/qa/ |
| `docs/qa/QA_EVIDENCE_CURSOR_UI_RELEASE.md` | S2.0.1 Cursor UI QA | 2026-01-10 | In Progress | docs/qa/ |
| `docs/QA_EVIDENCE.md` | General QA notes | Updated | Active | docs/ |

**Archived QA Evidence (Historical Record):**
| File | Purpose | Date | Location |
|------|---------|------|----------|
| `2025-12-QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md` | PR #127 frontend gate fix | 2025-12 | docs/archive/qa-evidence/ |
| `2025-12-QA_EVIDENCE_FRONTEND_IMPORTS.md` | Frontend import verification | 2025-12 | docs/archive/qa-evidence/ |
| `2025-12-QA_EVIDENCE_MERGE_GATE_DB_TESTS.md` | Merge gate database tests | 2025-12 | docs/archive/qa-evidence/ |

**Why Critical:** QA evidence is ONLY source for "Done" status (Gate 4 rule: do NOT invent Done without evidence)

**Archive Index:** See `docs/archive/README.md` for full list and retrieval instructions

---

## 2. NICE-TO-HAVE Documents

### Strategy & Future Direction
**Priority:** NICE-TO-HAVE — Read after MUST-HAVE docs

| File | Purpose | Last Updated | Notes |
|------|---------|--------------|-------|
| `docs/ai/AI_PROVIDER_KEY_STRATEGY.md` | AI provider + key management strategy | 2026-01-28 (Gate 6 + Decision Patch) | Platform default model, user keys, security requirements (APPROVED) |
| `docs/plans/PHASE4_5_FUTURE_BETS_CONCEPT.md` | Phase 4/5 future proposals | Updated | Long-term vision |
| `docs/plans/FUTURE_PROPOSALS_PHASE4_5.md` | Additional future proposals | Updated | Exploration notes |

### Operational Docs
**Priority:** NICE-TO-HAVE — Understand process and history

| File | Purpose | Last Updated | Notes |
|------|---------|--------------|-------|
| `docs/ops/REPO_REALITY_BASELINE.md` | Evidence-driven approach mandate | Updated | How to use QA evidence, trust reality over claims |
| `docs/ops/PM_NAMING_SYSTEM.md` | Status vocabulary standard | Updated | Not Started / In Progress / Blocked / Done / Deprecated ONLY |
| `docs/ops/DOC_HYGIENE_AUDIT.md` | Documentation hygiene audit | 2026-01-28 | Dead links, duplicates, stale dates identified |
| `docs/ops/DOC_HYGIENE_CHANGELOG.md` | Incremental cleanup log | 2026-01-28 (Gate 5) | All hygiene operations tracked |
| `docs/ops/PHASE_GATE_3_REPORT.md` | Gate 3 execution report | 2026-01-28 | NEXT.md and ROADMAP.md reconciliation |
| `docs/ops/PHASE_GATE_4_REPORT.md` | Gate 4 execution report | 2026-01-28 | BASELINE and CONTEXT refresh |
| `docs/ops/GATE_4_PATCH_REPORT.md` | Gate 4 Patch report | 2026-01-28 | Vocabulary normalization + evidence correction |
| `docs/ops/PHASE_GATE_5_REPORT.md` | Gate 5 execution report | 2026-01-28 | Archive operations + link verification |
| `docs/ops/PHASE_GATE_6_REPORT.md` | Gate 6 execution report | 2026-01-28 (Decision Patch) | AI strategy decisions finalized |

### Integration & Setup
**Priority:** NICE-TO-HAVE — Useful for local dev or integration work

| File | Purpose | Notes |
|------|---------|-------|
| `docs/DEV_SETUP.md` | Development environment setup | Prerequisites, local dev instructions |
| `docs/ENV_SETUP.md` | Environment variables setup | .env configuration |
| `docs/local-dev/LOCAL_DEV_QUICKSTART.md` | Quick start guide | Fast local dev setup |
| `docs/GITHUB_MCP_SETUP.md` | GitHub MCP integration | MCP-only pattern for GitHub |
| `docs/GITHUB_OAUTH_SETUP.md` | GitHub OAuth setup | OAuth configuration |
| `docs/integrations/ATLASSIAN_OAUTH_SETUP.md` | Atlassian OAuth setup | Jira/Confluence OAuth |
| `docs/MCP_ENV_SECURITY_IMPLEMENTATION.md` | MCP environment security | Security patterns for MCP |

### Deployment & Infrastructure
**Priority:** NICE-TO-HAVE — For deployment work

| File | Purpose | Notes |
|------|---------|-------|
| `docs/deploy/DEPLOYMENT_STRATEGY.md` | Deployment architecture | OCI strategy |
| `docs/deploy/RUNBOOK_OCI.md` | OCI runbook | Deployment steps |
| `docs/deploy/OCI_STAGING_RUNBOOK.md` | Staging deployment | Staging-specific instructions |
| `docs/deploy/AKISFLOW_DOMAIN_STRATEGY.md` | Domain strategy | akisflow.com domain setup |

### Additional Reference
**Priority:** NICE-TO-HAVE — Domain-specific deep dives

| File | Purpose | Notes |
|------|---------|-------|
| `docs/glossary.md` | Project terminology | Definitions |
| `docs/constraints.md` | Project constraints | Limitations and rules |
| `docs/PROJECT_STATUS.md` | Project status snapshot | Periodic status updates |
| `docs/PROJECT_ANALYSIS_2025-12-23.md` | Project analysis | Mid-project review |
| `docs/CI_AUTOMATION.md` | CI/CD automation | Test automation, pipelines |
| `docs/OBSERVABILITY_TRACE_SPEC.md` | Observability spec | Tracing and monitoring |
| `docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md` | Scribe agent spec | PR automation patterns |
| `docs/SCRIBE_MVP_CONTRACT_FIRST.md` | Scribe MVP design | Contract-first approach (v1.0 target) |

---

## 3. Freshness & Consistency Checklist

### How to Verify BASELINE ↔ ROADMAP ↔ NEXT Alignment

**Step 1: Check Last Updated Dates**
- `PROJECT_TRACKING_BASELINE.md` header: "Last Updated: 2026-01-28 (Gate 4 Reconciliation + Patch)"
- `ROADMAP.md` header: Gate 3 Reconciliation Status section (2026-01-28)
- `NEXT.md` header: Gate 3 Reconciliation Status section (2026-01-28)

**All three should have matching 2026-01-28 dates from Gate 3/4/Patch execution.**

**Step 2: Verify Current Phase Consistency**
- **BASELINE:** Check "Current Phase" in Overview section → Should be "Phase 2 (S2.0.1) In Progress"
- **ROADMAP:** Check Phase 2 table → Should show "Phase 2: OCI Hosting + Pilotlar | Production Hosting | In Progress (UI Track)"
- **NEXT:** Check Execution Order section → Should prioritize S2.0.1 tasks

**All three should agree on Phase 2 (S2.0.1) In Progress.**

**Step 3: Verify Sprint Status Vocabulary**
- **Allowed statuses:** Not Started / In Progress / Blocked / Done / Deprecated (from PM_NAMING_SYSTEM.md)
- **Check BASELINE sprint table:** Should use ONLY these 5 terms (no "Unknown", "Pending", "Complete")
- **Check ROADMAP/NEXT:** Should match BASELINE status for overlapping sprints

**All status terms should comply with PM_NAMING_SYSTEM.md.**

**Step 4: Cross-Reference QA Evidence**
- **BASELINE shows Done?** → Check `docs/qa/QA_EVIDENCE_*.md` for corresponding evidence file
- **Example:** S0.4.6 Done in BASELINE → `docs/qa/QA_EVIDENCE_S0.4.6.md` (2025-12-27 PASS) exists
- **No evidence?** → Status should be "Not Started" or "In Progress" with evidence gap note

**Done status MUST have QA evidence backing (Gate 4 rule).**

**Step 5: Verify Human-Readable Names**
- **BASELINE, ROADMAP, NEXT:** All phases and sprints should have human-readable names column/field
- **Example:** "Phase 0.4: Web Shell + Basit Motor" → Human-readable: "Web Shell and Basic Engine"
- **Check consistency:** Same phase should have same human-readable name across all three docs

**Human-readable names should be consistent across planning chain.**

### Where to Find Supporting QA Evidence

**Active QA Evidence (docs/qa/):**
- `docs/qa/QA_EVIDENCE_S0.4.6.md` — S0.4.6 Steps 1-5 PASS (2025-12-27)
- `docs/qa/QA_EVIDENCE_CURSOR_UI_RELEASE.md` — S2.0.1 In Progress (2026-01-10)
- `docs/qa/DEMO_READY_FINAL.md` — Demo readiness verification
- `docs/qa/POST_MERGE_SANITY_20260110.md` — Post-merge sanity checks

**Archived QA Evidence (docs/archive/qa-evidence/):**
- `2025-12-QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md`
- `2025-12-QA_EVIDENCE_FRONTEND_IMPORTS.md`
- `2025-12-QA_EVIDENCE_MERGE_GATE_DB_TESTS.md`

**Archive Index:** See `docs/archive/README.md` for complete list and retrieval instructions

### Conflict Resolution Status

**Resolved Conflicts (Gate 4):**
1. ✅ S0.4.6 status (BASELINE vs NEXT disagreement) → Resolved to "Done" with QA evidence
2. ✅ Current phase (Phase 0.4 vs Phase 2 disagreement) → Resolved to "Phase 2 (S2.0.1) In Progress" with QA evidence
3. ✅ Document staleness (Last Updated dates) → All updated 2026-01-28

**Remaining Open Conflicts (Flagged in NEXT.md):**
1. ❓ Phase 1 status (claimed Done in ROADMAP, no QA sign-off found)
2. ❓ S1.5.1 (Job Logging v1) status (claimed complete in some docs, no QA evidence)
3. ❓ S1.5.2 status (no clear evidence of completion)

**How to Resolve Open Conflicts:**
- Do NOT assume Done without QA evidence (Gate 4 constraint)
- Look for QA_EVIDENCE_*.md files in docs/qa/ or docs/archive/qa-evidence/
- If no evidence: Status should be "Not Started" or "In Progress" with evidence gap note
- When evidence found: Update BASELINE first (canonical), then ROADMAP/NEXT follow

---

## 4. Link Integrity Status

### Dead Links Fixed (Gate 3 & 5)
- ✅ `PHASE10_PLAN.md` reference in ROADMAP.md → REMOVED (file does not exist)
- ✅ All other links verified in BASELINE, ROADMAP, NEXT (Gates 3 & 5 verification)

### Known Good Links (Verified)
- Internal docs links (e.g., `docs/ops/REPO_REALITY_BASELINE.md`) → ✅ VERIFIED
- Backend docs links (e.g., `backend/docs/Auth.md`) → ✅ VERIFIED
- .cursor/context links (e.g., `.cursor/context/CONTEXT_ARCHITECTURE.md`) → ✅ VERIFIED

### Archive Links (Updated Paths)
**Files moved to docs/archive/ in Gate 5:**
- Old: `docs/QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md` → New: `docs/archive/qa-evidence/2025-12-QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md`
- Old: `docs/QA_EVIDENCE_FRONTEND_IMPORTS.md` → New: `docs/archive/qa-evidence/2025-12-QA_EVIDENCE_FRONTEND_IMPORTS.md`
- Old: `docs/QA_EVIDENCE_MERGE_GATE_DB_TESTS.md` → New: `docs/archive/qa-evidence/2025-12-QA_EVIDENCE_MERGE_GATE_DB_TESTS.md`
- Old: `docs/qa/DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md` → New: `docs/archive/debug-plans/2026-01-DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md`
- Old: `backend/docs/audit/2025-11-26-scribe-pipeline-audit.md` → New: `docs/archive/audits/2025-11-26-scribe-pipeline-audit.md`

**If you reference archived files, use new paths. See `docs/archive/README.md` for complete index.**

---

## 5. Document Versions & History

### Canonical Versions (Most Recent)
- **PROJECT_TRACKING_BASELINE.md:** 2026-01-28 (Gate 4 + Patch)
- **ROADMAP.md:** 2026-01-28 (Gate 3)
- **NEXT.md:** 2026-01-28 (Gate 3)
- **CONTEXT_ARCHITECTURE.md:** 2026-01-28 (Gate 4 + Patch)
- **CONTEXT_SCOPE.md:** 2026-01-28 (Gate 4 + Patch)
- **AI_PROVIDER_KEY_STRATEGY.md:** 2026-01-28 (Gate 6 + Decision Patch)

### Git History Preservation
**All archive operations used `git mv` to preserve history:**
- Use `git log --follow <path>` to trace archived file history
- Example: `git log --follow docs/archive/qa-evidence/2025-12-QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md`

---

## 6. Critical Constraints (Do NOT Violate)

### From CONTEXT_ARCHITECTURE.md
1. **MCP-only integration for GitHub, Atlassian, etc.:** Backend NEVER stores GitHub/Jira tokens in its own database
2. **Stack mandate:** Fastify 4.x + Drizzle ORM + React 19/Vite (NOT Next.js, NOT Prisma)
3. **AIService pattern:** Orchestrator-injected tools, NOT direct AI calls from agent code

### From Auth.md
1. **Email/password + verification PRIMARY:** OAuth (Google/GitHub) available but NOT primary
2. **JWT-based authentication:** All auth uses JWT tokens
3. **Multi-step signup:** Name/email → password → email verification → consent flows

### From Gate 4 Constraint
1. **Do NOT redesign auth flows:** Respect existing authentication architecture (Auth.md)
2. **Evidence-driven status:** Do NOT mark Done without QA evidence

### From PM_NAMING_SYSTEM.md
1. **Status vocabulary:** ONLY use Not Started / In Progress / Blocked / Done / Deprecated (no other terms)

---

## 7. Archive Location Reference

**Full archive index:** See `docs/archive/README.md`

**Quick reference:**
- **QA evidence archives:** `docs/archive/qa-evidence/`
- **Debug plan archives:** `docs/archive/debug-plans/`
- **Audit archives:** `docs/archive/audits/`
- **Historical phase docs:** `docs/archive/phase-9-2/`
- **Old QA notes:** `docs/archive/qa-notes/`
- **Deprecated docs:** `docs/archive/deprecated/`

**Retrieval:** Use `git log --follow <archived-path>` to see full history

---

## 8. Loading Priority Summary

### Tier 1: MUST-HAVE (Load First)
1. Planning Chain: BASELINE → ROADMAP → NEXT
2. Context Docs: CONTEXT_ARCHITECTURE.md, CONTEXT_SCOPE.md
3. Backend Core: Auth.md, API_SPEC.md, AGENT_WORKFLOWS.md
4. UI/UX: UI_DESIGN_SYSTEM.md, WEB_INFORMATION_ARCHITECTURE.md, BRAND_GUIDE.md
5. QA Evidence: docs/qa/QA_EVIDENCE_*.md files

### Tier 2: NICE-TO-HAVE (Load After Tier 1)
1. Strategy: AI_PROVIDER_KEY_STRATEGY.md, future proposals
2. Ops: REPO_REALITY_BASELINE.md, PM_NAMING_SYSTEM.md, gate reports
3. Integration: DEV_SETUP.md, GITHUB_MCP_SETUP.md, integration guides
4. Deployment: DEPLOYMENT_STRATEGY.md, runbooks
5. Reference: glossary.md, constraints.md, additional context

### Tier 3: Archive (Load On Demand)
- Archived QA evidence (historical verification)
- Debug plans (historical troubleshooting)
- Audits (historical reviews)
- Deprecated docs (outdated information)

---

## 9. Usage Examples

### Example 1: New Developer Onboarding
**Load in this order:**
1. BASELINE → understand current phase and sprint
2. ROADMAP → see high-level phase structure
3. NEXT → know what to work on immediately
4. CONTEXT_ARCHITECTURE → learn stack and architecture constraints
5. Auth.md → understand authentication patterns
6. API_SPEC.md → learn REST API contracts
7. UI_DESIGN_SYSTEM.md → learn frontend patterns
8. DEV_SETUP.md → set up local environment

### Example 2: External AI Agent Context Load
**Load in this order:**
1. BASELINE → current project state (phase, sprints, dates)
2. CONTEXT_ARCHITECTURE → architecture mandates (don't violate)
3. CONTEXT_SCOPE → project scope (what's in/out)
4. NEXT → immediate actions (what to do next)
5. Auth.md → authentication architecture (don't redesign)
6. QA_EVIDENCE_*.md → what's been verified (trust evidence)

### Example 3: Stakeholder Review
**Load in this order:**
1. ROADMAP → high-level phase overview
2. BASELINE → detailed schedule and status
3. NEXT → current priorities and blockers
4. AI_PROVIDER_KEY_STRATEGY → future AI integration strategy
5. Gate reports (Gate 3-6) → recent execution history

---

## 10. Maintenance Instructions

**When to Update This Pack:**
- After major documentation restructures (e.g., Gate 7+)
- When new MUST-HAVE documents are created
- When canonical documents change location
- When archive operations move files

**How to Update:**
1. Update "Last Updated" dates in file tables
2. Add/remove files from MUST-HAVE or NICE-TO-HAVE sections
3. Update Freshness & Consistency Checklist if verification steps change
4. Update Archive Location Reference if new archive categories added

**Ownership:** This pack is maintained by ops team as part of documentation hygiene process.

---

*This Context Upload Pack ensures external reviewers have maximum signal, minimum noise. Always load MUST-HAVE docs before NICE-TO-HAVE. Trust QA evidence over claimed status.*
