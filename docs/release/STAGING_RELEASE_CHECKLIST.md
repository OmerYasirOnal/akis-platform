# AKIS Staging Release Checklist

**Version**: 1.3.0  
**Last Updated**: 2026-02-16

This checklist ensures repeatable, reliable staging deployments.

> **Related**:
> - [Smoke Test Checklist](../deploy/STAGING_SMOKE_TEST_CHECKLIST.md) — Detailed pass/fail criteria
> - [Rollback Runbook](../deploy/STAGING_ROLLBACK_RUNBOOK.md) — When and how to rollback
> - [OCI Staging Runbook](../deploy/OCI_STAGING_RUNBOOK.md) — Full operations guide

---

## Pre-Deployment Checks

- [ ] All CI checks pass on `main` branch
- [ ] If GitHub Actions billing is blocked, run equivalent manual CI gates locally (backend `typecheck/lint/test:unit`, frontend `typecheck/lint/test/build`, backend `test:integration`, frontend Playwright E2E `--workers=1`) and attach evidence to release notes / issue tracker
- [ ] No blocking issues in recent commits
- [ ] `AI_KEY_ENCRYPTION_KEY` staging env'de set (OAuth token encrypted write strict-block policy için zorunlu)
- [ ] Active docs reference check: `node scripts/check_docs_references.mjs`
- [ ] Ground truth verified:
  ```bash
  git fetch origin && git rev-parse --short origin/main
  gh run list --workflow=oci-staging-deploy.yml -L 1
  curl -sf https://staging.akisflow.com/version | jq -r '.commit'
  ```

---

## M2 Canary Progression (Observe -> Enforce)

Reliability rollout için zorunlu canary adımları:

1. `%10 cohort`: `RELIABILITY_CANARY_ENABLED=true`, `AGENT_CONTRACT_CANARY_PERCENT=10`, `VERIFICATION_GATE_CANARY_PERCENT=10`, `VERIFICATION_GATE_ROLLOUT_MODE=warn`, `AGENT_CONTRACT_ENFORCEMENT_MODE=observe`
2. `%50 cohort`: `AGENT_CONTRACT_CANARY_PERCENT=50`, `VERIFICATION_GATE_CANARY_PERCENT=50`, `VERIFICATION_GATE_ROLLOUT_MODE=enforce_scribe`, `AGENT_CONTRACT_ENFORCEMENT_MODE=enforce`
3. `%100 cohort`: `AGENT_CONTRACT_CANARY_PERCENT=100`, `VERIFICATION_GATE_CANARY_PERCENT=100`, `VERIFICATION_GATE_ROLLOUT_MODE=enforce_all`

Her adımda quality gate kontrolü:
- `false_block_rate < 1%`
- `contract_violation_count` trendi stabil
- P0 kullanıcı akışları (Auth + Scribe + Jobs) PASS
- Trace reliability metrikleri:
  - `trace_reproducibility_rate >= 98%`
  - `critical_flow_coverage >= 95%`
  - `edge_case_category_coverage >= 90%`
  - `flake_rate <= 2%`
  - `mcp_call_success_rate >= 99%`

Threshold ihlalinde: [`../deploy/STAGING_ROLLBACK_RUNBOOK.md`](../deploy/STAGING_ROLLBACK_RUNBOOK.md) içindeki feature-flag rollback uygulanır.

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

## Manual Deploy Path (No GitHub Actions)

### When to Use
- GitHub Actions billing/minutes issues
- Workflow failures or pipeline blocked
- Emergency deploy needed from local machine

### Prerequisites
- [ ] SSH key file (e.g., `~/.ssh/akis-oci`)
- [ ] Local repo at target commit
- [ ] Clean git working tree (`git status` clean)
- [ ] Optional: GHCR credentials for faster deploy

### Deploy Command

```bash
./scripts/staging_deploy_manual.sh \
  --host 141.147.25.123 \
  --user ubuntu \
  --key ~/.ssh/akis-oci \
  --ghcr-user omeryasironal \
  --ghcr-token ghp_xxxxxxxxxxxxx \
  --confirm
```

**Notes**:
- Without `--confirm`: dry-run (preview commands)
- Without `--ghcr-*`: slower but works (server-side build)
- Apple Silicon (`arm64`) local build ile `amd64` staging sunucusuna deploy ediliyorsa image'i `linux/amd64` olarak üretin:
  - `docker buildx build --platform linux/amd64 -t ghcr.io/omeryasironal/akis-platform-devolopment/akis-backend:$(git rev-parse --short HEAD) --load backend`
  - Ardından `docker save | ssh ... 'docker load'` ile sunucuya taşıyın
