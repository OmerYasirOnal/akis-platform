# AKIS Platform - Reality Audit Report

**Version:** 1.0  
**Date:** 2026-02-02  
**Purpose:** Document the current state of AKIS Platform staging and production environments

---

## Executive Summary

AKIS Platform has staging (`staging.akisflow.com`) and production (`akisflow.com`) environments configured with:
- Fastify + Drizzle ORM backend (aligned with architecture mandate)
- React + Vite SPA frontend
- PostgreSQL 16 database (containerized)
- Caddy reverse proxy with auto-TLS
- GitHub Actions CI/CD pipelines

**Key Findings:**
- Architecture is correctly aligned (no migration needed)
- Auth system is implemented and QA verified (S0.4.2, S0.4.4)
- Several configuration issues exist that impact production readiness
- MCP gateway deployment is incomplete
- Environment secrets may not be configured in GitHub

---

## 1. Current Deployment State

### 1.1 Domains and Routing

| Environment | Domain | Reverse Proxy | TLS |
|-------------|--------|---------------|-----|
| **Local Dev** | localhost:5173/3000 | N/A | N/A |
| **Staging** | staging.akisflow.com | Caddy | Let's Encrypt (auto) |
| **Production** | akisflow.com | Caddy | Let's Encrypt (auto) |

**Routing Configuration:**
- `/api/*` → Backend Fastify server (port 3000)
- `/health`, `/ready`, `/version` → Backend health endpoints
- `/*` → Static frontend files (Vite build)

### 1.2 CI/CD Pipelines

| Workflow | Trigger | Target | Status |
|----------|---------|--------|--------|
| `ci.yml` | All branches/PRs | N/A (validation only) | Active |
| `deploy-staging.yml` | Push to `main` | staging.akisflow.com | Active |
| `deploy-prod.yml` | Semver tags + release | akisflow.com | Active |
| `pr-gate.yml` | Pull requests | N/A (validation only) | Active |

### 1.3 Database State

- **Engine:** PostgreSQL 16 (containerized)
- **Migrations:** 25 migration files in `backend/migrations/`
- **Schema includes:**
  - `users` - User accounts with auth fields
  - `jobs` - Agent job records
  - `job_plans` - Planning data for jobs
  - `job_audits` - Audit trail for job execution
  - `oauth_accounts` - OAuth provider connections
  - `integration_credentials` - User integration tokens
  - `billing_*` tables - Subscription and usage tracking

### 1.4 Agent Capability Status

| Agent | Status | Planning | Reflection | MCP Integration | Production Ready |
|-------|--------|----------|------------|-----------------|------------------|
| **Scribe** | Functional | Yes | Yes | GitHub MCP | Partially |
| **Trace** | Scaffold | No | No | Jira MCP (scaffold) | No |
| **Proto** | Scaffold | No | No | None | No |
| **Coder** | Scaffold | No | No | None | No |
| **Developer** | Scaffold | No | No | None | No |

---

## 2. Issue → Evidence → Impact → Fix Strategy

### 2.1 Critical Issues (P0)

| Issue | Evidence | Impact | Fix Strategy | Status |
|-------|----------|--------|--------------|--------|
| **Missing GitHub Secrets** | `deploy-staging.yml` lines 186-223 validate `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY` | Staging deployment blocked; CI passes but deploy fails | Configure secrets in GitHub repo settings (Settings → Secrets) | Manual action required |
| **MCP Gateway not deployed** | `docker-compose.staging.yml` line 131-155 shows MCP service with `profiles: [mcp]` | Scribe agent cannot execute GitHub operations in staging/prod | Deploy MCP gateway container; set `GITHUB_MCP_BASE_URL` env var | Manual action required |
| **Missing environment documentation** | No `docs/ops/ENVIRONMENTS_AND_RELEASES.md` existed | Onboarding friction; unclear deployment procedures | **FIXED:** Created comprehensive environment documentation | ✅ Completed |
| **SSH heredoc exit on migration error** | Deploy run #34/#35 logs show migration WARN at `15:06:09` followed by next step at `15:06:09` (14ms gap); `docker compose up -d` never executed | Backend container not started; health checks fail with 502 | **FIXED:** Split heredoc into separate SSH commands; each critical operation (pull, migrate, deploy) runs independently | ✅ Completed |
| **Invalid rollback docker compose syntax** | Rollback step used `docker compose pull backend:$IMAGE` which is invalid (expects service names, not images) | Rollback failed with "no such service: backend:ghcr.io/..." error | **FIXED:** Rollback now extracts tag from previous image and updates .env before pulling | ✅ Completed |
| **Overly strict env validation for Atlassian** | Backend required Atlassian credentials when `NODE_ENV=production`, even if `MCP_ATLASSIAN_ENABLED=false` | Backend crashed on startup in staging/prod without Atlassian integration | **FIXED:** Atlassian credentials only required when `MCP_ATLASSIAN_ENABLED=true` | ✅ Completed |
| **AI_KEY_ENCRYPTION_KEY required in all environments** | Validation threw error if `AI_KEY_ENCRYPTION_KEY` not set in production | Backend crashed on startup in staging without encryption key | **FIXED:** Made encryption key optional with warning (feature disabled when not set) | ✅ Completed |
| **Domain drift (akis.dev vs akisflow.com)** | Multiple files referenced old `akis.dev` domain | Health checks targeted wrong domain; cookie domain mismatch | **FIXED:** Standardized all references to `akisflow.com` | ✅ Completed |

