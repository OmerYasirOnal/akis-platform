# AKIS Platform - Staging Deployment Guide

This document explains how to configure and run the automated staging deployment via GitHub Actions, plus manual deployment fallback procedures.

## Prerequisites

Before the GitHub Actions workflow can deploy to staging, you need:

1. A staging server (OCI Free Tier VM or similar) with Docker and Docker Compose installed
2. SSH access configured
3. GitHub Secrets configured in the repository
4. Server architecture compatibility verified (ARM64 or AMD64)

## Server Architecture Compatibility

**CRITICAL**: The CI pipeline builds multi-arch images (`linux/amd64,linux/arm64`).

Verify your staging server architecture:

```bash
# Check architecture
uname -m
# Expected: aarch64 (ARM64) or x86_64 (AMD64)

# Check Docker platform support
docker info | grep -i arch
```

| Server Type | Architecture | Compatible |
|-------------|--------------|------------|
| OCI Ampere A1 (Free Tier) | ARM64 (aarch64) | ✅ Yes |
| OCI AMD (Standard) | AMD64 (x86_64) | ✅ Yes |
| AWS Graviton | ARM64 | ✅ Yes |
| Standard x86 VPS | AMD64 | ✅ Yes |

The workflow automatically builds for both architectures, so any of the above will work.

## GHCR Image Authentication

The workflow automatically authenticates to GHCR on the staging server using `GITHUB_TOKEN` (which has `packages:read` permission). This allows pulling images even if the repository/packages are private.

**If you need manual GHCR login on the server:**

```bash
# Create a Personal Access Token (PAT) with read:packages scope
# Then login:
echo "YOUR_PAT_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

## Required GitHub Secrets

Navigate to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `STAGING_HOST` | Server IP address or hostname | `192.168.1.100` or `staging.akis.dev` |
| `STAGING_USER` | SSH username on the server | `ubuntu`, `opc`, `akis` |
| `STAGING_SSH_KEY` | Private SSH key (PEM format) | See generation instructions below |

### Optional Secrets (for full functionality)

| Secret Name | Description |
|-------------|-------------|
| `STAGING_DATABASE_URL` | PostgreSQL connection string |
| `STAGING_AUTH_JWT_SECRET` | JWT signing secret |
| `AI_API_KEY` | OpenRouter or other AI provider API key |

## SSH Key Setup

### Step 1: Generate a new SSH keypair

On your local machine:

```bash
# Generate ed25519 key (recommended)
ssh-keygen -t ed25519 -C "github-actions@akis" -f ~/.ssh/akis_deploy -N ""

# Or generate RSA key (if ed25519 not supported)
ssh-keygen -t rsa -b 4096 -C "github-actions@akis" -f ~/.ssh/akis_deploy -N ""
```

This creates two files:
- `~/.ssh/akis_deploy` (private key - add to GitHub Secrets)
- `~/.ssh/akis_deploy.pub` (public key - add to server)

### Step 2: Add public key to the server

SSH into your staging server and add the public key:

```bash
# Connect to server
ssh your-user@your-server-ip

# Add public key to authorized_keys
echo "ssh-ed25519 AAAA... github-actions@akis" >> ~/.ssh/authorized_keys

# Ensure correct permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Add private key to GitHub Secrets

1. Copy the entire private key content:
   ```bash
   cat ~/.ssh/akis_deploy
   ```

2. Go to GitHub → Repository → Settings → Secrets and variables → Actions

3. Click "New repository secret"

4. Name: `STAGING_SSH_KEY`

5. Value: Paste the entire private key including:
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   ...
   -----END OPENSSH PRIVATE KEY-----
   ```

### Step 4: Verify SSH connectivity

Test that GitHub Actions can connect:

```bash
# From your local machine, test with the same key
ssh -i ~/.ssh/akis_deploy -o StrictHostKeyChecking=accept-new user@staging-host "echo 'SSH connection successful'"
```

## Server Setup

Ensure the staging server has the following structure:

```
/opt/akis/
├── docker-compose.yml     # Copied by CI from devops/compose/docker-compose.staging.yml
├── Caddyfile.staging      # Copied by CI from devops/compose/Caddyfile.staging
├── .env                   # Environment variables (created manually, NOT in git)
├── frontend/              # Static frontend files (copied by CI)
└── backups/               # Database backup directory
```

### Initial server setup (one-time)

```bash
# 1. Verify Docker and Docker Compose are installed
docker --version          # Should be 20.10+
docker compose version    # Should be 2.0+ (or docker-compose v1.29+)

