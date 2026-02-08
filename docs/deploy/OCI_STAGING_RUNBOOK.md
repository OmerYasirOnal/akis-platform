# AKIS Platform - OCI Staging Runbook

**Version**: 1.3.0  
**Last Updated**: 2026-02-03  
**Scope**: Staging Environment (pilot-grade)  
**Target**: OCI Free Tier (single VM)

> **Quick Reference**: For day-to-day releases, see the [Staging Release Checklist](../release/STAGING_RELEASE_CHECKLIST.md).
> **Smoke Tests**: See [STAGING_SMOKE_TEST_CHECKLIST.md](STAGING_SMOKE_TEST_CHECKLIST.md) for pass/fail criteria.
> **Rollback**: See [STAGING_ROLLBACK_RUNBOOK.md](STAGING_ROLLBACK_RUNBOOK.md) for dedicated rollback procedures.
>
> **Note**: This is the canonical staging runbook. Legacy duplicates (`RUNBOOK_OCI.md`, `ops/STAGING_RUNBOOK.md`) have been archived.
> **Security**: Never commit `backend/.env.staging` or any file containing real secrets to git.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Merge and Rollout Order](#2-merge-and-rollout-order)
3. [Domain and TLS Configuration](#3-domain-and-tls-configuration)
4. [Environment Variables and Secrets](#4-environment-variables-and-secrets)
5. [Initial Setup Checklist](#5-initial-setup-checklist)
6. [Deployment Procedures](#6-deployment-procedures)
7. [Database Management](#7-database-management)
8. [Backup and Recovery](#8-backup-and-recovery)
9. [Monitoring and Logging](#9-monitoring-and-logging)
10. [Incident Response](#10-incident-response)
11. [Rollback Procedures](#11-rollback-procedures)
12. [Promotion to Production](#12-promotion-to-production)
13. [Security Checklist](#13-security-checklist)

---

## 1. Overview

### Scope and Constraints

This runbook covers **staging-first deployment** on OCI Free Tier with minimal dependencies:

| Constraint | Value |
|------------|-------|
| **Compute** | 1× ARM64 VM (4 OCPU, 24GB RAM) |
| **Storage** | 200GB boot volume |
| **Database** | PostgreSQL 16 (containerized) |
| **Reverse Proxy** | Caddy (automatic HTTPS) |
| **Architecture** | Single VM, no Kubernetes |

### Component Overview

| Component | Technology | Port | Access |
|-----------|------------|------|--------|
| Reverse Proxy | Caddy | 80/443 | Public |
| Backend API | Fastify | 3000 | Internal |
| Database | PostgreSQL | 5432 | Internal |
| MCP Gateway | Node.js | 4010 | Internal (optional) |
| Frontend | Static (Vite build) | - | Served by Caddy |

---

## 2. Merge and Rollout Order

### 2.1 Docs-First Merge Policy

Merge documentation updates **before** deployment workflow changes to ensure:
- Runbook is available for reference during setup
- Secrets checklist documented before secrets are configured
- Domain strategy finalized before DNS configuration

**Recommended Merge Order**:

| Order | Component | PR/Files | Prerequisite |
|-------|-----------|----------|---------------|
| 1 | Domain Strategy | `docs/deploy/AKISFLOW_DOMAIN_STRATEGY.md` | None |
| 2 | Staging Runbook | `docs/deploy/OCI_STAGING_RUNBOOK.md` | Domain Strategy |
| 3 | QA Smoke Pack | `docs/qa/QA_EVIDENCE_STAGING_SMOKE_PACK.md` | Runbook |
| 4 | Deployment Scaffolding | `deploy/oci/staging/*` | Runbook |
| 5 | CI/CD Workflow | `.github/workflows/oci-staging-deploy.yml` | All above |

### 2.2 Pre-Deployment Checklist (Required Before First Deploy)

The deployment workflow (`oci-staging-deploy.yml`) will **skip deployment** until these are complete:

**Infrastructure**:
- [ ] OCI VM provisioned (ARM64, 4 OCPU, 24GB RAM)
- [ ] VM public IP address noted
- [ ] OCI Security List configured (ports 22, 80, 443)
- [ ] Docker and Docker Compose installed on VM
- [ ] Application directory `/opt/akis` created

**DNS**:
- [ ] A record for `staging.akisflow.com` → OCI VM IP
- [ ] DNS propagation verified (`nslookup staging.akisflow.com`)

**GitHub Secrets** (Repository → Settings → Secrets → Actions):
- [ ] `STAGING_HOST` - VM public IP address
- [ ] `STAGING_USER` - SSH username (usually `opc`)
- [ ] `STAGING_SSH_KEY` - Private SSH key (full content, ed25519 or RSA)

**Optional Secrets** (for full functionality):
- [ ] `STAGING_GITHUB_OAUTH_CLIENT_ID` - For social login
- [ ] `STAGING_GITHUB_OAUTH_CLIENT_SECRET` - For social login
- [ ] `STAGING_AI_API_KEY` - For agent operations

**VM Environment File** (`/opt/akis/.env`):
- [ ] `POSTGRES_PASSWORD` - Secure database password
- [ ] `AUTH_JWT_SECRET` - 256-bit secret (`openssl rand -base64 32`)
- [ ] `BACKEND_URL=https://staging.akisflow.com`
- [ ] `FRONTEND_URL=https://staging.akisflow.com`
- [ ] `AUTH_COOKIE_NAME=akis_session`
- [ ] `AUTH_COOKIE_SECURE=true`

### 2.3 Deployment Trigger Behavior

| Trigger | Quality Gates | Build | Deploy |
|---------|--------------|-------|--------|
| Push to `main` | ✅ Run | ✅ Run | ❌ Skip (manual only) |
| Manual dispatch (no confirm) | ✅ Run | ✅ Run | ❌ Skip |
| Manual dispatch + "deploy" confirm | ✅ Run | ✅ Run | ✅ Run (if secrets exist) |

**Why Manual-Only Deploy?**

Prevents automatic workflow failures when staging environment is not yet configured. The workflow checks for required secrets and will warn if missing.

---

## 3. Domain and TLS Configuration

### 2.1 DNS Records

**Required DNS Configuration**:

| Subdomain | Record Type | Value | TTL |
|-----------|-------------|-------|-----|
| `staging.akisflow.com` | A | `<OCI_VM_PUBLIC_IP>` | 300 |

**Verification Steps**:

1. Open DNS provider console (e.g., Cloudflare, Route53)
2. Add A record for `staging.akisflow.com` pointing to VM public IP
3. Wait for propagation (typically 5-15 minutes)
4. Verify: `nslookup staging.akisflow.com` should return the IP

### 2.2 TLS Certificate Management

Caddy handles TLS automatically via Let's Encrypt:

**Configuration** (already in `Caddyfile.staging`):
- Automatic certificate provisioning on first request
- Automatic renewal before expiry
- HTTP-to-HTTPS redirect enabled

**Verification Steps**:

1. After deployment, access `https://staging.akisflow.com/health`
2. Check certificate in browser (should show Let's Encrypt issuer)
3. Review Caddy logs for any certificate errors

**Troubleshooting TLS Issues**:

| Issue | Check | Resolution |
|-------|-------|------------|
| Certificate not issued | Caddy logs | Ensure port 80/443 open in OCI security rules |
| Rate limit hit | Let's Encrypt status | Wait 1 hour; use staging CA for testing |
| Domain mismatch | DNS propagation | Verify A record resolves correctly |

---

## 4. Environment Variables and Secrets

### 3.1 Secret Categories

| Category | Location | Example Variables |
|----------|----------|-------------------|
| **GitHub Actions** | Repository Settings → Secrets | `STAGING_HOST`, `STAGING_SSH_KEY` |
| **VM Environment** | `/opt/akis/.env` | `DATABASE_URL`, `AUTH_JWT_SECRET` |
| **Docker Compose** | Runtime environment | Inherited from `.env` file |

### 3.2 GitHub Secrets Checklist

**Required Secrets** (Repository → Settings → Secrets and Variables → Actions):

| Secret Name | Purpose | How to Generate |
|-------------|---------|-----------------|
| `STAGING_HOST` | VM public IP address | OCI console |
| `STAGING_USER` | SSH username | Usually `opc` for Oracle Linux |
| `STAGING_SSH_KEY` | Private SSH key (full content) | `ssh-keygen -t ed25519` |
| `STAGING_DATABASE_URL` | PostgreSQL connection string | `postgresql://akis:<password>@db:5432/akis_staging` |
| `STAGING_JWT_SECRET` | JWT signing key (min 32 chars) | `openssl rand -base64 32` |

**Optional Secrets**:

| Secret Name | Purpose | When Needed |
|-------------|---------|-------------|
| `STAGING_AI_API_KEY` | AI provider API key | For agent operations |
| `STAGING_GITHUB_OAUTH_CLIENT_ID` | GitHub OAuth client | For social login |
| `STAGING_GITHUB_OAUTH_CLIENT_SECRET` | GitHub OAuth secret | For social login |
| `STAGING_RESEND_API_KEY` | Email service API key | For email verification |

### 3.3 VM Environment File

**Location**: `/opt/akis/.env`

**Template** (create manually on first setup):

```
# Core
NODE_ENV=production

# Database
POSTGRES_USER=akis
POSTGRES_PASSWORD=<generated_secure_password>
POSTGRES_DB=akis_staging
DATABASE_URL=postgresql://akis:<password>@db:5432/akis_staging

# Auth
AUTH_JWT_SECRET=<generated_256_bit_secret>
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=lax
AUTH_COOKIE_NAME=akis_session

# URLs (critical for OAuth redirects)
BACKEND_URL=https://staging.akisflow.com
FRONTEND_URL=https://staging.akisflow.com
CORS_ORIGINS=https://staging.akisflow.com

# Rate Limiting (relaxed for staging)
RATE_LIMIT_MAX=200
LOG_LEVEL=debug

# Reverse proxy (required behind Caddy)
TRUST_PROXY=true

# Email (mock for staging, resend for production-like)
EMAIL_PROVIDER=mock

# AI (optional)
AI_PROVIDER=mock

# OAuth — GitHub (optional, for "Continue with GitHub" login)
# Create at: https://github.com/settings/developers → OAuth Apps
# Callback URL: https://staging.akisflow.com/auth/oauth/github/callback
GITHUB_OAUTH_CLIENT_ID=<from_github_oauth_app>
GITHUB_OAUTH_CLIENT_SECRET=<from_github_oauth_app>

# OAuth — Google (optional, for "Continue with Google" login)
# Create at: https://console.cloud.google.com/apis/credentials
# Authorized redirect URI: https://staging.akisflow.com/auth/oauth/google/callback
GOOGLE_OAUTH_CLIENT_ID=<from_google_cloud_console>
GOOGLE_OAUTH_CLIENT_SECRET=<from_google_cloud_console>
```

**Permission Requirements**:
- File mode: `600` (owner read/write only)
- Ownership: Deploy user (e.g., `opc`)

### 3.4 Secrets Rotation Policy

| Secret | Rotation Period | Procedure |
|--------|-----------------|-----------|
| JWT Secret | 90 days | Update GitHub Secret + VM .env + redeploy |
| Database Password | 90 days | ALTER USER in PostgreSQL + update .env |
| SSH Key | 180 days | Generate new key + update OCI + GitHub Secret |
| API Keys | As needed | Update in GitHub Secrets + redeploy |

### 3.5 OAuth Provider Setup

OAuth requires matching callback URIs between the backend configuration and the provider's developer console. The backend builds callback URLs as `${BACKEND_URL}/auth/oauth/<provider>/callback`.

**GitHub OAuth App**:

1. Go to https://github.com/settings/developers → "OAuth Apps" → "New OAuth App"
2. Set **Homepage URL**: `https://staging.akisflow.com`
3. Set **Authorization callback URL**: `https://staging.akisflow.com/auth/oauth/github/callback`
4. Copy Client ID → `GITHUB_OAUTH_CLIENT_ID` in `/opt/akis/.env`
5. Generate Client Secret → `GITHUB_OAUTH_CLIENT_SECRET` in `/opt/akis/.env`

**Google OAuth Client**:

1. Go to https://console.cloud.google.com/apis/credentials
2. Create "OAuth 2.0 Client ID" (Web application)
3. Add **Authorized JavaScript origin**: `https://staging.akisflow.com`
4. Add **Authorized redirect URI**: `https://staging.akisflow.com/auth/oauth/google/callback`
5. Copy Client ID → `GOOGLE_OAUTH_CLIENT_ID` in `/opt/akis/.env`
6. Copy Client Secret → `GOOGLE_OAUTH_CLIENT_SECRET` in `/opt/akis/.env`

**Verification** (after deploy):

```bash
# Should redirect to GitHub/Google login page (302)
curl -s -o /dev/null -w "%{http_code}" https://staging.akisflow.com/auth/oauth/github
curl -s -o /dev/null -w "%{http_code}" https://staging.akisflow.com/auth/oauth/google

# Should return 503 if credentials are missing
# Should return 302 if credentials are configured
```

> **Common Errors**:
> - `invalid_client` → Client ID/Secret mismatch or not set in `.env`
> - `redirect_uri_mismatch` → Callback URL in provider console doesn't match `${BACKEND_URL}/auth/oauth/<provider>/callback`
> - `OAUTH_NOT_CONFIGURED` → Missing `*_CLIENT_ID` or `*_CLIENT_SECRET` in env

---

## 5. Initial Setup Checklist

### 4.1 OCI VM Provisioning

- [ ] **Step 1**: Log into OCI console
- [ ] **Step 2**: Create compartment named `akis-platform`
- [ ] **Step 3**: Create VCN with public subnet
- [ ] **Step 4**: Create compute instance:
  - Shape: `VM.Standard.A1.Flex` (ARM64)
  - OCPUs: 4
  - Memory: 24 GB
  - Image: Oracle Linux 8 or Ubuntu 22.04
  - Boot volume: 100 GB
- [ ] **Step 5**: Note public IP address
- [ ] **Step 6**: Configure security list:
  - Ingress: TCP 22 (SSH, from specific IPs only)
  - Ingress: TCP 80 (HTTP)
  - Ingress: TCP 443 (HTTPS)

### 4.2 SSH Key Setup

- [ ] **Step 1**: Generate SSH key pair locally
  - Command: `ssh-keygen -t ed25519 -f ~/.ssh/akis-oci -C "akis-deploy"`
- [ ] **Step 2**: Add public key to OCI instance during creation
- [ ] **Step 3**: Test SSH connection
  - Command: `ssh -i ~/.ssh/akis-oci opc@<VM_IP>`
- [ ] **Step 4**: Add private key content to GitHub Secret `STAGING_SSH_KEY`

### 4.3 VM Initial Configuration

- [ ] **Step 1**: Update system packages
  - Command: `sudo dnf update -y` (or `apt update && apt upgrade -y`)
- [ ] **Step 2**: Install Docker
  - Oracle Linux: `sudo dnf install -y docker`
  - Ubuntu: Use official Docker install script
- [ ] **Step 3**: Enable and start Docker
  - `sudo systemctl enable docker`
  - `sudo systemctl start docker`
- [ ] **Step 4**: Add user to docker group
  - `sudo usermod -aG docker $USER`
  - Log out and log back in
- [ ] **Step 5**: Install Docker Compose
  - `sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose`
  - `sudo chmod +x /usr/local/bin/docker-compose`

### 4.4 Application Directory Setup

- [ ] **Step 1**: Create deployment directories
  - `sudo mkdir -p /opt/akis/{frontend,backups,logs}`
  - `sudo chown -R $USER:$USER /opt/akis`
  - `chmod 755 /opt/akis`
- [ ] **Step 2**: Create environment file
  - `nano /opt/akis/.env` (use template from Section 3.3)
  - `chmod 600 /opt/akis/.env`

### 4.5 GitHub Container Registry Authentication

- [ ] **Step 1**: Create GitHub Personal Access Token with `read:packages` scope
- [ ] **Step 2**: Login to GHCR on VM
  - `echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin`

### 4.6 DNS Configuration

- [ ] **Step 1**: Note VM public IP from OCI console
- [ ] **Step 2**: Add DNS A record for `staging.akisflow.com` → VM IP
- [ ] **Step 3**: Wait for DNS propagation
- [ ] **Step 4**: Verify: `ping staging.akisflow.com`

---

## 6. Deployment Procedures

### 5.1 Automated Deployment (Primary Method)

**Trigger**: Push to `main` branch (after PR merge)

**Prerequisites**:
- All GitHub Secrets configured
- VM initial setup complete
- DNS configured

**Process**:
1. Merge PR to `main`
2. GitHub Actions `deploy-staging.yml` runs automatically
3. Workflow steps:
   - Build and test (backend + frontend)
   - Build Docker images
   - Push to GHCR
   - SSH to VM
   - Run migrations
   - Start services
   - Health check
4. Verify deployment in GitHub Actions summary

### 5.2 Manual Deployment (Emergency)

**When to Use**: Workflow failure, urgent hotfix

**Steps**:

1. SSH into VM
   - `ssh -i ~/.ssh/akis-oci opc@<VM_IP>`

2. Navigate to application directory
   - `cd /opt/akis`

3. Pull latest compose files (if needed)
   - Copy from local: `scp devops/compose/* opc@<VM_IP>:/opt/akis/`

4. Pull latest images
   - `docker compose pull`

5. Run database migrations
   - `docker compose run --rm backend pnpm db:migrate`

6. Start services
   - `docker compose up -d --remove-orphans`

7. Verify deployment
   - `curl https://staging.akisflow.com/health`
   - `curl https://staging.akisflow.com/ready`

### 5.3 GHCR Pull Denied and Server-Side Build Fallback

**Why Does This Happen?**

The OCI VM does not have GitHub Container Registry (GHCR) credentials configured by default. When the deployment workflow attempts to pull the backend image from GHCR, it receives a "denied" error.

**Automatic Fallback Behavior**:

1. Workflow attempts to pull image from GHCR
2. If pull fails (denied or image not found), it falls back to server-side build
3. The backend source code is copied to `/opt/akis/backend-src/`
4. Docker builds the image locally with `--no-cache` to ensure fresh commit hash
5. The locally built image is used for deployment

**Build Args for Version Info**:
```bash
docker build \
  --no-cache \
  --build-arg BUILD_COMMIT="${COMMIT_SHA}" \
  --build-arg BUILD_TIME="${BUILD_TIME}" \
  --build-arg APP_VERSION="0.1.0" \
  -t ghcr.io/.../akis-backend:${COMMIT_SHA} \
  -t ghcr.io/.../akis-backend:staging \
  .
```

**Important**: The `--no-cache` flag ensures the BUILD_COMMIT is always freshly embedded, avoiding Docker cache issues with old commit hashes.

**Optional: Configure GHCR Access on Server**

To enable GHCR pulls (faster deploys, no server-side build):

1. Create a GitHub PAT with `read:packages` scope
2. SSH to the server and login:
   ```bash
   echo $GITHUB_PAT | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   ```
3. The workflow will automatically use GHCR pulls when available

### 5.4 Version Verification

The deployment workflow verifies that the deployed version matches the expected commit:

1. After `docker compose up`, wait for stabilization (30s)
2. Check `/health` and `/ready` endpoints
3. Fetch `/version` and compare the `commit` field with expected SHA
4. **Fail the deployment if versions don't match**

**Troubleshooting Version Mismatch**:

| Symptom | Possible Cause | Resolution |
|---------|----------------|------------|
| Old commit still shown | `docker compose up` didn't run | Check workflow logs for script errors |
| Build succeeded but old version | Docker cache used old layers | Ensure `--no-cache` is used in build |
| Container not restarted | Missing `--force-recreate` | Add `--force-recreate` to compose up |

### 5.5 Deploy Script Architecture

The deployment uses a **script-file approach** instead of SSH heredocs to avoid shell parsing issues:

**File**: `deploy/oci/staging/deploy.sh`

**Key Features**:
1. **GHCR Fallback**: Attempts GHCR pull first, falls back to server-side build
2. **No-Cache Build**: Uses `--no-cache` to ensure BUILD_COMMIT is always fresh
3. **Idempotent Migrations**: Runs migrations with `|| true` to handle "already applied" errors
4. **Force Recreate**: Uses `--force-recreate` to ensure containers restart with new image
5. **Exit Code Tracking**: Script tracks failures but always attempts `docker compose up`

**Script Execution Flow**:
```
Step 1: GHCR pull (may fail - OK)
Step 2: Server-side build if pull failed (with --no-cache)
Step 3: Update .env with BACKEND_VERSION
Step 4: Run migrations (|| true - errors OK if already applied)
Step 5: docker compose up --force-recreate (CRITICAL - always runs)
Step 6: Verify containers are running
Step 7: Prune old images
```

**Why Script File Instead of Heredoc?**

When using SSH heredocs with `docker compose run`, the heredoc can be corrupted by docker's stdin/stdout handling. This caused silent failures where steps after migrations never executed. The script file approach is deterministic and debuggable.

### 5.6 Known Migration Idempotency Issues

Some Drizzle-generated migrations are not idempotent:

**Example Error**:
```
error: enum label "validate" already exists
```

**Root Cause**: Migration `0004_broad_gideon.sql` uses simple `ALTER TYPE ADD VALUE` without `IF NOT EXISTS` check.

**Mitigation**: The deploy script uses `|| true` for migrations, treating "already exists" errors as warnings rather than failures. This is safe because:
1. The enum value already exists in the database
2. The schema is in the correct state
3. Only truly breaking migrations (e.g., missing required column) would cause runtime errors

**Future Improvement**: Consider wrapping enum additions in DO blocks with IF NOT EXISTS checks (see `0012_add_explainability_enum_values.sql` for example).

### 5.7 Deployment Verification Checklist

- [ ] `/health` returns `200 {"status":"ok"}`
- [ ] `/ready` returns `200 {"ready":true,"database":"connected"}`
- [ ] `/version` returns expected version and commit (matches deployed SHA)
- [ ] Frontend loads at `https://staging.akisflow.com`
- [ ] Login page accessible
- [ ] Test login works (use test credentials if available)

### 5.8 Manual Deployment from Developer Machine (Option C)

**When to Use**: GitHub Actions unreliable, billing issues, or explicit need for local control

**Prerequisites**:
- SSH access to staging server (private key file)
- Local repo at target commit (clean working tree)
- Optional: GHCR credentials for faster deploys

**Command**:
```bash
./scripts/staging_deploy_manual.sh \
  --host 141.147.25.123 \
  --user ubuntu \
  --key ~/.ssh/akis-oci \
  [--ghcr-user USERNAME --ghcr-token TOKEN] \
  --confirm
```

**Process**:
1. Validates SSH connectivity and git state
2. Runs quality gates (typecheck/lint)
3. Builds frontend if needed
4. Creates pre-deploy database backup
5. Copies deploy files to server via scp
6. Executes deploy.sh remotely (GHCR pull → fallback to build)
7. Runs migrations (allow benign errors)
8. Recreates services (docker compose up --force-recreate)
9. Verifies /health, /ready, /version endpoints
10. Fails if version mismatch detected

**Safety Features**:
- Dry-run mode by default (requires --confirm)
- Git working tree check (fails if dirty)
- Secret redaction in all logs
- Comprehensive error diagnostics
- Rollback option on failure

**Troubleshooting**:

| Issue | Resolution |
|-------|------------|
| SSH connection failed | Verify key file permissions (chmod 600), check OCI security list allows SSH from your IP |
| GHCR pull denied | Omit --ghcr-* flags; deploy continues with server-side build |
| Version mismatch | Check container status, backend logs (script shows diagnostics automatically) |
| Migration errors | Review migration output; benign "already exists" errors are allowed |
| Tests failing | Use --skip-tests for emergency deploy, or --force to continue despite failures |

**Performance**:
- With GHCR: ~3 minutes (faster, uses pre-built image)
- Without GHCR (server build): ~8 minutes (slower, builds on server)

**Emergency Deploy Options**:
```bash
# Skip tests and backup for fastest deploy
./scripts/staging_deploy_manual.sh \
  --host 141.147.25.123 \
  --user ubuntu \
  --key ~/.ssh/akis-oci \
  --skip-tests \
  --skip-backup \
  --confirm
```

**Standalone Verification**:
After deployment, verify manually:
```bash
./scripts/staging_smoke.sh --commit $(git rev-parse --short HEAD)
```

---

## 6. Database Management

### 6.1 Migration Policy

**Principle**: Forward-only migrations (no rollbacks)

**Workflow**:
1. Developer creates migration via `pnpm db:generate`
2. Migration committed to repository
3. CI validates migration in test database
4. Deploy workflow runs `pnpm db:migrate` automatically

### 6.2 Running Migrations Manually

**Standard Migration**:
```
ssh -i ~/.ssh/akis-oci opc@<VM_IP>
cd /opt/akis
docker compose run --rm backend pnpm db:migrate
```

**Check Migration Status**:
```
docker compose exec db psql -U akis -d akis_staging -c "\dt"
```

### 6.3 Database Connection

**From VM**:
```
docker compose exec db psql -U akis -d akis_staging
```

**Connection String Format**:
```
postgresql://akis:<password>@db:5432/akis_staging
```

---

## 7. Backup and Recovery

### 7.1 Pre-Deploy Backup (Automatic)

The deploy workflow creates a backup before each deployment:
- Location: `/opt/akis/backups/`
- Format: `staging-pre-deploy-YYYYMMDD-HHMMSS.sql`
- Retention: Manual cleanup (keep 7 days)

### 7.2 Manual Backup Procedure

**Create Backup**:
```
ssh -i ~/.ssh/akis-oci opc@<VM_IP>
cd /opt/akis
docker exec akis-staging-db pg_dump -U akis akis_staging > backups/manual-$(date +%Y%m%d-%H%M%S).sql
```

**Verify Backup**:
```
ls -lh /opt/akis/backups/
```

### 7.3 Restore Procedure

**Warning**: This replaces all data. Use only for disaster recovery.

**Steps**:

1. Stop backend
   - `docker compose stop backend`

2. Restore from backup
   - `docker exec -i akis-staging-db psql -U akis akis_staging < backups/<backup-file>.sql`

3. Start backend
   - `docker compose up -d backend`

4. Verify
   - `curl https://staging.akisflow.com/ready`

### 7.4 Backup Cleanup

**Remove backups older than 7 days**:
```
find /opt/akis/backups -name "*.sql" -mtime +7 -delete
```

---

## 8. Monitoring and Logging

### 8.1 Health Endpoints

| Endpoint | Purpose | Expected Response | Check Interval |
|----------|---------|-------------------|----------------|
| `/health` | Liveness | `{"status":"ok"}` | 1 minute |
| `/ready` | Readiness | `{"ready":true}` | 5 minutes |
| `/version` | Build info | `{"version":"x.y.z"}` | On deploy |

### 8.2 Log Access

**View Backend Logs**:
```
docker compose logs backend --tail=100 -f
```

**View All Service Logs**:
```
docker compose logs --tail=100 -f
```

**View Specific Container**:
```
docker logs akis-staging-backend --tail=50
docker logs akis-staging-db --tail=50
docker logs akis-staging-caddy --tail=50
```

### 8.3 Resource Monitoring

**Container Stats**:
```
docker stats --no-stream
```

**Disk Usage**:
```
df -h /opt/akis
du -sh /opt/akis/backups
```

**Memory/CPU**:
```
free -h
htop
```

### 8.4 External Uptime Monitoring

**Recommended Setup** (free tier):

1. Create UptimeRobot account (https://uptimerobot.com)
2. Add monitors:
   - `https://staging.akisflow.com/health` (1-minute interval)
   - `https://staging.akisflow.com/ready` (5-minute interval)
3. Configure alerts (email/Slack/webhook)

---

## 9. Incident Response

### 9.1 Incident Severity Levels

| Level | Description | Example | Response Time |
|-------|-------------|---------|---------------|
| **P0** | Total outage | Site unreachable | Immediate |
| **P1** | Critical feature broken | Auth not working | Within 1 hour |
| **P2** | Degraded service | Slow responses | Within 4 hours |
| **P3** | Minor issue | UI glitch | Next business day |

### 9.2 Incident Response Checklist

**P0/P1 Response**:

- [ ] **Step 1**: Verify issue (check health endpoints, logs)
- [ ] **Step 2**: Check if recent deploy
  - If yes: Consider immediate rollback
  - If no: Investigate root cause
- [ ] **Step 3**: Review logs for errors
  - `docker compose logs backend --tail=200`
- [ ] **Step 4**: Check resource usage
  - `docker stats`
  - `df -h`
- [ ] **Step 5**: Restart services if needed
  - `docker compose restart backend`
- [ ] **Step 6**: If database issue, check connectivity
  - `docker compose exec db pg_isready -U akis`
- [ ] **Step 7**: If rollback needed, follow Section 10
- [ ] **Step 8**: Document incident and resolution

### 9.3 Common Issues and Resolutions

| Issue | Symptom | Resolution |
|-------|---------|------------|
| Health check failing | `/health` returns 503 | Restart backend: `docker compose restart backend` |
| Database disconnected | `/ready` shows `database: disconnected` | Restart db: `docker compose restart db` |
| Certificate error | Browser shows SSL warning | Check Caddy logs, ensure port 80/443 open |
| Out of memory | Containers OOMKilled | Add swap or reduce container limits |
| Disk full | Write errors | Clean old backups, Docker prune |

---

## 10. Rollback Procedures

### 10.1 Automatic Rollback (CI/CD)

The deploy workflow includes automatic rollback if health checks fail:
- Attempts health check 30 times with 5-second intervals
- On failure, pulls previous image version and restarts

### 10.2 Manual Rollback by Version

**Steps**:

1. Identify previous working version
   - Check GitHub Actions history or container registry

2. SSH to VM
   - `ssh -i ~/.ssh/akis-oci opc@<VM_IP>`

3. Set target version
   - `export BACKEND_VERSION=<previous_commit_sha>`

4. Pull and restart
   - `cd /opt/akis`
   - `docker compose pull`
   - `docker compose up -d --force-recreate backend`

5. Verify
   - `curl https://staging.akisflow.com/version`

### 10.3 Database Rollback (Last Resort)

**Warning**: Results in data loss to backup point.

**Steps**:

1. Stop backend
2. Restore database from backup (see Section 7.3)
3. Rollback application to matching version
4. Start backend
5. Verify functionality

---

## 11. Promotion to Production

### 11.1 Staging Validation Criteria

Before promoting to production, verify:

- [ ] All smoke tests pass (see QA Evidence Pack)
- [ ] Staging stable for minimum 24 hours
- [ ] No critical bugs in staging
- [ ] Performance acceptable (response times < 2s)
- [ ] Email delivery works (if applicable)
- [ ] OAuth flows work

### 11.2 Promotion Checklist

- [ ] **Step 1**: Create production OAuth Apps (separate from staging)
  - GitHub: New OAuth App with `akis.dev` callback URL
  - Google: Add `akis.dev` to authorized redirect URIs
  - Atlassian: New OAuth App for production

- [ ] **Step 2**: Configure production secrets in GitHub
  - `PROD_HOST`, `PROD_SSH_KEY`, etc.
  - Use different secrets from staging

- [ ] **Step 3**: Configure production environment file on VM
  - `AUTH_COOKIE_SECURE=true` (mandatory)
  - Production database credentials
  - Production email provider (Resend)

- [ ] **Step 4**: Create release tag
  - `git tag v1.0.0`
  - `git push origin v1.0.0`

- [ ] **Step 5**: Approve production deployment
  - GitHub environment protection requires approval

- [ ] **Step 6**: Monitor deployment
  - Watch GitHub Actions workflow
  - Check health endpoints

- [ ] **Step 7**: Verify production
  - Complete smoke test on production
  - Monitor for 1 hour

### 11.3 Production Differences

| Setting | Staging | Production |
|---------|---------|------------|
| `AUTH_COOKIE_SECURE` | `false` or `true` | `true` (mandatory) |
| `LOG_LEVEL` | `debug` | `info` |
| `RATE_LIMIT_MAX` | 200 | 100 |
| Database | `akis_staging` | `akis_prod` |
| Domain | `staging.akisflow.com` | `akis.dev` |
| Deploy trigger | Push to main | Tag/Release |
| Approval required | No | Yes |

---

## 12. Security Checklist

### 12.1 Pre-Deployment Security

- [ ] SSH key is ed25519 or RSA 4096-bit
- [ ] SSH access limited to specific IPs (OCI security rules)
- [ ] GitHub Secrets used for all sensitive values
- [ ] No secrets committed to repository
- [ ] `.env` file has mode 600

### 12.2 Production Security (Before Go-Live)

- [ ] `AUTH_COOKIE_SECURE=true` set
- [ ] `CORS_ORIGINS` set to specific domain (no wildcard)
- [ ] Rate limiting enabled
- [ ] JWT secret is 256-bit or longer
- [ ] Database password is securely generated
- [ ] All OAuth apps use HTTPS callback URLs
- [ ] Firewall only exposes ports 80, 443

### 12.3 Ongoing Security

- [ ] Rotate secrets every 90 days
- [ ] Monitor for failed login attempts
- [ ] Review access logs periodically
- [ ] Keep Docker images updated
- [ ] Apply OS security patches monthly

---

## Appendix A: Quick Reference Commands

**SSH to VM**:
```
ssh -i ~/.ssh/akis-oci opc@<VM_IP>
```

**View Logs**:
```
docker compose logs backend --tail=100 -f
```

**Restart Services**:
```
docker compose restart backend
```

**Health Check**:
```
curl https://staging.akisflow.com/health
curl https://staging.akisflow.com/ready
curl https://staging.akisflow.com/version
```

**Database Backup**:
```
docker exec akis-staging-db pg_dump -U akis akis_staging > backups/backup-$(date +%Y%m%d-%H%M%S).sql
```

**Resource Check**:
```
docker stats --no-stream
df -h
free -h
```

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-13 | Auto | Initial staging runbook |
| 1.1.0 | 2026-02-03 | Auto | Added GHCR fallback docs, version verification details |
| 1.2.0 | 2026-02-03 | Auto | Added deploy script architecture, migration idempotency docs |
| 1.3.0 | 2026-02-03 | Auto | Added reference to Staging Release Checklist |
| 1.4.0 | 2026-02-07 | Auto | Consolidated from RUNBOOK_OCI.md + ops/STAGING_RUNBOOK.md; added smoke/rollback doc refs |