# Demo Readiness Report - PR #170

**PR**: feat: live agent progress, duplicate prevention, and stability improvements  
**Branch**: `feat/agents-live-progress-and-stability`  
**Date**: 2026-01-10  
**Status**: Ready for Demo

---

## Summary

PR #170 delivers:
- **Stability**: Integration status endpoints never return 500
- **Live Progress**: Real-time trace events during agent runs
- **Duplicate Prevention**: Cannot start duplicate runs for same repo
- **Branch Strategy**: Auto-create or manual branch selection

---

## Quick Start

### Prerequisites
```bash
# PostgreSQL on port 5433
docker compose -f docker-compose.dev.yml up -d

# Verify database
docker ps | grep postgres  # Should show healthy
```

### Run Quality Checks
```bash
# Backend
cd backend && pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm build

# Frontend
cd frontend && pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm build

# MCP Gateway
cd mcp-gateway && pnpm install && pnpm build
```

### Start Services
```bash
# Terminal 1: Backend
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
cd backend && pnpm dev

# Terminal 2: Frontend
cd frontend && pnpm dev
```

### Verify Health
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}

curl http://localhost:3000/ready
# Expected: {"ready":true,"database":"connected","timestamp":"..."}
```

---

## Terminal-Based Tests

### Integration Status Endpoints (Requirement A)

```bash
# Without authentication - returns 401 (expected)
curl -s http://localhost:3000/api/integrations/jira/status
# {"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}

curl -s http://localhost:3000/api/integrations/confluence/status
# {"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}
```

**Key Point**: Endpoints return 401 (auth required) NOT 500 (server error).

With authentication (via UI), these return:
```json
{"connected":false}
```
or if configured:
```json
{"connected":true,"siteUrl":"...","userEmail":"..."}
```

---

## Manual UI QA Checklist

**Login Credentials**:
- Email: `t@t.com`
- Password: `12345678`

### A) Integrations Page - No 500 Errors
- [ ] Open http://localhost:5173/login and login
- [ ] Navigate to http://localhost:5173/dashboard/integrations
- [ ] Page loads without errors
- [ ] Jira shows "Not Connected" (no crash)
- [ ] Confluence shows "Not Connected" (no crash)
- [ ] GitHub shows "Connect" button

### B) Agents Live Progress
- [ ] Connect GitHub via OAuth (requires setup)
- [ ] Navigate to http://localhost:5173/dashboard/agents
- [ ] Select repository and branch
- [ ] Click "Run Agent"
- [ ] Live Progress section appears with trace events
- [ ] Events update every 1-2 seconds

### C) Duplicate Run Prevention
- [ ] While job is running, "Run Agent" button is disabled
- [ ] "Agent is already running" warning appears
- [ ] Navigate away and return - warning persists
- [ ] Cannot start second run for same repo

### D) Branch Strategy
- [ ] "Auto-create" and "Manual" radio buttons present
- [ ] Auto-create shows `scribe/docs-YYYYMMDD-HHMMSS` preview
- [ ] "Refresh" button regenerates preview
- [ ] Manual mode allows custom branch selection

### E) Profile Save
- [ ] Navigate to http://localhost:5173/dashboard/settings/profile
- [ ] Change name and click "Save Profile"
- [ ] Success message appears
- [ ] Name updates immediately without refresh

---

## Environment Variables

| Variable | Purpose | Required for Demo? | Default |
|----------|---------|-------------------|---------|
| `DATABASE_URL` | PostgreSQL connection | Yes | `postgresql://postgres:postgres@localhost:5433/akis_v2` |
| `AKIS_PORT` | Backend port | No | `3000` |
| `VITE_API_URL` | Frontend API base | No | `http://localhost:3000` |
| `GITHUB_OAUTH_CLIENT_ID` | GitHub OAuth | For GitHub features | None (optional) |
| `GITHUB_OAUTH_CLIENT_SECRET` | GitHub OAuth | For GitHub features | None (optional) |
| `AI_PROVIDER` | AI service | For agent runs | `mock` |

### GitHub OAuth Setup (Optional)
To test GitHub integration:
1. Create OAuth App at https://github.com/settings/developers
2. Set callback URL: `http://localhost:3000/api/integrations/github/oauth/callback`
3. Add to `backend/.env.local`:
   ```
   GITHUB_OAUTH_CLIENT_ID=your_client_id
   GITHUB_OAUTH_CLIENT_SECRET=your_client_secret
   GITHUB_OAUTH_CALLBACK_URL=http://localhost:3000/api/integrations/github/oauth/callback
   ```

---

## Test Results Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Backend typecheck | ✅ Pass | - |
| Backend lint | ✅ Pass | - |
| Backend tests | ✅ Pass | 24 tests |
| Backend build | ✅ Pass | - |
| Frontend typecheck | ✅ Pass | - |
| Frontend lint | ✅ Pass | 1 warning (non-blocking) |
| Frontend tests | ✅ Pass | 49 tests |
| Frontend build | ✅ Pass | - |
| MCP Gateway build | ✅ Pass | - |
| Health endpoint | ✅ 200 | - |
| Ready endpoint | ✅ 200 | - |
| Integration status | ✅ 401/200 | No 500 errors |

---

## Changes in PR #170

### Files Modified
- `backend/src/api/integrations.ts` - Graceful error handling
- `backend/src/api/agents.ts` - Running jobs endpoint, duplicate prevention
- `frontend/src/services/api/integrations.ts` - Error type updates
- `frontend/src/services/api/agents.ts` - Running jobs API
- `frontend/src/pages/dashboard/integrations/IntegrationsHubPage.tsx` - Error display
- `frontend/src/pages/dashboard/agents/AgentsHubPage.tsx` - Live progress, branch strategy

### Cleanup Done
- Removed accidental `pnpm-lock 2.yaml` (tracked garbage file)
- Removed accidental root `node_modules/` directory

---

## Known Limitations

1. **Frontend lint warning**: `react-hooks/exhaustive-deps` in DashboardIntegrationsPage.tsx (non-blocking)
2. **GitHub OAuth**: Requires manual setup in GitHub Developer Console
3. **AI Provider**: Agent runs require AI key configuration for full functionality

---

## Next Steps

1. Merge PR #170 via GitHub UI or CLI:
   ```bash
   gh pr merge 170 --squash --delete-branch
   ```
2. For demo: Set up GitHub OAuth App if testing agent runs
3. Optional: Configure AI provider keys for full agent functionality
