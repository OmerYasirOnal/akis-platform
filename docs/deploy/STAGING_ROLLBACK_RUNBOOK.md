# Staging Rollback Runbook

**Version**: 1.1.0
**Last Updated**: 2026-02-16
**Scope**: Staging Environment (`staging.akisflow.com`)

> Extracted from [OCI_STAGING_RUNBOOK.md](OCI_STAGING_RUNBOOK.md) Section 10, with additional detail.

---

## When to Rollback

| Trigger | Severity | Action |
|---------|----------|--------|
| Smoke test version mismatch | CRITICAL | Immediate rollback |
| Health endpoint 503 after deploy | HIGH | Rollback within 5 minutes |
| Frontend blank page | HIGH | Check Caddy first, then rollback |
| Auth flow broken post-deploy | MEDIUM | Investigate, rollback if not fixable in 15 min |
| Trace reproducibility <98% | HIGH | Feature-flag rollback + investigate drift |
| Trace flake rate >2% (15m window) | HIGH | Feature-flag rollback + quarantine review |
| Trace edge-case coverage <90% | HIGH | Stop enforce rollout, revert to observe |
| Non-critical UI bug | LOW | Fix forward, no rollback needed |

---

## M2 Reliability Emergency Rollback

M2 güvenilirlik dalgası için en hızlı rollback yolu deploy rollback değil, feature-flag rollback'tir.

| Domain | Env Flag | Safe Rollback Value |
|--------|----------|---------------------|
| Contract enforcement | `AGENT_CONTRACT_ENFORCEMENT_MODE` | `observe` |
| Verification gates rollout | `VERIFICATION_GATE_ROLLOUT_MODE` | `observe` |
| Canary gating | `RELIABILITY_CANARY_ENABLED` | `false` |
| Contract canary ratio | `AGENT_CONTRACT_CANARY_PERCENT` | `0` |
| Gate canary ratio | `VERIFICATION_GATE_CANARY_PERCENT` | `0` |
| Deterministic planning force | `AI_FORCE_DETERMINISTIC_PLAN` | `false` (opsiyonel, sadece ihtiyaç halinde) |
| Freshness scheduler | `FRESHNESS_SCHEDULER_ENABLED` | `false` |

**Procedure (no code rollback):**
1. Update staging `.env` flags above.
2. Restart backend container.
3. Run `GET /health`, `GET /ready`, `GET /api/knowledge/freshness/status`.
4. Re-run smoke + regression subset.

> Not: OAuth token encryption write policy (`AI_KEY_ENCRYPTION_KEY`) feature-flag ile kapatılamaz.
> Key eksikse callback write akışları block olur; rollback yerine key provisioning fix uygulanmalıdır.

## Trace Rollout Audit Fields (Zorunlu)

Rollback veya enforce-mode değişikliği yapıldığında aşağıdaki alanlar incident notuna yazılır:

1. `who` (değişikliği yapan kişi)
2. `when` (UTC timestamp)
3. `metric` (ihlali tetikleyen metrik ve değer)
4. `rollback_toggle` (değiştirilen env flag listesi)
5. `cohort` (`10`, `50`, `100`)

---

## 1. Automatic Rollback (CI/CD)

The `oci-staging-deploy.yml` workflow includes automatic rollback:

1. After deployment, runs health check (30 attempts x 5s)
2. If health check fails, pulls **previous** Docker image version
3. Restarts backend with previous image
4. Re-runs health check

**No manual intervention needed** — the workflow handles this.

To check if automatic rollback triggered:
```bash
gh run view <RUN_ID> --log | grep -i rollback
```

---

## 2. Manual Rollback by Version

### Step 1: Identify Previous Working Version

```bash
# Option A: Check recent GitHub Actions deploy runs
gh run list --workflow=oci-staging-deploy.yml -L 5

# Option B: Check GHCR tags
docker image ls ghcr.io/omeryasironal/akis-backend --format '{{.Tag}}'

# Option C: Check deploy logs on server
ssh <USER>@<STAGING_HOST> "cat /opt/akis/deploy.log | tail -20"
```

