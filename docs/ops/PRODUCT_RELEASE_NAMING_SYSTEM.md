# Product Release Naming System

> **Purpose:** Canonical release taxonomy for AKIS Platform agents and platform versions
> **Created:** 2026-01-28
> **Status:** MANDATED — Must be followed for all roadmap/baseline/docs references
> **Scope:** Agents (Scribe, Trace, Proto) + Platform (AKIS)

---

## 1. Motivation

**Problem:** Current docs use premature version labels ("Scribe v2") without evidence that prior versions exist or were formally released. This creates:
- **Confusion:** "v2" implies v1.0 was released (no evidence exists)
- **Unprofessionalism:** Violates standard semantic versioning practices
- **Misalignment:** Stakeholders expect v2.0 to be a major release following v1.0 GA

**Solution:** Establish clear taxonomy mapping development stages to version labels, with strict evidence requirements.

---

## 2. Release Taxonomy (Canonical)

### 2.1 Development Stages

| Stage | Definition | Version Label | Public Availability | Example Usage |
|-------|-----------|---------------|---------------------|---------------|
| **Prototype** | Proof-of-concept, unstable, frequent breaking changes | `v0.0.x` | Internal only | "Scribe Prototype (v0.0.3)" |
| **Alpha** | Feature-incomplete, known bugs, internal testing | `v0.1.x - v0.4.x` | Invited testers only | "Scribe Alpha (v0.3.2)" |
| **Beta** | Feature-complete for core workflows, public testing | `v0.5.x - v0.9.x` | Public beta testers | "Scribe Beta (v0.8.1)" |
| **Release Candidate (RC)** | Final testing before v1.0, no new features | `v1.0.0-rc.1` | Public (staged rollout) | "Scribe v1.0.0-rc.2" |
| **MVP (Minimum Viable Product)** | First production-ready release, v1.0 equivalent | `v1.0.0` | General Availability (GA) | "Scribe MVP (v1.0.0)" |
| **Stable** | Post-v1.0 incremental improvements | `v1.1.x, v1.2.x` | GA | "Scribe v1.2.0" |
| **Major Release** | Breaking changes, significant new capabilities | `v2.0.0, v3.0.0` | GA | "Scribe v2.0.0" |

### 2.2 Semantic Versioning Rules

**Format:** `vMAJOR.MINOR.PATCH[-PRERELEASE]`

**MAJOR (v1.0.0 → v2.0.0):**
- Breaking changes to public API or workflows
- Incompatible with previous major version
- **Requires:** v1.0.0 GA + formal deprecation notices for v1.x

**MINOR (v1.0.0 → v1.1.0):**
- New features, backward-compatible
- May deprecate old features (but not remove)
- **Requires:** v1.0.0 GA

**PATCH (v1.0.0 → v1.0.1):**
- Bug fixes, backward-compatible
- No new features
- **Requires:** v1.0.0 GA

**PRERELEASE (v1.0.0-rc.1):**
- Alpha: `v0.3.0-alpha.1`
- Beta: `v0.8.0-beta.2`
- Release Candidate: `v1.0.0-rc.3`

---

## 3. Version Gating Rules (Strict)

### 3.1 v1.0 Requirements

**An agent or platform component can ONLY be labeled "v1.0" (MVP) when ALL of the following exist:**

1. **Acceptance Criteria Defined:**
   - Written acceptance checklist (functional, security, UX, performance)
   - Example: `docs/agents/scribe/SCRIBE_MVP_ACCEPTANCE.md`

2. **QA Evidence Complete:**
   - ALL acceptance criteria verified with QA evidence files
   - Example: `docs/qa/QA_EVIDENCE_SCRIBE_MVP.md` (PASS status)

3. **Production Deployment:**
   - Deployed to production environment (not staging/dev)
   - Accessible to real users (not just internal team)

4. **Documentation Complete:**
   - User-facing docs (how to use)
   - API/integration docs (how to integrate)
   - Known issues / limitations documented

