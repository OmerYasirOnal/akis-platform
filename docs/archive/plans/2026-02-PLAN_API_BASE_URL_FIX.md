# Plan: API Base URL Normalization Fix

**Issue:** `/api/api` double prefix causing 404 errors on staging
**Date:** 2026-02-02
**Status:** Ready for execution

## Root Cause

The frontend build sets `VITE_API_URL=/api`, but API service code expects the base URL to be the origin only (without `/api`). When paths like `/api/agents/jobs/running` are appended to base URL `/api`, the result is `/api/api/agents/jobs/running`.

## Fix Strategy

1. Create centralized `getApiBaseUrl()` utility that returns origin only
2. Update all API service files to use this utility
3. Remove/empty `VITE_API_URL` from deploy workflow
4. Document the standard

## Files to Change

- `frontend/src/services/api/config.ts` (CREATE)
- `frontend/src/services/api/agents.ts`
- `frontend/src/services/api/ai-keys.ts`
- `frontend/src/services/api/integrations.ts`
- `frontend/src/services/api/billing.ts`
- `frontend/src/services/api/settings.ts`
- `frontend/src/services/api/agent-configs.ts`
- `frontend/src/services/api/github-discovery.ts`
- `frontend/src/services/api/HttpClient.ts`
- `frontend/src/components/jobs/FeedbackTab.tsx`
- `.github/workflows/deploy-staging.yml`
- `docs/ops/API_BASE_URL.md` (CREATE)

## Verification

```bash
# After deploy, these should NOT return 404:
curl -sI https://staging.akisflow.com/api/agents/jobs/running | head -3
curl -sI https://staging.akisflow.com/api/settings/ai-keys/status | head -3
curl -sI https://staging.akisflow.com/api/integrations/github/oauth/start | head -3
```

## Branch

`fix/api-base-url-normalization`
