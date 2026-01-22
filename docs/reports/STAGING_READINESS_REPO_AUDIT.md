# AKIS Platform - Staging Readiness Repository Audit

**Date**: 2026-01-13  
**Auditor**: Automated Analysis  
**Branch**: `main` (commit `08dfc26`)  
**Status**: 🟡 **STAGING-READY WITH CAVEATS**

---

## Executive Summary

This audit inspects the AKIS Platform repository end-to-end to assess staging deployment readiness on OCI Free Tier. The analysis compares "current reality" (implemented/merged) versus "planned" (WBS/roadmap), identifies gaps, and flags risk items.

### Overall Assessment

| Dimension | Status | Notes |
|-----------|--------|-------|
| **Backend Core** | ✅ Ready | Fastify server, 22 migrations, health endpoints |
| **Frontend SPA** | ✅ Ready | Vite build, Tailwind CSS, React 18 |
| **Authentication** | 🟡 Partial | Multi-step auth works; email delivery needs production config |
| **OAuth Integration** | ✅ Ready | GitHub/Google/Atlassian OAuth implemented |
| **MCP Gateway** | ✅ Ready | Docker-based, optional profile for staging |
| **CI/CD Pipeline** | ✅ Ready | `deploy-staging.yml` exists with quality gates |
| **Health Endpoints** | ✅ Ready | `/health`, `/ready`, `/version` implemented |
| **Database Migrations** | ✅ Ready | Forward-only policy, 22 migrations tracked |
| **Domain/TLS** | ⚠️ Pending | Caddyfile ready; DNS records not configured |
| **Secret Management** | 🟡 Partial | GitHub Secrets documented; actual values needed |

---

## 1. Recently Merged PRs and Functional Outcomes

### Last 15 Merged PRs (Evidence)

| PR # | Title | Functional Outcome | WBS Task ID |
|------|-------|-------------------|-------------|
| **#172** | Atlassian OAuth Connect | Jira/Confluence OAuth 3LO flow working | `T-INT-ATL-01` |
| **#171** | Atlassian OAuth 2.0 (3LO) | OAuth service + token refresh | `T-INT-ATL-01` |
| **#170** | Live agent progress + duplicate prevention | Real-time trace UI, job locking | `T-AGT-UX-01` |
| **#169** | Integrations/settings/docs complete | Demo-ready integrations hub | `T-INT-HUB-01` |
| **#168** | Dashboard polish + Jira/Confluence | Usage tracking, MCP integration | `T-UI-DASH-02` |
| **#167** | Cursor-like Agents Hub | Public site content | `T-UI-DASH-01` |
| **#166** | Cursor-inspired dashboard + AKIS liquid neon | Brand identity implementation | `T-UI-BRAND-01` |
| **#165** | Documentation updates | Docs consolidation | `T-DOC-01` |
| **#164** | OpenAI provider precedence fix | No cross-provider fallback | `T-AI-CFG-01` |
| **#163** | GitHub OAuth redirect fix | OAuth callback flow | `T-AUTH-OAUTH-01` |

### What Actually Shipped

1. **Complete OAuth Stack**: GitHub, Google, and Atlassian (Jira+Confluence) OAuth flows
2. **Live Agent Progress**: Real-time trace events with emoji indicators
3. **Duplicate Prevention**: Cannot start duplicate runs for same repository
4. **Branch Strategy UI**: Auto-create vs Manual branch selection
5. **Integrations Hub**: Graceful degradation, never 500s
6. **AI Provider Configuration**: OpenAI/OpenRouter with per-user keys
7. **Usage Tracking**: Token usage and AI call analytics

---

## 2. Current Reality vs Planning Matrix

### Backend Status

