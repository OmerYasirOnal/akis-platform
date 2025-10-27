# Scribe Bugfix Checklist

## ✅ Completed Bugfixes

### 1. Tech Detection: Swift/iOS Support
- [x] Stop probing JS/Python manifests unless present
- [x] Detect `.xcodeproj`, `.swift`, `Info.plist` as Swift/iOS indicators
- [x] Detect `Package.swift` for SwiftPM
- [x] Add early return to avoid false positives
- [x] Update type definitions to include `'swift'` package manager

**Files Changed:**
- `src/lib/agents/utils/github-utils.ts` (detectTechStack, detectPackageManager)
- `src/lib/agents/documentation-agent-types.ts` (packageManager type)

### 2. Contents API Update Path (422 Fix)
- [x] Include `sha` when file exists (fixes 422)
- [x] Probe file existence before update in `mcpCommit`
- [x] Log SHA detection for debugging
- [x] Handle both create and update scenarios

**Files Changed:**
- `src/lib/services/mcp.ts` (mcpCommit function)

**Protocol:**
```typescript
// 1. Probe
GET /repos/{owner}/{repo}/contents/{path}?ref={branch}
  - 200 → keep sha = res.sha
  - 404 → new file (no sha)

// 2. Write
PUT /repos/{owner}/{repo}/contents/{path}
{
  "message": "docs: update {path}",
  "content": "<base64>",
  "branch": "{branch}",
  "sha": "<sha-if-exists>"
}
```

### 3. DAS Metrics: Avoid "100% with total=0"
- [x] Return `score = 0` when `totalReferences = 0`
- [x] Update calculateRefCoverage logic
- [x] Add comment explaining the fix

**Files Changed:**
- `src/lib/agents/documentation-agent.ts` (calculateRefCoverage)

**Before:**
```typescript
const score = totalReferences > 0 ? ... : 100; // ❌ Wrong
```

**After:**
```typescript
const score = totalReferences > 0 ? ... : 0; // ✅ Correct
```

### 4. Backend Log Mirroring
- [x] Add `/api/logs` route (POST endpoint)
- [x] Create logger utility with server mirror
- [x] Integrate logger into ScribeRunner
- [x] Server console now shows all agent operations

**Files Created:**
- `src/app/api/logs/route.ts`
- `src/lib/utils/logger.ts`

**Files Changed:**
- `src/lib/agents/scribe/runner.ts` (logger integration)

### 5. Idempotent Branch Operations
- [x] Check if branch exists before creating
- [x] Respect `.gitignore` and avoid committing build artifacts
- [x] Use `createOrCheckoutBranch` wrapper (already existed)

**Status:** Already implemented, no changes needed.

## 📋 Best Practices

### Tech Detection
- Always check Swift/iOS indicators first (priority)
- Don't probe for JS/Python files in Swift projects
- Use early returns to avoid false positives

### GitHub Operations
- Always fetch `sha` before updating files
- Log all API operations for debugging
- Handle both 200 (exists) and 404 (new file) responses

### DAS Metrics
- Never return 100% when totalReferences = 0
- Always validate links before scoring
- Use realistic checklist items

### Logging
- Mirror all logs to server console
- Use structured format: `[timestamp] [scope] message`
- Log to `/api/logs` POST endpoint

## 🔄 Rollback Plan

If any bugfix causes issues:

1. **Tech Detection:** Revert `detectTechStack` changes, use original logic
2. **422 Fix:** Remove SHA probe, pass `undefined` for new files only
3. **DAS Metrics:** Revert to `score = 100` when `totalReferences = 0`
4. **Log Mirroring:** Remove logger import, use plain `console.log`

## ✅ Verification Steps

1. Test Swift/iOS repo (e.g., Falbak)
   - [ ] Tech stack detected as Swift/iOS
   - [ ] No 404 errors for package.json

2. Test commit/update flow
   - [ ] New file creates successfully
   - [ ] Existing file updates without 422

3. Test DAS metrics
   - [ ] RefCoverage = 0% when no references
   - [ ] No "100% with 0 of 0" inconsistency

4. Test server logs
   - [ ] Logs visible in terminal
   - [ ] `/api/logs` responds with 204

---

*Bugfix completed on 2025-10-27*

