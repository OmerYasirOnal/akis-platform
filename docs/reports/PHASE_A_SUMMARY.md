# PHASE A SUMMARY — Target Structure & Move Plan
**AKIS Platform - Structural Refactor**

---

## 🎯 PHASE A COMPLETE — AWAITING STRUCTURE GATE APPROVAL

**Date**: 2025-10-27  
**Phase**: A - Target Structure & Move Plan  
**Status**: ✅ All deliverables produced, awaiting HITL approval  
**Next Gate**: 🛑 **STRUCTURE GATE** — Do not proceed with moves until approved

---

## 📦 DELIVERABLES PRODUCED

All artifacts saved in `devagents/docs/`:

| Artifact | Purpose | Status |
|----------|---------|--------|
| **MOVE_MAP.csv** | Complete file-by-file move plan (38 files) | ✅ Complete |
| **PROPOSED_STRUCTURE.md** | Target tree, boundaries, examples, validation | ✅ Complete |
| **legacy_auth_refs.txt** | Deprecated token flows & migration plan | ✅ Complete |
| **candidates_for_removal.md** | Files to remove post-refactor (~960 LOC) | ✅ Updated |
| **PHASE_A_SUMMARY.md** | This summary document | ✅ Complete |

---

## 📊 REFACTOR SCOPE

