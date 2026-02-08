# PR Merge Checklist — Documentation Restructure (docs/restructure-2026-01 → main)

> **Purpose:** Reviewer-executable checklist for pre-merge validation
> **Created:** 2026-01-28
> **Branch:** `docs/restructure-2026-01`
> **Target:** `main`
> **Related Docs:** PR_RELEASE_NOTES_DOCS_REBASE.md, CONTEXT_UPLOAD_PACK.md, RESTRUCTURE_VERIFICATION_REPORT.md

---

## Quick Reference

**Estimated Review Time:** 30-45 minutes (spot-check approach)

**Critical Blocker Status:** ✅ **RESOLVED** (CONTEXT_ARCHITECTURE.md contradiction fixed)

**Ready to Merge:** ✅ **YES** (after completing this checklist)

---

## 1. Pre-Review Setup

### 1.1 Checkout Branch

```bash
# Clone repo if not already done
cd /path/to/akis-platform-devolopment/devagents

# Fetch latest
git fetch origin

# Checkout review branch
git checkout docs/restructure-2026-01

# Verify branch
git branch --show-current
# Expected: docs/restructure-2026-01
```

### 1.2 Verify Clean State

```bash
# Check for uncommitted changes
git status

# Expected result:
# - Modified files (M) should be staged or ready to stage
# - Renamed files (R) should show archive operations
# - Untracked files (??) should be new gate reports
# - No unexpected changes outside docs/
```

**Checkpoint:** ☐ Branch checked out, git status reviewed

---

## 2. Scope Validation (CRITICAL)

### 2.1 Docs-Only Scope Verification

**Objective:** Confirm ZERO product code changes

```bash
# Check for backend code changes
git diff main --name-status | grep "^[MAD].*backend/src"
# Expected: (empty)

# Check for frontend code changes
git diff main --name-status | grep "^[MAD].*frontend/src"
# Expected: (empty)

# Check for database migration changes
git diff main --name-status | grep -E "migrations|drizzle.*schema"
# Expected: (empty)

# Check for API contract changes
git diff main -- backend/docs/API_SPEC.md | grep -E "^[+-].*POST|^[+-].*GET|^[+-].*endpoint"
# Expected: (empty or only doc formatting changes)
```

**Checkpoint:** ☐ Confirmed docs-only scope (no product code changed)

### 2.2 Changed Files Summary

```bash
# Get full list of changed files
git diff main --name-status | head -30

# Expected categories:
# - M (Modified): docs/*.md, .cursor/context/*.md
# - A (Added): docs/ops/*.md, docs/ai/*.md, docs/archive/README.md
# - R (Renamed): QA evidence, debug plans, audits → docs/archive/
# - D (Deleted): docs/academic/00-README 2.md (duplicate)
```

**Checkpoint:** ☐ Reviewed changed files list (matches expectation: 21 files)

---

## 3. Critical Blocker Resolution Verification

### 3.1 CONTEXT_ARCHITECTURE.md Contradiction (RESOLVED)

**Issue:** Line 18 claimed "Next.js + Prisma" but lines 104-115 claimed "Fastify + Drizzle ✅ ALIGNED"

**Verification:**

```bash
# Check line 18 (should now say Fastify + Drizzle)
sed -n '18p' .cursor/context/CONTEXT_ARCHITECTURE.md

# Expected: "- Reality check: Current stack ALREADY uses Fastify + Drizzle + React/Vite (verified via package.json)"
# NOT: "- Reality check: Current stack uses Next.js + Prisma (not Fastify + Drizzle yet)"
```

```bash
# Check for "Historical Research" demarcation (should exist around line 23-28)
sed -n '23,35p' .cursor/context/CONTEXT_ARCHITECTURE.md | grep -E "Historical Research|Non-Canonical"

# Expected: Section header marking sections 1-2 as historical context
```

```bash
# Verify no other "Next.js + Prisma" claims outside historical section
grep -n "Next.js.*Prisma" .cursor/context/CONTEXT_ARCHITECTURE.md

# Expected: Only appears in historical research section (lines 56-58 area)
# Should have clear "Historical Research" context above it
```

