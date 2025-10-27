# Phase 0: Discovery Findings

**Date:** 2025-01-27  
**Task:** FIX_GH_SECURITY_AND_BOUNDARIES  
**Phase:** Phase 0 — Discovery (Read-Only)  
**Status:** ⏸️ PAUSED AT HITL GATE A

---

## 📋 EXECUTIVE SUMMARY

Phase 0 discovery has been completed. Analysis reveals **MIXED COMPLIANCE** with security boundaries:

### ✅ GOOD NEWS
1. **Client components are CLEAN** - `BranchCreator.tsx` and `RepoPicker.tsx` correctly use API routes (`/api/github/*`) instead of direct server imports
2. **No direct `modules/github` imports** found in client components
3. **GitHub App credentials are server-side only** - accessed only in `src/lib/auth/github-app.ts`

### ⚠️ ISSUES IDENTIFIED
1. **NO `server-only` guards** - Zero files use `import "server-only"` despite client-side check guards
2. **GitHub App NOT configured** - Environment validation shows only OAuth is configured
3. **OAuth fallback is ACTIVE** - `token-provider.ts` falls back to OAuth (lines 98-105)
4. **Client-side env access** - `GitHubConnect.tsx` reads `process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID` on client (line 14)
5. **Test files access env** - `e2e/github-app-auth.test.ts` manipulates `process.env` directly

---

## 🔍 DETAILED FINDINGS

### 1. Environment Variable Access (Outside Server Context)

#### Files with `process.env` access:

**Client Component Issues:**
```
src/components/GitHubConnect.tsx:14
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
```
✅ **This is OK** - Uses `NEXT_PUBLIC_*` prefix (Next.js convention for client-safe vars)

**Auth/GitHub Modules:**
```
src/lib/auth/github-app.ts:88-90
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const privateKeyPem = process.env.GITHUB_APP_PRIVATE_KEY_PEM;

src/lib/github/token-provider.ts:111-113
  const hasAppEnv = process.env.GITHUB_APP_ID && 
                    process.env.GITHUB_APP_INSTALLATION_ID && 
                    process.env.GITHUB_APP_PRIVATE_KEY_PEM;
```
⚠️ **NEEDS server-only guard** - These files read sensitive credentials

**AI/LLM Config:**
```
src/lib/ai/openrouter.ts:
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
```
⚠️ **NEEDS server-only guard** - API keys should never reach client

**Logger:**
```
src/lib/utils/logger.ts:
  if (process.env.NODE_ENV === 'development') {
```
✅ **This is OK** - NODE_ENV is safe to check

**Test Files:**
```
src/__tests__/e2e/github-app-auth.test.ts
  Multiple process.env manipulations
```
✅ **This is OK** - Test environment

---

### 2. GitHub Module Imports

#### Import Chain Analysis:

```
src/app/api/agent/documentation/analyze/route.ts
  → import { getGitHubToken } from '@/lib/github/token-provider';

src/app/api/github/repos/route.ts
  → import { getUserRepos } from '@/lib/agents/utils/github-utils';

src/app/api/github/branch/route.ts
  → import { createOrCheckoutBranch } from '@/lib/agents/utils/github-utils';

src/lib/agents/utils/github-utils.ts
  → import { ... } from '@/lib/github/operations';
  → import { GitHubClientOptions } from '@/lib/github/client';

src/lib/agents/documentation-agent.ts
  → import { ... } from './utils/github-utils';

src/lib/github/token-provider.ts
  → import { getCachedGitHubAppToken } from '../auth/github-app';

src/lib/services/mcp.ts
  → import { ... } from '../agents/utils/github-utils';
```

✅ **GOOD:** All imports are server-to-server  
✅ **GOOD:** Client components use `/api/github/*` endpoints  
⚠️ **MISSING:** No `import "server-only"` guards

---

### 3. Server-Only Guard Status

```bash
grep -R "import.*\"server-only\"" src
# Result: No matches found
```

❌ **CRITICAL:** Zero files have `server-only` protection despite:
- `token-provider.ts` has client-side check: `if (typeof window !== 'undefined')`
- `client.ts` has client-side check: `if (typeof window !== 'undefined')`
- `github-app.ts` has NO guards

**Risk:** Without build-time enforcement, accidental client imports won't fail until runtime.

---

### 4. Current File Structure

**Current GitHub Module Structure:**
```
src/lib/
├── auth/
│   ├── github-app.ts          ⚠️ No server-only guard
│   ├── github-token.ts         (@deprecated wrapper)
│   ├── storage.ts
│   └── types.ts
├── github/
│   ├── __tests__/
│   ├── client.ts               ⚠️ Has runtime check, no server-only
│   ├── operations.ts           ⚠️ No server-only guard
│   └── token-provider.ts       ⚠️ Has runtime check, no server-only
├── agents/utils/
│   ├── github-utils.ts         ⚠️ No server-only guard
│   ├── github-utils-v2.ts      (duplicate?)
│   └── github-utils-legacy.ts  (candidate for removal?)
```

**Observations:**
- ✅ Organized under `src/lib/github/` (not `modules/github/` as spec suggests)
- ⚠️ Three versions of `github-utils` (legacy, v1, v2) - needs cleanup
- ❌ No `server-only` imports anywhere

