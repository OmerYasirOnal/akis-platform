# STABILIZATION SUMMARY

**Feature:** Scribe ActorContext + Install CTA Fix  
**Date:** 2025-10-27  
**Status:** ✅ Ready for Review  
**Type:** Enhancement + Bug Fix

---

## Executive Summary

This PR introduces **ActorContext system** to fix the "User not found" error in Scribe Agent and enables **headless operation** under GitHub App (no OAuth user required). Additionally, it fixes the "Install to more repos" button to open the correct GitHub Installation manage page and surfaces permission/repo-coverage gaps with actionable CTAs.

---

## Problem Statement

### 1. Scribe "User not found" Error
- **Issue:** Scribe Agent failed with `❌ Hata: User not found.` when running under GitHub App only (no OAuth user)
- **Root Cause:** Code assumed OAuth user presence; no fallback to GitHub App bot identity
- **Impact:** Users could not run Scribe headlessly with just GitHub App installed

### 2. "Install to more repos" Button
- **Issue:** Button linked to wrong URL (generic install page, not installation manage page)
- **Root Cause:** No logic to fetch `installation.html_url` from GitHub API
- **Impact:** Users confused when trying to add repos or fix permissions

---

## Solution Overview

### ActorContext System
Introduced a unified authentication context that supports:
- **oauth_user:** Traditional OAuth user flow (priority 1)
- **app_bot:** GitHub App bot identity (priority 2, fallback)
- **service_account:** Future service account support

**Key Benefits:**
- ✅ Scribe runs headlessly with GitHub App only
- ✅ Preserves OAuth user flow when available
- ✅ Clear attribution in commits/logs based on actor mode
- ✅ Feature flag for rollback (`SCRIBE_ALLOW_APP_BOT_FALLBACK`)

### Diagnostics Endpoint + UI
New `/api/github/app/diagnostics` endpoint that:
- Fetches installation info from GitHub API
- Extracts token permissions from access token response
- Compares required vs actual permissions
- Returns `installation.html_url` for correct CTA

**UI Enhancements:**
- 🤖 "GitHub App Mode • Active" badge
- 📋 Collapsible "Required Permissions" with diff (✓ / ❌)
- ⚠️ Warning + CTA if permissions missing
- ℹ️ Warning + CTA if selected repos only
- 🔗 Correct "Manage Installation" link

---

## Changes by Category

### Core Auth (3 files)
- **NEW:** `src/lib/auth/actor.ts` - ActorContext types, resolvers, helpers
- **MOD:** `src/modules/github/token-provider.ts` - Enhanced logging with actor info
- **MOD:** `src/app/actions/scribe.ts` - Actor resolution in server action

### Scribe Runner (1 file)
- **MOD:** `src/modules/agents/scribe/server/runner.server.ts` - Integrated actor context, attribution, banners

### Diagnostics (1 file)
- **NEW:** `src/app/api/github/app/diagnostics/route.ts` - Permissions check & install info endpoint

### UI (1 file)
- **MOD:** `src/components/integrations/GitHubIntegration.tsx` - Diagnostics display, permissions diff, correct CTAs

### Tests (2 files)
- **NEW:** `src/__tests__/unit/actor.test.ts` - Unit tests (9 test cases)
- **NEW:** `src/__tests__/integration/scribe-app-only.test.ts` - Integration test (3 test cases)

**Total:** 8 files changed (3 new, 5 modified)

---

## Technical Highlights

### 1. Actor Resolution Logic
```typescript
// Priority 1: OAuth user (if available)
if (options.userToken && options.userId) {
  return { mode: "oauth_user", userId, githubLogin, ... };
}

// Priority 2: GitHub App (if fallback enabled)
if (options.installationId && isAppBotFallbackEnabled()) {
  return { mode: "app_bot", installationId, githubLogin: 'akis-app[bot]', ... };
}

// Priority 3: Environment fallback
const envInstallationId = process.env.GITHUB_APP_INSTALLATION_ID;
if (envInstallationId && isAppBotFallbackEnabled()) {
  return { mode: "app_bot", installationId: parseInt(envInstallationId), ... };
}

// No auth available
throw new Error('Authentication required. ...');
```

### 2. Structured Logging
**Before:**
```
[TokenProvider] Getting token for unknown
```

**After:**
```
[TokenProvider] Getting token for owner/repo (actor=app_bot installation=99999)
[ScribeRunner] 👤 Actor: app_bot (installation: 99999)
[ScribeRunner] ℹ️ 🤖 Running as AKIS App bot (installation 99999)
```

