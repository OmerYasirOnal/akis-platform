# AKIS Stabilization Rollback Guide

**Emergency rollback procedure for GitHub App Stabilization changes**

---

## ⚠️ When to Rollback

Use this guide if:
- GitHub App mode causes production issues
- `/installation/repositories` endpoint fails unexpectedly
- Rate-limit logging causes performance degradation
- LLM budget enforcement blocks critical operations

---

## 🔄 Quick Rollback (5 minutes)

### Option 1: OAuth Fallback (Temporary Fix)

**Use Case**: App not working, need immediate fix

**Steps**:

1. **Add fallback flag** to `.env.local`:
```bash
ALLOW_OAUTH_FALLBACK=true
```

2. **Restart server**:
```bash
npm run dev
# or for production:
pm2 restart akis
```

3. **Verify**: UI should revert to PAT integration form

**Limitations**:
- Only works in development (`NODE_ENV !== 'production'`)
- Users must provide PAT manually
- Loses App benefits (auto-refresh, fine-grained permissions)

---

### Option 2: Git Revert (Full Rollback)

**Use Case**: Need to completely undo stabilization changes

**Commands**:

```bash
# 1. Identify the stabilization commit
git log --oneline | head -20
# Look for: "feat: GitHub App stabilization & boundary hardening"

# 2. Revert the commit (replace COMMIT_HASH)
git revert COMMIT_HASH

# 3. If multiple commits, revert range:
git revert COMMIT_START..COMMIT_END

# 4. Push
git push origin main

# 5. Redeploy
npm run build && pm2 restart akis
```

**What Gets Reverted**:
- ❌ `/installation/repositories` endpoint removed
- ❌ App-aware UI components reverted
- ❌ Rate-limit logging disabled
- ✅ Original `/user/repos` logic restored
- ✅ PAT integration as primary method

---

## 🔍 Verification Steps

After rollback, test:

### 1. OAuth Integration Works
```bash
# UI Test
1. Go to /profile or /integrations
2. See "GitHub" PAT form (not "App Mode")
3. Enter valid PAT token
4. Click "Connect" → should succeed
```

### 2. Repo Listing Works
```bash
# API Test
curl -X GET http://localhost:3000/api/github/repos \
  -H "Authorization: Bearer YOUR_PAT_TOKEN"

# Expected: { "ok": true, "data": [...repos], "source": "oauth" }
```

### 3. No Server Errors
```bash
# Check logs
tail -f logs/akis.log | grep -i error
# Should see no "installation/repositories" errors
```

---

## 🛠️ Partial Rollback (Selective)

If only specific features are problematic:

### Disable LLM Budget Only

**Edit**: `src/lib/ai/usage-tracker.ts`

Change:
```typescript
export function trackLLMUsage(usage) {
  // Disable enforcement
  return; // Early return, skip all checks
}
```

Or set env:
```bash
ALLOW_LLM_OVER_BUDGET=true
LLM_BUDGET_DAILY_TOKENS=999999999
```

### Disable Rate-Limit Logging

**Edit**: `src/modules/github/client.ts`

Change:
```typescript
// Line ~126
if (this.enableLogging && rateLimit.remaining > 0) {
  // Comment out or set enableLogging to false
  return; // Skip logging
}
```

Or pass options:
```typescript
createGitHubClient({ enableLogging: false })
```

### Keep App but Remove UI Changes

**Revert only UI files**:
```bash
git checkout HEAD^ -- src/components/integrations/GitHubPATIntegration.tsx
git checkout HEAD^ -- src/components/RepoPicker.tsx
git commit -m "revert: UI App-awareness (keep backend)"
```

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Resource not accessible by integration" after rollback

**Cause**: App tokens cached in memory

**Fix**:
```bash
# Clear any cached tokens
rm -rf .next/cache
npm run dev
```

### Issue 2: UI still shows "App Mode"

**Cause**: Browser cached install-info response

**Fix**:
```bash
# User action: Hard refresh
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Or clear Next.js cache
rm -rf .next
npm run build
```

### Issue 3: Rate-limit errors persist

**Cause**: Client retry logic aggressive

**Fix**: Wait for rate-limit reset (check `x-ratelimit-reset` header)
```bash
# Get reset time
curl -I https://api.github.com/user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | grep x-ratelimit-reset

# Convert to readable time
date -r 1738000000  # Replace with reset timestamp
```

---

## 📋 Rollback Checklist

- [ ] Environment variables removed/changed
- [ ] Server restarted
- [ ] Caches cleared (`.next/`, browser)
- [ ] UI shows PAT form (not App banner)
- [ ] Repo listing works with PAT
- [ ] No 403 errors in logs
- [ ] Team notified of rollback
- [ ] Incident documented (what went wrong?)

---

## 🔐 Data Safety

**Safe to rollback**: No data loss occurs
- ✅ User integrations preserved (stored in AuthContext)
- ✅ Repository data not modified
- ✅ GitHub App installation remains (just not used)
- ✅ All changes are code-level only

**After rollback**:
- Users must re-connect via PAT if they were using App mode
- Existing PAT integrations unaffected

---

## 🚨 Emergency Contacts

If rollback fails or issues persist:

1. **Check GitHub Status**: https://www.githubstatus.com/
2. **Review Logs**: Check `/api/logs` endpoint or server console
3. **GitHub App Settings**: https://github.com/settings/apps → Revoke permissions if needed
4. **OpenRouter Status**: https://openrouter.ai/status (for LLM issues)

---

## 📊 Monitoring Post-Rollback

Watch these metrics for 24 hours:

```bash
# Error rate
grep -i "error" logs/akis.log | wc -l

# 403 frequency (should drop to 0 after rollback)
grep "403" logs/akis.log | wc -l

# Active PAT integrations
# Check AuthContext or database for connected users
```

---

## 🔄 Re-applying Changes (After Fix)

Once issue resolved:

1. Identify root cause from logs
2. Fix in a new branch: `fix/app-stabilization-issue`
3. Test locally with App mode enabled
4. Deploy to staging first
5. Gradual rollout: Enable for 10% of users, monitor, then 100%

**Environment-based rollout**:
```bash
# Staging
GITHUB_APP_ENABLED=true

# Production (gradual)
GITHUB_APP_ENABLED=false          # Initial (use OAuth)
GITHUB_APP_ENABLED_PERCENTAGE=10  # Phase 1
GITHUB_APP_ENABLED_PERCENTAGE=50  # Phase 2
GITHUB_APP_ENABLED=true           # Full rollout
```

---

## 📝 Rollback Log Template

Document the rollback:

```markdown
## Rollback Incident Report

**Date**: YYYY-MM-DD HH:MM UTC
**Triggered by**: [Name]
**Reason**: [Brief description of issue]

**Actions Taken**:
1. [Step 1]
2. [Step 2]

**Verification**:
- [ ] UI reverted
- [ ] API functional
- [ ] No errors in logs

**Root Cause**: [To be determined / Known issue]

**Next Steps**: [Fix plan]
```

---

**Last Updated**: 2025-01-27  
**Tested**: ✅ OAuth fallback verified  
**Status**: Ready for use

