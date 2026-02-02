# AKIS Platform - Environments and Releases

**Version:** 1.0  
**Last Updated:** 2026-02-02  
**Purpose:** Define environment contracts, release flow, and deployment procedures for AKIS Platform

---

## 1. Overview

AKIS Platform operates across three environments: Local Development, Staging, and Production. This document defines the contract for each environment and the release engineering procedures.

### 1.1 Key Principles

- **Environment parity:** Staging should mirror production as closely as possible
- **Secrets isolation:** Each environment has its own secrets; never share across environments
- **Immutable deployments:** Docker images are tagged and never overwritten
- **Rollback capability:** Every deployment can be rolled back within 5 minutes

---

## 2. Environment Contracts

### 2.1 Environment Matrix

| Environment | Domain | Database | AI Provider | GitHub MCP | Auto-Deploy |
|-------------|--------|----------|-------------|------------|-------------|
| **Local Dev** | localhost:5173 (frontend), localhost:3000 (backend) | Docker postgres:5433 | mock | Optional | N/A |
| **Staging** | staging.akisflow.com | akis_staging (containerized) | mock or user-key | Required | main branch push |
| **Production** | akisflow.com | akis_prod (containerized) | openrouter or user-key | Required | semver tag + manual approval |

### 2.2 Local Development

**Purpose:** Developer workstations for feature development and testing.

**Stack:**
- Frontend: Vite dev server on port 5173
- Backend: Fastify on port 3000
- Database: PostgreSQL via Docker Compose on port 5433

**Setup:**
```bash
# Start database
./scripts/db-up.sh

# Run migrations
cd backend && pnpm db:migrate

# Start backend (terminal 1)
cd backend && pnpm dev

# Start frontend (terminal 2)
cd frontend && npm run dev
```

**Required Environment Variables:**
```bash
# backend/.env (copy from .env.example)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2
AUTH_JWT_SECRET=<min-32-chars>
AUTH_COOKIE_NAME=akis_sid
AI_PROVIDER=mock
AI_KEY_ENCRYPTION_KEY=<base64-32-bytes>
```

### 2.3 Staging Environment

**Purpose:** Pre-production testing, QA verification, and demo environment.

**URL:** https://staging.akisflow.com

**Infrastructure:**
- OCI Free Tier VM (4 OCPU, 24GB RAM ARM)
- Docker Compose stack (Caddy + Backend + PostgreSQL + MCP Gateway)
- Auto-TLS via Caddy/Let's Encrypt

**Deployment Trigger:** Push to `main` branch (via `.github/workflows/deploy-staging.yml`)

**Required Environment Variables:**
```bash
# /opt/akis/.env on staging server
NODE_ENV=production
DATABASE_URL=postgresql://akis:${POSTGRES_PASSWORD}@db:5432/akis_staging
AUTH_JWT_SECRET=${AUTH_JWT_SECRET}
AUTH_COOKIE_NAME=akis_sid
AUTH_COOKIE_SECURE=false  # staging uses different auth handling
AUTH_COOKIE_SAMESITE=lax

BACKEND_URL=https://staging.akisflow.com/api
FRONTEND_URL=https://staging.akisflow.com
CORS_ORIGINS=https://staging.akisflow.com

GITHUB_MCP_BASE_URL=http://mcp-gateway:4010/mcp
AI_PROVIDER=mock  # or user-managed keys

POSTGRES_USER=akis
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=akis_staging
```

**GitHub Secrets Required:**
- `STAGING_HOST` - Server IP or hostname
- `STAGING_USER` - SSH username (e.g., `ubuntu`, `opc`)
- `STAGING_SSH_KEY` - Private SSH key (ed25519 or RSA PEM format)

### 2.4 Production Environment

**Purpose:** Live customer-facing environment.

**URL:** https://akisflow.com

**Infrastructure:**
- OCI Free Tier VM (4 OCPU, 24GB RAM ARM)
- Docker Compose stack (Caddy + Backend + PostgreSQL + MCP Gateway)
- Auto-TLS via Caddy/Let's Encrypt
- Automated database backups

**Deployment Trigger:** 
- Semver tag push (v*.*.*)
- GitHub Release publish
- **Requires manual approval** via GitHub Environment protection