# 2. Create directories
sudo mkdir -p /opt/akis/{frontend,backups}
sudo chown -R $USER:$USER /opt/akis

# 3. Create .env file with required variables
cat > /opt/akis/.env << 'EOF'
# ============================================================
# AKIS Staging Environment Configuration
# ============================================================

# --- Database (REQUIRED) ---
DATABASE_URL=postgresql://akis:your-password@db:5432/akis_staging
POSTGRES_USER=akis
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=akis_staging

# --- Authentication (REQUIRED) ---
AUTH_JWT_SECRET=your-jwt-secret-at-least-32-characters-long

# --- Logging ---
LOG_LEVEL=debug

# --- AI Provider (optional) ---
AI_PROVIDER=mock
AI_API_KEY=

# --- Image References (set by CI, but can override) ---
# GITHUB_REPOSITORY=omeryasironal/akis-platform-devolopment
# BACKEND_VERSION=staging
EOF

# 4. Secure the file (contains secrets)
chmod 600 /opt/akis/.env
```

### Runtime Prerequisites Checklist

Before deployment, ensure your server has:

| Requirement | Check Command | Minimum Version |
|-------------|---------------|-----------------|
| Docker | `docker --version` | 20.10+ |
| Docker Compose | `docker compose version` | 2.0+ |
| Disk Space | `df -h /opt/akis` | 5GB+ free |
| Memory | `free -h` | 2GB+ available |
| Network | `curl -I https://ghcr.io` | Can reach GHCR |

### Database Migration Strategy

The workflow automatically runs migrations during deployment:

```bash
docker compose run --rm backend pnpm db:migrate
```

**Migration behavior:**
- Migrations run inside a temporary container before service restart
- If migration fails, deployment continues (logged as warning)
- Manual migration: `docker compose exec backend pnpm db:migrate`
- Rollback: Restore from pre-deploy backup in `/opt/akis/backups/`

## Running the Deployment

### Automatic (via GitHub Actions)

1. Push changes to the `main` branch
2. GitHub Actions workflow triggers automatically
3. Monitor progress at: Repository → Actions → Deploy to Staging

### Manual Deployment Fallback

If GitHub Actions fails or you need to deploy manually:

```bash
# 1. SSH into the server
ssh -i ~/.ssh/akis_deploy user@staging.akis.dev

# 2. Navigate to app directory
cd /opt/akis

# 3. Pull latest images from GHCR
export GITHUB_REPOSITORY=omeryasironal/akis-platform-devolopment
export BACKEND_VERSION=staging  # or specific commit hash
docker compose pull

# 4. Run database migrations
docker compose run --rm backend pnpm db:migrate

# 5. Deploy with rolling update
docker compose up -d --remove-orphans

# 6. Check logs
docker compose logs -f --tail=100

# 7. Verify health
curl -s https://staging.akis.dev/health | jq
curl -s https://staging.akis.dev/version | jq
```

## Smoke Test URLs

After deployment, verify these endpoints:

| URL | Expected Response |
|-----|-------------------|
| `https://staging.akis.dev/health` | `{"status":"ok",...}` (200) |
| `https://staging.akis.dev/ready` | `{"status":"ready",...}` (200) |
| `https://staging.akis.dev/version` | `{"version":"...","commit":"..."}` (200) |
| `https://staging.akis.dev/docs` | Frontend documentation SPA (200 HTML) |
| `https://staging.akis.dev/api/docs` | Swagger UI interface (200 HTML) |
| `https://staging.akis.dev/openapi.json` | OpenAPI spec JSON (200) |

### Quick smoke test script

```bash
#!/bin/bash
BASE_URL="https://staging.akis.dev"

echo "Testing AKIS staging deployment..."

# Health check
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
echo "  /health: $HEALTH"

# Ready check
READY=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/ready")
echo "  /ready: $READY"

# Version
VERSION=$(curl -s "$BASE_URL/version" | jq -r '.commit // "error"')
echo "  /version commit: $VERSION"

# Frontend docs (should be SPA)
DOCS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/docs")
echo "  /docs (frontend): $DOCS"

# API docs (Swagger)
API_DOCS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/docs")
echo "  /api/docs (swagger): $API_DOCS"

# OpenAPI spec
OPENAPI=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/openapi.json")
echo "  /openapi.json: $OPENAPI"

echo ""
if [ "$HEALTH" = "200" ] && [ "$READY" = "200" ]; then
  echo "✅ Deployment successful!"
else
  echo "❌ Deployment may have issues - check logs"
fi
```

