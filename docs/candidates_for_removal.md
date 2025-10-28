# Candidates for Removal (Post-Structural Refactor)

**Date:** 2025-10-27  
**Context:** PHASE A - Feature-Sliced Architecture Migration  
**Status:** Analysis Complete — Awaiting PHASE 2 Moves & Validation

---

## 📋 EXECUTIVE SUMMARY

After structural refactor (PHASE 2), the following files will become redundant and are candidates for safe removal:

| File/Directory | Size | References | Status | Reason |
|----------------|------|------------|--------|--------|
| `src/lib/github/token-provider.ts` | ~200 LOC | 2 tests | **REMOVE AFTER TEST MIGRATION** | Replaced by `modules/github/token-provider.ts` |
| `src/lib/auth/github-token.ts` | ~100 LOC | 0 | **SAFE TO REMOVE** | Deprecated wrapper, no imports |
| `src/lib/agents/utils/github-utils-legacy.ts` | 661 LOC | 0 | **SAFE TO REMOVE** | No imports, direct fetch calls |
| `src/lib/` (entire directory) | N/A | 0 post-refactor | **REMOVE AFTER MOVES** | All content migrated to `modules/` or `shared/` |

**Total to Remove**: ~960 lines of code, 1 entire directory

---

## 🔍 DETAILED ANALYSIS

### 1. `src/lib/github/token-provider.ts`

**File Size:** ~200 lines  
**Status:** Deprecated, but still used in tests  
**References Found:** 2 test files

**Grep Proof**:
```bash
$ grep -rn "from.*lib/github/token-provider" src/
src/lib/github/__tests__/token-provider.test.ts:8:import { getGitHubToken, isValidGitHubToken } from '../token-provider';
src/__tests__/e2e/github-app-auth.test.ts:29:    const { getGitHubToken } = await import('@/lib/github/token-provider');
src/__tests__/e2e/github-app-auth.test.ts:110:    const { getGitHubToken } = await import('@/lib/github/token-provider');
src/__tests__/e2e/github-app-auth.test.ts:184:      const { getGitHubToken } = await import('@/lib/github/token-provider');
```

**Replacement**: `src/modules/github/token-provider.ts` (already exists, more feature-complete)

**Migration Plan**:
1. Update `src/__tests__/e2e/github-app-auth.test.ts`:
   - Change imports from `@/lib/github/token-provider` → `@/modules/github/token-provider`
2. Migrate `src/lib/github/__tests__/token-provider.test.ts`:
   - Move to `src/modules/github/__tests__/token-provider-legacy.test.ts`
   - Update imports to test `modules/github/token-provider`
3. After test pass, remove `src/lib/github/token-provider.ts`

**Validation**:
```bash
# After migration, verify no imports remain:
$ grep -rn "from.*lib/github/token-provider" src/ | wc -l
# Expected: 0
```

**Rollback**: Restore from git: `git checkout HEAD~1 -- src/lib/github/token-provider.ts`

---

### 2. `src/lib/auth/github-token.ts`

**File Size:** ~100 lines  
**Status:** Deprecated (explicitly marked in code)  
**References Found:** 0

**Grep Proof**:
```bash
$ grep -rn "from.*lib/auth/github-token" src/
# Result: No matches found
```

**Deprecation Markers in Code**:
- Line 2: `* DEPRECATED: Use @/lib/github/token-provider instead`
- Line 5: `* @deprecated Import from @/lib/github/token-provider`
- Line 38: `* @deprecated Use getGitHubToken from @/lib/github/token-provider`
- Line 68: `logger.warn('GitHubToken', 'DEPRECATED: Use @/lib/github/token-provider instead');`

**Recommendation**: ✅ **SAFE TO REMOVE IMMEDIATELY**

**Validation**:
```bash
# Confirm no imports:
$ grep -R "github-token" src/ --include="*.ts" --include="*.tsx"
# Expected: Only this file's own name, no import statements
```

**Rollback**: `git checkout HEAD~1 -- src/lib/auth/github-token.ts`

---

### 3. `src/lib/agents/utils/github-utils-legacy.ts`

**File Size:** 661 lines (~17KB)  
**Status:** Legacy implementation with direct fetch calls  
**References Found:** 0

**Grep Proof**:
```bash
$ grep -R "github-utils-legacy" src/ --include="*.ts" --include="*.tsx"
# Result: No matches found
```

**Content Analysis**:
- Contains 11 direct `fetch('https://api.github.com/...')` calls
- Functions: `parseGitHubUrl`, `fetchFileContent`, `getRepoTree`, `createBranch`, `createPR`, etc.
- All functionality replaced by:
  - `src/modules/github/operations.ts`
  - `src/modules/github/client.ts`
  - Modern implementations use token-provider for auth

**Recommendation**: ✅ **SAFE TO REMOVE**