**Checkpoint:** ☐ CONTEXT_ARCHITECTURE.md contradiction resolved (line 18 corrected, historical section demarcated)

---

## 4. Key Files Spot-Check

### 4.1 Planning Chain Synchronization

**Objective:** Verify BASELINE ↔ ROADMAP ↔ NEXT alignment

**Check 1: Current Phase Agreement**

```bash
# BASELINE current phase
grep -A2 "Current Phase" docs/PROJECT_TRACKING_BASELINE.md | grep "Phase 2"

# ROADMAP Phase 2 status
grep "Phase 2.*In Progress" docs/ROADMAP.md

# NEXT current phase
grep "Current Phase.*Phase 2" docs/NEXT.md

# Expected: All three mention "Phase 2 (S2.0.1) In Progress"
```

**Check 2: PM_NAMING_SYSTEM Compliance**

```bash
# Check for non-compliant status terms
grep -oE "(Unknown|Pending|Complete|Finished)" docs/PROJECT_TRACKING_BASELINE.md

# Expected: (empty - only Not Started / In Progress / Blocked / Done / Deprecated allowed)
```

**Check 3: Last Updated Dates**

```bash
# All three should show 2026-01-28
grep -E "Last Updated|2026-01-28" docs/PROJECT_TRACKING_BASELINE.md | head -1
grep "2026-01-28" docs/ROADMAP.md | head -1
grep "2026-01-28" docs/NEXT.md | head -1

# Expected: All show 2026-01-28
```

**Checkpoint:** ☐ Planning chain synchronized (phase, vocabulary, dates aligned)

### 4.2 Gate Reports Existence

```bash
# Verify all gate reports exist
ls -lh docs/ops/PHASE_GATE_*.md docs/ops/GATE_4_PATCH_REPORT.md

# Expected: 6 files (Gate 3, 4, 5, 6, 7 + Gate 4 Patch)
```

**Checkpoint:** ☐ All gate reports present (6 files)

### 4.3 AI Strategy Approval Status

```bash
# Check AI strategy status
head -5 docs/ai/AI_PROVIDER_KEY_STRATEGY.md | grep "Status.*APPROVED"

# Expected: "Status:** APPROVED — Gate 6 Decision Patch Applied"
```

```bash
# Verify Q1-Q3 resolved
grep -E "Decision 1:|Decision 2:|Decision 3:" docs/ai/AI_PROVIDER_KEY_STRATEGY.md

# Expected: 3 matches (all decisions documented)
```

**Checkpoint:** ☐ AI strategy approved with decisions finalized

### 4.4 Archive Operations Integrity

```bash
# Verify archive directory structure
ls -d docs/archive/qa-evidence docs/archive/debug-plans docs/archive/audits

# Expected: All 3 directories exist
```

```bash
# Verify git mv preserved history (check one file)
git log --follow --oneline docs/archive/qa-evidence/2025-12-QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md | wc -l

# Expected: >1 (shows history before rename)
```

```bash
# Verify archive index exists
ls -lh docs/archive/README.md

# Expected: File exists with archive policy + operations log
```

**Checkpoint:** ☐ Archive operations correct (structure + history preserved + index created)

---

## 5. Content Coherence Spot-Checks

### 5.1 CONTEXT_UPLOAD_PACK.md Structure

```bash
# Check for MUST-HAVE section
grep -n "## 1. MUST-HAVE Documents" docs/ops/CONTEXT_UPLOAD_PACK.md

# Expected: Section exists (around line 20-30)
```

```bash
# Check for Freshness Checklist
grep -n "Freshness & Consistency Checklist" docs/ops/CONTEXT_UPLOAD_PACK.md

# Expected: Section exists (around line 150-200)
```

**Checkpoint:** ☐ Context Upload Pack structured (MUST-HAVE + Freshness Checklist present)

### 5.2 PR Release Notes Completeness