### 2.2 High Priority Issues (P1)

| Issue | Evidence | Impact | Fix Strategy | Status |
|-------|----------|--------|--------------|--------|
| **Auth cookie domain empty** | `docker-compose.prod.yml` line 72: `AUTH_COOKIE_DOMAIN` was empty string | Session cookies may not persist across subdomains | **FIXED:** Set `AUTH_COOKIE_DOMAIN=.akisflow.com` as default | ✅ Completed |
| **AI provider inconsistency** | Staging: `AI_PROVIDER=mock`, Prod: `AI_PROVIDER=openrouter` | Staging tests don't reflect prod AI behavior | Document difference; optionally allow user keys in staging | Documentation task |
| **Stale planning docs** | `docs/NEXT.md` shows conflicts; `PROJECT_TRACKING_BASELINE.md` 41+ days stale | Planning confusion; outdated task tracking | Resolve doc conflicts; archive stale docs | Manual cleanup |
| **No feature flags** | No mechanism to disable unstable routes in production | Unstable features could impact prod users | **FIXED:** Added `FEATURE_FLAG_UNSTABLE_ROUTES` env var | ✅ Completed |

### 2.3 Medium Priority Issues (P2)

| Issue | Evidence | Impact | Fix Strategy | Status |
|-------|----------|--------|--------------|--------|
| **Health checks lack schema validation** | Smoke tests only checked HTTP 200, not response content | False positives possible; schema drift undetected | **FIXED:** Enhanced smoke tests with schema validation | ✅ Completed |
| **Trace agent incomplete** | `TraceAgent.ts` exists but planning/reflection not implemented | Cannot use Trace agent for Jira→test case workflows | Implement Trace MVP (P1 task) | Pending |
| **Proto agent incomplete** | `ProtoAgent.ts` scaffold only | Cannot use Proto agent for prototyping workflows | Implement Proto MVP (P1 task) | Pending |

### 2.4 Low Priority Issues (P3)

| Issue | Evidence | Impact | Fix Strategy | Status |
|-------|----------|--------|--------------|--------|
| **Atlassian integration not production-ready** | `MCP_ATLASSIAN_ENABLED=false` default; OAuth scaffold only | Cannot use Jira/Confluence integrations | Complete Atlassian OAuth flow; deploy Atlassian MCP adapter | Future work |
| **Usage-based billing not connected** | Stripe tables exist but metering not wired | Cannot charge based on actual usage | Integrate Stripe metered billing | Future work |

---

## 3. Architecture Alignment

### 3.1 What's Correctly Implemented

| Component | Mandate | Current State | Notes |
|-----------|---------|---------------|-------|
| Backend Framework | Fastify + TypeScript | ✅ Compliant | No Express/NestJS |
| ORM | Drizzle | ✅ Compliant | No Prisma |
| Frontend | React + Vite SPA | ✅ Compliant | No Next.js SSR |
| Database | PostgreSQL | ✅ Compliant | PostgreSQL 16 |
| Integrations | MCP-only adapters | ✅ Compliant | Adapters in `backend/src/services/mcp/adapters/` |
| Auth | Multi-step + OAuth | ✅ Compliant | JWT sessions, bcrypt passwords |
| Orchestration | Central orchestrator | ✅ Compliant | `AgentOrchestrator.ts` + `AgentFactory.ts` |