5. **Formal Release Announcement:**
   - Release notes published (what's new, breaking changes, upgrade path)
   - Versioned tag in git (e.g., `git tag scribe-v1.0.0`)

**If ANY of the above are missing:** The component is NOT v1.0 (use Alpha/Beta/Prototype instead)

### 3.2 v2.0 Requirements

**FORBIDDEN until v1.0 exists.** A component can ONLY be labeled "v2.0" when:

1. **v1.0 exists** (all v1.0 requirements met)
2. **Breaking changes documented:**
   - What's changing (features removed, API changes, workflow changes)
   - Why it's breaking (rationale for incompatibility)
   - Migration guide (how to upgrade from v1.x)

3. **v1.x deprecation timeline:**
   - v1.x support end date announced
   - Grace period defined (e.g., 6 months)

4. **QA evidence for v2.0:**
   - ALL new acceptance criteria verified
   - Migration tested (v1.x → v2.0 upgrade paths)

5. **Formal v2.0 release:**
   - Release notes published
   - Git tag created (e.g., `git tag scribe-v2.0.0`)

**If v1.0 does NOT exist:** Using "v2.0" is **FORBIDDEN** (unprofessional, misleading)

---

## 4. Agent-Specific Taxonomy

### 4.1 Scribe Agent

**Current Status (Evidence-Based):**
```
Evidence Check:
- Acceptance criteria: docs/agents/scribe/... (no SCRIBE_MVP_ACCEPTANCE.md found)
- QA evidence: docs/qa/QA_EVIDENCE_S0.4.6.md (partial, covers S0.4.6 only)
- Production deployment: No evidence of production release
- Formal release: No git tag "scribe-v1.0.0" found
- Release notes: No "Scribe v1.0 Release Notes" found

Verdict: Scribe has NOT reached v1.0 (NO EVIDENCE)
Current stage: Alpha (v0.4.x range based on S0.4.6 completion)
```

**Allowed Labels:**
- ✅ "Scribe Prototype" (for v0.0.x work)
- ✅ "Scribe Alpha" (for v0.1.x - v0.4.x work)
- ✅ "Scribe Beta" (IF v0.5+ criteria met)
- ✅ "Scribe MVP" or "Scribe v1.0 (planned)" (future roadmap references)
- ❌ "Scribe v1.0" (FORBIDDEN until evidence exists)
- ❌ "Scribe v2" or "Scribe v2.0" (FORBIDDEN — v1.0 doesn't exist)

**Current Recommended Label:** "Scribe Alpha (v0.4.6 stabilization)"

**Roadmap References:**
- Use: "Scribe MVP (v1.0 target)" — clearly marks it as future goal
- Use: "Scribe stabilization" — neutral, avoids false version claims
- Avoid: "Scribe v2" — implies v1.0 exists (false)

### 4.2 Trace Agent

**Current Status (Evidence-Based):**
```
Evidence Check:
- Acceptance criteria: No TRACE_MVP_ACCEPTANCE.md found
- QA evidence: No QA_EVIDENCE_TRACE_*.md found
- Production deployment: No evidence
- Formal release: No git tag

Verdict: Trace has NOT reached v1.0 (NO EVIDENCE)
Current stage: Prototype or early Alpha (based on roadmap position)
```

**Allowed Labels:**
- ✅ "Trace Prototype"
- ✅ "Trace Alpha (early)" (if any implementation exists)
- ✅ "Trace MVP (v1.0 target)" (roadmap references)
- ❌ "Trace v1.0" (FORBIDDEN until evidence)
- ❌ "Trace v2" (FORBIDDEN — v1.0 doesn't exist)

**Current Recommended Label:** "Trace Prototype"

### 4.3 Proto Agent

**Current Status (Evidence-Based):**
```
Evidence Check:
- Acceptance criteria: No PROTO_MVP_ACCEPTANCE.md found
- QA evidence: No QA_EVIDENCE_PROTO_*.md found
- Production deployment: No evidence
- Formal release: No git tag

Verdict: Proto has NOT reached v1.0 (NO EVIDENCE)
Current stage: Prototype (based on roadmap position)
```

**Allowed Labels:**
- ✅ "Proto Prototype"
- ✅ "Proto MVP (v1.0 target)" (roadmap references)
- ❌ "Proto v1.0" (FORBIDDEN until evidence)
- ❌ "Proto v2" (FORBIDDEN — v1.0 doesn't exist)

**Current Recommended Label:** "Proto Prototype"

### 4.4 AKIS Platform

**Current Status (Evidence-Based):**
```
Evidence Check:
- Platform acceptance: No PLATFORM_MVP_ACCEPTANCE.md found
- QA evidence: Partial (S0.4.6 auth flows, S2.0.1 UI in progress)
- Production deployment: No evidence of public GA
- Formal release: No platform version git tag

Verdict: AKIS Platform has NOT reached v1.0 (NO EVIDENCE)
Current stage: Alpha (based on Phase 2 S2.0.1 work)
```

**Allowed Labels:**
- ✅ "AKIS Platform Alpha" (current state)
- ✅ "AKIS Platform MVP (v1.0 target)" (roadmap references)
- ❌ "AKIS Platform v1.0" (FORBIDDEN until evidence)
- ❌ "AKIS Platform v2" (FORBIDDEN — v1.0 doesn't exist)

**Current Recommended Label:** "AKIS Platform Alpha (Phase 2)"

---

## 5. Roadmap/Baseline Naming Rules

### 5.1 Phase Names (Allowed)

**Format:** `Phase X: [Original Turkish Name] ([Human-Readable English Name])`

**Examples:**
- ✅ "Phase 0.4: Web Shell + Basit Motor (Web Shell and Basic Engine)"
- ✅ "Phase 1: Scribe • Trace • Proto (Agent Early Access)"
- ✅ "Phase 2: OCI Hosting + Pilotlar (Production Hosting)"

**Rules:**
- Original name preserved (Turkish OK)
- Human-readable English translation in parentheses
- No version numbers in phase names (phases are milestones, not versions)

### 5.2 Sprint Names (Allowed)

**Format:** `SX.Y.Z: [Sprint Goal Description]`

**Examples:**
- ✅ "S0.4.6: Scribe Config Dashboard"
- ✅ "S2.0.1: Cursor-Inspired UI"
- ✅ "S3.1.2: Trace Stabilization"

**Rules:**
- Sprint IDs remain (S0.4.6, S2.0.1, etc.)
- Goal description is feature-focused, NOT version-focused
- Avoid: "Scribe v2 Implementation" → Use: "Scribe Advanced Features"

### 5.3 Feature References (Allowed)

**When referencing agent features in roadmap/baseline:**

**Allowed:**
- ✅ "Scribe stabilization"
- ✅ "Scribe MVP preparation"
- ✅ "Scribe advanced workflows (v1.0 target)"
- ✅ "Trace early implementation"
- ✅ "Proto prototype"

**Forbidden:**
- ❌ "Scribe v2 implementation" (v1.0 doesn't exist)
- ❌ "Scribe 2.0 features" (v1.0 doesn't exist)
- ❌ "Scribe next-gen" (vague, use specific feature names)
- ❌ "Scribe v1.5" (implies v1.0 exists)

### 5.4 Roadmap Milestone Labels (Allowed)

**For future milestones that target v1.0:**

**Allowed:**
- ✅ "Scribe MVP Milestone" (clear target)
- ✅ "Scribe v1.0 Readiness Gate" (explicit version + "readiness" = not yet released)
- ✅ "Scribe Production Launch Prep" (deployment-focused)

**Forbidden:**
- ❌ "Scribe v2 Milestone" (v1.0 doesn't exist)
- ❌ "Scribe v1.0 Complete" (unless evidence exists)

---

## 6. Migration from Current Naming

### 6.1 Files Requiring Normalization

**Identified Files (from grep search):**
1. `docs/ops/CONTEXT_UPLOAD_PACK.md` — "Scribe v2 design" reference
2. `docs/ops/REPO_REALITY_BASELINE.md` — "Scribe v2" references
3. `docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md` — "Scribe v2" mention
4. `docs/SCRIBE_V2_CONTRACT_FIRST.md` — Entire file titled "Scribe v2"

**Action Required:** Create `RELEASE_NAMING_PATCH_PLAN.md` with mappings (see Task 3)

### 6.2 Replacement Mapping (General Guidance)

| Current (Incorrect) | Replacement (Correct) | Rationale |
|---------------------|----------------------|-----------|
| "Scribe v2" | "Scribe Advanced Features" | No v1.0 exists, feature-focused label |
| "Scribe v2 design" | "Scribe MVP design" | Clarifies target is first production release |
| "Scribe 2.0 implementation" | "Scribe stabilization" | Neutral, avoids false version claim |
| "Scribe v2 contract" | "Scribe v1.0 (planned) contract" | Marks as future goal, not current reality |
| "Next-gen Scribe" | "Scribe enhanced workflows" | Specific feature focus |

---

## 7. Enforcement & Compliance

### 7.1 Documentation Review Checklist

**Before merging any doc that references agent versions:**

- [ ] Does it claim "v1.0" or "MVP"? → Verify acceptance criteria + QA evidence exist
- [ ] Does it claim "v2.0"? → Verify v1.0 exists + breaking changes documented
- [ ] Does it use "v0.x"? → Verify stage matches (Prototype/Alpha/Beta)
- [ ] Does it use vague labels ("next-gen", "advanced")? → Replace with specific feature names
- [ ] Does roadmap/baseline use version labels? → Replace with milestone labels or feature names

### 7.2 QA Gate for Version Claims

**Any doc claiming an agent has reached a version milestone MUST provide:**

1. **Link to acceptance criteria doc** (e.g., `docs/agents/scribe/SCRIBE_MVP_ACCEPTANCE.md`)
2. **Link to QA evidence** (e.g., `docs/qa/QA_EVIDENCE_SCRIBE_MVP.md` with PASS status)
3. **Git tag reference** (e.g., `git tag scribe-v1.0.0`)
4. **Release notes link** (e.g., `docs/releases/SCRIBE_V1.0_RELEASE_NOTES.md`)

**If ANY of the above are missing:** Version claim is REJECTED (use Alpha/Beta/Prototype instead)

### 7.3 Roadmap/Baseline Updates

**When updating PROJECT_TRACKING_BASELINE.md or ROADMAP.md:**

1. **Search for version labels:** `grep -E "v[0-9]\.[0-9]|v[0-9]" docs/PROJECT_TRACKING_BASELINE.md`
2. **Verify each version label:** Check against this taxonomy
3. **Replace non-compliant labels:** Use feature names or milestone labels
4. **Document changes:** Add note in DOC_HYGIENE_CHANGELOG.md

---

## 8. Examples: Compliant vs Non-Compliant

### 8.1 Roadmap Sprint Description (Compliant)

**Non-Compliant:**
```
| S3.2.1 | Scribe v2 Implementation | 2026-03-01 | 2026-03-15 | Implement Scribe v2 features | Not Started |
```

**Compliant:**
```
| S3.2.1 | Scribe Advanced Workflows | 2026-03-01 | 2026-03-15 | Multi-repo support, async job queue, webhook triggers (Scribe MVP prep) | Not Started |
```

**Why Compliant:**
- Feature-focused description (multi-repo, async, webhooks)
- Clarifies target: "Scribe MVP prep" (implies v1.0 readiness, not v2.0)
- No false version claims

### 8.2 Feature Document Title (Compliant)

**Non-Compliant:**
```
# Scribe v2 Contract-First Design
```

**Compliant:**
```
# Scribe MVP Contract-First Design (v1.0 Target)
```

**Why Compliant:**
- "MVP" clarifies first production release
- "(v1.0 Target)" explicitly marks as future goal
- No claim that v2.0 exists

### 8.3 Release Notes Reference (Compliant)

**Non-Compliant:**
```
See SCRIBE_V2_RELEASE_NOTES.md for breaking changes.
```

**Compliant:**
```
See SCRIBE_MVP_RELEASE_PLAN.md for v1.0 readiness criteria.
```

**Why Compliant:**
- "RELEASE_PLAN" (not "RELEASE_NOTES") clarifies it's planning, not released
- "v1.0 readiness criteria" specifies target version
- No claim v2.0 exists

---

## 9. Glossary

**MVP (Minimum Viable Product):**
- First production-ready release (v1.0 equivalent)
- All acceptance criteria met
- QA verified
- Public GA deployment

**Alpha:**
- Feature-incomplete
- Known bugs
- Internal/invited testing only
- v0.1.x - v0.4.x range

**Beta:**
- Feature-complete for core workflows
- Public testing
- v0.5.x - v0.9.x range

**RC (Release Candidate):**
- Final testing before v1.0
- No new features, bug fixes only
- v1.0.0-rc.1, v1.0.0-rc.2, etc.

**v1.0 (First Major Release):**
- Production-ready
- Public GA
- All acceptance criteria met
- Formal release with notes + git tag

**v2.0 (Second Major Release):**
- Breaking changes from v1.x
- REQUIRES v1.0 to exist first
- Migration guide required
- Deprecation timeline for v1.x

---

## 10. Compliance Summary

**This taxonomy is MANDATED for:**
- ✅ All roadmap references (PROJECT_TRACKING_BASELINE.md, ROADMAP.md)
- ✅ All agent documentation (docs/agents/*)
- ✅ All QA evidence files (docs/qa/QA_EVIDENCE_*.md)
- ✅ All release planning docs (docs/plans/*)
- ✅ All context docs (.cursor/context/*)

**Non-Compliance Consequences:**
- ❌ Doc PRs rejected if version claims lack evidence
- ❌ Roadmap updates rejected if using "v2" without v1.0 evidence
- ❌ Feature docs rejected if using misleading version labels

**Compliance Enforcement:**
- Gate reviews check for non-compliant labels
- DOC_HYGIENE_CHANGELOG logs normalization operations
- RELEASE_NAMING_PATCH_PLAN tracks all replacements

---

*This naming system is effective immediately (2026-01-28). All docs must comply before merge to main.*
