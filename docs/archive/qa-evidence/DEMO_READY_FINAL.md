# AKIS Platform - Demo Ready Final Report

**Date**: 2026-01-10  
**Main Branch**: `main` (PR #170 merged)  
**Status**: ✅ **DEMO READY**

---

## Executive Summary

AKIS Platform is now **demo-ready and integration-ready** end-to-end. All quality gates pass, runtime is verified, and key UX features are complete.

### Key Achievements (PR #170)

| Feature | Status | Description |
|---------|--------|-------------|
| **Live Progress** | ✅ Complete | Real-time trace events with emoji indicators (▶✓🤖⚡❌) |
| **Duplicate Prevention** | ✅ Complete | Cannot start duplicate runs for same repo; shows warning |
| **Branch Strategy** | ✅ Complete | Auto-create vs Manual with preview and refresh |
| **Integrations Hub** | ✅ Complete | Never 500s - graceful degradation |
| **GitHub OAuth** | ✅ Complete | OAuth flow with CSRF protection |
| **Jira/Confluence Connect** | ✅ Complete | MCP-based with encrypted storage |

---

## Quick Start

### Prerequisites

```bash
# Required
- Node.js ≥ 20
- Docker (for PostgreSQL)
- GitHub Personal Access Token (for MCP Gateway)

# Optional (for full agent functionality)
- GitHub OAuth App credentials
- OpenRouter or OpenAI API key
```

### 1. Start Database

```bash
cd devagents
./scripts/db-up.sh  # Starts PostgreSQL on port 5433
```

### 2. Start Backend

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
cd backend
pnpm install
pnpm db:migrate
pnpm dev  # http://localhost:3000
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### 4. Verify Health

```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"..."}

curl http://localhost:3000/ready
# {"ready":true,"database":"connected"}
```

---

## Login Credentials (Test User)

| Field | Value |
|-------|-------|
| Email | `t@t.com` |
| Password | `12345678` |

---

## Demo Flow

### A) Login & Dashboard
1. Open http://localhost:5173/login
2. Login with test credentials
3. Dashboard should load with sidebar navigation

### B) Integrations Hub
1. Navigate to `/dashboard/integrations`
2. **GitHub**: Click "Connect" → OAuth flow
3. **Jira/Confluence**: Click "Connect" → Modal with credentials form
4. ✅ Page never crashes (graceful degradation)

### C) Agents Hub
1. Navigate to `/dashboard/agents`
2. Select **Scribe** agent
3. Choose repository and base branch
4. Select branch strategy:
   - **Auto-create**: Shows `scribe/docs-YYYYMMDD-HHMMSS` preview
   - **Manual**: Creates unique branch from base
5. Click **Run Agent**
6. ✅ Live progress appears with trace events
7. ✅ If job running, button disabled + warning shown

### D) AI Keys (Optional)
1. Navigate to `/dashboard/settings/ai-keys`
2. Add OpenRouter or OpenAI key
3. Agents will use this for AI operations

---

## Quality Gates

| Check | Backend | Frontend |
|-------|---------|----------|
| **Typecheck** | ✅ Pass | ✅ Pass |
| **Lint** | ✅ Pass | ✅ Pass (1 warning) |
| **Test** | ✅ 183 pass | ✅ 49 pass |
| **Build** | ✅ Pass | ✅ Pass |

### Run All Checks

```bash
# Backend
cd backend && pnpm typecheck && pnpm lint && pnpm test && pnpm build

# Frontend
cd frontend && npm run typecheck && npm run lint && npm run test && npm run build
```

---

## Environment Variables

### Backend (`backend/.env.local`)

```bash
# Required
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2

# For GitHub OAuth (optional)
GITHUB_OAUTH_CLIENT_ID=your_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret
GITHUB_OAUTH_CALLBACK_URL=http://localhost:3000/api/integrations/github/oauth/callback

# For AI (optional - defaults to mock)
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-v1-...

# For MCP Gateway (optional)
GITHUB_MCP_BASE_URL=http://localhost:4010/mcp
GITHUB_TOKEN=ghp_...
```

### Frontend (`frontend/.env`)

```bash
VITE_API_URL=http://localhost:3000
```

---

## OAuth Setup (Optional)

### GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Create OAuth App:
   - **Application name**: AKIS Local Dev
   - **Homepage URL**: http://localhost:5173
   - **Callback URL**: http://localhost:3000/api/integrations/github/oauth/callback
3. Copy Client ID and Client Secret to `backend/.env.local`

---

## Architecture Overview

### Integration Flow

```
User → Frontend (React SPA)
         ↓
     Backend (Fastify)
         ↓
   ┌─────┴─────┐
   ↓           ↓
GitHub      Jira/Confluence
(OAuth)     (API Token)
   ↓           ↓
   MCP Adapters
```

### Live Progress Flow

```
1. User clicks "Run Agent"
2. Backend creates job (pending → running)
3. Backend emits trace events as job progresses
4. Frontend polls /api/agents/jobs/:id?include=trace every 1 second
5. UI shows latest 5 trace events with emoji indicators
6. Job completes → frontend shows final status
```

### Duplicate Prevention Flow

```
1. Frontend polls /api/agents/jobs/running every 3 seconds
2. If job running for same owner/repo:
   - "Run Agent" button disabled
   - Warning banner shown with "View Run" link
3. User can still view job progress
4. Only one job per repo at a time
```

---

## Known Limitations

1. **Frontend lint warning**: `react-hooks/exhaustive-deps` in DashboardIntegrationsPage.tsx (non-blocking)
2. **AI Provider**: Agent runs require AI key for full functionality (mock by default)
3. **MCP Gateway**: Required for GitHub operations (branch create, commit)

---

## Troubleshooting

### "Table not found" or 500 errors

```bash
# Check DATABASE_URL port (should be 5433)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
cd backend && pnpm db:migrate
```

### GitHub OAuth "state_mismatch"

- Clear cookies and try again
- Ensure `GITHUB_OAUTH_CALLBACK_URL` matches GitHub App settings

### Agent runs but no AI response

- Check `AI_PROVIDER` is set to `openrouter` or `openai`
- Ensure `AI_API_KEY` is valid
- Check backend logs for AI errors

---

## Files Changed (PR #170)

- `backend/src/api/integrations.ts` - Graceful error handling
- `backend/src/api/agents.ts` - Running jobs endpoint, duplicate prevention
- `frontend/src/pages/dashboard/agents/AgentsHubPage.tsx` - Live progress, branch strategy
- `frontend/src/pages/dashboard/integrations/IntegrationsHubPage.tsx` - Error display
- `docs/qa/DEMO_READINESS_PR170.md` - Demo checklist

---

## Next Steps

1. **Demo**: Platform is ready for demo presentations
2. **Production**: Configure real OAuth and AI keys
3. **Phase 2**: OCI hosting + real user pilots
