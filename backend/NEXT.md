# Backend NEXT — Gap Audit (2025-01-08)

## Summary

Backend audit focused on architecture compliance, security, API completeness, and database integrity. Core findings: Fastify + Drizzle architecture is solid, orchestrator pattern correctly implemented, but security plugins (helmet, CORS) exist but not fully wired, rate limiting missing, and no .env.example for onboarding.

### Architecture Compliance ✅
- ✅ Fastify (not Express)
- ✅ Drizzle ORM (no Prisma found)
- ✅ PostgreSQL with proper migrations
- ✅ ESM imports with `.js` extensions
- ✅ Orchestrator pattern isolates agents (no agent-to-agent calls)
- ✅ Dependency injection (AIService, MCPTools)

## Scorecard

| Area | Status | Key Risks | Confidence |
|------|--------|-----------|------------|
| API Routes | 🟢 green | /auth/*, /agents/jobs, /health, /metrics all present; Swagger/OpenAPI configured | high |
| Security Plugins | 🔴 red | Helmet and CORS plugins exist but not registered in server.app.ts | high |
| Rate Limiting | 🔴 red | @fastify/rate-limit installed but not configured or registered | high |
| Env Validation | 🟢 green | Zod schema in env.ts is comprehensive; fail-fast on invalid config | high |
| Database/Drizzle | 🟢 green | Migrations present (0000-0003); schema.ts complete with jobs, users, jobPlans, jobAudits | high |
| Orchestrator/Agents | 🟢 green | Orchestrator manages lifecycle; agents register via AgentFactory; no cross-agent calls | high |
| MCP Adapters | 🟡 amber | Signature-only adapters (GitHubMCP, JiraMCP, ConfluenceMCP) exist but not instantiated | medium |
| AI Service | 🟡 amber | AIService.ts has mock planner/reflector; OpenRouter provider configured but marked TODO for real LLM calls | medium |
| Error Handling | 🟢 green | Unified error model in errorHandler.ts; custom error classes (JobNotFoundError, etc.) | high |
| Logging | 🟢 green | Pino with request-id; structured logging; onResponse hook for metrics | high |
| Metrics | 🟢 green | Prometheus metrics via prom-client; /metrics endpoint; job lifecycle tracked | high |

## Findings & Tasks

### [Backend/Security] Register Helmet Plugin
- **Why**: Helmet plugin code exists (plugins/security/helmet.ts) but not registered in server.app.ts
- **Scope**: backend/src/server.app.ts, backend/src/plugins/security/helmet.ts
- **Acceptance**: 
  - Import helmetPlugin in server.app.ts
  - Register before routes: `await app.register(helmetPlugin, { enableCSP: env.NODE_ENV === 'production' })`
  - Verify CSP headers in dev/prod
  - Add comment explaining CSP tuning (Swagger UI may need unsafe-inline for styles)
- **Impact**: high (security)
- **Effort**: S
- **Confidence**: high
- **Links**: backend/src/plugins/security/helmet.ts:1-19, backend/src/server.app.ts:1-156

### [Backend/Security] Register CORS Plugin
- **Why**: CORS plugin code exists (plugins/security/cors.ts) but not registered in server.app.ts
- **Scope**: backend/src/server.app.ts, backend/src/plugins/security/cors.ts
- **Acceptance**: 
  - Import corsPlugin in server.app.ts
  - Register before routes: `await app.register(corsPlugin, { origins: env.CORS_ORIGINS })`
  - Verify CORS headers on OPTIONS preflight requests
  - Test with frontend at http://localhost:5173
- **Impact**: high (security + CORS issues blocking frontend)
- **Effort**: S
- **Confidence**: high
- **Links**: backend/src/plugins/security/cors.ts:1-50, backend/src/server.app.ts:1-156, backend/src/config/env.ts:15-23

### [Backend/Security] Implement Rate Limiting
- **Why**: @fastify/rate-limit is installed (package.json) but not configured; DoS risk
- **Scope**: backend/src/plugins/security/ (new file: rateLimit.ts), backend/src/server.app.ts
- **Acceptance**: 
  - Create backend/src/plugins/security/rateLimit.ts plugin wrapper
  - Configure rate limits per route type (auth: 10 req/min, agents: 30 req/min, metrics: 100 req/min)
  - Register in server.app.ts before routes
  - Document rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining)
  - Add tests for rate limit enforcement
- **Impact**: high (security)
- **Effort**: M
- **Confidence**: high
- **Links**: backend/package.json:30, backend/src/server.app.ts

### [Backend/DX] Create .env.example
- **Why**: No .env.example file; new contributors don't know what env vars are needed
- **Scope**: backend/.env.example (new file)
- **Acceptance**: 
  - List all env vars from backend/src/config/env.ts with safe placeholders
  - Include comments explaining each var
  - Mark required vs. optional
  - Add link in README.md setup instructions
- **Impact**: medium
- **Effort**: S
- **Confidence**: high
- **Links**: backend/src/config/env.ts:1-152, README.md:66-69

### [Backend/AI] Implement Real LLM Calls
- **Why**: AIService.ts planner/reflector are mocked (lines 112-140); agents can't run real workflows
- **Scope**: backend/src/services/ai/AIService.ts
- **Acceptance**: 
  - Replace mock planner with OpenRouter API calls (or chosen provider)
  - Replace mock reflector with real LLM critique flow
  - Add error handling for API failures (retries, fallbacks)
  - Document required AI_PROVIDER and AI_API_KEY env vars
  - Add integration tests with real API (optional: use test mode or mocks)
- **Impact**: high (functionality)
- **Effort**: L
- **Confidence**: medium (requires external API setup)
- **Links**: backend/src/services/ai/AIService.ts:112-140, backend/src/config/env.ts:50-51

### [Backend/MCP] Instantiate MCP Adapters
- **Why**: MCP adapter types exist but not instantiated in server.app.ts (line 38-43 is empty)
- **Scope**: backend/src/server.app.ts:38-43, backend/src/services/mcp/adapters/*.ts
- **Acceptance**: 
  - Instantiate GitHubMCPService with env.GITHUB_MCP_BASE_URL if configured
  - Instantiate JiraMCPService with env.ATLASSIAN_MCP_BASE_URL if MCP_ATLASSIAN_ENABLED=true
  - Instantiate ConfluenceMCPService similarly
  - Pass instantiated adapters to AgentOrchestrator
  - Document in ENV_SETUP.md when MCP adapters are needed
- **Impact**: medium (feature completeness)
- **Effort**: M
- **Confidence**: medium (requires external service setup)
- **Links**: backend/src/server.app.ts:36-46, backend/src/services/mcp/adapters/index.ts:1-27

### [Backend/DB] Document Migration Strategy
- **Why**: Migrations exist (0000-0003) but no docs on how to create new ones or rollback
- **Scope**: backend/migrations/README.md (already exists), docs/DB_MIGRATIONS.md (new)
- **Acceptance**: 
  - Document `pnpm db:generate` and `pnpm db:migrate` workflow
  - Explain migration naming conventions
  - Document rollback strategy (manual SQL or drizzle-kit revert)
  - Add link from CONTRIBUTING.md
- **Impact**: low
- **Effort**: S
- **Confidence**: high
- **Links**: backend/migrations/README.md, CONTRIBUTING.md

### [Backend/Logging] Verify Pino Pretty in Production
- **Why**: server.app.ts uses pino-pretty in development but should disable in production for structured JSON logs
- **Scope**: backend/src/server.app.ts:50-66
- **Acceptance**: 
  - Verify `NODE_ENV === 'production'` disables pino-pretty transport
  - Document logging format in docs/LOGGING.md (optional)
  - Add note in README about log aggregation (e.g., stdout → systemd/CloudWatch)
- **Impact**: low
- **Effort**: S
- **Confidence**: high
- **Links**: backend/src/server.app.ts:50-66

### [Backend/Tests] Expand Test Coverage
- **Why**: Some test files exist (smoke.jobs.test.ts, mcp.contract.test.ts) but coverage unknown
- **Scope**: backend/test/*.test.ts
- **Acceptance**: 
  - Add tests for auth routes (/auth/signup, /auth/login, /auth/logout, /auth/me)
  - Add tests for agents routes (/api/agents/jobs POST, GET by ID, GET list)
  - Add tests for orchestrator error handling
  - Document test patterns in docs/TESTING.md
  - Optional: Add coverage reporting (c8 or similar)
- **Impact**: medium
- **Effort**: L
- **Confidence**: medium
- **Links**: backend/test/*.test.ts

### [Backend/TODO Harvest] Address TODO Comments
- **Why**: Several TODOs found in backend codebase
- **Scope**: Multiple files (see list below)
- **Acceptance**: 
  - Review each TODO
  - Convert actionable items to issues
  - Remove or document non-critical TODOs
- **Impact**: low (individually)
- **Effort**: M
- **Confidence**: low (context dependent)
- **Links**: 
  - backend/src/core/contracts/AgentPlaybook.ts:47 — `TODO: Implement retry logic`
  - backend/src/services/ai/AIService.ts:112, 122, 130, 140 — `TODO: Implement real LLM calls`
  - .cursor/prompts/02_CORE_AGENTS_SCAFFOLD.md:9 — `orchestrator/AgentOrchestrator.ts` (shell, TODOs)

### [Backend/Observability] Add Health Check Details
- **Why**: /health endpoint exists but minimal; no DB connectivity check
- **Scope**: backend/src/api/health.ts
- **Acceptance**: 
  - Add database ping to health check (optional: SELECT 1)
  - Return status: 'ok' | 'degraded' (if DB fails)
  - Add uptime, memory usage (optional)
  - Document health check contract in docs/API.md or OpenAPI schema
- **Impact**: low
- **Effort**: S
- **Confidence**: high
- **Links**: backend/src/api/health.ts

---

## Performance Notes

### Current State
- **Dependencies**: Lightweight stack (Fastify, Drizzle, Zod, prom-client)
- **Heavy Imports**: None detected; no Prisma or heavyweight SDKs in hot paths ✅
- **OCI Free Tier**: Current dependency footprint is small; memory usage expected < 512MB ✅

### Recommendations
- Monitor memory usage in production (add to /health or /metrics)
- Avoid pulling in heavy ML/NLP libraries client-side (use MCP adapters for external services)
- Consider caching frequent DB queries (e.g., user lookup by email) with in-memory LRU cache if needed

---

## Audit Metadata

- **Date**: 2025-01-08
- **Scope**: Backend codebase (src/, test/, migrations/)
- **Method**: Static file analysis, dependency audit, architecture pattern review
- **Confidence**: High for security and architecture; medium for AI/MCP (external dependencies)

