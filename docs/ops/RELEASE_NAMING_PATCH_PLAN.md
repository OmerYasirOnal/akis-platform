# Release Naming Patch Plan

> **Purpose:** Traceable mapping of premature version references to compliant labels per PRODUCT_RELEASE_NAMING_SYSTEM.md
> **Created:** 2026-01-28
> **Status:** READY FOR EXECUTION (awaiting approval)
> **Scope:** Replace "Scribe v2" and similar premature versioning across docs

---

## 1. Patch Scope

**Total Occurrences Found:** 24 occurrences of "Scribe v2" / "Scribe V2" / "Scribe 2.0" across 4 files

**Files Requiring Patches:**
1. `docs/SCRIBE_V2_CONTRACT_FIRST.md` (15 occurrences + filename)
2. `docs/ops/REPO_REALITY_BASELINE.md` (1 occurrence)
3. `docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md` (1 occurrence)
4. `docs/ops/CONTEXT_UPLOAD_PACK.md` (1 occurrence)

**Note:** `docs/ops/PRODUCT_RELEASE_NAMING_SYSTEM.md` and `docs/ops/RESTRUCTURE_VERIFICATION_REPORT.md` contain "Scribe v2" references but are META-DOCS documenting the problem—DO NOT PATCH these.

---

## 2. Replacement Mapping Table

### 2.1 File: docs/SCRIBE_V2_CONTRACT_FIRST.md

**Evidence:** File currently titled "Scribe v2: Contract-First Doc Specialist"
**Issue:** Implies v1.0 exists (NO EVIDENCE)
**Proposed Action:** Rename file + update all internal references

**Filename Change:**
| Current Filename | Proposed Filename | Rationale | Evidence |
|------------------|-------------------|-----------|----------|
| `docs/SCRIBE_V2_CONTRACT_FIRST.md` | `docs/SCRIBE_MVP_CONTRACT_FIRST.md` | "MVP" clarifies target is first production release (v1.0), not second release (v2.0) | No Scribe v1.0 evidence exists (see PRODUCT_RELEASE_NAMING_SYSTEM.md Section 4.1) |

**Content Changes (Line-by-Line):**

| Line # | Current Text | Proposed Replacement | Rationale |
|--------|-------------|---------------------|-----------|
| 1 | `# Scribe v2: Contract-First Doc Specialist` | `# Scribe MVP: Contract-First Doc Specialist` | Title alignment with filename |
| 5 | `Scribe v2 is a major upgrade...` | `Scribe MVP is a contract-first documentation agent designed to transform...` | Reframe as "MVP capabilities" not "v2 upgrade" (no v1 to upgrade from) |
| 11 | `Scribe v2 uses **Documentation Contracts**...` | `Scribe MVP uses **Documentation Contracts**...` | Direct replacement |
| 20 | `When targetPath points to a directory, Scribe v2:` | `When targetPath points to a directory, Scribe MVP:` | Direct replacement |
| 27 | `Scribe v2 follows a structured playbook:` | `Scribe MVP follows a structured playbook:` | Direct replacement |
| 93 | `## How to Use Scribe v2` | `## How to Use Scribe MVP` | Section header replacement |
| 142 | `commitMessage: 'docs: update 2 files via Scribe v2',` | `commitMessage: 'docs: update 2 files via Scribe MVP',` | Example code replacement |
| 154 | `Scribe v2 includes built-in quality checks:` | `Scribe MVP includes built-in quality checks:` | Direct replacement |
| 201 | `Scribe v2 maintains strict security:` | `Scribe MVP maintains strict security:` | Direct replacement |
| 217 | `Run Scribe v2 tests:` | `Run Scribe MVP tests:` | Direct replacement |
| 285 | `**Solution**: Scribe v2 will create a default...` | `**Solution**: Scribe MVP will create a default...` | Direct replacement |
| 297 | `Scribe v2 transforms documentation updates...` | `Scribe MVP transforms documentation updates...` | Direct replacement |

