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
# Edit .env with production values:
#   POSTGRES_PASSWORD=<strong-password>
#   SESSION_SECRET=<random-string>
#   DOMAIN=app.akisflow.com
#   GITHUB_TOKEN=<optional, for MCP>

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

## Smoke Test Script

Run these after every deploy to verify the system is healthy:

```bash
#!/bin/bash
set -e
DOMAIN="${1:-app.akisflow.com}"

echo "=== AKIS Smoke Tests ==="

# 1. Health check
echo -n "Health: "
curl -sf "https://$DOMAIN/health" | jq -r '.status'

# 2. Ready check
echo -n "Ready: "
curl -sf "https://$DOMAIN/ready" | jq -r '.ready // .status'

# 3. Frontend loads (returns HTML)
echo -n "Frontend: "
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN/")
[ "$STATUS" = "200" ] && echo "OK ($STATUS)" || echo "FAIL ($STATUS)"

# 4. API agents endpoint (auth required, expect 401 or 200)
echo -n "API /api/agents/jobs: "
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/agents/jobs")
[ "$STATUS" = "401" ] || [ "$STATUS" = "200" ] && echo "OK ($STATUS)" || echo "FAIL ($STATUS)"

# 5. Plans endpoint (no auth required)
echo -n "Plans: "
curl -sf "https://$DOMAIN/api/billing/plans" | jq -r '.[0].name // "OK"'

echo "=== Done ==="
```

## Deployment Checklist (OCI/Ubuntu)

1. **Install Docker + Compose plugin**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   # Logout and login for group change
   ```

2. **Configure env vars**
   ```bash
   cp deploy/prod/.env.example deploy/prod/.env
   # Edit with production values
   ```

3. **Open firewall ports**
   ```bash
   sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
   # OCI: Also add ingress rules in the VCN security list
   ```

4. **DNS A record**
   - Point `app.akisflow.com` (or your domain) to the server's public IP
   - Wait for DNS propagation (check with `dig app.akisflow.com`)

5. **Deploy**
   ```bash
   docker compose -f deploy/prod/docker-compose.yml up -d
   ```

6. **Verify health endpoints**
   ```bash
   curl https://app.akisflow.com/health
   curl https://app.akisflow.com/ready
   ```

7. **Configure Stripe webhook** (if billing enabled)
   - Set webhook endpoint to `https://app.akisflow.com/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`

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