### Files to Move: 38
- **lib/github/** → **modules/github/** (merge): 5 files
- **lib/auth/** → **modules/github/auth/** + **shared/lib/auth/**: 5 files
- **lib/agents/** → **modules/documentation/agent/**: 12 files
- **lib/ai/** → **shared/lib/ai/**: 3 files
- **lib/utils/** → **shared/lib/utils/**: 2 files
- **lib/services/** → **shared/services/**: 1 file
- **lib/contracts/** → **shared/types/contracts/**: 1 file
- **components/** → **shared/components/** + **modules/documentation/components/**: 10 files

### Files to Remove: 3
- `lib/github/token-provider.ts` (after test migration)
- `lib/auth/github-token.ts` (deprecated, no imports)
- `lib/agents/utils/github-utils-legacy.ts` (unused, 661 LOC)

### New Directories: 15
```
modules/documentation/
modules/github/auth/
shared/components/{ai,github,integrations}/
shared/lib/{ai,auth,utils}/
shared/services/
shared/types/contracts/
```

### Total Impact
- **LOC Changes**: ~200 import rewrites
- **Files Moved**: 38
- **Files Removed**: 3 (~960 LOC)
- **Directory Structure**: 7 new top-level + 8 subdirectories

---

## 🏗️ TARGET STRUCTURE (HIGH-LEVEL)

```
src/
├── app/                      # Next.js routes (no change)
├── contexts/                 # React contexts (no change)
│
├── modules/                  # Feature modules
│   ├── agents/scribe/
│   ├── documentation/        # NEW - documentation agent
│   │   ├── agent/
│   │   ├── components/
│   │   └── playbooks/
│   ├── github/               # Consolidated GitHub SSOT
│   │   ├── auth/            # NEW - GitHub App primitives
│   │   ├── token-provider.ts
│   │   ├── client.ts
│   │   ├── operations.ts
│   │   └── upsert.ts
│   └── mcp/
│
└── shared/                   # Shared utilities
    ├── components/           # NEW - organized by category
    │   ├── ai/
    │   ├── github/
    │   └── integrations/
    ├── config/
    ├── lib/                  # NEW - pure utilities
    │   ├── ai/
    │   ├── auth/
    │   └── utils/
    ├── services/             # NEW - IO-bound adapters
    └── types/                # NEW - shared types
        └── contracts/
```

---

## 🔑 KEY DECISIONS (FROM HITL DIRECTIVE)

### 1. Client Components
**Decision**: SSR by default; add `"use client"` only where required
- Interactive components (forms, state): Mark as client
- Pure display components: Keep as server
- Rationale: One-line per file in PR

**Files Requiring `"use client"`** (12 total):
- All React Context providers (`AuthContext.tsx`)
- Interactive forms (`DocumentationAgentUI`, `BranchCreator`, etc.)
- Components using hooks (`useState`, `useEffect`, `useAuth`)

### 2. GitHub Token SSOT
**Decision**: `modules/github/token-provider.ts` is the ONLY source
- All GitHub API calls must use this provider
- `lib/auth/github-app.ts` → moved to `modules/github/auth/github-app.ts`
- Deprecated providers: `lib/github/token-provider.ts`, `lib/auth/github-token.ts`

**Proof Required (PHASE 3)**:
- `grep` output showing all token calls via SSOT
- `docs/legacy_auth_refs.txt` documenting old flows

### 3. Component Boundaries
**Shared Components**: Pure UI, reusable across features
- Location: `shared/components/{ai,github,integrations}/`
- Examples: `BranchCreator`, `ModelSelector`, `GitHubConnect`

**Feature Components**: Documentation agent-specific UI
- Location: `modules/documentation/components/`
- Examples: `DocumentAgent`, `DocumentationAgentUI`, `AgentPlaybookViewer`

### 4. Utilities vs Services
**Pure Utils** (no IO): `shared/lib/`
- Examples: `logger`, `diagnostic`, AI models

**IO-Bound Services**: `shared/services/` or `modules/*/services/`
- Examples: `mcp.ts` (GitHub API adapter)

### 5. Legacy Utils
**Decision**: `github-utils-legacy.ts` → candidate for removal
- 661 lines, 0 imports found
- If any helpers needed: Extract to `shared/lib/utils/github-helpers.ts`
- Otherwise: List in `candidates_for_removal.md`

---

## 🚨 CRITICAL RISKS & MITIGATION

### Risk 1: Circular Dependencies 🔴 HIGH
**Scenario**: `modules/documentation` → `modules/github` → `shared/lib/auth/actor` → `modules/github` (cycle)

**Mitigation**:
- Keep types in `shared/types/` (no runtime deps)
- Ensure `shared/*` never imports `modules/*`
- Use barrel files to control exports

### Risk 2: Alias Resolution 🟠 MEDIUM
**Scenario**: `@/*` imports fail after `baseUrl` addition

**Mitigation**:
- Add `baseUrl: "."` in PHASE 1 BEFORE moves
- Test: `npm run typecheck` immediately after tsconfig change
- Proof: `docs/proofs/tsconfig.diff`

### Risk 3: Server/Client Boundary 🟠 MEDIUM
**Scenario**: Server-only code (token-provider) imported in client component

**Mitigation**:
- Add `"use client"` to all interactive components in PHASE 2
- Use runtime checks (`typeof window === 'undefined'`)
- Validate: Dev server boot test

### Risk 4: Test Failures 🟡 LOW
**Scenario**: Tests break due to import path changes

**Mitigation**:
- Update test imports in sync with source moves
- Update Jest `moduleNameMapper` if using path aliases
- Run `npm test` after each move batch

### Risk 5: Runtime Module-Not-Found 🟡 LOW
**Scenario**: Missed import causes production crash

**Mitigation**:
- `grep -R "@/lib/" src` after moves (expect 0)
- Boot dev server, navigate all routes
- Capture validation in `docs/validation/`

---

## 📋 MODULE BOUNDARIES (IMPORT RULES)

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| `app/` | `modules/*`, `shared/*`, `contexts/*` | Direct `lib/*` (deprecated) |
| `contexts/` | `shared/types`, `shared/lib/auth` | `modules/*`, `app/*` |
| `modules/documentation/` | `modules/github`, `shared/*` | `modules/agents`, `app/*` |
| `modules/github/` | `shared/lib`, `shared/types` | `modules/documentation`, `app/*` |
| `shared/components/` | `shared/lib`, `shared/types`, `contexts/*` | `modules/*`, `app/*` |
| `shared/lib/` | Other `shared/lib`, `shared/types` | `modules/*`, `app/*`, `contexts/*` |
| `shared/types/` | Nothing (pure types) | Everything |

**Key Principle**: Shared cannot depend on modules; modules can depend on shared.

---

## 🧪 VALIDATION PLAN (PHASE 4)

After moves complete, must validate:

```bash
# 1. TypeScript
npm run typecheck
# Expected: Exit 0

# 2. Linting
npm run lint
# Expected: Exit 0

# 3. Build
npm run build
# Expected: Exit 0, no errors

# 4. No lib/ imports
grep -R "from ['\"]\@/lib/" src | wc -l
# Expected: 0

# 5. Dev server
npm run dev
# Expected: Boots without module-not-found

# 6. Tests
npm test
# Expected: Pass (or known failures unrelated)
```

**Validation Artifacts**:
- `docs/validation/typecheck.txt`
- `docs/validation/build.txt`
- `docs/validation/dev_boot.txt`

---

## 📦 MOVE EXECUTION STRATEGY (PHASE 2)

### Order (Dependency-Safe)
1. **Types first**: `lib/auth/types.ts`, `lib/contracts/` → `shared/types/`
2. **Utilities**: `lib/utils/`, `lib/ai/` → `shared/lib/`
3. **Services**: `lib/services/mcp.ts` → `shared/services/`
4. **Agents**: `lib/agents/` → `modules/documentation/`
5. **GitHub**: `lib/github/`, `lib/auth/github-*` → `modules/github/` (merge)
6. **Components**: `components/` → `shared/components/` or `modules/documentation/components/`

### Codemod Approach
**Option A (Regex)**: Fast, good for simple renames
```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|@/lib/utils/logger|@/shared/lib/utils/logger|g' {} +
```

**Option B (AST)**: Safe, handles edge cases
```bash
npx jscodeshift -t transforms/update-imports.js src/
```

**Proof**:
- `docs/proofs/imports_before.txt`: `grep -R "@/lib/" src | wc -l`
- `docs/proofs/imports_after.txt`: Should be 0

---

## 🔄 ROLLBACK PLAN

### Scenario 1: Single File Issue
```bash
git checkout HEAD~1 -- src/modules/documentation/agent/some-file.ts
npm run build
```

### Scenario 2: Phase Rollback
```bash
git revert <phase-2-commit-sha>
npm run build
```

### Scenario 3: Full Rollback
```bash
# Restore from backup branch
git checkout backup-before-refactor
git branch -D refactor/structure

# Or restore lib/
git checkout HEAD~N -- src/lib/
```

**Safety Net**: No files deleted until validation passes. All moves are additive.

---

## ✅ DEFINITION OF DONE (PHASE A)

- [x] `MOVE_MAP.csv` produced (38 files mapped)
- [x] `PROPOSED_STRUCTURE.md` with target tree, boundaries, examples
- [x] `legacy_auth_refs.txt` documenting token flows
- [x] `candidates_for_removal.md` updated (3 files marked)
- [x] Risk assessment documented
- [x] Module boundary rules defined
- [x] Validation checklist prepared
- [x] Rollback plan documented

**Status**: ✅ **PHASE A COMPLETE**

---

## 🛑 STRUCTURE GATE — AWAITING APPROVAL

**Required Actions**:
1. ✅ Review `MOVE_MAP.csv` (confirm all moves make sense)
2. ✅ Review `PROPOSED_STRUCTURE.md` (approve target structure)
3. ✅ Review `legacy_auth_refs.txt` (confirm token migration plan)
4. ✅ Review `candidates_for_removal.md` (approve removal list)
5. ❓ **APPROVE or REQUEST CHANGES**

**Approval Questions**:
- Is the target structure acceptable?
- Are module boundaries clear and enforceable?
- Is the GitHub SSOT consolidation plan sound?
- Are risks adequately mitigated?
- Is the move order safe (dependency-first)?

**Upon Approval**:
→ Proceed to **PHASE 1** (Path Alias Enablement)  
→ Then **PHASE 2** (Execute Moves & Import Rewrites)

**If Changes Requested**:
→ Update relevant artifacts  
→ Re-submit for approval

---

## 📚 ARTIFACT LOCATIONS

All deliverables in `devagents/docs/`:

| File | Path | Purpose |
|------|------|---------|
| Move Map | `docs/MOVE_MAP.csv` | File-by-file move plan |
| Structure | `docs/PROPOSED_STRUCTURE.md` | Target tree + boundaries |
| Legacy Auth | `docs/legacy_auth_refs.txt` | Token flow migration |
| Candidates | `docs/candidates_for_removal.md` | Deprecated files list |
| Audit Report | `docs/audit/REPO_AUDIT_REPORT.md` | PHASE -1 findings |
| Summary | `docs/PHASE_A_SUMMARY.md` | This document |

---

## 📞 NEXT STEPS

**For Human Reviewer**:
1. Read `PROPOSED_STRUCTURE.md` (target tree in Section 1)
2. Review `MOVE_MAP.csv` (sample 5-10 moves for sanity check)
3. Check risks in `PROPOSED_STRUCTURE.md` Section 9
4. **APPROVE** or **REQUEST CHANGES**

**For Agent (upon approval)**:
1. Execute **PHASE 1**: Add `baseUrl: "."` to `tsconfig.json`, verify
2. Execute **PHASE 2**: Perform atomic moves per `MOVE_MAP.csv`, rewrite imports
3. Execute **PHASE 3**: Consolidate GitHub SSOT
4. Execute **PHASE 4**: Run validation checklist
5. Generate PR with proofs

---

**Phase A Duration**: ~45 minutes  
**Artifacts Produced**: 5 documents, 1 CSV  
**Files Analyzed**: ~80 source files  
**Move Plan Coverage**: 100% (all lib/ content mapped)

**Status**: 🎯 **READY FOR STRUCTURE GATE REVIEW**

---

**Report Generated**: 2025-10-27  
**Agent**: AKIS Scribe Agent (Principal Engineer Mode)  
**Task**: STRUCTURAL_REFACTOR_TASK.md (PHASE A)