```bash
# Check for all expected sections
grep -E "^## [0-9]" docs/ops/PR_RELEASE_NOTES_DOCS_REBASE.md | head -10

# Expected sections:
# - Files Added
# - Files Updated
# - Files Archived
# - Files Deleted
# - Conflicts Resolved
# - Link Integrity Status
# - Summary Statistics
```

**Checkpoint:** ☐ PR Release Notes comprehensive (all key sections present)

### 5.3 Verification Report Verdict

```bash
# Check merge-readiness verdict
grep -A5 "Merge-Readiness Verdict" docs/ops/RESTRUCTURE_VERIFICATION_REPORT.md

# Expected: Should show "NOT READY" if blocker unresolved, or assessment of blocker status
# Note: This report may be outdated if blocker was fixed AFTER report creation
```

**Checkpoint:** ☐ Verification Report reviewed (blocker status noted)

---

## 6. Link Integrity Verification

### 6.1 Archive Path Updates

```bash
# Check if any docs still reference old archive paths
grep -r "docs/QA_EVIDENCE_PR127" docs/ --include="*.md" | grep -v "archive/qa-evidence"

# Expected: (empty - all references should use new archive paths)
```

```bash
# Verify PHASE10_PLAN.md reference removed (was dead link)
grep "PHASE10_PLAN" docs/ROADMAP.md

# Expected: (empty - dead link should be removed)
```

**Checkpoint:** ☐ Link integrity maintained (archive paths updated, dead links removed)

---

## 7. Additional Deliverables Verification

### 7.1 Naming System & Patch Plan

```bash
# Verify naming system exists
ls -lh docs/ops/PRODUCT_RELEASE_NAMING_SYSTEM.md

# Expected: File exists (~20-25 KB)
```

```bash
# Verify patch plan exists
ls -lh docs/ops/RELEASE_NAMING_PATCH_PLAN.md

# Expected: File exists (~15-20 KB)
```

```bash
# Check if "Scribe v2" patch was applied
grep -c "Scribe MVP" docs/SCRIBE_MVP_CONTRACT_FIRST.md 2>/dev/null || echo "File renamed or patched"

# Note: File was renamed from SCRIBE_V2_CONTRACT_FIRST.md to SCRIBE_MVP_CONTRACT_FIRST.md per RELEASE_NAMING_PATCH_PLAN
```

**Checkpoint:** ☐ Naming system + patch plan exist (execution status noted)

### 7.2 Verification Report & Merge Checklist

```bash
# Verify verification report exists
ls -lh docs/ops/RESTRUCTURE_VERIFICATION_REPORT.md

# Expected: File exists (~25-30 KB)
```

```bash
# Verify this merge checklist exists
ls -lh docs/ops/PR_MERGE_CHECKLIST_DOCS_REBASE.md

# Expected: File exists (you're reading it!)
```

**Checkpoint:** ☐ Verification report + merge checklist exist

---

## 8. Git Operations Check

### 8.1 Unstaged Files

```bash
# Check for unstaged files
git status --short | grep "^??"

# Expected: May show untracked files (gate reports, new docs)
# Action: Stage all relevant files before commit
```

**If unstaged files exist:**

```bash
# Stage all new/modified docs
git add docs/ai/
git add docs/ops/
git add docs/NEXT.md docs/ROADMAP.md docs/PROJECT_TRACKING_BASELINE.md
git add .cursor/context/
git add docs/archive/README.md

# Verify staged
git status
# Expected: All relevant files in "Changes to be committed" (green)
```

**Checkpoint:** ☐ All files staged (no unexpected unstaged changes)

### 8.2 Commit Message (If Not Already Committed)

**If changes not yet committed, use this template:**