| Feature | Plan Status | Reality | Evidence |
|---------|-------------|---------|----------|
| **Fastify Server** | TAMAMLANDI | ✅ Implemented | `backend/src/server.app.ts` |
| **PostgreSQL 16** | TAMAMLANDI | ✅ Working | `docker-compose.dev.yml`, 22 migrations |
| **Health Endpoints** | TAMAMLANDI | ✅ Implemented | `backend/src/api/health.ts` lines 17-130 |
| **JWT Authentication** | TAMAMLANDI | ✅ Implemented | `backend/src/services/auth/jwt.ts` |
| **Multi-step Auth** | TAMAMLANDI | ✅ Implemented | `backend/src/api/auth.multi-step.ts` |
| **OAuth (GitHub)** | TAMAMLANDI | ✅ Implemented | `backend/src/api/auth.oauth.ts` |
| **OAuth (Google)** | TAMAMLANDI | ✅ Implemented | `backend/src/api/auth.oauth.ts` |
| **OAuth (Atlassian)** | TAMAMLANDI | ✅ Implemented | PR #172, migration `0021_add_atlassian_oauth.sql` |
| **Email Verification** | DEVAM | 🟡 Mock only | `EMAIL_PROVIDER=mock` default; Resend integration code exists |
| **Rate Limiting** | TAMAMLANDI | ✅ Implemented | `@fastify/rate-limit` in dependencies |
| **Request Logging** | TAMAMLANDI | ✅ Implemented | Pino structured logging |
| **Metrics Endpoint** | TAMAMLANDI | ✅ Implemented | `backend/src/api/metrics.ts` |
| **Agent Orchestrator** | TAMAMLANDI | ✅ Implemented | `backend/src/core/orchestrator/` |
| **Scribe Agent** | TAMAMLANDI | ✅ Functional | Dry-run + Write mode working |
| **MCP Adapters** | TAMAMLANDI | ✅ Signature-only | GitHub/Jira/Confluence adapters |

### Frontend Status

| Feature | Plan Status | Reality | Evidence |
|---------|-------------|---------|----------|
| **Vite + React 18** | TAMAMLANDI | ✅ Working | `frontend/vite.config.ts` |
| **Tailwind CSS** | TAMAMLANDI | ✅ Implemented | `frontend/tailwind.config.js` |
| **Dashboard Layout** | TAMAMLANDI | ✅ Implemented | Cursor-inspired design |
| **Agent Hub** | TAMAMLANDI | ✅ Implemented | Scribe console with live progress |
| **Integrations Hub** | TAMAMLANDI | ✅ Implemented | GitHub/Jira/Confluence connect |
| **Settings Pages** | TAMAMLANDI | ✅ Implemented | AI keys, usage tracking |
| **i18n (TR/EN)** | TAMAMLANDI | ✅ Implemented | `frontend/src/i18n/` |
| **Public Site** | TAMAMLANDI | ✅ Implemented | Landing, features, documentation |

### DevOps/Deployment Status

| Feature | Plan Status | Reality | Evidence |
|---------|-------------|---------|----------|
| **Docker Compose (Staging)** | TAMAMLANDI | ✅ Exists | `devops/compose/docker-compose.staging.yml` |
| **Docker Compose (Prod)** | TAMAMLANDI | ✅ Exists | `devops/compose/docker-compose.prod.yml` |
| **Caddyfile (Staging)** | TAMAMLANDI | ✅ Exists | `devops/compose/Caddyfile.staging` |
| **Caddyfile (Prod)** | TAMAMLANDI | ✅ Exists | `devops/compose/Caddyfile.prod` |
| **Backend Dockerfile** | TAMAMLANDI | ✅ Exists | `backend/Dockerfile` |
| **CI Pipeline** | TAMAMLANDI | ✅ Working | `.github/workflows/ci.yml` |
| **PR Gate** | TAMAMLANDI | ✅ Working | `.github/workflows/pr-gate.yml` |
| **Deploy Staging Workflow** | TAMAMLANDI | ✅ Exists | `.github/workflows/deploy-staging.yml` |
| **Deploy Prod Workflow** | TAMAMLANDI | ✅ Exists | `.github/workflows/deploy-prod.yml` |
| **OCI VM Provisioning** | PLANLI | ⚠️ Not done | Needs manual OCI setup |
| **DNS Configuration** | PLANLI | ⚠️ Not done | `staging.akisflow.com` → OCI IP needed |
| **GitHub Secrets** | PLANLI | ⚠️ Not done | Secret values not configured |

---

## 3. Key Gaps for Staging Deployment

### Critical Path Items (Must-Have)

| Gap | Priority | WBS ID | Action Required |
|-----|----------|--------|-----------------|
| **OCI VM** | P0 | `T-OCI-PROV-01` | Provision ARM64 VM on OCI Free Tier |
| **DNS Records** | P0 | `T-OCI-DNS-01` | Configure `staging.akisflow.com` A record |
| **GitHub Secrets** | P0 | `T-OCI-SEC-01` | Set `STAGING_*` secrets in repo |
| **Database Password** | P0 | `T-OCI-DB-01` | Generate secure password, add to secrets |
| **JWT Secret** | P0 | `T-OCI-AUTH-01` | Generate 256-bit secret, add to secrets |

### Near-Term Items (Should-Have for Staging)