- Use `--skip-tests` for emergency deploys
- Use `--skip-backup` to skip pre-deploy database backup

### Verification

Run smoke tests manually:
```bash
./scripts/staging_smoke.sh --commit $(git rev-parse --short HEAD)
```

Expected output:
```
✅ /health: 200
✅ /ready: 200
✅ /version: 200 (commit: abc1234) MATCH
✅ / (frontend): 200
✅ /api/auth/me: 401
All smoke tests passed!
```

### Troubleshooting

Same as GitHub Actions path (see OCI_STAGING_RUNBOOK.md Section 9).

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

**Optional Fix**: Configure GHCR credentials for faster deploys (reduces deploy time by ~5 minutes):

#### Step 1: Create GitHub PAT

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Set:
   - **Note**: `AKIS GHCR Read Token`
   - **Expiration**: 90 days (or custom)
   - **Scopes**: Select only `read:packages`
4. Click **Generate token**
5. Copy the token (you won't see it again)

#### Step 2: Add Repository Secrets

1. Go to Repository → Settings → Secrets and variables → Actions
2. Add two secrets:
   - **`GHCR_USERNAME`**: Your GitHub username
   - **`GHCR_READ_TOKEN`**: The PAT you just created

#### Step 3: Verify

After next deploy, check workflow logs for:
```
GHCR credentials provided, attempting login...
GHCR login successful
GHCR pull successful
```

Instead of:
```
No GHCR credentials provided, attempting anonymous pull...
GHCR pull failed (no credentials or image not found)
=== Building image locally (fallback) ===
```

#### Note on Security

- Credentials are passed via environment variables, never stored on disk
- `docker logout ghcr.io` is called after pull attempt
- If PAT expires, deploy falls back to server-side build (no failure)

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

---

## GitHub Actions Billing

### Handling "Problem Billing Your Account" Email

If you receive an email from GitHub about billing issues:

#### Impact

- **Actions**: Workflows may be paused or fail
- **Packages**: GHCR pulls may be denied
- **Artifacts**: Storage limits may apply

#### Resolution Checklist

1. **Check Payment Method**
   - Go to GitHub → Settings → Billing and plans → Payment information
   - Verify card is valid and not expired
   - Update if necessary

2. **Check Spending Limits**
   - Go to GitHub → Settings → Billing and plans → Spending limits
   - Ensure **Actions** spending limit is NOT $0 (which stops all usage)
   - Set a reasonable limit (e.g., $10/month for safety)

3. **Review Usage**
   - Go to GitHub → Settings → Billing and plans → Plans and usage
   - Check Actions minutes used this billing cycle
   - Check Packages storage used

4. **Verify No Blocks**
   - Go to GitHub → Settings → Billing and plans → Payment information
   - Look for any red warnings or "action required" notices

#### After Fixing

1. Re-run any failed workflows
2. Verify GHCR access: `docker pull ghcr.io/<owner>/<repo>/<image>:tag`
3. Monitor next billing cycle for recurring issues

---

## Migration Idempotency Guide

### Writing Idempotent Migrations

All migrations in this repo MUST be idempotent (safe to run multiple times).

#### Pattern: Enum Value Addition

```sql
-- ❌ BAD: Will fail if value exists
ALTER TYPE my_enum ADD VALUE 'new_value';

-- ✅ GOOD: Idempotent pattern
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'new_value' AND enumtypid = 'my_enum'::regtype) THEN
        ALTER TYPE my_enum ADD VALUE 'new_value';
    END IF;
END $$;
```

#### Pattern: Column Addition

```sql
-- ❌ BAD: Will fail if column exists
ALTER TABLE users ADD COLUMN status VARCHAR(50);

-- ✅ GOOD: Idempotent pattern
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50);
```

#### Pattern: Index Creation

```sql
-- ❌ BAD: Will fail if index exists
CREATE INDEX idx_users_email ON users(email);

-- ✅ GOOD: Idempotent pattern
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

#### Verifying Idempotency

Nightly smoke workflow runs migrations twice against the same DB. If your migration is not idempotent, it will fail there before reaching staging.

---

## Reference

- Full runbook: [OCI_STAGING_RUNBOOK.md](../deploy/OCI_STAGING_RUNBOOK.md)
- Workflow: `.github/workflows/oci-staging-deploy.yml`
- Deploy script: `deploy/oci/staging/deploy.sh`