**Total Replacements in File:** 15 occurrences + 1 filename change = 16 changes

### 2.2 File: docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md

**Evidence:** Line 747 contains reference to "Scribe v2 Contract-First Doc"
**Issue:** Link points to file with premature version name
**Proposed Action:** Update link to new filename

| Line # | Current Text | Proposed Replacement | Rationale |
|--------|-------------|---------------------|-----------|
| 747 | `- [Scribe v2 Contract-First Doc](../../SCRIBE_V2_CONTRACT_FIRST.md)` | `- [Scribe MVP Contract-First Doc](../../SCRIBE_MVP_CONTRACT_FIRST.md)` | Update both link text and path to match renamed file |

**Total Replacements in File:** 1

### 2.3 File: docs/ops/REPO_REALITY_BASELINE.md

**Evidence:** Line 123 contains "Scribe v2 contract-first" reference
**Issue:** Premature version label in repo reality table
**Proposed Action:** Replace with feature-focused description

| Line # | Current Text | Proposed Replacement | Rationale |
|--------|-------------|---------------------|-----------|
| 123 | `docs/SCRIBE_V2_CONTRACT_FIRST.md \| Scribe v2 contract-first \| — \| — \| — \| Yes \| Keep \| Low \|` | `docs/SCRIBE_MVP_CONTRACT_FIRST.md \| Scribe MVP contract-first design \| — \| — \| — \| Yes \| Keep \| Low \|` | Update filename + description to match renamed file |

**Total Replacements in File:** 1 (filename + description)

### 2.4 File: docs/ops/CONTEXT_UPLOAD_PACK.md

**Evidence:** Line 158 contains "Scribe v2 design" reference
**Issue:** Premature version label in context upload pack
**Proposed Action:** Replace with MVP-focused description

| Line # | Current Text | Proposed Replacement | Rationale |
|--------|-------------|---------------------|-----------|
| 158 | `docs/SCRIBE_V2_CONTRACT_FIRST.md \| Scribe v2 design \| Contract-first approach \|` | `docs/SCRIBE_MVP_CONTRACT_FIRST.md \| Scribe MVP design \| Contract-first approach (v1.0 target) \|` | Update filename + clarify target version |

**Total Replacements in File:** 1 (filename + description)

---

## 3. Summary Statistics

| File | Occurrences | Filename Change | Content Changes | Total Changes |
|------|-------------|-----------------|-----------------|---------------|
| `docs/SCRIBE_V2_CONTRACT_FIRST.md` | 15 | Yes (rename to SCRIBE_MVP_*) | 15 | 16 |
| `docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md` | 1 | No | 1 (link update) | 1 |
| `docs/ops/REPO_REALITY_BASELINE.md` | 1 | No | 1 (filename + description) | 1 |
| `docs/ops/CONTEXT_UPLOAD_PACK.md` | 1 | No | 1 (filename + description) | 1 |
| **Total** | **18** | **1** | **18** | **19** |

**Note:** Total occurrences (18) counts distinct text replacements. Filename appears in multiple locations (REPO_REALITY_BASELINE, CONTEXT_UPLOAD_PACK, SCRIBE_PR_FACTORY link).

---

## 4. Execution Plan

### Phase 1: Filename Rename (Git Mv to Preserve History)

```bash
# Rename file with git mv (preserves history)
git mv docs/SCRIBE_V2_CONTRACT_FIRST.md docs/SCRIBE_MVP_CONTRACT_FIRST.md
```

**Verification:**
```bash
# Verify rename tracked
git status | grep "renamed:"
# Expected: renamed: docs/SCRIBE_V2_CONTRACT_FIRST.md -> docs/SCRIBE_MVP_CONTRACT_FIRST.md
```

### Phase 2: Content Replacements (Automated)

**Approach:** Use sed for bulk replacements, then manual verification