**Required Environment Variables:**
```bash
# /opt/akis/.env on production server
NODE_ENV=production
DATABASE_URL=postgresql://akis:${POSTGRES_PASSWORD}@db:5432/akis_prod
AUTH_JWT_SECRET=${AUTH_JWT_SECRET}
AUTH_COOKIE_NAME=akis_sid
AUTH_COOKIE_SECURE=true  # MANDATORY in production
AUTH_COOKIE_SAMESITE=lax
AUTH_COOKIE_DOMAIN=.akisflow.com  # Enable cross-subdomain sessions

BACKEND_URL=https://akisflow.com/api
FRONTEND_URL=https://akisflow.com
CORS_ORIGINS=https://akisflow.com

GITHUB_MCP_BASE_URL=http://mcp-gateway:4010/mcp
AI_PROVIDER=openrouter
AI_API_KEY=${AI_API_KEY}  # Platform default key

POSTGRES_USER=akis
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=akis_prod
```

**GitHub Secrets Required:**
- `PROD_HOST` - Server IP or hostname
- `PROD_USER` - SSH username
- `PROD_SSH_KEY` - Private SSH key (ed25519 or RSA PEM format)

---

## 3. Release Flow

### 3.1 Release Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Feature    │───►│   PR Gate   │───►│   Staging   │───►│ Production  │
│  Branch     │    │  (CI green) │    │(auto-deploy)│    │(tag+approve)│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 3.2 Branch Strategy

| Branch | Purpose | Protection | Deploy Target |
|--------|---------|------------|---------------|
| `main` | Integration branch | Required reviews, CI green | Staging |
| `feat/*` | Feature development | None | None |
| `fix/*` | Bug fixes | None | None |
| `release/*` | Release candidates | CI green | None (use tags) |

### 3.3 Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

Types: feat, fix, docs, chore, refactor, test, style, perf
Scope: backend, frontend, ci, deps, docs
```

Examples:
- `feat(backend): add job retry endpoint`
- `fix(frontend): resolve auth redirect loop`
- `docs(ops): update environment contracts`

### 3.4 Release Process

**Step 1: Prepare Release**
```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Update version in package.json files
# backend/package.json: "version": "0.5.0"
# frontend/package.json: "version": "0.5.0"
```

**Step 2: Create Release Tag**
```bash
git tag -a v0.5.0 -m "Release v0.5.0: Feature X, Fix Y"
git push origin v0.5.0
```

**Step 3: Monitor Deployment**
1. Tag push triggers `deploy-prod.yml`
2. Build and test jobs run
3. Docker images built and pushed to GHCR
4. **Manual approval required** via GitHub Environment
5. Deploy to production server
6. Health checks validate deployment
7. Smoke tests run

**Step 4: Verify Release**
- Check https://akisflow.com/health
- Check https://akisflow.com/version (should show new version)
- Run quick manual smoke test

### 3.5 Hotfix Process

For critical production issues:

```bash
# Create hotfix branch from latest tag
git checkout -b hotfix/critical-auth-bug v0.5.0

# Make fix, commit, push
git commit -m "fix(auth): resolve session expiry issue"
git push origin hotfix/critical-auth-bug

# Create PR to main, merge after review
# Tag new patch version
git checkout main
git pull
git tag -a v0.5.1 -m "Hotfix: Critical auth bug"
git push origin v0.5.1
```

---

## 4. Rollback Procedures

### 4.1 Application Rollback

**Immediate Rollback (< 5 minutes):**

```bash
# SSH to production server
ssh $PROD_USER@$PROD_HOST

# Roll back to previous image
cd /opt/akis
docker compose pull backend:${PREVIOUS_TAG}
docker compose up -d backend

# Verify
curl https://akisflow.com/health
curl https://akisflow.com/version
```

**Via GitHub Actions (Recommended):**

The `deploy-prod.yml` workflow includes automatic rollback on health check failure.

### 4.2 Database Rollback

**Warning:** Database rollback is NOT automatic. Schema changes may require manual intervention.

**Pre-deployment backup location:** `/opt/akis/backups/`

**Restore procedure:**
```bash
# SSH to production server
ssh $PROD_USER@$PROD_HOST

# Stop backend
cd /opt/akis
docker compose stop backend

# Restore from backup
BACKUP_FILE=/opt/akis/backups/prod-pre-deploy-v0.5.0-20260202-120000.dump
docker exec -i akis-prod-db pg_restore -U akis -d akis_prod --clean < $BACKUP_FILE