## Troubleshooting

### "Missing required secrets" error

The workflow shows which secrets are missing. Add them in GitHub → Repository → Settings → Secrets and variables → Actions.

### SSH connection failed

1. Verify the server is accessible: `ping staging.akis.dev`
2. Verify SSH port is open: `nc -zv staging.akis.dev 22`
3. Verify key is correct: Test locally with the same key
4. Check server logs: `sudo journalctl -u ssh -n 50`

### Docker pull failed (GHCR authentication)

The workflow uses `${{ secrets.GITHUB_TOKEN }}` which is automatic. If it fails:

1. Verify the package is public or the token has `packages:read` permission
2. Check GHCR image exists: `docker pull ghcr.io/omeryasironal/akis-platform-devolopment/akis-backend:staging`

### Health check failed after deployment

```bash
# Check container status
docker compose ps

# Check container logs
docker compose logs backend --tail=100

# Check if port is listening
docker compose exec backend wget -qO- http://localhost:3000/health

# Check Caddy logs
docker compose logs caddy --tail=50
```

### Database migration failed

```bash
# Run migrations manually
docker compose run --rm backend pnpm db:migrate

# Check database connectivity
docker compose exec db psql -U akis -d akis_staging -c "SELECT 1"
```

## Rollback Procedure

If a deployment causes issues:

```bash
# SSH into server
ssh -i ~/.ssh/akis_deploy user@staging.akis.dev
cd /opt/akis

# Option 1: Roll back to previous image tag
export BACKEND_VERSION=previous-commit-hash
docker compose pull backend
docker compose up -d backend

# Option 2: Restore database from backup (if needed)
docker compose exec -T db psql -U akis akis_staging < backups/staging-pre-deploy-TIMESTAMP.sql

# Option 3: Full rollback
docker compose down
# Manually restore files from git
docker compose up -d
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                          │
│  ┌─────────┐   ┌─────────────┐   ┌─────────────────────┐  │
│  │  Build  │ → │ Docker Push │ → │ SSH Deploy to OCI   │  │
│  └─────────┘   └─────────────┘   └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  OCI Free Tier VM                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Caddy (ports 80, 443)                               │   │
│  │  • /docs*        → frontend static files (SPA)      │   │
│  │  • /api/*        → backend:3000                     │   │
│  │  • /api/docs*    → backend:3000 (Swagger UI)        │   │
│  │  • /openapi.json → backend:3000                     │   │
│  └─────────────────────────────────────────────────────┘   │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Backend:3000    │ ←→ │ PostgreSQL:5432 │                │
│  │ (Fastify)       │    │ (akis_staging)  │                │
│  └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Source of Truth

The repository has two sets of compose/Caddy configurations:

| Location | Purpose | Used By |
|----------|---------|---------|
| `devops/compose/*` | **Canonical** - Used by GitHub Actions CI/CD | Automated deployments |
| `deploy/oci/staging/*` | **Reference** - For manual OCI deployments | Manual deployments (deprecated) |

**Always edit `devops/compose/` files for production changes.** The `deploy/oci/` files are kept for reference but should stay synchronized or be marked deprecated.

### Key Configuration Files

| File | Description |
|------|-------------|
| `devops/compose/docker-compose.staging.yml` | Docker Compose services definition |
| `devops/compose/Caddyfile.staging` | Caddy reverse proxy configuration |
| `devops/compose/Caddyfile.prod` | Production Caddy configuration |
| `backend/Dockerfile` | Backend container build |

### Routing Rules (Critical)

| Route | Destination | Purpose |
|-------|-------------|---------|
| `/docs*` | Frontend SPA | User documentation |
| `/api/*` | Backend:3000 | REST API |
| `/api/docs*` | Backend:3000 | Swagger UI |
| `/openapi.json` | Backend:3000 | OpenAPI spec |
| `/health`, `/ready`, `/version` | Backend:3000 | Health checks |

**Important:** `/docs` must NOT proxy to backend (would conflict with Swagger at the old location).

## Related Documentation

- [Backend API Documentation](/api/docs) - Swagger UI
- [Frontend Documentation](/docs) - User guides
- [Environment Setup](./ENV_SETUP.md) - Local development
- [CI/CD Pipeline](./CI_AUTOMATION.md) - GitHub Actions details