```bash
git commit -m "docs: Phase Gates 3-7 restructure + evidence corrections

Gate 3: NEXT + ROADMAP reconciliation
- Added Gate 3 status sections to NEXT.md and ROADMAP.md
- Added human-readable names (31 phases/sprints)
- Flagged conflicts with evidence requirements

Gate 4: BASELINE + CONTEXT refresh
- Updated PROJECT_TRACKING_BASELINE.md (Phase 2, S2.0.1)
- Corrected CONTEXT_ARCHITECTURE.md + CONTEXT_SCOPE.md (stack reality verified)
- Resolved 3 conflicts with QA evidence

Gate 4 Patch: Vocabulary + evidence normalization
- Replaced 'Unknown' with 'Not Started' + evidence notes
- Verified Fastify + Drizzle + React/Vite via package.json
- Corrected OAuth status (ALREADY implemented, not future)

Gate 5: Archive operations
- Archived 5 files to docs/archive/ (git mv, history preserved)
- Deleted 1 duplicate file (docs/academic/00-README 2.md)
- Created archive index (docs/archive/README.md)

Gate 6: AI strategy + Decision Patch
- Created AI_PROVIDER_KEY_STRATEGY.md (APPROVED)
- Resolved Q1-Q3 (workspace keys future, Simple+Advanced modes, fail gracefully)
- Added auth consistency section + MVP vs Future scope

Gate 7: Context pack + release notes
- Created CONTEXT_UPLOAD_PACK.md (MUST-HAVE vs NICE-TO-HAVE)
- Created PR_RELEASE_NOTES_DOCS_REBASE.md (comprehensive summary)
- Created PHASE_GATE_7_REPORT.md

Additional Deliverables:
- Fixed CONTEXT_ARCHITECTURE.md contradiction (line 18 + historical demarcation)
- Created PRODUCT_RELEASE_NAMING_SYSTEM.md (professional version taxonomy)
- Created RELEASE_NAMING_PATCH_PLAN.md ('Scribe v2' normalization plan)
- Created RESTRUCTURE_VERIFICATION_REPORT.md (evidence-driven validation)
- Created PR_MERGE_CHECKLIST_DOCS_REBASE.md (this checklist)

Evidence-Driven Corrections: 54+
- Status: S0.4.6 Done (QA verified), Phase 2 In Progress (QA verified)
- Stack: Fastify + Drizzle + React/Vite verified (package.json)
- OAuth: Verified available (Auth.md)
- Vocabulary: PM_NAMING_SYSTEM compliance (50+ replacements)

Files Changed: 26 total
- Added: 14 (AI strategy, gate reports, archive index, context pack, naming docs)
- Modified: 6 (planning chain, context docs, changelog)
- Archived: 5 (QA evidence, debug plan, audit)
- Deleted: 1 (duplicate)

Docs-only scope: Zero product code changes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Checkpoint:** ☐ Commit message prepared (or already committed with descriptive message)

---

## 9. Final Pre-Merge Validation

### 9.1 Planning Chain Coherence (Final Check)

```bash
# Run freshness check from CONTEXT_UPLOAD_PACK.md instructions
# Step 1: Dates aligned?
grep "2026-01-28" docs/PROJECT_TRACKING_BASELINE.md docs/ROADMAP.md docs/NEXT.md

# Step 2: Phase aligned?
grep -E "Phase 2.*S2.0.1" docs/PROJECT_TRACKING_BASELINE.md docs/ROADMAP.md docs/NEXT.md

# Step 3: Vocabulary compliant?
grep -oE "(Unknown|Pending|Complete)" docs/PROJECT_TRACKING_BASELINE.md | wc -l
# Expected: 0 (no non-compliant terms)

# All checks pass?
```

**Checkpoint:** ☐ Planning chain coherence confirmed (dates, phase, vocabulary aligned)

### 9.2 Critical Files Final Review

**Spot-check these 5 critical files (open in editor, skim for obvious issues):**

1. `docs/PROJECT_TRACKING_BASELINE.md` — Last Updated 2026-01-28? Phase 2 status?
2. `.cursor/context/CONTEXT_ARCHITECTURE.md` — Line 18 corrected? Historical section demarcated?
3. `docs/ai/AI_PROVIDER_KEY_STRATEGY.md` — Status APPROVED? Decisions resolved?
4. `docs/ops/CONTEXT_UPLOAD_PACK.md` — MUST-HAVE section clear? Freshness checklist present?
5. `docs/ops/PR_RELEASE_NOTES_DOCS_REBASE.md` — Summary statistics correct? Approval checklist present?

**Checkpoint:** ☐ Critical files spot-checked (no obvious errors)

### 9.3 Blocker Resolution Confirmation

**Review RESTRUCTURE_VERIFICATION_REPORT.md blocker:**

```bash
# Check blocker section
sed -n '/6.1 Blockers/,/6.2 Non-Blocking/p' docs/ops/RESTRUCTURE_VERIFICATION_REPORT.md