| Gap | Priority | WBS ID | Action Required |
|-----|----------|--------|-----------------|
| **Email Delivery** | P1 | `T-EMAIL-01` | Configure Resend API key for production email |
| **AI Provider Key** | P1 | `T-AI-KEY-01` | Add OpenRouter/OpenAI API key |
| **OAuth App Secrets** | P1 | `T-OAUTH-01` | Create staging OAuth apps and configure |
| **Backup Script** | P2 | `T-OCI-BAK-01` | Automate PostgreSQL backup to OCI Object Storage |

---

## 4. Deep-Dive: Critical Staging Readiness Areas

### 4.1 Auth Cookie Behavior in HTTPS

**Evidence**:
- File: `backend/src/lib/env.ts`, `backend/docs/Auth.md`
- Cookie options defined with `secure` flag conditional on `NODE_ENV`

**Current State**:
```typescript
// From backend/docs/Auth.md (lines 182-188)
const cookieOpts = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in ms
};
```

**Staging Configuration**:
- `AUTH_COOKIE_SECURE=false` is acceptable for initial staging with HTTP
- For HTTPS staging, set `AUTH_COOKIE_SECURE=true` + `AUTH_COOKIE_SAMESITE=lax`
- Caddyfile already handles HTTPS termination with Let's Encrypt

**Risk**: 🟢 LOW - Configuration is environment-driven, no code changes needed.

### 4.2 Email Verification Delivery Readiness

**Evidence**:
- File: `backend/.env.example` (lines 38-41)
- Service: `backend/src/services/email/` (EmailService interface)

**Current State**:
- `EMAIL_PROVIDER=mock` by default (codes logged to console)
- Resend integration code exists (`EMAIL_PROVIDER=resend` switches to real delivery)
- Required env vars: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

**Staging Readiness**:
- For staging demo: `EMAIL_PROVIDER=mock` is acceptable
- For production-like staging: Configure Resend account and API key

**Risk**: 🟡 MEDIUM - Email delivery works but requires external service configuration.

### 4.3 OAuth Redirect URL Readiness

**Evidence**:
- File: `backend/src/api/auth.oauth.ts` (lines 302, 428)
- File: `backend/docs/Auth.md` (Section 7)

**Current State**:
```typescript
// Redirect URI built dynamically from BACKEND_URL
const redirectUri = `${config.BACKEND_URL}/auth/oauth/${provider}/callback`;
```

**Required Configuration for Staging**:
| Provider | Callback URL |
|----------|-------------|
| GitHub | `https://staging.akisflow.com/auth/oauth/github/callback` |
| Google | `https://staging.akisflow.com/auth/oauth/google/callback` |
| Atlassian | `https://staging.akisflow.com/auth/oauth/atlassian/callback` |

**Action Required**:
1. Create OAuth Apps in provider consoles with staging callback URLs
2. Set `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, etc. in GitHub Secrets
3. Ensure `BACKEND_URL=https://staging.akisflow.com` in staging environment (no `/api` suffix)

**Risk**: 🟢 LOW - Implementation exists; only configuration needed.

### 4.4 Database Migration Strategy

**Evidence**:
- File: `backend/migrations/README.md`
- File: `docs/deploy/DEPLOYMENT_STRATEGY.md` (Section 6)
- Directory: `backend/migrations/` (22 migration files)

**Current State**:
- **Forward-only migrations**: No rollback scripts (by design)
- **Drizzle ORM**: Schema-driven migrations via `pnpm db:generate`
- **Atomic**: Each migration runs in a single transaction
- **CI-tested**: Migrations run in CI pipeline before merge

**Migration Files (Latest)**:
```
0020_add_integration_credentials.sql
0021_add_atlassian_oauth.sql
```

**Staging Deploy Flow**:
1. GitHub Actions pulls new image
2. Runs `docker compose run --rm backend pnpm db:migrate`
3. On failure: deployment aborts, previous version remains running

**Risk**: 🟢 LOW - Well-documented forward-only policy, CI-verified.

### 4.5 Health Endpoints Usage

**Evidence**:
- File: `backend/src/api/health.ts` (complete implementation)
- File: `.github/workflows/deploy-staging.yml` (lines 246-265)

**Implemented Endpoints**:

| Endpoint | Purpose | Auth | Response |
|----------|---------|------|----------|
| `GET /health` | Liveness check | ❌ | `{ status: "ok", timestamp }` |
| `GET /ready` | Readiness (DB check) | ❌ | `{ ready: true, database: "connected" }` |
| `GET /version` | Build info | ❌ | `{ version, commit, buildTime }` |

**CI/CD Integration**:
```yaml
# From deploy-staging.yml (lines 249-265)
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://staging.akisflow.com/health)
READY=$(curl -s -o /dev/null -w "%{http_code}" https://staging.akisflow.com/ready)

if [ "$HEALTH" = "200" ] && [ "$READY" = "200" ]; then
  echo "Health checks passed!"
  exit 0
fi
```

