# AKIS Staging Release Checklist

**Version**: 1.0.0  
**Last Updated**: 2026-02-03

This checklist ensures repeatable, reliable staging deployments.

---

## Pre-Deployment Checks

- [ ] All CI checks pass on `main` branch
- [ ] No blocking issues in recent commits
- [ ] Ground truth verified:
  ```bash
  git fetch origin && git rev-parse --short origin/main
  gh run list --workflow=oci-staging-deploy.yml -L 1
  curl -sf https://staging.akisflow.com/version | jq -r '.commit'
  ```

---

## How to Trigger Deploy

### Via GitHub UI

1. Go to **Actions** → **OCI Staging Deploy**
2. Click **Run workflow**
3. Set `confirm_deploy` to **`deploy`**
4. Click **Run workflow**

### Via CLI

```bash
gh workflow run oci-staging-deploy.yml --field confirm_deploy=deploy
```

---

## Post-Deployment Verification

### Required Endpoints

| Endpoint | Expected Response |
|----------|-------------------|
| `/health` | `200 {"status":"ok"}` |
| `/ready` | `200 {"ready":true,"database":"connected"}` |
| `/version` | `200 {"commit":"<expected_sha>"}` |

### Verification Commands

```bash
# Check all endpoints
curl -sf https://staging.akisflow.com/health
curl -sf https://staging.akisflow.com/ready
curl -sf https://staging.akisflow.com/version

# Verify commit matches
EXPECTED=$(git rev-parse --short origin/main)
DEPLOYED=$(curl -sf https://staging.akisflow.com/version | jq -r '.commit')
[ "$EXPECTED" = "$DEPLOYED" ] && echo "✅ MATCH" || echo "❌ MISMATCH"
```

---

## Troubleshooting

### Version Mismatch

**Symptom**: `/version.commit` doesn't match workflow `headSha`

**Diagnosis**:
```bash
# SSH to server
ssh ubuntu@141.147.25.123

# Check container state
cd /opt/akis
docker compose ps
docker inspect akis-staging-backend --format '{{.Config.Image}} {{.Created}}'

# Check .env version
grep BACKEND_VERSION .env

# Check backend logs
docker compose logs --tail=50 backend
```

**Resolution**:
1. Re-run the OCI Staging Deploy workflow
2. If still failing, SSH and manually run:
   ```bash
   cd /opt/akis
   export BACKEND_VERSION=<expected_sha>
   docker compose up -d --force-recreate --pull never backend
   ```

### GHCR Pull Denied

**Symptom**: Workflow shows "GHCR pull failed (no credentials or image not found)"

**Impact**: Deploy continues with server-side build (slower but works)

**Optional Fix**: Configure GHCR credentials for faster deploys:
1. Create GitHub PAT with `read:packages` scope
2. Add repository secrets:
   - `GHCR_USERNAME`: GitHub username
   - `GHCR_READ_TOKEN`: PAT token

### Migration Errors

**Symptom**: Deploy fails with migration errors

**Benign Errors** (automatically handled):
- `enum label ... already exists`
- `relation ... already exists`
- `column ... already exists`

**Non-Benign Errors** (deployment fails):
- Any other database error

**Resolution**:
1. Check migration files for idempotency
2. Use `DO $$ IF NOT EXISTS ... END $$;` pattern for enum additions
3. Run `pnpm db:migrate` locally against a fresh DB to verify

### Health Check Failing

**Symptom**: `/health` or `/ready` not responding

**Diagnosis**:
```bash
ssh ubuntu@141.147.25.123
cd /opt/akis
docker compose ps
docker compose logs --tail=100 backend
```

**Resolution**:
1. Restart backend: `docker compose restart backend`
2. Check database: `docker compose exec db pg_isready -U akis`
3. Check Caddy: `docker compose logs --tail=50 caddy`

---

## Rollback Procedure

### Quick Rollback

1. Find previous successful deploy run:
   ```bash
   gh run list --workflow=oci-staging-deploy.yml -L 5
   ```

2. Get the previous headSha and re-deploy manually:
   ```bash
   ssh ubuntu@141.147.25.123
   cd /opt/akis
   export BACKEND_VERSION=<previous_sha>
   docker compose up -d --force-recreate --pull never backend
   ```

### Database Rollback (Emergency Only)

```bash
ssh ubuntu@141.147.25.123
cd /opt/akis

# Stop backend
docker compose stop backend

# Restore from backup (if available)
docker exec -i akis-staging-db psql -U akis akis_staging < backups/<backup-file>.sql

# Restart backend
docker compose up -d backend
```

---

## Reference

- Full runbook: [OCI_STAGING_RUNBOOK.md](../deploy/OCI_STAGING_RUNBOOK.md)
- Workflow: `.github/workflows/oci-staging-deploy.yml`
- Deploy script: `deploy/oci/staging/deploy.sh`