### 3. Permissions Check
```typescript
// Required permissions
const REQUIRED_PERMISSIONS = {
  'metadata': 'read',
  'contents': 'write',
  'pull_requests': 'write',
};

// Compare actual vs required
const missing: string[] = [];
Object.entries(REQUIRED_PERMISSIONS).forEach(([key, value]) => {
  const actual = tokenPermissions[key];
  if (!actual || (value === 'write' && actual !== 'write')) {
    missing.push(`${key}:${value}`);
  }
});
```

### 4. Install URL Priority Fallback
```typescript
function getInstallUrl() {
  // Priority 1: Use html_url from API
  if (diagnostics.htmlUrl) return diagnostics.htmlUrl;
  
  // Priority 2: Construct based on account type
  if (diagnostics.account.type === 'Organization') {
    return `https://github.com/organizations/${login}/settings/installations/${id}`;
  } else {
    return `https://github.com/settings/installations/${id}`;
  }
  
  // Priority 3: New installation
  return `https://github.com/apps/${appSlug}/installations/new`;
}
```

---

## Testing

### Unit Tests (9 test cases)
✅ Actor resolution: oauth_user only  
✅ Actor resolution: app_bot only  
✅ Actor resolution: environment fallback  
✅ Actor resolution: prefer oauth_user when both available  
✅ Actor resolution: fail when no auth  
✅ Actor resolution: fail when fallback disabled  
✅ Feature flag: default true, explicit disable  
✅ Commit author: correct email per mode  
✅ Banner: shows for app_bot, null for others

### Integration Tests (3 test cases)
✅ Scribe runs successfully with GitHub App only (no OAuth)  
✅ Scribe logs show `app_bot` and banner  
✅ Scribe fails gracefully when no auth available

### Manual Testing Checklist
- [ ] Set GitHub App env vars, run Scribe → should succeed with `app_bot` logs
- [ ] Visit `/api/github/app/diagnostics` → verify permissions diff
- [ ] Open integrations page → verify badge, accordion, CTAs
- [ ] Click "Manage Installation" → should open correct GitHub page
- [ ] Test with selected repos only → verify "Add More Repositories" CTA

---

## Security & Observability

### Security
- ✅ All auth logic remains server-only (no token exposure)
- ✅ Least privilege: enforces minimum required permissions
- ✅ Feature flag for rollback
- ✅ Actionable errors (no raw "User not found")

### Observability
- ✅ Structured logs with actor mode
- ✅ Correlation IDs for request tracking
- ✅ Banner in UI when running as app_bot
- ✅ Diagnostics endpoint for health checks

---

## Metrics

### Code Quality
- **Lines Added:** ~600 (including tests)
- **Lines Modified:** ~50
- **Test Coverage:** 12 test cases (9 unit + 3 integration)
- **Linter Errors:** 0
- **TypeScript Errors:** 0

### Impact
- **User-Facing Bugs Fixed:** 2 (Scribe auth failure, wrong install CTA)
- **New Features:** ActorContext, Diagnostics endpoint
- **Breaking Changes:** 0 (backward compatible)

---

## Rollback Plan

### Feature Flag
```bash
# Disable app_bot fallback (restore OAuth-only behavior)
export SCRIBE_ALLOW_APP_BOT_FALLBACK=false
```

### Git Revert
```bash
git revert <commit-sha>
# Or checkout previous commit
git checkout <previous-commit>
```

**Risk:** Low. OAuth user path is unchanged; new code is additive with flag.

---

## Definition of Done

- [x] ActorContext system implemented
- [x] Scribe runs headlessly with GitHub App only
- [x] Token Provider logs include actor info
- [x] Diagnostics endpoint created
- [x] UI shows permissions diff and correct CTAs
- [x] Unit tests (9 test cases) ✅
- [x] Integration tests (3 test cases) ✅
- [x] STABILIZATION_CHANGELIST.md created
- [x] STABILIZATION_SUMMARY.md created
- [ ] Docs updated (GITHUB_APP_SETUP.md) - **In Progress**
- [ ] Manual validation (see checklist above)

---

## Next Steps

1. **Review:** Code review by team
2. **Test:** Manual validation (run Scribe, test CTAs)
3. **Merge:** Merge to main after approval
4. **Monitor:** Watch logs for `actor=app_bot` occurrences
5. **Document:** Update GITHUB_APP_SETUP.md with minimum permissions

---

## References

- **Task Prompt:** `.cursor/prompts/CURSOR_SCRIBE_FIX_AND_INSTALL_CTA.md`
- **Changelist:** `STABILIZATION_CHANGELIST.md`
- **Diagnostics:** `docs/OBSERVABILITY.md`
- **GitHub App Docs:** `docs/GITHUB_APP_SETUP.md` (to be updated)

---

**Prepared by:** AKIS Scribe Agent (Principal Engineer Mode)  
**Review Status:** ⏳ Awaiting Review  
**Estimated Review Time:** 30 minutes
