# Scribe Agent Pipeline Audit

**Date:** 2025-11-26  
**Author:** System Architect  
**Branch:** `feat/scribe-hardening-logout-fix`  
**Status:** Pre-implementation audit with fixes applied

---

## 1. Executive Summary

This document audits the Scribe agent pipeline from end-to-end, identifying known issues, implemented fixes, and remaining work. The audit covers the complete flow from frontend form submission through backend execution to the Jobs UI.

---

## 2. High-Level Architecture Overview

```
┌─────────────────────┐     ┌────────────────────────┐     ┌──────────────────────┐
│  Frontend           │     │  Backend API           │     │  External Services   │
│  (React + Vite)     │────>│  (Fastify + TypeScript)│────>│  (GitHub, AI)        │
└─────────────────────┘     └────────────────────────┘     └──────────────────────┘
         │                            │                              │
         │  POST /api/agents/jobs     │  AgentOrchestrator          │
         │  { type: "scribe", ... }   │  → ScribeAgent              │
         │                            │  → AIService (planner)      │
         │                            │  → GitHubMCPService         │
         ▼                            ▼                              ▼
   Jobs List/Detail UI         PostgreSQL (jobs table)        GitHub MCP API
```

---

## 3. Pipeline Step-by-Step Flow

### 3.1 Frontend - Job Submission

**Files:**
- `frontend/src/pages/dashboard/agents/DashboardAgentScribeRunPage.tsx` - Form UI
- `frontend/src/pages/agents/useAgentRunner.ts` - Hook for job submission/polling
- `frontend/src/services/api/agents.ts` - API client methods
- `frontend/src/services/api/HttpClient.ts` - HTTP client with retry

**Flow:**
1. User fills form with `owner`, `repo`, `baseBranch`, optional `featureBranch`, `taskDescription`
2. Form validation ensures required fields are present
3. `useAgentRunner.runAgent()` calls `agentsApi.runAgent('scribe', payload)`
4. `HttpClient.post('/api/agents/jobs', { type: 'scribe', payload })` sends request
5. On success, starts polling for job status updates

### 3.2 Backend - Job Creation

**Files:**
- `backend/src/api/agents.ts` - POST /api/agents/jobs handler
- `backend/src/core/orchestrator/AgentOrchestrator.ts` - Job orchestration

**Flow:**
1. Request validated via Zod schema (`scribePayloadSchema`)
2. `orchestrator.submitJob()` creates job row with state `pending`
3. `orchestrator.startJob()` called immediately (synchronous execution)
4. Job transitions to `running` state
5. Returns `{ jobId, state }` to frontend

### 3.3 Backend - Agent Execution

**Files:**
- `backend/src/agents/scribe/ScribeAgent.ts` - Scribe agent implementation
- `backend/src/services/ai/AIService.ts` - AI planner/reflector
- `backend/src/services/mcp/adapters/GitHubMCPService.ts` - GitHub MCP adapter
- `backend/src/core/state/AgentStateMachine.ts` - FSM for job lifecycle

**Flow:**
1. **Planning Phase** (if `playbook.requiresPlanning = true`):
   - `agent.plan(aiService.planner, context)` called
   - AIService calls OpenRouter/OpenAI API
   - Plan stored in `job_plans` table
   - Audit entry created in `job_audits` table

2. **Execution Phase**:
   - `agent.executeWithTools(mcpTools, plan, context)` called
   - For Scribe: reads target file, generates new content, commits via GitHub MCP
   - Execution result stored

3. **Reflection Phase** (if `playbook.requiresReflection = true`):
   - `agent.reflect(aiService.reflector, result)` called
   - Critique stored in `job_audits` table

4. **Validation Phase** (if `requiresStrictValidation = true`):
   - `aiService.validateWithStrongModel()` called
   - Static checks (lint, typecheck) run
   - Validation result appended to job result

5. **Completion**:
   - Job state transitions to `completed` or `failed`
   - Result/error stored in database

### 3.4 Frontend - Job Status Display

**Files:**
- `frontend/src/pages/JobsListPage.tsx` - Jobs list with filtering
- `frontend/src/pages/JobDetailPage.tsx` - Job detail view
- `frontend/src/components/agents/JobStatus.tsx` - Status display component

**Flow:**
1. Polling via `useAgentRunner` fetches job status every 2.5s
2. State updates trigger UI re-render
3. Terminal states (completed/failed) stop polling
4. Error information displayed with `errorCode` and `errorMessage`

---

## 4. Known Issues (Pre-Fix)

### 4.1 P0 - Logout Flow Broken

**Issue:** `POST /auth/logout` returned `400 FST_ERR_CTP_EMPTY_JSON_BODY` when frontend sent request with `Content-Type: application/json` but no body.