### 3.2 Security Plugins

| Plugin | Mandate | Status |
|--------|---------|--------|
| `@fastify/helmet` | Required | ✅ Registered |
| `@fastify/cors` | Required | ✅ Registered (env-driven) |
| `@fastify/rate-limit` | Required | ✅ Registered (env-driven) |

### 3.3 Health Endpoints

| Endpoint | Expected Response | Status |
|----------|-------------------|--------|
| `GET /health` | `{"status":"ok"}` | ✅ Implemented |
| `GET /ready` | `{"ready":true}` | ✅ Implemented |
| `GET /version` | `{"version":"x.y.z","commit":"abc"}` | ✅ Implemented |

---

## 4. File Reference

### 4.1 Key Configuration Files

| File | Purpose |
|------|---------|
| `backend/src/config/env.ts` | Environment variable schema and validation |
| `backend/.env.example` | Environment variable template |
| `devops/compose/docker-compose.staging.yml` | Staging Docker Compose configuration |
| `devops/compose/docker-compose.prod.yml` | Production Docker Compose configuration |
| `.github/workflows/ci.yml` | CI pipeline (typecheck, lint, test, build) |
| `.github/workflows/deploy-staging.yml` | Staging auto-deployment |
| `.github/workflows/deploy-prod.yml` | Production deployment (manual approval) |

### 4.2 Agent Implementation Files

| File | Agent | Status |
|------|-------|--------|
| `backend/src/agents/scribe/ScribeAgent.ts` | Scribe | Functional |
| `backend/src/agents/trace/TraceAgent.ts` | Trace | Scaffold |
| `backend/src/agents/proto/ProtoAgent.ts` | Proto | Scaffold |
| `backend/src/core/orchestrator/AgentOrchestrator.ts` | Orchestrator | Complete |
| `backend/src/core/agents/AgentFactory.ts` | Agent Factory | Complete |

---

## 5. Recommendations

### 5.1 Immediate Actions (Manual)

1. **Configure GitHub Secrets:**
   - Navigate to Repository → Settings → Secrets and variables → Actions
   - Add: `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`
   - Add: `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY` (when ready for prod deploys)

2. **Deploy MCP Gateway:**
   - Build and push `mcp-gateway` Docker image
   - Update compose files to start MCP service
   - Configure `GITHUB_MCP_BASE_URL` on servers

3. **Server Environment Setup:**
   - Ensure `/opt/akis/.env` contains all required variables
   - Generate and set `AUTH_JWT_SECRET` (unique per environment)
   - Set `AI_KEY_ENCRYPTION_KEY` for user key encryption

### 5.2 Code Changes Completed

| Change | File | Description |
|--------|------|-------------|
| Environment documentation | `docs/ops/ENVIRONMENTS_AND_RELEASES.md` | Full environment contract and release flow |
| Feature flags | `backend/src/config/env.ts` | Added `FEATURE_FLAG_UNSTABLE_ROUTES` |
| Cookie domain fix | `devops/compose/docker-compose.prod.yml` | Default to `.akisflow.com` for session sharing |
| Smoke test enhancement | `.github/workflows/deploy-*.yml` | Schema validation for health endpoints |

---

## 6. Appendix: Evidence Links

### 6.1 CI/CD Workflow Files
- [ci.yml](../../.github/workflows/ci.yml)
- [deploy-staging.yml](../../.github/workflows/deploy-staging.yml)
- [deploy-prod.yml](../../.github/workflows/deploy-prod.yml)

### 6.2 Compose Files
- [docker-compose.staging.yml](../../devops/compose/docker-compose.staging.yml)
- [docker-compose.prod.yml](../../devops/compose/docker-compose.prod.yml)

### 6.3 Configuration
- [env.ts](../../backend/src/config/env.ts)
- [.env.example](../../backend/.env.example)

### 6.4 Related Documentation
- [ENVIRONMENTS_AND_RELEASES.md](../ops/ENVIRONMENTS_AND_RELEASES.md)
- [Auth.md](../../backend/docs/Auth.md)