### Step 2: SSH to VM

```bash
ssh -i ~/.ssh/akis-oci <USER>@<STAGING_HOST>
cd /opt/akis
```

### Step 3: Pull and Deploy Previous Version

```bash
# Set target version (use commit SHA or tag)
export BACKEND_VERSION=<previous_commit_sha>

# Pull the specific version
docker compose pull backend

# Restart with previous version
docker compose up -d --force-recreate backend
```

### Step 4: Verify Rollback

```bash
# Health check
curl -sf https://staging.akisflow.com/health | jq .

# Version check (should show old commit)
curl -sf https://staging.akisflow.com/version | jq .

# Ready check (DB connection)
curl -sf https://staging.akisflow.com/ready | jq .
```

### Step 5: Run Full Smoke Test

```bash
# From dev machine
./scripts/staging_smoke.sh --commit <previous_commit_sha>
```

---

## 3. Database Considerations

### Migration Policy: Forward-Only

AKIS uses **forward-only migrations**. There is no automatic `down` migration.

| Scenario | Action |
|----------|--------|
| New code + new migration | Rollback code, migration stays (must be backward-compatible) |
| Migration broke data | Write a **compensating migration** (new forward migration that fixes the issue) |
| Complete data corruption | Restore from backup (see below) |

### Why Forward-Only?

- Drizzle ORM generates forward-only SQL
- Down migrations are error-prone and often untested
- Compensating migrations are safer and auditable

### Database Backup Restore (Last Resort)

> **Warning**: Restores to backup point. Any data created after backup will be lost.

```bash
ssh <USER>@<STAGING_HOST>
cd /opt/akis

# 1. Stop backend
docker compose stop backend

# 2. List available backups
ls -la backups/

# 3. Restore from backup
docker exec -i akis-staging-db psql -U akis akis_staging < backups/<backup-file>.sql

# 4. Restart backend with matching code version
export BACKEND_VERSION=<version_matching_backup>
docker compose up -d backend

# 5. Verify
curl -sf https://staging.akisflow.com/health | jq .
```

---

## 4. Rollback Decision Matrix

```
Deploy failed?
  ├── Health check fails → Automatic rollback (CI handles it)
  ├── Health OK but version wrong → Manual rollback (Step 2)
  ├── Health OK, version OK, but feature broken
  │   ├── Auth broken → Manual rollback (Step 2)
  │   ├── UI glitch → Fix forward (new PR)
  │   └── Data issue → Compensating migration
  └── DB migration failed → Check migration logs, fix and re-run
```

---

## 5. Communication Protocol

| When | Who | What |
|------|-----|------|
| Rollback initiated | Deployer | Post in project channel: "Rolling back staging to <version>, reason: <reason>" |
| Rollback complete | Deployer | Post: "Rollback complete, smoke tests pass" |
| Root cause identified | Deployer/Dev | Post: "Root cause: <description>, fix PR: #<number>" |

---

## 6. Post-Rollback Checklist

- [ ] Smoke tests pass on rolled-back version
- [ ] Root cause identified
- [ ] Fix PR created (conventional commit: `fix(scope): description`)
- [ ] Fix PR passes CI
- [ ] Re-deploy with fix

---

## Related Documents

- [OCI_STAGING_RUNBOOK.md](OCI_STAGING_RUNBOOK.md) — Full staging operations
- [../ops/STAGING_SMOKE_CHECKLIST.md](../ops/STAGING_SMOKE_CHECKLIST.md) — Smoke test details
- [../release/STAGING_RELEASE_CHECKLIST.md](../release/STAGING_RELEASE_CHECKLIST.md) — Release checklist
- [OCI_STAGING_RUNBOOK.md](OCI_STAGING_RUNBOOK.md) — Deployment architecture