**File 1: docs/SCRIBE_MVP_CONTRACT_FIRST.md (post-rename)**
```bash
# Replace all "Scribe v2" with "Scribe MVP"
sed -i '' 's/Scribe v2/Scribe MVP/g' docs/SCRIBE_MVP_CONTRACT_FIRST.md

# Verify replacements
grep -n "Scribe v2" docs/SCRIBE_MVP_CONTRACT_FIRST.md
# Expected: (empty - no matches)

grep -n "Scribe MVP" docs/SCRIBE_MVP_CONTRACT_FIRST.md | wc -l
# Expected: 15 lines
```

**File 2: docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md**
```bash
# Replace link text + path
sed -i '' 's/Scribe v2 Contract-First Doc](..\/..\/SCRIBE_V2_CONTRACT_FIRST.md)/Scribe MVP Contract-First Doc](..\/..\/SCRIBE_MVP_CONTRACT_FIRST.md)/g' docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md

# Verify replacement
grep -n "SCRIBE_MVP_CONTRACT_FIRST.md" docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md
# Expected: Line 747 with new link
```

**File 3: docs/ops/REPO_REALITY_BASELINE.md**
```bash
# Replace filename in table row
sed -i '' 's/SCRIBE_V2_CONTRACT_FIRST.md | Scribe v2 contract-first/SCRIBE_MVP_CONTRACT_FIRST.md | Scribe MVP contract-first design/g' docs/ops/REPO_REALITY_BASELINE.md

# Verify replacement
grep -n "SCRIBE_MVP_CONTRACT_FIRST" docs/ops/REPO_REALITY_BASELINE.md
# Expected: Line 123 with new filename
```

**File 4: docs/ops/CONTEXT_UPLOAD_PACK.md**
```bash
# Replace filename + description in table row
sed -i '' 's/SCRIBE_V2_CONTRACT_FIRST.md | Scribe v2 design/SCRIBE_MVP_CONTRACT_FIRST.md | Scribe MVP design/g' docs/ops/CONTEXT_UPLOAD_PACK.md

# Verify replacement
grep -n "SCRIBE_MVP_CONTRACT_FIRST" docs/ops/CONTEXT_UPLOAD_PACK.md
# Expected: Line 158 with new filename
```

### Phase 3: Verification

**Verify no "Scribe v2" remains (excluding meta-docs):**
```bash
# Search for remaining "Scribe v2" (case-insensitive)
grep -r "Scribe v2\|Scribe V2" docs/ --include="*.md" | grep -v "PRODUCT_RELEASE_NAMING_SYSTEM\|RESTRUCTURE_VERIFICATION_REPORT\|RELEASE_NAMING_PATCH_PLAN"

# Expected: (empty - no matches outside meta-docs)
```

**Verify "Scribe MVP" appears in all expected locations:**
```bash
# Check renamed file
grep -c "Scribe MVP" docs/SCRIBE_MVP_CONTRACT_FIRST.md
# Expected: 15

# Check link updated
grep "SCRIBE_MVP_CONTRACT_FIRST.md" docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md
# Expected: 1 match (line 747)

# Check tables updated
grep "SCRIBE_MVP_CONTRACT_FIRST.md" docs/ops/REPO_REALITY_BASELINE.md
grep "SCRIBE_MVP_CONTRACT_FIRST.md" docs/ops/CONTEXT_UPLOAD_PACK.md
# Expected: 1 match each
```

### Phase 4: Git Commit

```bash
# Stage all changes
git add docs/SCRIBE_MVP_CONTRACT_FIRST.md
git add docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md
git add docs/ops/REPO_REALITY_BASELINE.md
git add docs/ops/CONTEXT_UPLOAD_PACK.md

# Commit with descriptive message
git commit -m "docs: normalize 'Scribe v2' to 'Scribe MVP' per naming taxonomy

- Rename SCRIBE_V2_CONTRACT_FIRST.md → SCRIBE_MVP_CONTRACT_FIRST.md (git mv)
- Replace 15 occurrences of 'Scribe v2' with 'Scribe MVP' in contract doc
- Update 3 references across SCRIBE_PR_FACTORY_V1, REPO_REALITY_BASELINE, CONTEXT_UPLOAD_PACK
- Compliance: PRODUCT_RELEASE_NAMING_SYSTEM.md (no v1.0 evidence exists)

Total changes: 1 file renamed, 18 text replacements across 4 files"
```