**Note**: If any helper functions are discovered to be useful (e.g., `parseGitHubUrl`), extract to `src/shared/lib/utils/github-helpers.ts` before removal.

**Validation**:
```bash
# Check for any imports:
$ grep -R "utils-legacy\|github-utils-legacy" src/
# Expected: No results
```

**Rollback**: `git checkout HEAD~1 -- src/lib/agents/utils/github-utils-legacy.ts`

---

### 4. `src/lib/github/` (Entire Directory)

**Status:** Duplication of `src/modules/github/`  
**Files**:
- `client.ts` → Duplicated in `modules/github/client.ts`
- `operations.ts` → Duplicated in `modules/github/operations.ts`
- `token-provider.ts` → (See #1 above)
- `__tests__/` → Tests to be migrated

**Grep Proof (After PHASE 2 Import Rewrite)**:
```bash
$ grep -R "from.*@/lib/github" src/ --include="*.ts" --include="*.tsx"
# Expected: 0 results after import updates
```

**Recommendation**: ✅ **REMOVE AFTER PHASE 2 VALIDATION**

**Prerequisites**:
1. All imports updated to `@/modules/github/*`
2. Tests migrated to `modules/github/__tests__/`
3. `npm run build` and `npm test` pass

**Validation**:
```bash
# 1. No imports of lib/github:
$ grep -rn "@/lib/github" src/ | wc -l
# Expected: 0

# 2. TypeScript compiles:
$ npm run typecheck
# Expected: Exit 0

# 3. Build succeeds:
$ npm run build
# Expected: Exit 0
```

**Rollback**: `git checkout HEAD~1 -- src/lib/github/`

---

### 5. `src/lib/` (Entire Directory)

**Status:** Will be empty after all moves to `modules/` and `shared/`  
**Current Contents**:
- `lib/agents/` → Moving to `modules/documentation/agent/`
- `lib/ai/` → Moving to `shared/lib/ai/`
- `lib/auth/` → Moving to `shared/lib/auth/` and `modules/github/auth/`
- `lib/contracts/` → Moving to `shared/types/contracts/`
- `lib/github/` → Merging into `modules/github/`
- `lib/services/` → Moving to `shared/services/`
- `lib/utils/` → Moving to `shared/lib/utils/`

**Total Files**: ~30 files

**Recommendation**: ✅ **REMOVE AFTER PHASE 2 MOVES & VALIDATION**

**Validation**:
```bash
# 1. Verify lib/ is empty:
$ find src/lib -type f -name "*.ts" -o -name "*.tsx" | wc -l
# Expected: 0

# 2. No imports from @/lib/:
$ grep -rn "from.*@/lib/" src/ | wc -l
# Expected: 0

# 3. Build passes:
$ npm run build
# Expected: Exit 0
```

**Removal Command**:
```bash
# After all validation passes:
rm -rf src/lib/
```

**Rollback**: `git checkout HEAD~1 -- src/lib/`

---

## 📊 ACTIVE FILES (KEEP — NOT CANDIDATES)

These files are still actively used and will be MOVED, not removed:

### `src/lib/agents/utils/github-utils.ts`
**Status**: ✅ **KEEP & MOVE**  
**Target**: `src/modules/documentation/agent/utils/github-utils.ts`  
**References**: 4 active imports

**Grep Proof**:
```bash
$ grep -R "from.*github-utils'" src/ --include="*.ts" --include="*.tsx"
src/lib/agents/documentation-agent.ts:34:} from './utils/github-utils';
src/lib/services/mcp.ts:13:} from '../agents/utils/github-utils';
src/lib/agents/utils/github-utils-v2.ts:12:import { ... } from './github-utils';
```

### `src/lib/agents/utils/github-utils-v2.ts`
**Status**: ✅ **KEEP & MOVE**  
**Target**: `src/modules/documentation/agent/utils/github-utils-v2.ts`  
**References**: Used by some agent implementations

**Note**: Previous analysis (2025-01-27) suggested removal, but imports exist. Moving to feature module.

---

## 🗑️ REMOVAL EXECUTION PLAN (PHASE 2+)

### Timing: After PHASE 2 Moves + PHASE 4 Validation

**Step 1: Create Archive Backup**
```bash
cd /Users/omeryasironal/Desktop/bitirme_projesi/deneme1/devagents
mkdir -p .archive/structural-refactor-backup
cp -r src/lib .archive/structural-refactor-backup/
tar -czf .archive/structural-refactor-backup-$(date +%Y%m%d).tar.gz src/lib/
```

**Step 2: Remove Individual Deprecated Files**
```bash
# Safe to remove immediately (no references):
rm src/lib/auth/github-token.ts
rm src/lib/agents/utils/github-utils-legacy.ts

# Remove after test migration:
rm src/lib/github/token-provider.ts
rm -rf src/lib/github/__tests__/
```

**Step 3: Remove Empty lib/github Directory**
```bash
# After all imports updated:
rm -rf src/lib/github/
```

**Step 4: Remove Entire lib/ Directory**
```bash
# Only after ALL files moved and validated:
find src/lib -type f -name "*.ts" -o -name "*.tsx"
# If output is empty:
rm -rf src/lib/
```

**Step 5: Update Documentation**
```bash
# Update docs/ARCHITECTURE.md to reflect new structure
# Update README.md import examples
# Remove lib/ references from docs/
```

**Step 6: Commit**
```bash
git add -A
git commit -m "chore: remove deprecated lib/ directory after structural refactor

- Removed lib/auth/github-token.ts (deprecated, no references)
- Removed lib/agents/utils/github-utils-legacy.ts (unused, 661 LOC)
- Removed lib/github/ (consolidated into modules/github/)
- Removed lib/ (all content migrated to modules/ or shared/)

All imports updated to new paths in PHASE 2.
Total removed: ~960 LOC + 1 directory.
Backups: .archive/structural-refactor-backup/"
```

---

## ✅ VALIDATION CHECKLIST (Pre-Removal)

Run these commands before removal:

### 1. Import Analysis
```bash
# No lib/ imports should remain:
grep -R "from.*@/lib/" src/ --include="*.ts" --include="*.tsx" | wc -l
# Expected: 0

# Specifically check deprecated files:
grep -R "github-token\|github-utils-legacy\|lib/github" src/ --include="*.ts" --include="*.tsx"
# Expected: No import statements (only file paths in grep itself)
```

### 2. TypeScript Validation
```bash
npm run typecheck
# Expected: Exit 0, no TS errors
```

### 3. Linting
```bash
npm run lint
# Expected: Exit 0, no lint errors
```

### 4. Build Validation
```bash
npm run build
# Expected: Exit 0, successful build
```

### 5. Test Validation
```bash
npm test
# Expected: All tests pass (or known failures unrelated to refactor)
```

### 6. Dev Server Boot
```bash
npm run dev
# Expected: Server boots without module-not-found errors
# Navigate to key routes: /, /dashboard, /profile
```

---

## 🔄 ROLLBACK INSTRUCTIONS

If any issues arise after removal:

### Rollback Single File
```bash
# Restore specific deprecated file:
git checkout HEAD~1 -- src/lib/auth/github-token.ts
npm run build
```

### Rollback Entire lib/ Directory
```bash
# Restore all of lib/:
git checkout HEAD~1 -- src/lib/
npm run build
```

### Rollback from Archive
```bash
# If git history unavailable:
tar -xzf .archive/structural-refactor-backup-YYYYMMDD.tar.gz -C /
npm run build
```

### Emergency: Revert Entire Refactor
```bash
# Find refactor branch/commit:
git log --oneline | grep "refactor(structure)"

# Revert entire commit:
git revert <commit-sha>

# Or reset to before refactor (DESTRUCTIVE):
git reset --hard <commit-before-refactor>
```

---

## 📌 NOTES & BEST PRACTICES

### Why Phased Removal?
- **Safety First**: Ensure all imports updated before removal
- **Validation Gates**: Each phase must pass validation
- **Reversibility**: Git history + archives enable quick rollback

### Archive Strategy
- `.archive/` directory (gitignored) for local backups
- Tarball with date stamp for easy identification
- Keep archives until next major release

### Git Safety Net
- All changes committed separately
- Descriptive commit messages with file counts
- Easy to revert individual commits

### Communication
- Update team on new import paths
- Document in ARCHITECTURE.md
- Add import path examples to README

---

## 📅 TIMELINE

| Phase | Action | Timing | Status |
|-------|--------|--------|--------|
| **PHASE -1** | Audit & identify candidates | Completed | ✅ |
| **PHASE A** | Document move plan | Completed | ✅ |
| **PHASE 2** | Execute moves & import updates | Pending HITL | ⏳ |
| **PHASE 3** | GitHub SSOT consolidation | Pending HITL | ⏳ |
| **PHASE 4** | Validation (lint/typecheck/build) | Pending HITL | ⏳ |
| **Cleanup** | Remove deprecated files | After PHASE 4 | 📅 |

---

## 🎯 SUCCESS CRITERIA

Removal is successful when:

1. ✅ All imports use `@/modules/*` or `@/shared/*`
2. ✅ Zero references to `@/lib/` in codebase
3. ✅ `src/lib/` directory does not exist
4. ✅ `npm run build` succeeds
5. ✅ All tests pass
6. ✅ Dev server boots without errors
7. ✅ Backup archives created
8. ✅ Documentation updated

---

**Last Updated**: 2025-10-27  
**Next Review**: After PHASE 2 Moves  
**Owner**: AKIS Scribe Agent (Structural Refactor Task)
