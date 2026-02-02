# AKIS Platform - Edge Proxy Operations Runbook

This runbook covers the edge proxy architecture that enables both staging and production to run on the same server, plus troubleshooting common issues like nginx conflicts and OAuth routing.

## Architecture Overview

```
                        Internet
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │     Edge Proxy (Caddy)               │
        │     Ports: 80, 443                   │
        │     Container: akis-edge-caddy       │
        └──────────────────────────────────────┘
                    │           │
       ┌────────────┘           └────────────┐
       ▼                                      ▼
┌─────────────────────┐        ┌─────────────────────┐
│  akisflow.com       │        │  staging.akisflow.com│
│  (Production)       │        │  (Staging)           │
│                     │        │                      │
│  akis-prod-backend  │        │  akis-staging-backend│
│  akis-prod-db       │        │  akis-staging-db     │
└─────────────────────┘        └─────────────────────┘
```

**Key points:**
- Only the edge proxy binds to host ports 80/443
- Staging and production stacks use internal Docker networking
- All stacks connect via the shared `akis-edge-net` network

## Common Issues and Solutions

### Issue: 502 Bad Gateway from nginx

**Symptom:** Browser shows "502 Bad Gateway nginx/1.24.0"

**Cause:** nginx is still running and binding ports 80/443, intercepting traffic before it reaches the Docker edge proxy.

**Diagnosis:**
```bash
# Check what's binding to port 80/443
sudo ss -ltnp | egrep ':(80|443)\s'

# If output shows nginx:
# LISTEN  0  511  0.0.0.0:80  0.0.0.0:*  users:(("nginx",pid=1234,fd=5))
```

**Fix:**
```bash
# Stop, disable, and mask nginx (prevents auto-start)
sudo systemctl stop nginx
sudo systemctl disable nginx
sudo systemctl mask nginx

# Verify ports are free
sudo ss -ltnp | egrep ':(80|443)\s'
# Should show nothing or only Docker

# Restart edge proxy
cd /opt/akis
docker compose -f docker-compose.edge.yml up -d
```

### Issue: Edge proxy container not running

**Symptom:** Health checks return 000 (connection refused)

**Diagnosis:**
```bash
# Check if edge container exists
docker ps -a | grep akis-edge-caddy

# Check container logs
docker logs akis-edge-caddy 2>&1 | tail -50
```

**Fix:**
```bash
cd /opt/akis

# Ensure network exists
docker network create akis-edge-net 2>/dev/null || true

# Ensure frontend directories exist
mkdir -p /opt/akis/staging-frontend /opt/akis/prod-frontend

# Start edge proxy
docker compose -f docker-compose.edge.yml up -d

# Verify
docker ps | grep akis-edge-caddy
```

### Issue: OAuth endpoint returns 502

**Symptom:** `/auth/oauth/github` returns 502 or shows nginx error page

**Expected behavior:** 
- If OAuth is configured: 301/302/303 redirect to GitHub
- If OAuth is not configured: 503 with `{"error":"github OAuth is not configured"}`

**Diagnosis:**
```bash
# Test OAuth endpoint
curl -sS -I https://staging.akisflow.com/auth/oauth/github | head

# Check if response comes from Caddy (look for "via: 1.1 Caddy" header)
# If you see "nginx" in the response, nginx is still intercepting traffic
```

**Fix:** Follow the nginx removal steps above, then verify the edge proxy is routing correctly:
```bash
# Check edge proxy logs for /auth requests
docker logs akis-edge-caddy 2>&1 | grep -i auth

# Verify Caddyfile routing
cat /opt/akis/Caddyfile.edge | grep -A2 "handle /auth"
```

### Issue: OAuth returns 503 "not configured"

**This is expected behavior** when `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET` are not set in the environment.

To enable OAuth:
1. Create a GitHub OAuth App at https://github.com/settings/developers
2. Add credentials to `/opt/akis/.env`:
   ```
   GITHUB_OAUTH_CLIENT_ID=your_client_id
   GITHUB_OAUTH_CLIENT_SECRET=your_client_secret
   GITHUB_OAUTH_CALLBACK_URL=https://staging.akisflow.com/auth/oauth/github/callback
   ```