---

## 5. Rationale for Each Replacement

### "Scribe v2" → "Scribe MVP"

**Why "MVP" instead of "Alpha" or "Beta"?**
- Contract-first design document describes PRODUCTION-READY capabilities
- "MVP" (Minimum Viable Product) = v1.0 equivalent (first GA release)
- "Alpha"/"Beta" would imply feature-incomplete or testing phase
- Document describes complete feature set (contracts, multi-file, quality checks)

**Why NOT "Scribe v1.0 (planned)"?**
- Document is design/implementation guide, not roadmap reference
- "v1.0 (planned)" suggests future work; this describes current design
- "MVP" is clearer for user-facing docs (less technical than "v1.0")

**Why NOT "Scribe Advanced Features"?**
- Too vague for a design document title
- "MVP" signals production readiness + completeness
- Maintains version-like clarity without false v2.0 claim

### Filename: SCRIBE_V2_* → SCRIBE_MVP_*

**Why rename file instead of just content?**
- Filename itself is a version claim (SCRIBE_V2_*)
- Other files reference this filename (links break if not updated)
- Git mv preserves history (no information loss)
- Consistency: filename should match document title

---

## 6. Alternative Replacements Considered (Rejected)

| Alternative | Reason Rejected |
|-------------|-----------------|
| "Scribe v1.0" | Too technical for user-facing doc; "MVP" clearer |
| "Scribe Enhanced" | Vague; doesn't signal production readiness |
| "Scribe Contract-First" | Loses version context; unclear if current or future |
| "Scribe Next-Gen" | Marketing speak; unprofessional |
| "Scribe Stable" | Implies already released (no evidence) |

---

## 7. Link Integrity Verification

**After Patch Execution, Verify:**

**Links TO Scribe doc:**
```bash
# Find all links to SCRIBE_*_CONTRACT_FIRST.md
grep -r "SCRIBE.*CONTRACT_FIRST.md" docs/ --include="*.md"

# Expected results:
# - docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md: link to SCRIBE_MVP_CONTRACT_FIRST.md
# - docs/ops/REPO_REALITY_BASELINE.md: reference to SCRIBE_MVP_CONTRACT_FIRST.md
# - docs/ops/CONTEXT_UPLOAD_PACK.md: reference to SCRIBE_MVP_CONTRACT_FIRST.md
# - NO links to SCRIBE_V2_CONTRACT_FIRST.md (old filename)
```

**Links WITHIN Scribe doc:**
```bash
# Check internal links in SCRIBE_MVP_CONTRACT_FIRST.md
grep -n "\[.*\](.*)" docs/SCRIBE_MVP_CONTRACT_FIRST.md

# Verify:
# - No broken internal anchors
# - No references to "v2" in link text
```

---

## 8. Rollback Plan (If Needed)

**If patch causes issues, rollback with:**

```bash
# Undo filename rename
git mv docs/SCRIBE_MVP_CONTRACT_FIRST.md docs/SCRIBE_V2_CONTRACT_FIRST.md

# Revert content changes
git checkout HEAD docs/SCRIBE_V2_CONTRACT_FIRST.md
git checkout HEAD docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md
git checkout HEAD docs/ops/REPO_REALITY_BASELINE.md
git checkout HEAD docs/ops/CONTEXT_UPLOAD_PACK.md

# Verify rollback
git status
# Expected: working tree clean (all changes reverted)
```

---

## 9. Post-Patch Validation Checklist

