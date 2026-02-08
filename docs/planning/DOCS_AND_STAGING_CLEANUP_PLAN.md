# AKIS Platform — Docs, Staging Cleanup & Export Pack Plan

> **Status:** In Progress
> **Created:** 2026-02-07
> **Owner:** Principal Systems Architect

## Executive Summary

Repo'da 130+ dokuman bulunuyor; bunlarin ~25'i tekrarli veya guncelligini yitirmis, root dizinde 21 markdown dosyasi var (olmasi gereken: 5-7). Staging deployment bilgisi 3 ayri runbook'a dagilmis. Bu plan: (1) root clutter'i temizler, (2) tekrarli dokumanlari konsolide eder, (3) tek kanonik staging runbook olusturur, (4) smoke-test/rollback dokumanlarini pekistirir, (5) cleanup sonrasi 25 dosyalik kanonik seti AKIS_gpt export pack'ine kopyalar.

---

## 1. Current State Snapshot

### 1.1 Staging Deployment Reality

- **Ortam:** OCI Free Tier VM (ARM64, 4 OCPU, 24GB RAM)
- **Domain:** `staging.akisflow.com` (Caddy reverse proxy, Let's Encrypt)
- **Docker Compose:** `deploy/oci/staging/docker-compose.yml` (kanonik), `devops/compose/docker-compose.staging.yml` (edge), `devops/compose/docker-compose.edge.yml` (shared proxy)
- **Env:** `deploy/oci/staging/env.example` (kanonik template)
- **CI/CD:** `.github/workflows/oci-staging-deploy.yml`
- **Deploy:** `deploy/oci/staging/deploy.sh`
- **Smoke:** `scripts/staging_smoke.sh`

### 1.2 Major Duplications

| ID | Konu | Tekrar Eden | Kanonik |
|----|------|-------------|---------|
| D1 | DEV_SETUP | root + docs/ + docs/local-dev/ | `docs/local-dev/LOCAL_DEV_QUICKSTART.md` |
| D2 | Staging Runbook | deploy/ + deploy/RUNBOOK_OCI + ops/ | `docs/deploy/OCI_STAGING_RUNBOOK.md` |
| D3 | OAuth Setup | docs/ + ops/ | `docs/ops/OAUTH_SETUP.md` |
| D4 | ENV Docs | docs/ + ops/ | `docs/ENV_SETUP.md` |
| D5 | NEXT.md | root + docs/ | `docs/NEXT.md` |
| D6 | Roadmap | docs/ + docs/roadmap/ | `docs/ROADMAP.md` |

---

## 2. Execution Phases

### Phase 1: Root Cleanup (docs-only PR)
- Archive 12 stale root files to `docs/archive/`
- Create this plan document

### Phase 2: Duplication Consolidation (docs-only PR)
- Merge D1-D6 duplicates into canonical files
- Delete redundant copies

### Phase 3: Ops + QA Archive (docs-only PR)
- Archive 12 ops process artifacts (gate reports, PR checklists)
- Archive 5 one-off QA reports
- Archive 3 misc files

### Phase 4: Staging Doc Hardening (docs-only PR)
- Consolidate OCI staging runbook
- Create smoke-test checklist
- Create rollback runbook

### Phase 5: Security Hygiene (chore PR)
- Ensure `.env.staging` and secret files are gitignored

### Phase 6: Export Pack (local-only)
- Copy 25 canonical files to `~/Desktop/AKIS_gpt/`
- Generate MANIFEST.md

---

## 3. Archive Manifest

See `docs/archive/README.md` for full archive index with dates and reasons.

---

## 4. Risk Notes

| Risk | Etki | Mitigasyon |
|------|------|-----------|
| Broken internal links | Orta | `rg` ile link taramasi; INDEX.md guncelleme |
| Gate raporlari tez referansi | Orta | Archive'a tasi, silme |
| Secret dosyalar | Yuksek | gitignore kontrolu |
| Konsolidasyon bilgi kaybi | Dusuk | Eski dosyalar archive'da kalir |
