# Trace Map: Runtime 404 Issues (S0.4.6)

**Date**: 2025-12-18  
**Branch**: `fix/scribe-github-only-and-job-run-s0.4.6`

---

## FAILING URLS (BEFORE FIX)

### 1. GET /api/agents/configs/scribe
**Symptom**: 404 Not Found

**Expected**: 200 with config payload or 401 if not authenticated

**Actual (before fix)**: 404 (route not registered)

### 2. GET /api/integrations/connect/github
**Symptom**: 404 Not Found

**Expected**: 302 redirect to GitHub OAuth or 501 if not configured

**Actual (before fix)**: 404 (route not registered)

---

## ROOT CAUSE

**Problem**: Frontend expects `/api/agents/configs/:agentType` and `/api/integrations/connect/:provider` but these routes were never registered in `backend/src/server.app.ts`.

**Why**: Files `backend/src/api/agent-configs.ts` and `backend/src/api/integrations.ts` were removed during earlier cleanup (they had type errors and weren't registered).

**Evidence**:
```bash
$ grep -r "agentConfigRoutes\|integrationsRoutes" backend/src/server.app.ts
# No matches found (before fix)
```

---

## FIX IMPLEMENTED

### File 1: backend/src/api/agent-configs.ts (recreated)

**Routes registered**:
- `GET /api/agents/configs/:agentType` - Returns config + integration status
- `POST /api/agents/configs/:agentType` - Upsert config
- `POST /api/agents/configs/:agentType/validate` - Validate config

**Auth behavior**:
- 401 if no session cookie
- 200 with payload if authenticated

**Location**: Lines 1-212

### File 2: backend/src/api/integrations.ts (recreated)

**Routes registered**:
- `GET /api/integrations/connect/:provider` - Start OAuth flow

**Behavior**:
- GitHub: 302 redirect if `GITHUB_OAUTH_CLIENT_ID` configured, 501 if not
- Confluence: 501 (not yet implemented)
- Unknown provider: 400

**Security**:
- `returnTo` validated against whitelist (no open redirect)

**Location**: Lines 1-106

### File 3: backend/src/server.app.ts

**Change**: Import and register new route handlers

**Lines 9-16**:
```typescript
import { agentConfigRoutes } from './api/agent-configs.js';
import { integrationsRoutes } from './api/integrations.js';
```

**Lines 143-144** (after existing route registrations):
```typescript
await app.register(agentConfigRoutes);
await app.register(integrationsRoutes);
```

---

## REGISTERED ROUTES (AFTER FIX)

Confirmed via backend startup + manual curl tests:

| Method | Path | Status | Response |
|--------|------|--------|----------|
| GET | `/health` | 200 | `{"status":"ok"}` |
| GET | `/api/agents/configs/scribe` | 401 | `{"error":{"code":"UNAUTHORIZED"}}` |
| GET | `/api/integrations/connect/github` | 302 | Location: GitHub OAuth URL |

No more 404s!

---

## TESTING PROOF

### Backend Quality Gates
```bash
$ cd backend
$ pnpm typecheck  # ✅ PASS
$ pnpm lint       # ✅ PASS
$ NODE_ENV=test pnpm test  # ✅ 85/85 PASS
```

### Runtime Smoke
```bash
$ curl http://localhost:3000/health
{"status":"ok"}

$ curl http://localhost:3000/api/agents/configs/scribe
{"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}
# ✅ 401 (expected without session), not 404

$ curl -v http://localhost:3000/api/integrations/connect/github?returnTo=/dashboard
< HTTP/1.1 302 Found
< Location: https://github.com/login/oauth/authorize?client_id=...
# ✅ 302 redirect (expected), not 404
```

---

## FRONTEND IMPACT

No frontend changes needed. Frontend was already calling the correct paths:

**File**: `frontend/src/services/api/agent-configs.ts:117`
```typescript
`/api/agents/configs/${agentType}`
```

**File**: `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx:424`
```typescript
`${backendUrl}/api/integrations/connect/github?returnTo=${returnTo}`
```

---

## BACKWARD COMPATIBILITY

✅ No breaking changes  
✅ Existing `/api/agents/jobs` routes unchanged  
✅ Auth flow unchanged  
✅ All existing tests pass

---

## DEFINITION OF DONE

- [x] No 404 for `/api/agents/configs/:agentType`
- [x] No 404 for `/api/integrations/connect/:provider`
- [x] Backend tests pass (85/85)
- [x] Frontend tests pass (34/34)
- [x] Runtime smoke successful
- [x] Evidence documented