---

### 5. Environment Configuration Status

From startup logs:
```
🤖 GitHub App Configuration (Optional)
───────────────────────────────────────────────
ℹ️  GitHub App is not configured (using OAuth only)
ℹ️  This is OK, but GitHub App is more secure
```

**Environment Variables (from validation script):**
- ✅ `OPENROUTER_API_KEY` — set
- ❌ `OPENAI_API_KEY` — not set (optional)
- ✅ `GITHUB_CLIENT_ID` — set
- ✅ `GITHUB_CLIENT_SECRET` — set
- ✅ `NEXT_PUBLIC_GITHUB_CLIENT_ID` — set
- ❌ `GITHUB_APP_ID` — **NOT set**
- ❌ `GITHUB_APP_INSTALLATION_ID` — **NOT set**
- ❌ `GITHUB_APP_PRIVATE_KEY_PEM` — **NOT set**

**Impact:** System will always fall back to OAuth (undesired behavior per spec).

---

### 6. OAuth Fallback Detection

From `src/lib/github/token-provider.ts`:

```typescript
// Priority 1: GitHub App Installation Token (preferred)
if (!options.forceOAuth) {
  try {
    const appToken = await getCachedGitHubAppToken();
    if (appToken) {
      logger.info('TokenProvider', `[${correlationId}] ✅ Using GitHub App token`);
      return { token: appToken, source: 'github_app' };
    }
    logger.warn('TokenProvider', `[${correlationId}] ⚠️ GitHub App token unavailable`);
  } catch (error: any) {
    logger.error('TokenProvider', `[${correlationId}] ❌ GitHub App error: ${error.message}`);
  }
}

// Priority 2: OAuth User Token (fallback)
if (options.userToken) {
  logger.info('TokenProvider', `[${correlationId}] ✅ Using OAuth token`);
  return { token: options.userToken, source: 'oauth' };
}
```

✅ **GOOD:** GitHub App has priority  
⚠️ **ISSUE:** OAuth fallback exists (should be removed per spec)

---

### 7. Client Components Boundary Check

**Examined Files:**
- ✅ `BranchCreator.tsx` (line 41) — Uses `/api/github/branch` (API route)
- ✅ `RepoPicker.tsx` (line 43) — Uses `/api/github/repos` (API route)
- ✅ `GitHubConnect.tsx` — Only uses `NEXT_PUBLIC_*` env var (safe)

**No client component directly imports server modules.** ✅

---

## 📊 RISK ASSESSMENT

| Risk | Severity | Probability | Impact |
|------|----------|-------------|--------|
| Client imports server code | 🟡 Medium | Low (no current violations) | High (secrets leak) |
| OAuth fallback used unintentionally | 🟡 Medium | High (no GitHub App configured) | Medium (security downgrade) |
| Missing server-only guards | 🟡 Medium | High (no build-time checks) | High (silent failure) |
| Duplicate github-utils files | 🟢 Low | N/A | Low (maintenance debt) |
| Environment misconfiguration | 🔴 High | High (confirmed missing) | High (feature broken) |

---

## 🎯 EVIDENCE SUMMARY FOR HITL GATE A

### Current State Classification: 🟡 MIXED COMPLIANCE

**Compliant:**
1. Client components correctly use API routes
2. Sensitive env vars only accessed server-side
3. Logical separation exists (`lib/github/`, `lib/auth/`)

**Non-Compliant:**
1. ❌ Zero `server-only` imports (no build-time enforcement)
2. ❌ GitHub App credentials not configured (OAuth fallback active)
3. ⚠️ Duplicate/legacy utility files
4. ⚠️ Some files lack guards despite handling credentials

**Proofs Attached:**
- `docs/BEFORE_TREE.txt` — File list snapshot
- grep outputs in this document
- Startup logs showing OAuth-only mode

---

## 🚦 HITL GATE A: DECISION REQUIRED

### Recommended Scope for Phase 1+

**Critical Path:**
1. Add `import "server-only"` to all GitHub/auth modules
2. Configure GitHub App environment variables (`.env.local` template)
3. Remove OAuth fallback (or make it explicit dev mode flag)
4. Clean up duplicate `github-utils` files

**Optional (Nice to Have):**
5. Move from `src/lib/github/` to `src/modules/github/` (spec compliance)
6. Add startup validation that fails fast if credentials missing

### Questions for Human:
1. **GitHub App Setup:** Should we create `.env.local.template` with GitHub App instructions?
2. **OAuth Removal:** Completely remove OAuth fallback, or add `ALLOW_OAUTH_FALLBACK=false` env flag?
3. **File Consolidation:** Can we remove `github-utils-legacy.ts` and `github-utils-v2.ts`?
4. **Directory Structure:** Keep `src/lib/github/` or move to `src/modules/github/` per spec?

---

## 📌 NEXT STEPS (After Approval)

If approved, proceed to **Phase 1 — Server-Only GitHub Core**:
1. Add `server-only` guards to 6 files
2. Create `.env.local.template` with GitHub App setup
3. Update token-provider to remove OAuth fallback
4. Run `npm run typecheck && npm run build` (expect success)
5. Test startup with missing credentials (expect clear error)

---

**Phase 0 Complete. Awaiting HITL Gate A approval to proceed to Phase 1.**

