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

## 9. Staging Deploy Runbook

### 9.1 Prerequisites (One-Time Setup)

**GitHub Repository Secrets (Settings → Secrets and variables → Actions):**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `STAGING_HOST` | Server IP or hostname | `192.168.1.100` or `staging-server.internal` |
| `STAGING_USER` | SSH username | `ubuntu`, `opc`, or `akis` |
| `STAGING_SSH_KEY` | Private SSH key (PEM format) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

**Note:** These are **repository secrets**, not environment secrets. The workflow does NOT require a GitHub Environment to be configured.

### 9.2 Triggering a Deploy

**Automatic (Recommended):**
- Push to `main` branch triggers staging deploy automatically
- Merging a PR to `main` also triggers deploy

**Manual Re-run:**
1. Go to Actions → "Deploy to Staging"
2. Click on the failed/successful run
3. Click "Re-run jobs" → "Re-run all jobs"

### 9.3 Success Criteria

After deployment, these URLs must respond:

| Endpoint | Expected Response | HTTP Status |
|----------|-------------------|-------------|
| `https://staging.akisflow.com/health` | `{"status":"ok"}` | 200 |
| `https://staging.akisflow.com/ready` | `{"ready":true}` | 200 |
| `https://staging.akisflow.com/version` | `{"version":"x.y.z","commit":"abc123"}` | 200 |

### 9.4 Diagnosing Failures

#### Failure Mode 1: SSH Connection Failed

**Symptoms:**
- `Permission denied (publickey)`
- `Could not resolve hostname`
- `Connection timed out`

**Diagnosis:**
1. Check that `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY` are set in GitHub Secrets
2. Verify SSH key format (must be PEM, not PPK)
3. Check server firewall allows port 22 from GitHub Actions IPs

**Fix:** Re-add the SSH key secret with correct format.

#### Failure Mode 2: Health Check Returns 502

**Symptoms:**
- `health=502, ready=502` in workflow logs
- Caddy is running but backend is down

**Diagnosis:**
```bash
# SSH to staging server
ssh $STAGING_USER@$STAGING_HOST

# Check container status
cd /opt/akis && docker compose ps

# Check backend logs
docker compose logs backend --tail=100

# Common issues:
# - Backend crash on startup (missing env vars)
# - Database connection refused
# - Migration running indefinitely
```

**Fix:** Check backend container logs for specific error.

#### Failure Mode 3: Health Check Returns 000

**Symptoms:**
- `health=000000, ready=000000` in workflow logs
- Cannot reach the server at all

**Diagnosis:**
1. Check DNS: `nslookup staging.akisflow.com`
2. Check server is running: Can you SSH manually?
3. Check Caddy is running: `docker compose ps caddy`
4. Check firewall: Ports 80, 443 open?

**Fix:** Usually DNS or server-level issue, not workflow issue.

#### Failure Mode 4: Backend Container Not Started

**Symptoms:**
- `health=502, ready=502` in workflow logs
- `docker compose ps` shows only `db` and `caddy` running, no `backend`
- Workflow artifact shows database logs but no backend logs

**Diagnosis:**
1. Check workflow logs for "=== Container status ===" section
2. Look for backend container in `docker compose ps` output
3. Download workflow artifact `staging-deploy-logs-XX` and check for backend logs

**Common Causes:**
- Deploy script exited early (e.g., after migration error)
- Image pull failed silently
- Container health check failing on startup

**Fix:**
```bash
# SSH to server and manually start
ssh $STAGING_USER@$STAGING_HOST
cd /opt/akis
docker compose up -d --force-recreate backend
docker compose logs -f backend  # Watch for startup errors
```

#### Failure Mode 5: Port 80/443 Already in Use

**Symptoms:**
- `failed to bind host port 0.0.0.0:80/tcp: address already in use`
- Deployment fails at "Start services" step

**Diagnosis:**
```bash
# SSH to server
ssh $STAGING_USER@$STAGING_HOST

# Check what's using port 80/443
sudo ss -tlnp | grep ':80 '
sudo ss -tlnp | grep ':443 '

# Common culprits: nginx, apache, another Caddy container
```

**Fix:**
```bash
# Stop nginx if running
sudo systemctl stop nginx
sudo systemctl disable nginx

# Stop old Caddy containers
docker stop akis-staging-caddy akis-prod-caddy 2>/dev/null
docker rm akis-staging-caddy akis-prod-caddy 2>/dev/null

# Verify ports are free
sudo ss -tlnp | grep ':80 '  # Should show nothing
```

### 9.5 Edge Proxy Architecture

AKIS uses a **single edge reverse proxy** pattern for hosting both staging and production on the same server:

```
Internet
    │
    ▼
┌─────────────────────────────────────┐
│  akis-edge-caddy (ports 80/443)     │
│  ├─ akisflow.com → prod-backend     │
│  └─ staging.akisflow.com → staging  │
└─────────────────────────────────────┘
    │               │
    ▼               ▼
┌─────────────┐ ┌─────────────┐
│ akis-prod   │ │ akis-staging│
│ (no ports)  │ │ (no ports)  │
└─────────────┘ └─────────────┘
```

**Key Files:**
- `devops/compose/docker-compose.edge.yml` - Edge proxy (binds 80/443)
- `devops/compose/Caddyfile.edge` - Routing rules by hostname
- `devops/compose/docker-compose.staging.yml` - Staging stack (no port bindings)
- `devops/compose/docker-compose.prod.yml` - Production stack (no port bindings)

**Managing Edge Proxy:**
```bash
cd /opt/akis

# Start/restart edge proxy
docker compose -f docker-compose.edge.yml up -d

# Reload Caddy config (zero-downtime)
docker exec akis-edge-caddy caddy reload --config /etc/caddy/Caddyfile

# View edge proxy logs
docker compose -f docker-compose.edge.yml logs -f

# Check which containers are connected to edge network
docker network inspect akis-edge-net
```

### 9.6 Important Notes

- **SSH Host vs Public URL:** `STAGING_HOST` is for SSH connectivity (private IP or hostname), while health checks use `staging.akisflow.com` (public domain)
- **Migration Failures:** Migration errors are logged as WARN and do not stop the deploy. This is intentional because "enum already exists" errors are common on re-deploys.
- **Rollback:** On health check failure, the workflow automatically attempts to rollback to the previous image version.
- **Edge Proxy:** Only one service (akis-edge-caddy) should bind to ports 80/443. All other stacks connect via the `akis-edge-net` network.

---

## 10. References

- CI Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
- Staging Deploy: [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml)
- Production Deploy: [`.github/workflows/deploy-prod.yml`](../../.github/workflows/deploy-prod.yml)
- Staging Compose: [`devops/compose/docker-compose.staging.yml`](../../devops/compose/docker-compose.staging.yml)
- Production Compose: [`devops/compose/docker-compose.prod.yml`](../../devops/compose/docker-compose.prod.yml)
- Backend Env Example: [`backend/.env.example`](../../backend/.env.example)
