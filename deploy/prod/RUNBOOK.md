# AKIS Production Deployment Runbook

## Prerequisites

- Docker and Docker Compose v2 installed
- Domain DNS A record pointing to server IP
- `.env` file created from `.env.example` with production values
- Backend Docker image built and pushed to GHCR

## First-Time Deploy

```bash
# 1. Clone repo on server
git clone https://github.com/omeryasironal/akis-platform-devolopment.git
cd akis-platform-devolopment/devagents

# 2. Create env file
cp deploy/prod/.env.example deploy/prod/.env
# Edit .env with production values

# 3. Build frontend
pnpm -C frontend install && pnpm -C frontend build

# 4. Start services
docker compose -f deploy/prod/docker-compose.yml up -d

# 5. Run DB migrations
docker compose -f deploy/prod/docker-compose.yml exec backend \
  node -e "import('./dist/db/migrate.js').then(m => m.default())"

# 6. Verify
curl https://app.akisflow.com/health
# Expected: {"status":"ok"}
```

## Update Deploy

```bash
cd akis-platform-devolopment/devagents
git pull origin main

# Rebuild backend image
docker compose -f deploy/prod/docker-compose.yml build backend

# Rebuild frontend
pnpm -C frontend install && pnpm -C frontend build

# Rolling restart
docker compose -f deploy/prod/docker-compose.yml up -d --no-deps backend

# Run migrations if needed
docker compose -f deploy/prod/docker-compose.yml exec backend \
  node -e "import('./dist/db/migrate.js').then(m => m.default())"
```

## Smoke Tests

```bash
# Health check
curl -s https://app.akisflow.com/health | jq .

# Ready check
curl -s https://app.akisflow.com/ready | jq .

# API response
curl -s https://app.akisflow.com/ | jq .

# Plans endpoint (no auth required)
curl -s https://app.akisflow.com/api/billing/plans | jq .
```

## Rollback

```bash
# Revert to previous image tag
BACKEND_VERSION=previous-tag docker compose -f deploy/prod/docker-compose.yml up -d --no-deps backend
```

## Logs

```bash
# All services
docker compose -f deploy/prod/docker-compose.yml logs -f

# Specific service
docker compose -f deploy/prod/docker-compose.yml logs -f backend

# Last 100 lines
docker compose -f deploy/prod/docker-compose.yml logs --tail=100 backend
```

## Database Backup

```bash
docker compose -f deploy/prod/docker-compose.yml exec db \
  pg_dump -U akis akis_prod > backup-$(date +%Y%m%d).sql
```