After executing patch, confirm:

- [ ] File renamed: `docs/SCRIBE_MVP_CONTRACT_FIRST.md` exists (old file gone)
- [ ] Git history preserved: `git log --follow docs/SCRIBE_MVP_CONTRACT_FIRST.md` shows full history
- [ ] No "Scribe v2" in patched files: `grep -r "Scribe v2" docs/SCRIBE_MVP_CONTRACT_FIRST.md docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md docs/ops/REPO_REALITY_BASELINE.md docs/ops/CONTEXT_UPLOAD_PACK.md` returns empty
- [ ] "Scribe MVP" appears 15 times in main doc: `grep -c "Scribe MVP" docs/SCRIBE_MVP_CONTRACT_FIRST.md` returns 15
- [ ] Link updated in SCRIBE_PR_FACTORY_V1.md: Line 747 points to SCRIBE_MVP_CONTRACT_FIRST.md
- [ ] Table updated in REPO_REALITY_BASELINE.md: Line 123 references SCRIBE_MVP_CONTRACT_FIRST.md
- [ ] Table updated in CONTEXT_UPLOAD_PACK.md: Line 158 references SCRIBE_MVP_CONTRACT_FIRST.md
- [ ] No broken links: All references to SCRIBE_*_CONTRACT_FIRST.md point to MVP version
- [ ] Git status clean: No unexpected file changes

---

## 10. Impact Assessment

### Low Risk Changes
- ✅ Content replacements are LITERAL ("v2" → "MVP"), no semantic changes
- ✅ Filename rename uses git mv (history preserved)
- ✅ Only 4 files affected (limited blast radius)
- ✅ No code changes (docs-only patch)
- ✅ Links updated in same commit (no broken references)

### Benefits
- ✅ Compliance with PRODUCT_RELEASE_NAMING_SYSTEM.md
- ✅ Removes misleading version claims (no v1.0 exists)
- ✅ Professional taxonomy alignment
- ✅ Clearer communication to stakeholders (MVP = production target)

### Risks (Mitigated)
- ⚠️ External systems linking to SCRIBE_V2_CONTRACT_FIRST.md will 404
  - **Mitigation:** This is a branch (docs/restructure-2026-01), not yet merged to main
  - **Mitigation:** If external links exist, add redirect or keep both files (symlink)
- ⚠️ Developers expecting "v2" terminology will be confused
  - **Mitigation:** PRODUCT_RELEASE_NAMING_SYSTEM.md documents the change
  - **Mitigation:** Commit message explains rationale

---

## 11. Coordination with Other Patches

**This patch is INDEPENDENT of:**
- CONTEXT_ARCHITECTURE.md contradiction fix (Task 4) — different files
- PR_MERGE_CHECKLIST creation (Task 5) — different purpose

**This patch DEPENDS on:**
- PRODUCT_RELEASE_NAMING_SYSTEM.md existence (created in Task 2) — provides rationale

**Recommended Execution Order:**
1. Fix CONTEXT_ARCHITECTURE.md contradiction (BLOCKER)
2. Execute naming patch (THIS TASK) — non-blocking improvement
3. Stage all files
4. Create PR with merge checklist (Task 5)

---

## 12. Execution Status

**Status:** ⏸️ READY FOR EXECUTION (awaiting approval)

**Prerequisites:**
- ✅ PRODUCT_RELEASE_NAMING_SYSTEM.md created (provides taxonomy)
- ✅ Replacement mapping defined (Section 2)
- ✅ Execution commands prepared (Section 4)
- ✅ Verification steps defined (Section 4, Phase 3)
- ✅ Rollback plan documented (Section 8)

**To Execute:** Run commands in Section 4 (Phases 1-4)

**To Verify:** Complete checklist in Section 9

---

*Patch plan ready. Execute after resolving CONTEXT_ARCHITECTURE.md blocker. Estimated time: 10-15 minutes (rename + replacements + verification).*
