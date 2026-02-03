# AKIS Staging Runbook

**Version:** 1.0  
**Last Updated:** 2026-02-03  
**Purpose:** Quick troubleshooting guide for staging deployment issues

---

## Quick Health Check

Run this first when investigating any staging issue:

```bash
# Health endpoints
curl -sf https://staging.akisflow.com/health | jq
curl -sf https://staging.akisflow.com/ready | jq
curl -sf https://staging.akisflow.com/version | jq

# API endpoint (should be 401, not 404)
curl -sI https://staging.akisflow.com/api/agents/jobs/running | head -3

# Auth endpoint (should return JSON error, not HTML)
curl -s -X POST https://staging.akisflow.com/auth/login/start \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## Issue: "Not Found" Errors

### Symptom 1: `/api/api/...` Double Prefix

**Check:** Open browser DevTools → Network tab → Look for URLs with `/api/api/`

```bash
# This should return 404 (correct - double prefix should not exist)
curl -sI https://staging.akisflow.com/api/api/agents/jobs/running | head -3

# This should return 401 (correct - endpoint exists, auth required)
curl -sI https://staging.akisflow.com/api/agents/jobs/running | head -3
```

**If you see `/api/api/` in requests:**
- Frontend base URL is incorrectly set to include `/api`
- Check `VITE_API_URL` or `VITE_BACKEND_URL` environment variables
- See [API_BASE_URL.md](./API_BASE_URL.md) for the correct standard

**Fix:** Ensure all API services use `getApiBaseUrl()` from `frontend/src/services/api/config.ts`

### Symptom 2: Auth Endpoints Return 404

**Check:**

```bash
# Should return JSON with error code, NOT 404
curl -s -X POST https://staging.akisflow.com/auth/signup/start \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com"}'

# Expected responses:
# - 200 with {"userId":"...","status":"pending_password"}
# - 200 with {"error":"Email already registered","code":"EMAIL_IN_USE"}
# - NOT 404
```

**If 404:**
1. Check if backend is running: `curl -sf https://staging.akisflow.com/health`
2. Check Caddy routing in `Caddyfile.edge`
3. Verify auth routes are registered in backend

### Symptom 3: HTML Response Instead of JSON

**Check:**

```bash
# If you get HTML back, there's a routing issue
curl -s https://staging.akisflow.com/api/agents/jobs | head -5
```

**If HTML (not JSON):**
- Edge proxy might be serving SPA fallback for API routes
- Check Caddyfile routing order (API routes must come before catch-all)

---

## Issue: Deploy Triage

### Check Workflow Status

```bash
# List recent workflow runs
gh run list --workflow=deploy-staging.yml --limit 10

# View specific run details
gh run view <RUN_ID> --json status,conclusion,jobs

# Watch running workflow
gh run watch <RUN_ID>
```

### Common States

| State | Meaning | Action |
|-------|---------|--------|
| `queued` | Waiting for runner | Wait or use `workflow_dispatch` |
| `in_progress` | Currently running | Monitor with `gh run watch` |
| `success` | Deployed successfully | Verify with `/version` |
| `failure` | Build/deploy failed | Check logs with `gh run view` |
| `cancelled` | Superseded by newer run | Expected with `cancel-in-progress: true` |

### Manual Trigger (workflow_dispatch)

Use when automatic deploy doesn't start or you need to force-deploy:

```bash
# Trigger manual deploy
gh workflow run deploy-staging.yml -f reason="Manual deploy after config change"

# Monitor the triggered run
gh run list --workflow=deploy-staging.yml --limit 1
gh run watch
```

### Verify Deployment

```bash
# Check deployed commit matches expected
EXPECTED="abc1234"  # Your commit hash
DEPLOYED=$(curl -sf https://staging.akisflow.com/version | jq -r '.commit')

if [ "$DEPLOYED" = "$EXPECTED" ]; then
  echo "✅ Correct version deployed: $DEPLOYED"
else
  echo "❌ Version mismatch: expected=$EXPECTED, deployed=$DEPLOYED"
fi
```

---

## Issue: Auth Flow Problems

### OAuth "503 Not Configured"

```bash
# Check OAuth endpoint
curl -sI https://staging.akisflow.com/auth/oauth/github | head -5

# 503 with OAUTH_NOT_CONFIGURED means env vars not set
# 302 redirect means OAuth is working
```

**Fix:** Add OAuth credentials to server environment:

```bash
ssh user@staging-server
cd /opt/akis
# Add to .env (get actual values from GitHub OAuth App settings)
echo "GITHUB_OAUTH_CLIENT_ID=your_client_id" >> .env
echo "GITHUB_OAUTH_CLIENT_SECRET=your_client_secret" >> .env
docker compose restart backend
```

See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed setup.

### Expected Auth Responses

| Endpoint | Method | Expected Response |
|----------|--------|-------------------|
| `/auth/signup/start` | POST | `{"userId":"...", "status":"pending_password"}` or error |
| `/auth/login/start` | POST | `{"userId":"...", "requiresPassword":true}` or error |
| `/auth/me` | GET | `{"id":"...", "email":"..."}` (if logged in) or 401 |
| `/auth/oauth/github` | GET | 302 redirect to GitHub (if configured) or 503 |

### Common Auth Error Codes

| Code | Meaning |
|------|---------|
| `EMAIL_IN_USE` | Email already registered (signup) |
| `USER_NOT_FOUND` | No account with this email (login) |
| `INVALID_PASSWORD` | Wrong password |
| `OAUTH_NOT_CONFIGURED` | OAuth env vars not set |

---

## Issue: Server-Side Debugging

### SSH Into Server

```bash
ssh -i ~/.ssh/akis_deploy user@staging.akisflow.com
cd /opt/akis
```

### Container Status

```bash
# List all containers
docker compose ps

# Check specific container logs
docker compose logs backend --tail=100
docker compose logs edge --tail=50

# Check if backend responds locally
curl -sf http://localhost:3000/health
```

### Database Connectivity

```bash
# Test database connection
docker compose exec backend pnpm db:migrate

# Direct database query
docker compose exec db psql -U akis -d akis_staging -c "SELECT 1"
```

### Network Debugging

```bash
# Check edge proxy can reach backend
docker compose exec edge wget -qO- http://backend:3000/health

# Check port bindings
sudo ss -tlnp | grep -E ':(80|443|3000) '
```

---

## Rollback Procedure

If deployment causes issues:

```bash
# 1. Find previous working commit
gh run list --workflow=deploy-staging.yml --limit 10

# 2. SSH into server
ssh -i ~/.ssh/akis_deploy user@staging.akisflow.com
cd /opt/akis

# 3. Update .env to use previous commit
sed -i 's/BACKEND_VERSION=.*/BACKEND_VERSION=previous_commit_hash/' .env

# 4. Pull and restart
docker compose pull
docker compose up -d

# 5. Verify
curl -sf https://staging.akisflow.com/version | jq
```

---

## Quick Reference URLs

| URL | Purpose |
|-----|---------|
| https://staging.akisflow.com | Frontend |
| https://staging.akisflow.com/health | Health check |
| https://staging.akisflow.com/version | Version info |
| https://staging.akisflow.com/api/docs | Swagger UI |

---

## Related Documentation

- [API_BASE_URL.md](./API_BASE_URL.md) - Frontend base URL standard
- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - OAuth configuration
- [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md) - Full deployment guide
- [EDGE_PROXY_RUNBOOK.md](./EDGE_PROXY_RUNBOOK.md) - Caddy/nginx troubleshooting