# Restart backend
docker compose up -d backend
```

---

## 5. Health Checks and Monitoring

### 5.1 Health Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /health` | Liveness probe | `{"status":"ok"}` |
| `GET /ready` | Readiness probe (DB connected) | `{"ready":true}` |
| `GET /version` | Version info | `{"version":"0.5.0","commit":"abc1234"}` |

### 5.2 Monitoring Checklist

After each deployment, verify:

- [ ] `/health` returns 200
- [ ] `/ready` returns 200
- [ ] `/version` shows correct version
- [ ] Login flow works
- [ ] Dashboard loads
- [ ] Job creation works (if MCP gateway deployed)

---

## 6. Secrets Management

### 6.1 Secret Categories

| Category | Examples | Storage Location |
|----------|----------|------------------|
| **Deployment** | SSH keys, server IPs | GitHub Secrets |
| **Application** | JWT secret, DB password | Server `.env` file |
| **Integration** | OAuth secrets, API keys | Server `.env` file |

### 6.2 GitHub Secrets Checklist

**Staging Environment:**
- [ ] `STAGING_HOST` - Server IP or hostname
- [ ] `STAGING_USER` - SSH username
- [ ] `STAGING_SSH_KEY` - Private SSH key

**Production Environment:**
- [ ] `PROD_HOST` - Server IP or hostname
- [ ] `PROD_USER` - SSH username
- [ ] `PROD_SSH_KEY` - Private SSH key

### 6.3 Server Secrets Checklist

**Both Staging and Production:**
- [ ] `AUTH_JWT_SECRET` - Min 32 characters, unique per environment
- [ ] `POSTGRES_PASSWORD` - Strong random password
- [ ] `AI_KEY_ENCRYPTION_KEY` - Base64-encoded 32-byte key

**Production Only:**
- [ ] `AI_API_KEY` - OpenRouter or OpenAI API key (platform default)

### 6.4 Generating Secrets

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Postgres Password
openssl rand -base64 24

# AI Key Encryption Key (32 bytes base64)
echo "base64:$(openssl rand -base64 32)"
```

---

## 7. CI/CD Pipeline Reference

### 7.1 Workflow Files

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | All branches | Typecheck, lint, test, build |
| `deploy-staging.yml` | Push to main | Deploy to staging |
| `deploy-prod.yml` | Semver tag | Deploy to production |
| `pr-gate.yml` | Pull requests | PR validation checks |

### 7.2 CI Requirements

All PRs must pass:
1. `pnpm -r typecheck` - TypeScript compilation
2. `pnpm -r lint` - ESLint
3. `pnpm -r build` - Production build
4. `pnpm -r test` - Unit/integration tests

### 7.3 Deployment Artifacts

| Artifact | Registry | Naming |
|----------|----------|--------|
| Backend Image | ghcr.io | `ghcr.io/{repo}/akis-backend:{tag}` |
| Frontend Build | Upload artifact | `frontend-dist-prod` |

---

## 8. Troubleshooting

### 8.1 Deployment Failures

**Symptom:** Staging deployment fails at "Validate required secrets"

**Cause:** GitHub Secrets not configured

**Fix:** Add required secrets in GitHub repository settings

---

**Symptom:** Health check fails after deployment

**Cause:** Application crash or DB connection issue

**Fix:**
```bash
# Check container logs
ssh $HOST
cd /opt/akis
docker compose logs backend --tail=100

# Check if DB is healthy
docker compose logs db --tail=50
```

---

**Symptom:** Auth sessions not persisting in production

**Cause:** Cookie domain mismatch

**Fix:** Ensure `AUTH_COOKIE_DOMAIN=.akisflow.com` is set in production `.env`

---

## 9. References

- CI Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
- Staging Deploy: [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml)
- Production Deploy: [`.github/workflows/deploy-prod.yml`](../../.github/workflows/deploy-prod.yml)
- Staging Compose: [`devops/compose/docker-compose.staging.yml`](../../devops/compose/docker-compose.staging.yml)
- Production Compose: [`devops/compose/docker-compose.prod.yml`](../../devops/compose/docker-compose.prod.yml)
- Backend Env Example: [`backend/.env.example`](../../backend/.env.example)