# Was blocker: CONTEXT_ARCHITECTURE.md contradiction (line 18)
# Resolution: Fixed in this PR (verified in Section 3.1 above)
```

**Checkpoint:** ☐ Blocker resolved (CONTEXT_ARCHITECTURE.md line 18 corrected)

---

## 10. Merge Decision

### 10.1 Checklist Summary

Review all checkpoints above:

- ☐ Branch checked out, git status reviewed
- ☐ Docs-only scope confirmed (no product code changed)
- ☐ Changed files list matches expectation (26 files)
- ☐ CONTEXT_ARCHITECTURE.md contradiction resolved
- ☐ Planning chain synchronized (phase, vocabulary, dates)
- ☐ All gate reports present (6 files)
- ☐ AI strategy approved with decisions finalized
- ☐ Archive operations correct (structure + history + index)
- ☐ Context Upload Pack structured correctly
- ☐ PR Release Notes comprehensive
- ☐ Verification Report reviewed
- ☐ Link integrity maintained
- ☐ Naming system + patch plan exist
- ☐ Verification report + merge checklist exist
- ☐ All files staged (if not committed)
- ☐ Commit message prepared (if not committed)
- ☐ Planning chain coherence confirmed (final check)
- ☐ Critical files spot-checked
- ☐ Blocker resolved

**Total Checkpoints:** 19

**Checkpoints Passed:** _____ / 19

### 10.2 Merge Readiness Verdict

**If ALL checkpoints passed:**
✅ **READY TO MERGE**

**If 1-2 checkpoints failed (non-critical):**
⚠️ **MERGE WITH CAUTION** (document issues, create follow-up ticket)

**If 3+ checkpoints failed OR critical blocker unresolved:**
❌ **NOT READY** (resolve issues, re-run checklist)

---

## 11. Post-Merge Actions

**After merge to main:**

1. **Delete branch:**
   ```bash
   git branch -d docs/restructure-2026-01
   git push origin --delete docs/restructure-2026-01
   ```

2. **Notify stakeholders:**
   - AI_PROVIDER_KEY_STRATEGY.md approved (Gate 6 decisions finalized)
   - Planning chain synchronized (Phase 2 S2.0.1 current)
   - 3 open conflicts remain (Phase 1, S1.5.1, S1.5.2 - no QA evidence)

3. **Optional follow-up (recommended but not blocking):**
   - Execute RELEASE_NAMING_PATCH_PLAN.md ("Scribe v2" → "Scribe MVP")
   - Resolve 3 open conflicts (locate or create QA evidence)
   - Create Gate 8 framework for periodic reconciliation

---

## 12. Reviewer Notes

**Use this space for reviewer-specific observations:**

**Issues Found:**
- [ ] Issue 1: ___________________________
- [ ] Issue 2: ___________________________

**Questions for Author:**
- [ ] Question 1: ___________________________
- [ ] Question 2: ___________________________

**Approval Decision:**
- [ ] ✅ APPROVED (merge recommended)
- [ ] ⚠️ APPROVED WITH CONDITIONS (list conditions above)
- [ ] ❌ REJECTED (list blockers above)

**Reviewer Signature:** __________________ **Date:** __________

---

*Checklist complete. If all checkpoints pass, proceed with merge. For questions, refer to PR_RELEASE_NOTES_DOCS_REBASE.md (comprehensive change summary) or RESTRUCTURE_VERIFICATION_REPORT.md (evidence-driven validation).*
