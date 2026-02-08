# PR Release Notes — Documentation Restructure (Gates 3-7)

> **Branch:** `docs/restructure-2026-01`
> **Created:** 2026-01-28
> **Purpose:** Summary of all documentation changes from Phase Gates 3-7
> **Merge Target:** `main` (awaiting approval)

---

## Executive Summary

This PR restructures and reconciles core planning and architecture documentation through a gated approach (Gates 3-7). All changes are documentation-only—no product code modified.

**Key Outcomes:**
- ✅ Planning chain synchronized (BASELINE ↔ ROADMAP ↔ NEXT)
- ✅ Context docs evidence-corrected (stack reality verified)
- ✅ 5 files archived with git history preserved
- ✅ 1 duplicate file deleted
- ✅ AI provider strategy finalized (Gate 6 Decision Patch)
- ✅ Context Upload Pack created for external review
- ✅ All conflicts resolved or explicitly flagged

---

## 1. Files Added

### New Strategy Documents (Gate 6)
| File | Purpose | Status |
|------|---------|--------|
| `docs/ai/AI_PROVIDER_KEY_STRATEGY.md` | AI provider + key management strategy | APPROVED (Gate 6 Decision Patch) |

### New Operational Documents (Gates 3-7)
| File | Purpose | Gate |
|------|---------|------|
| `docs/ops/PHASE_GATE_3_REPORT.md` | Gate 3 execution report (NEXT + ROADMAP reconciliation) | Gate 3 |
| `docs/ops/PHASE_GATE_4_REPORT.md` | Gate 4 execution report (BASELINE + CONTEXT refresh) | Gate 4 |
| `docs/ops/GATE_4_PATCH_REPORT.md` | Gate 4 Patch report (vocabulary normalization + evidence correction) | Gate 4 Patch |
| `docs/ops/PHASE_GATE_5_REPORT.md` | Gate 5 execution report (archive operations + link verification) | Gate 5 |
| `docs/ops/PHASE_GATE_6_REPORT.md` | Gate 6 execution report (AI strategy + Decision Patch) | Gate 6 |
| `docs/ops/CONTEXT_UPLOAD_PACK.md` | External review context pack (MUST-HAVE vs NICE-TO-HAVE) | Gate 7 |
| `docs/ops/PR_RELEASE_NOTES_DOCS_REBASE.md` | This file (PR release notes) | Gate 7 |

### New Archive Index (Gate 5)
| File | Purpose | Gate |
|------|---------|------|
| `docs/archive/README.md` | Archive index (policy, structure, operations log) | Gate 5 |

**Total Files Added:** 9

---

## 2. Files Updated

### Planning Chain (Gates 3 & 4)
| File | What Changed | Gates | Key Updates |
|------|--------------|-------|-------------|
| `docs/PROJECT_TRACKING_BASELINE.md` | Current phase updated, conflicts resolved, vocabulary normalized, human-readable names added | Gate 4 + Patch | Current phase: Phase 2 (S2.0.1) In Progress, S0.4.6 Done (QA verified), PM_NAMING_SYSTEM vocabulary applied (50+ instances), 31 phases/sprints with human-readable names |
| `docs/ROADMAP.md` | Conflicts flagged, human-readable names added, "Verified vs Claimed" section added | Gate 3 | Phase tables updated with human-readable names, broken link to PHASE10_PLAN.md removed, conflicts documented with evidence requirements |
| `docs/NEXT.md` | Execution order updated, "Verified vs Claimed" section added, conflicts flagged | Gate 3 | S0.4.6 Steps 3-5 marked Done (evidence-backed), conflicts documented with 4-step verification checklists |