3. Restart backend: `docker compose restart backend`

## Verification Commands

### Check overall health

```bash
# All endpoints at once
curl -sS https://staging.akisflow.com/health | jq
curl -sS https://staging.akisflow.com/ready | jq
curl -sS https://staging.akisflow.com/version | jq
```

### Check edge proxy status

```bash
# Container status
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E '(edge|caddy)'

# Port bindings
sudo ss -ltnp | egrep ':(80|443)\s'

# Edge logs
docker logs akis-edge-caddy --tail=100
```

### Check OAuth routing

```bash
# Should return redirect OR JSON error (not 502)
curl -sS -I https://staging.akisflow.com/auth/oauth/github
curl -sS https://staging.akisflow.com/auth/oauth/github
```

### Check backend connectivity from edge

```bash
# Exec into edge container and test internal routing
docker exec akis-edge-caddy wget -qO- http://akis-staging-backend:3000/health
docker exec akis-edge-caddy wget -qO- http://akis-prod-backend:3000/health
```

## Restarting Services

### Reload Caddy configuration (no downtime)

```bash
docker exec akis-edge-caddy caddy reload --config /etc/caddy/Caddyfile
```

### Restart edge proxy

```bash
cd /opt/akis
docker compose -f docker-compose.edge.yml restart
```

### Full edge proxy recreation

```bash
cd /opt/akis
docker compose -f docker-compose.edge.yml down
docker compose -f docker-compose.edge.yml up -d
```

## File Locations

| File | Purpose |
|------|---------|
| `/opt/akis/docker-compose.edge.yml` | Edge proxy compose file |
| `/opt/akis/Caddyfile.edge` | Edge Caddy configuration |
| `/opt/akis/docker-compose.yml` | Staging stack compose |
| `/opt/akis/staging-frontend/` | Staging frontend static files |
| `/opt/akis/prod-frontend/` | Production frontend static files |

## Routing Rules (Caddyfile.edge)

| Route | Backend | Purpose |
|-------|---------|---------|
| `/health` | `akis-{env}-backend:3000` | Health check |
| `/ready` | `akis-{env}-backend:3000` | Readiness check |
| `/version` | `akis-{env}-backend:3000` | Version info |
| `/api/*` | `akis-{env}-backend:3000` | REST API |
| `/auth/*` | `akis-{env}-backend:3000` | Authentication (OAuth, login) |
| `/api/docs*` | `akis-{env}-backend:3000` | Swagger UI |
| `/openapi.json` | `akis-{env}-backend:3000` | OpenAPI spec |
| `/*` (default) | Static files | Frontend SPA |

## Workflow Integration

The GitHub Actions workflows (`deploy-staging.yml`, `deploy-prod.yml`) automatically:

1. **Check and mask nginx**: Stops, disables, and masks nginx to prevent conflicts
2. **Create network**: Ensures `akis-edge-net` exists
3. **Deploy stack**: Starts backend/db without port bindings
4. **Start edge proxy**: Starts Caddy with 80/443 bindings
5. **Verify edge**: Confirms `akis-edge-caddy` container is running
6. **Health checks**: Validates endpoints respond correctly
7. **OAuth smoke test**: Verifies `/auth/oauth/github` routing works

## Emergency: Restore nginx (if needed for other sites)

If you need nginx back for other applications:

```bash
# Unmask nginx
sudo systemctl unmask nginx

# Start nginx (warning: will conflict with edge proxy)
sudo systemctl start nginx

# You'll need to either:
# 1. Stop edge proxy and use nginx for everything
# 2. Configure nginx as upstream proxy to edge proxy
# 3. Move other apps to different ports
```

## Related Documentation

- [Staging Deployment Guide](./STAGING_DEPLOYMENT.md)
- [Environments and Releases](./ENVIRONMENTS_AND_RELEASES.md)