**Risk**: 🟢 LOW - Fully implemented and integrated into deploy pipeline.

---

## 5. Risk Register

### High Priority Risks

| Risk ID | Description | Impact | Mitigation |
|---------|-------------|--------|------------|
| **R-001** | OCI VM not provisioned | Blocks staging deploy | Schedule OCI provisioning this week |
| **R-002** | DNS not configured | No public access | Configure DNS after VM IP known |
| **R-003** | GitHub Secrets missing | Workflow will fail | Create secrets before first deploy |

### Medium Priority Risks

| Risk ID | Description | Impact | Mitigation |
|---------|-------------|--------|------------|
| **R-004** | Email delivery not configured | Users can't verify email | Use mock for staging; configure Resend before prod |
| **R-005** | OAuth apps not configured | No social login | Create staging OAuth apps in provider consoles |
| **R-006** | AI API key not set | Agent runs fail | Configure AI provider key |

### Low Priority Risks

| Risk ID | Description | Impact | Mitigation |
|---------|-------------|--------|------------|
| **R-007** | MCP Gateway optional | GitHub operations limited | Enable with `--profile mcp` when needed |
| **R-008** | Backup automation missing | Data loss on failure | Implement OCI Object Storage backup |

---

## 6. WBS Task ID Mapping

### Existing Tasks (Need Status Update)

| WBS Task ID | Description | Current Status | New Status |
|-------------|-------------|----------------|------------|
| `T-AUTH-CORE-01` | JWT Authentication | DEVAM | TAMAMLANDI |
| `T-AUTH-MULTI-01` | Multi-step Auth | DEVAM | TAMAMLANDI |
| `T-AUTH-OAUTH-01` | GitHub/Google OAuth | DEVAM | TAMAMLANDI |
| `T-INT-ATL-01` | Atlassian OAuth | PLANLI | TAMAMLANDI |
| `T-UI-DASH-01` | Dashboard Core | DEVAM | TAMAMLANDI |
| `T-UI-DASH-02` | Integrations Hub | DEVAM | TAMAMLANDI |
| `T-AGT-SCRIBE-01` | Scribe Agent | DEVAM | TAMAMLANDI |
| `T-OBS-HEALTH-01` | Health Endpoints | PLANLI | TAMAMLANDI |
| `T-CICD-STAGE-01` | Staging Workflow | DEVAM | TAMAMLANDI |

### Missing Tasks (To Add)

| WBS Task ID | Description | Sprint | Status |
|-------------|-------------|--------|--------|
| `T-OCI-PROV-01` | OCI VM Provisioning | S3.1 | PLANLI |
| `T-OCI-DNS-01` | DNS Configuration | S3.1 | PLANLI |
| `T-OCI-SEC-01` | GitHub Secrets Setup | S3.1 | PLANLI |
| `T-OCI-DB-01` | Database Password Setup | S3.1 | PLANLI |
| `T-OCI-AUTH-01` | JWT Secret Generation | S3.1 | PLANLI |
| `T-OCI-DEPLOY-01` | First Staging Deploy | S3.1 | PLANLI |
| `T-EMAIL-PROD-01` | Resend Email Setup | S3.2 | PLANLI |
| `T-OAUTH-STAGE-01` | Staging OAuth Apps | S3.1 | PLANLI |
| `T-OCI-BAK-01` | Backup Automation | S3.2 | PLANLI |

---

## 7. Conclusion and Recommendations

### Immediate Actions (This Week)

1. ✅ **Create OCI Account** and provision ARM64 VM
2. ✅ **Configure DNS** for `staging.akisflow.com`
3. ✅ **Set GitHub Secrets** for staging deployment
4. ✅ **Run first staging deploy** via workflow

### Before Production

1. ⬜ Configure Resend for email delivery
2. ⬜ Create production OAuth Apps (separate from staging)
3. ⬜ Set up backup automation to OCI Object Storage
4. ⬜ Configure monitoring/alerting (UptimeRobot recommended)

### Documentation Status

| Document | Status | Path |
|----------|--------|------|
| Deployment Strategy | ✅ Complete | `docs/deploy/DEPLOYMENT_STRATEGY.md` |
| OCI Runbook | ✅ Complete | `docs/deploy/RUNBOOK_OCI.md` |
| Auth Documentation | ✅ Complete | `backend/docs/Auth.md` |
| Environment Setup | ✅ Complete | `docs/ENV_SETUP.md` |

---

**Last Updated**: 2026-01-13  
**Next Review**: After first staging deployment