### Context Docs (Gate 4 + Patch)
| File | What Changed | Gate | Key Updates |
|------|--------------|------|-------------|
| `.cursor/context/CONTEXT_ARCHITECTURE.md` | "Current Reality Check" added (evidence-based) | Gate 4 + Patch | Stack Reality table CORRECTED: Fastify 4.x + Drizzle ORM + React 19/Vite marked ✅ ALIGNED (was incorrectly claiming NOT MIGRATED), evidence sources cited (package.json, Auth.md) |
| `.cursor/context/CONTEXT_SCOPE.md` | "What Exists Now" section added (evidence-based) | Gate 4 + Patch | OAuth status CORRECTED: moved from "Future Features" to "Implemented Features" (evidence: Auth.md confirms OAuth available S0.4.2, PR #90) |

### Operational Docs (Gates 3-5)
| File | What Changed | Gate | Key Updates |
|------|--------------|------|-------------|
| `docs/ops/DOC_HYGIENE_CHANGELOG.md` | Incremental operations log updated | Gates 3, 4, 5 | Gate 3, 4, 5 operations logged with timestamps, summary table updated |

**Total Files Updated:** 6

---

## 3. Files Archived (With New Paths)

**All archive operations used `git mv` to preserve history.**

| Old Path | New Path | Reason | Gate |
|----------|----------|--------|------|
| `docs/QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md` | `docs/archive/qa-evidence/2025-12-QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md` | Historical QA evidence (PR #127 verified 2025-12) | Gate 5 |
| `docs/QA_EVIDENCE_FRONTEND_IMPORTS.md` | `docs/archive/qa-evidence/2025-12-QA_EVIDENCE_FRONTEND_IMPORTS.md` | Historical QA evidence (frontend imports verified 2025-12) | Gate 5 |
| `docs/QA_EVIDENCE_MERGE_GATE_DB_TESTS.md` | `docs/archive/qa-evidence/2025-12-QA_EVIDENCE_MERGE_GATE_DB_TESTS.md` | Historical QA evidence (merge gate DB tests verified 2025-12) | Gate 5 |
| `docs/qa/DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md` | `docs/archive/debug-plans/2026-01-DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md` | Historical debug plan (Scribe AI cookie 401 issue) | Gate 5 |
| `backend/docs/audit/2025-11-26-scribe-pipeline-audit.md` | `docs/archive/audits/2025-11-26-scribe-pipeline-audit.md` | Historical audit (scribe pipeline audit 2025-11-26) | Gate 5 |

**Total Files Archived:** 5

**Retrieval:** Use `git log --follow <new-path>` to see full history (git preserves history across moves)

**Archive Index:** See `docs/archive/README.md` for complete list and retrieval instructions

---

## 4. Files Deleted

| File | Reason | Gate |
|------|--------|------|
| `docs/academic/00-README 2.md` | Duplicate of `docs/academic/00-README.md` (diff verified: identical) | Gate 5 |

**Total Files Deleted:** 1

---

## 5. Conflicts Resolved

### Gate 4 Resolutions (Evidence-Driven)
| Conflict # | Description | Resolution | Evidence Source |
|------------|-------------|------------|-----------------|
| 1 | S0.4.6 status (NEXT.md claimed Done, BASELINE/ROADMAP claimed Not Started) | **RESOLVED to Done** | `docs/qa/QA_EVIDENCE_S0.4.6.md` (2025-12-27 PASS, Steps 1-5 complete) |
| 2 | Current phase (NEXT.md claimed Phase 2, BASELINE/ROADMAP claimed Phase 0.4) | **RESOLVED to Phase 2 (S2.0.1) In Progress** | `docs/qa/QA_EVIDENCE_CURSOR_UI_RELEASE.md` (2026-01-10, S2.0.1 In Progress) |
| 3 | Document staleness (Last Updated dates inconsistent) | **RESOLVED: All updated 2026-01-28** | Gate 4 Reconciliation timestamp |

### Gate 4 Patch Corrections (Evidence-Driven)
| Correction # | Description | Resolution | Evidence Source |
|--------------|-------------|------------|-----------------|
| 1 | Stack reality contradiction (CONTEXT_ARCHITECTURE claimed NOT migrated to Fastify + Drizzle) | **CORRECTED: Stack ALREADY uses Fastify + Drizzle + React/Vite** | `backend/package.json`, `frontend/package.json` verification |
| 2 | OAuth status contradiction (CONTEXT_SCOPE claimed OAuth "Future Feature") | **CORRECTED: OAuth ALREADY implemented (S0.4.2, PR #90)** | `backend/docs/Auth.md` lines 11-19 verification |
| 3 | Status vocabulary non-compliance (BASELINE used "Unknown" for S1.5.1, S1.5.2) | **CORRECTED: Replaced "Unknown" with "Not Started" + evidence gap notes** | `docs/ops/PM_NAMING_SYSTEM.md` compliance |

**Total Conflicts Resolved:** 6

---

## 6. Remaining Open Conflicts (Flagged for Future Resolution)

| Conflict # | Description | Evidence Gap | Flagged In |
|------------|-------------|--------------|------------|
| 1 | Phase 1 status (ROADMAP.md claims Done, no QA sign-off found) | Missing: `docs/qa/QA_EVIDENCE_PHASE1.md` or equivalent | `docs/NEXT.md` Conflict #1 |
| 2 | S1.5.1 (Job Logging v1) status (some docs claim complete, no QA evidence) | Missing: `docs/qa/QA_EVIDENCE_S1.5.1.md` | `docs/PROJECT_TRACKING_BASELINE.md` Notes column |
| 3 | S1.5.2 status (no clear evidence of completion) | Missing: `docs/qa/QA_EVIDENCE_S1.5.2.md` | `docs/PROJECT_TRACKING_BASELINE.md` Notes column |

**How to Resolve (Future Work):**
1. Locate or create QA evidence files for Phase 1, S1.5.1, S1.5.2
2. If evidence found: Update BASELINE (canonical), then ROADMAP/NEXT follow
3. If no evidence exists: Keep status as "Not Started" or "In Progress" until verification

**Note:** These conflicts were LEFT OPEN by design (Gate 4 constraint: do NOT invent Done without evidence)

**Total Open Conflicts:** 3

---

## 7. Link Integrity Status

### Dead Links Fixed
| Link | Location | Fix | Gate |
|------|----------|-----|------|
| `PHASE10_PLAN.md` | `docs/ROADMAP.md` | REMOVED reference (file does not exist) | Gate 3 |

### Links Verified (No Fixes Needed)
- ✅ All internal docs links in BASELINE, ROADMAP, NEXT verified (Gates 3 & 5)
- ✅ Backend docs links (Auth.md, API_SPEC.md, AGENT_WORKFLOWS.md) verified (Gate 4)
- ✅ .cursor/context links (CONTEXT_ARCHITECTURE.md, CONTEXT_SCOPE.md) verified (Gate 4)

### Archive Link Updates (Path Changes)
**Old links that referenced archived files now need updated paths:**
- Old: `docs/QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md` → New: `docs/archive/qa-evidence/2025-12-QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md`
- Old: `docs/QA_EVIDENCE_FRONTEND_IMPORTS.md` → New: `docs/archive/qa-evidence/2025-12-QA_EVIDENCE_FRONTEND_IMPORTS.md`
- Old: `docs/QA_EVIDENCE_MERGE_GATE_DB_TESTS.md` → New: `docs/archive/qa-evidence/2025-12-QA_EVIDENCE_MERGE_GATE_DB_TESTS.md`
- Old: `docs/qa/DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md` → New: `docs/archive/debug-plans/2026-01-DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md`
- Old: `backend/docs/audit/2025-11-26-scribe-pipeline-audit.md` → New: `docs/archive/audits/2025-11-26-scribe-pipeline-audit.md`

**Note:** No internal docs currently link to these archived files (verified Gate 5). If future docs reference them, use new paths.

**Link Integrity Summary:**
- ✅ 1 dead link fixed (PHASE10_PLAN.md removed)
- ✅ All active links verified
- ✅ Archive paths documented for future reference

---

## 8. Gate 6 Decision Patch Summary

### Open Questions Resolved (AI Provider Strategy)
| Question | Decision | MVP Scope | Future Scope |
|----------|----------|-----------|--------------|
| Q1: Workspace Key Scope | Workspace-specific (when implemented) | NOT in MVP (user-level keys only) | Post-MVP: workspace-specific precedence |
| Q2: Model Selection | Simple + Advanced modes | MVP: both modes | Advanced mode with more models |
| Q3: Rate Limit Handling | Fail gracefully | MVP: fail gracefully only | Post-MVP: opt-in fallback policy |

### AI_PROVIDER_KEY_STRATEGY.md Final Status
- ✅ Platform default model defined (works without user keys)
- ✅ User-level keys (MVP scope): OpenAI, Anthropic, OpenRouter
- ✅ Simple mode (default): Provider auto-selects model
- ✅ Advanced mode (opt-in): Provider + model selection
- ✅ Rate limit handling (MVP): Fail gracefully (no automatic fallback)
- ✅ Security requirements: 27 acceptance criteria (encryption, redaction, audit, rotation)
- ✅ Authentication consistency verified (aligns with Auth.md: email/password primary, OAuth available)
- ✅ MCP-only rule compliance (AI keys exempt, GitHub/Jira tokens still MCP-only)
- ✅ MVP vs Future scope documented (workspace keys, fallback policy, usage analytics post-MVP)

**Strategy Status:** APPROVED — Implementation-ready (Gate 6 Decision Patch applied 2026-01-28)

---

## 9. Summary Statistics

### Files Changed
| Category | Count | Details |
|----------|-------|---------|
| **Added** | 9 | AI strategy (1), gate reports (6), archive index (1), context pack (1) |
| **Updated** | 6 | Planning chain (3), context docs (2), changelog (1) |
| **Archived** | 5 | QA evidence (3), debug plan (1), audit (1) |
| **Deleted** | 1 | Duplicate file |
| **Total Affected** | 21 | Documentation-only changes |

### Conflict Resolution
| Category | Count | Details |
|----------|-------|---------|
| **Resolved** | 6 | Gate 4 (3), Gate 4 Patch (3) |
| **Remaining Open** | 3 | Phase 1 status, S1.5.1 status, S1.5.2 status |
| **Total Conflicts** | 9 | 67% resolved, 33% flagged for future work |

### Link Integrity
| Category | Count | Details |
|----------|-------|---------|
| **Dead Links Fixed** | 1 | PHASE10_PLAN.md removed |
| **Links Verified** | 50+ | All internal docs, backend docs, context docs |
| **Archive Path Updates** | 5 | New paths documented for archived files |

### Evidence-Driven Corrections
| Category | Count | Details |
|----------|-------|---------|
| **Status Corrections** | 2 | S0.4.6 Done, Current phase Phase 2 |
| **Stack Reality Corrections** | 1 | Fastify + Drizzle + React/Vite verified |
| **OAuth Status Correction** | 1 | OAuth moved to "Implemented Features" |
| **Vocabulary Normalization** | 50+ | "Unknown" replaced with PM_NAMING_SYSTEM terms |
| **Total Evidence-Based Edits** | 54+ | All backed by package.json, QA evidence, or Auth.md |

---

## 10. Key Decisions & Patterns

### Evidence-Driven Approach (Gate 4 Mandate)
**Pattern:** Trust QA evidence over claimed status
- ✅ S0.4.6 marked Done ONLY after finding QA_EVIDENCE_S0.4.6.md (2025-12-27 PASS)
- ✅ Current phase updated to Phase 2 ONLY after finding QA_EVIDENCE_CURSOR_UI_RELEASE.md (2026-01-10)
- ✅ Stack reality corrected ONLY after verifying backend/package.json and frontend/package.json
- ❌ Phase 1 status NOT updated to Done (no QA evidence found, conflict left open)

**Impact:** All "Done" status claims now backed by QA evidence or explicitly flagged as conflicts

### PM_NAMING_SYSTEM Vocabulary Enforcement (Gate 4 Patch)
**Pattern:** Strict status vocabulary (5 terms ONLY)
- ✅ Allowed: Not Started / In Progress / Blocked / Done / Deprecated
- ❌ Replaced: "Unknown", "Pending", "Complete", "Finished", etc.
- ✅ 50+ instances normalized in PROJECT_TRACKING_BASELINE.md

**Impact:** Consistent status terminology across all planning docs

### Human-Readable Names (Gate 3)
**Pattern:** Every phase/sprint gets human-readable name
- Example: "Phase 0.4: Web Shell + Basit Motor" → Human-readable: "Web Shell and Basic Engine"
- ✅ 31 phases/sprints updated in BASELINE
- ✅ All phase tables in ROADMAP updated
- ✅ Execution order in NEXT updated

**Impact:** Improved readability for stakeholders and external reviewers

### Conservative Cleanup (Gate 5)
**Pattern:** KEEP > ARCHIVE > DELETE
- ✅ 5 files archived (historical value, not actively needed)
- ✅ 1 file deleted (exact duplicate verified with diff)
- ✅ ALL archive operations used `git mv` (history preserved)
- ✅ Archive index created for discoverability

**Impact:** No information loss, full audit trail maintained

### Gated Approval Process (Gates 3-7)
**Pattern:** Sequential phases with STOP gates
- Gate 3: NEXT + ROADMAP reconciliation → STOP → Approved
- Gate 4: BASELINE + CONTEXT refresh → STOP → Approved
- Gate 4 Patch: Vocabulary + evidence correction → STOP → Approved
- Gate 5: Archive operations → STOP → Approved
- Gate 6: AI strategy → STOP → Decision Patch → STOP → Approved
- Gate 7: Context pack + release notes → STOP (awaiting approval)

**Impact:** Controlled, reviewable changes with clear approval checkpoints

---

## 11. Testing & Verification

### No Product Code Changed
- ✅ Zero changes to `backend/src/` code
- ✅ Zero changes to `frontend/src/` code
- ✅ Zero changes to database migrations
- ✅ Zero changes to API contracts (API_SPEC.md updated dates only, contracts unchanged)

**Testing Required:** NONE (documentation-only PR)

### Documentation Verification Performed
- ✅ All links verified (Gate 3, 5)
- ✅ All status vocabulary normalized (Gate 4 Patch)
- ✅ All QA evidence cross-referenced (Gate 4)
- ✅ All archive operations logged (Gate 5)
- ✅ All human-readable names added (Gate 3)
- ✅ All evidence sources cited (Gate 4 Patch)

**Manual Review Recommended:**
1. Review CONTEXT_UPLOAD_PACK.md (Gate 7) for external review readiness
2. Verify AI_PROVIDER_KEY_STRATEGY.md (Gate 6) decisions align with product roadmap
3. Confirm open conflicts (Phase 1, S1.5.1, S1.5.2) are acceptable to leave flagged

---

## 12. Migration Notes

### For Existing Context Consumers
**If you currently reference these files, update your links:**

**Archived Files (New Paths):**
- `docs/QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md` → `docs/archive/qa-evidence/2025-12-QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md`
- `docs/QA_EVIDENCE_FRONTEND_IMPORTS.md` → `docs/archive/qa-evidence/2025-12-QA_EVIDENCE_FRONTEND_IMPORTS.md`
- `docs/QA_EVIDENCE_MERGE_GATE_DB_TESTS.md` → `docs/archive/qa-evidence/2025-12-QA_EVIDENCE_MERGE_GATE_DB_TESTS.md`
- `docs/qa/DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md` → `docs/archive/debug-plans/2026-01-DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md`
- `backend/docs/audit/2025-11-26-scribe-pipeline-audit.md` → `docs/archive/audits/2025-11-26-scribe-pipeline-audit.md`

**Deleted Files (No Replacement Needed):**
- `docs/academic/00-README 2.md` → Use `docs/academic/00-README.md` (identical content)

**New Files to Include in Context:**
- `docs/ops/CONTEXT_UPLOAD_PACK.md` → MUST-HAVE docs list for external review
- `docs/ai/AI_PROVIDER_KEY_STRATEGY.md` → AI provider strategy (APPROVED)
- `docs/archive/README.md` → Archive index (find historical docs)

### For AI Agents / External Reviewers
**Recommended Context Load Order:**
1. Start with `docs/ops/CONTEXT_UPLOAD_PACK.md` (Gate 7)
2. Follow MUST-HAVE docs list (Tier 1)
3. Load NICE-TO-HAVE docs as needed (Tier 2)
4. Reference archive index for historical context (Tier 3)

**Key Changes to Note:**
- Current phase is now Phase 2 (S2.0.1) In Progress (was incorrectly Phase 0.4)
- Stack reality: Fastify + Drizzle + React/Vite ALREADY implemented (was incorrectly claiming NOT migrated)
- OAuth status: ALREADY implemented (was incorrectly claiming "Future Feature")
- PM_NAMING_SYSTEM vocabulary enforced (only 5 allowed status terms)

---

## 13. Post-Merge Actions

### Immediate Actions (After Merge)
1. ✅ Delete branch `docs/restructure-2026-01` (squash merge recommended)
2. ✅ Update external documentation references (if any systems link to old paths)
3. ✅ Notify stakeholders of AI_PROVIDER_KEY_STRATEGY.md approval (Gate 6 decisions finalized)

### Follow-Up Actions (Next Sprint)
1. ⏳ Resolve remaining open conflicts (Phase 1, S1.5.1, S1.5.2 status verification)
2. ⏳ Create missing QA evidence files if Phase 1/S1.5.1/S1.5.2 were actually completed
3. ⏳ Update any external systems that reference archived file paths

### Long-Term Actions (Future Gates)
1. ⏳ Gate 8+: Continue documentation hygiene (periodic reconciliation)
2. ⏳ Implement AI_PROVIDER_KEY_STRATEGY.md (post-MVP work per Gate 6 decisions)
3. ⏳ Review and update CONTEXT_UPLOAD_PACK.md after major doc changes

---

## 14. Approval Checklist

**Before Merging This PR, Confirm:**
- [ ] All 9 new files reviewed (gate reports, AI strategy, context pack, release notes)
- [ ] All 6 updated files reviewed (planning chain, context docs, changelog)
- [ ] All 5 archived files' new paths verified (git history preserved)
- [ ] 1 deleted file confirmed as duplicate (diff verified identical)
- [ ] 6 resolved conflicts verified with evidence sources
- [ ] 3 remaining open conflicts acceptable to leave flagged
- [ ] Link integrity status acceptable (1 dead link fixed, all others verified)
- [ ] AI_PROVIDER_KEY_STRATEGY.md decisions approved (Q1-Q3 resolutions)
- [ ] CONTEXT_UPLOAD_PACK.md provides sufficient external review guidance
- [ ] No product code changed (documentation-only PR)
- [ ] No testing required (no behavioral changes)
- [ ] Post-merge actions documented (delete branch, notify stakeholders)

---

## 15. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| External links break (archived file paths changed) | Low | Low | Archive index documents all new paths, git history preserved |
| Context consumers miss archived files | Low | Medium | CONTEXT_UPLOAD_PACK.md documents archive locations, README.md provides index |
| Open conflicts misinterpreted as resolved | Low | Medium | NEXT.md explicitly flags conflicts with evidence gap notes |
| AI strategy decisions misaligned with product roadmap | Low | High | Gate 6 Decision Patch applied after user approval (Q1-Q3 resolved) |
| Documentation becomes stale again | Medium | Medium | Gate 7+ framework established for periodic reconciliation |

**Overall Risk:** LOW — All changes documentation-only, git history preserved, evidence-driven corrections

---

## 16. Related Pull Requests

**None** — This is the first PR from the `docs/restructure-2026-01` branch.

**Future PRs (Expected):**
- Implementation of AI_PROVIDER_KEY_STRATEGY.md (backend + frontend work)
- Resolution of open conflicts (Phase 1, S1.5.1, S1.5.2 QA verification)
- Periodic documentation reconciliation (Gate 8+)

---

## 17. Changelog Summary

**ADDED:**
- AI provider key management strategy (APPROVED, MVP + future scope defined)
- Phase Gate 3-7 execution reports (6 reports documenting all changes)
- Context Upload Pack (MUST-HAVE vs NICE-TO-HAVE docs for external review)
- Archive index (policy, structure, operations log for 5 archived files)

**CHANGED:**
- Planning chain synchronized (BASELINE ↔ ROADMAP ↔ NEXT) with evidence-driven corrections
- Context docs corrected (stack reality verified, OAuth status corrected)
- Status vocabulary normalized (PM_NAMING_SYSTEM compliance: 50+ instances)
- Human-readable names added (31 phases/sprints across planning chain)
- Documentation hygiene changelog updated (Gate 3, 4, 5 operations logged)

**ARCHIVED:**
- 3 historical QA evidence files → docs/archive/qa-evidence/
- 1 historical debug plan → docs/archive/debug-plans/
- 1 historical audit → docs/archive/audits/

**REMOVED:**
- 1 duplicate file (docs/academic/00-README 2.md)

**FIXED:**
- 1 dead link (PHASE10_PLAN.md reference removed from ROADMAP.md)
- 6 conflicts resolved with evidence (S0.4.6 status, current phase, stack reality, OAuth status, vocabulary, staleness)
- 3 conflicts flagged for future resolution (Phase 1, S1.5.1, S1.5.2 status verification pending)

---

*This PR represents Gates 3-7 of the documentation restructure initiative. All changes are evidence-driven, gated for approval, and fully documented. Merge recommended after approval checklist completion.*