**Root Cause:** 
- Fastify's default JSON parser rejects empty bodies
- Frontend HttpClient always set `Content-Type: application/json`

**Fix Applied:**
- Backend: Custom JSON parser that treats empty body as `{}`
- Frontend: HttpClient only sets `Content-Type` when body is present
- Frontend: auth.ts logout call explicitly sends no body

### 4.2 P1 - AI Rate Limiting Not Handled

**Issue:** Scribe jobs failed silently when OpenRouter returned 429 (rate limited).

**Error seen:**
```
Planning failed for job ... AI API error (429) for deepseek/deepseek-r1:free
```

**Root Cause:**
- AIService had no retry logic
- Error not classified or propagated to Job record
- No user-friendly message in UI

**Fix Applied:**
- New error types: `AIProviderError`, `AIRateLimitedError`
- Retry logic with exponential backoff in `AIService.chatCompletion()`
- `errorCode` and `errorMessage` fields added to jobs table
- Error handler updated to classify AI errors
- Frontend UI updated to display error information

### 4.3 P1 - Job Errors Not Surfaced

**Issue:** Jobs list showed `FAILED` state but no indication of why.

**Fix Applied:**
- Jobs API returns `errorCode` and `errorMessage`
- JobsListPage displays error badge and message
- JobDetailPage shows structured error information

### 4.4 P2 - HTTP Client Inconsistencies

**Issue:** Both frontend and backend HTTP clients could send `Content-Type: application/json` without body.

**Fix Applied:**
- Frontend HttpClient: Only set Content-Type when body present
- Backend HttpClient: Same fix applied

---

## 5. Remaining Work (TODO)

### P0 - Critical

- [ ] **Database migration** for new `error_code` and `error_message` columns
- [ ] **Test coverage** for logout flow changes
- [ ] **Test coverage** for AI rate limiting scenarios

### P1 - Important

- [ ] **Planner model fallback**: Add `AI_MODEL_PLANNER_FALLBACK` env var for automatic fallback when primary is rate-limited
- [ ] **Job retry mechanism**: Allow users to retry failed jobs from UI
- [ ] **Webhook support**: Notify external systems when jobs complete/fail

### P2 - Nice to Have

- [ ] **Rate limit monitoring**: Track 429 occurrences for observability
- [ ] **AI cost tracking**: Log token usage per job for cost analysis
- [ ] **Batch job support**: Queue multiple Scribe jobs for sequential execution

### P3 - Future

- [ ] **GitHub App installation flow**: Replace personal tokens with App-based auth
- [ ] **Confluence integration**: Enable Scribe to update Confluence pages
- [ ] **Real-time status**: WebSocket or SSE for job status instead of polling

---

## 6. Environment Configuration

### Required Variables

```env
# AI Configuration
AI_PROVIDER=openrouter|openai|mock
AI_API_KEY=<your-api-key>
AI_BASE_URL=https://openrouter.ai/api/v1  # Optional, defaults based on provider
AI_MODEL_DEFAULT=meta-llama/llama-3.3-70b-instruct:free
AI_MODEL_PLANNER=deepseek/deepseek-r1:free  # Or your preferred model
AI_MODEL_VALIDATION=anthropic/claude-3-opus  # Strong model for validation

# Retry configuration
AI_PLANNER_MAX_RETRIES=3
AI_RETRY_BASE_DELAY_MS=1000

# GitHub MCP
GITHUB_MCP_BASE_URL=https://api.github.com/mcp  # Or your MCP proxy
GITHUB_TOKEN=<personal-access-token>  # For MVP; use GitHub App in production
```

---

## 7. Testing Recommendations

### Unit Tests

1. `AIService.chatCompletion()` retry logic
2. `AgentOrchestrator.failJob()` with AI errors
3. Error classification in `mapErrorToCode()`

### Integration Tests

1. Logout flow end-to-end
2. Scribe job creation with mock AI
3. Job listing with error filtering

### Manual Smoke Tests

1. Login → Dashboard → Run Scribe → Verify job appears
2. Simulate AI rate limit (use invalid API key or rate-limited model)
3. Verify error displayed in Jobs UI
4. Logout → Verify redirect to home

---

## 8. Conclusion

This audit identified critical issues in the auth and Scribe pipelines. The implemented fixes address:

1. **Logout reliability** - Users can now reliably log out without API errors
2. **AI resilience** - Rate limiting is handled gracefully with retry and clear error messages
3. **Error visibility** - Failed jobs now show why they failed

The pipeline is now more robust for production use, though database migration and additional test coverage remain as follow-up work.

