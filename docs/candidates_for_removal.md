# Candidates for Removal (Post-Migration Analysis)

**Date:** 2025-01-27  
**Context:** Phase 1 - GitHub Security Boundaries & Server-Only Migration  
**Status:** Analysis Complete — Awaiting Approval for Cleanup

---

## 📋 Summary

After migrating GitHub modules to `src/modules/github/` with server-only guards, the following files are candidates for removal:

| File | Size | References | Status | Reason |
|------|------|------------|--------|--------|
| `src/lib/agents/utils/github-utils-legacy.ts` | ~17KB | 0 | **SAFE TO REMOVE** | No imports found |
| `src/lib/agents/utils/github-utils-v2.ts` | ~12KB | 0 | **SAFE TO REMOVE** | No imports found |
| `src/lib/github/` (directory) | N/A | 0 | **SAFE TO REMOVE** | Migrated to `src/modules/github/` |

---

## 🔍 Detailed Analysis

### 1. `src/lib/agents/utils/github-utils-legacy.ts`

**File Size:** 661 lines (~17KB)  
**Last Known Status:** Legacy implementation  
**References Found:** 0

```bash
grep -R "github-utils-legacy" src --include="*.ts" --include="*.tsx"
# Result: No matches found
```

**Recommendation:** ✅ **SAFE TO REMOVE**  
This is an older implementation that has been superseded by `github-utils.ts`. No active imports detected.

**Rollback:** If needed, restore from git history:
```bash
git show HEAD~1:src/lib/agents/utils/github-utils-legacy.ts > src/lib/agents/utils/github-utils-legacy.ts
```

---

### 2. `src/lib/agents/utils/github-utils-v2.ts`

**File Size:** 531 lines (~12KB)  
**Last Known Status:** Version 2 implementation (duplicate)  
**References Found:** 0

```bash
grep -R "github-utils-v2" src --include="*.ts" --include="*.tsx"
# Result: No matches found
```

**Recommendation:** ✅ **SAFE TO REMOVE**  
This appears to be an intermediate/experimental version. Content is identical or very similar to `github-utils.ts`.

**Verification:**
```bash
diff src/lib/agents/utils/github-utils.ts src/lib/agents/utils/github-utils-v2.ts
# If output is empty or minimal, they are duplicates
```

**Rollback:** Restore from git if needed.

---

### 3. `src/lib/github/` (Old Module Directory)

**Status:** Replaced by `src/modules/github/`  
**Files in directory:**
- `client.ts` → Migrated to `src/modules/github/client.ts`
- `token-provider.ts` → Migrated to `src/modules/github/token-provider.ts`
- `operations.ts` → Migrated to `src/modules/github/operations.ts`
- `__tests__/` → Can be migrated if needed

**References Found:** 0 (all imports updated to `@/modules/github`)

```bash
grep -R "from.*@/lib/github" src --include="*.ts" --include="*.tsx"
# Result: No matches found (after Phase 1 import updates)
```

**Recommendation:** ✅ **SAFE TO REMOVE**  
All imports have been migrated. Old directory can be safely deleted.

**Rollback:** Git history or manual re-migration from `modules/` back to `lib/`.

---

## 📊 Active `github-utils.ts` Usage

The **canonical** `src/lib/agents/utils/github-utils.ts` is still actively used:

```bash
grep -R "from.*github-utils'" src --include="*.ts" --include="*.tsx"
```

**References (4 total):**
1. `src/app/api/github/repos/route.ts:7`  
   ```ts
   import { getUserRepos } from '@/lib/agents/utils/github-utils';
   ```

2. `src/app/api/github/branch/route.ts:7`  
   ```ts
   import { createOrCheckoutBranch } from '@/lib/agents/utils/github-utils';
   ```

3. `src/lib/agents/documentation-agent.ts:34`  
   ```ts
   } from './utils/github-utils';
   ```

4. `src/lib/services/mcp.ts:13`  
   ```ts
   } from '../agents/utils/github-utils';
   ```

**Status:** ✅ **KEEP** — Active usage, no removal.

---

## 🗑️ Removal Plan (Optional — Execute After Approval)

### Step 1: Create Backup
```bash
cd devagents
mkdir -p .archive/phase1-cleanup
cp -r src/lib/github .archive/phase1-cleanup/
cp src/lib/agents/utils/github-utils-legacy.ts .archive/phase1-cleanup/
cp src/lib/agents/utils/github-utils-v2.ts .archive/phase1-cleanup/
```

### Step 2: Remove Files
```bash
# Remove legacy and v2 utilities
rm src/lib/agents/utils/github-utils-legacy.ts
rm src/lib/agents/utils/github-utils-v2.ts

# Remove old lib/github directory
rm -rf src/lib/github
```

### Step 3: Verify Build
```bash
npm run typecheck
npm run build
```

### Step 4: Commit
```bash
git add -A
git commit -m "chore: remove deprecated github utils and old lib/github directory

- Removed github-utils-legacy.ts (no references)
- Removed github-utils-v2.ts (no references)
- Removed src/lib/github/ (migrated to src/modules/github/)

All imports updated to new paths in Phase 1.
Backups saved in .archive/phase1-cleanup/"
```

---

## 🔄 Rollback Instructions

If any issues arise after removal:

```bash
# Restore specific file
git checkout HEAD~1 -- src/lib/agents/utils/github-utils-legacy.ts

# Or restore entire old directory
git checkout HEAD~1 -- src/lib/github

# Re-run build
npm run build
```

---

## ✅ Verification Commands

Run these commands to confirm safe removal:

```bash
# 1. Check for any remaining references to legacy/v2
grep -R "github-utils-legacy\|github-utils-v2" src --include="*.ts" --include="*.tsx"
# Expected: No output

# 2. Check for old lib/github imports
grep -R "from.*@/lib/github" src --include="*.ts" --include="*.tsx"
# Expected: No output

# 3. Verify canonical github-utils is still used
grep -R "from.*github-utils'" src --include="*.ts" --include="*.tsx" | wc -l
# Expected: 4 (or similar active count)

# 4. Run tests
npm run typecheck && npm run lint && npm run build
# Expected: All pass
```

---

## 📌 Notes

- **Why not remove immediately?** Following safe refactoring practices (measure twice, cut once).
- **Archive strategy:** Backups kept in `.archive/` directory (gitignored) for quick local rollback.
- **Git safety:** All changes are reversible via git history.
- **Phased approach:** Removal is optional cleanup step, not critical path.

**Next Steps:** Proceed with Phase 1 validation (lint, typecheck, build). Cleanup can be deferred to Phase 2 if preferred.

