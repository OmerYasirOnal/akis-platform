# NEXT — S0.5 Pilot Demo Execution

> **Canonical Plan:** [`docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)  
> **WBS Export:** [`docs/planning/WBS_EXPORT_S0.5.xlsx_compatible.md`](planning/WBS_EXPORT_S0.5.xlsx_compatible.md)  
> **Research Brief:** [`docs/planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md`](planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md)  
> **Last Updated:** 2026-02-08

---

## Planning Chain

```
docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md   (canonical plan — single source of truth)
          |
docs/ROADMAP.md                                          (milestones overview)
          |
docs/NEXT.md                                             (this file — immediate actions)
```

---

## Current Focus: S0.5 — Pilot Demo (Target: 28 Subat 2026)

### Phase A (7-9 Sub) — STAGING FIX (P0 BLOCKER)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S0.5.0-OPS-1 | Frontend base URL fix (`config.ts` production guard) | Done | PR #217 + regression fix PR #226: production guard rejects localhost in `getApiBaseUrl()` (2026-02-08) |
| S0.5.0-OPS-2 | Backend trust-proxy (`env.ts` + `server.app.ts`) | Done | PR #230: TRUST_PROXY env-gated, Fastify trustProxy: true (2026-02-08). docker-compose TRUST_PROXY passthrough added (2026-02-08) |
| S0.5.0-OPS-3 | Staging env + OAuth callback dogrulama | In Progress | Runbook updated with OAuth provider setup, callback URLs documented, startup diagnostics added |
| S0.5.0-OPS-4 | Smoke test'e localhost leak check ekle | Not Started | Dep: OPS-1 |
| S0.5.0-OPS-5 | DB migration ve health dogrulama | Not Started | SSH + docker check |
| S0.5.0-OPS-6 | Full deploy + smoke test | Not Started | Dep: OPS-1~5, 6/6 pass |
| S0.5.0-AUTH-PRIVACY | `/auth/privacy-consent` 404 (Caddy routing) | Done | PR #231: Caddyfile split — backend auth API routes vs SPA pages (2026-02-08) |
| S0.5.0-OAUTH-GOOGLE | Google login `invalid_client` on staging | In Progress | #229 — Runbook documents callback URI setup; startup log shows provider config status |

### Phase B (10-16 Sub) — PILOT ACCESS + UX

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S0.5.1-WL-1 | Invite stratejisi (email + acik signup) | Not Started | Dep: OPS-6 |
| S0.5.1-WL-2 | Onboarding flow (signup -> AI key -> first job) | Not Started | Getting Started karti |
| S0.5.1-WL-3 | Feedback capture (FeedbackTab entegrasyonu) | Not Started | Dep: WL-2 |
| S0.5.2-UX-1 | Trace console sayfasi | Not Started | Dep: OPS-6 |
| S0.5.2-UX-2 | Proto console sayfasi | Not Started | Dep: OPS-6 |
| S0.5.2-UX-3 | Dashboard Getting Started karti | Not Started | Dep: WL-2 |

### Phase C (14-21 Sub) — AGENT RELIABILITY

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S0.5.1-AGT-1 | Agent contract dokumantasyonu (3 ajan) | Not Started | Input/output/error |
| S0.5.1-AGT-2 | Playbook determinizm (temp=0, prompt sabit) | Not Started | |
| S0.5.1-AGT-3 | Scribe golden path dogrulama | Not Started | Dep: OPS-6, AGT-1 |
| S0.5.1-AGT-4 | Trace golden path dogrulama | Not Started | Dep: OPS-6, AGT-1 |
| S0.5.1-AGT-5 | Proto golden path dogrulama | Not Started | Dep: OPS-6, AGT-1 |
| S0.5.1-AGT-6 | Hata handling standardizasyonu | Not Started | Dep: AGT-1 |

### Phase D (17-23 Sub) — RAG (PARALEL)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S0.5.2-RAG-1 | Research brief + karar kilitleme | Not Started | Context packs Feb, pg_trgm March |
| S0.5.2-RAG-2 | Context pack mekanizmasi dogrulama | Not Started | Dep: AGT-3 |

### Phase E (24-28 Sub) — QA + M1 PILOT DEMO

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S0.5.3-QA-1 | Regression checklist | Not Started | Dep: AGT-3~5 |
| S0.5.3-QA-2 | Demo scripti (15 dk) | Not Started | Dep: QA-1 |
| S0.5.3-QA-3 | QA evidence dokumani | Not Started | Dep: QA-2 |
| S0.5.3-QA-4 | Tez hazirlik notu (outline) | Not Started | |

---

## M1 Definition of Done (28 Subat 2026)

- [ ] `staging.akisflow.com` uzerinde hic `localhost` referansi yok
- [ ] `/health`, `/ready`, `/version` 200 donuyor
- [ ] Email/password signup + login calisiyor (staging)
- [ ] OAuth redirect'leri staging domain'inde calisiyor
- [ ] Scribe/Trace/Proto golden path'leri calisiyor
- [ ] Hata durumlarinda anlasilir mesaj
- [ ] Pilot onboarding akisi calisiyor
- [ ] Demo scripti yazilmis ve prova edilmis
- [ ] QA evidence dokumani mevcut

---

## Critical Decisions (Lock Before Build)

1. Frontend build'de `VITE_BACKEND_URL` set edilmeyecek (runtime resolution)
2. `TRUST_PROXY=true` staging `.env`'ye eklenecek
3. `AUTH_COOKIE_DOMAIN` bos birakilacak
4. GitHub OAuth callback: `https://staging.akisflow.com/auth/oauth/github/callback`
5. RAG Subat: context packs; Mart: pg_trgm
6. Pilot access: email davet + acik signup
7. **Scope freeze: 21 Subat sonrasi yeni feature yok**

---

## Post-M1 Milestones

| Milestone | Target | Focus |
|-----------|--------|-------|
| M2: Stabilizasyon | Mart 2026 | Bug fix, pilot feedback, pg_trgm prototype, tez taslagi, demo video |
| M3: Mezuniyet | Nisan-Mayis 2026 | Final rapor, sunum slaytlari, savunma provasi, teslim paketi |

---

## Completed Phases (Historical)

| Phase | Name | Status | Date |
|-------|------|--------|------|
| 0.1-0.3 | Foundation + Architecture + Core Engine | Done | Nov 2025 |
| 0.4 | Web Shell + Basic Motor | Done | Dec 2025 |
| 1 | Scribe/Trace/Proto Early Access | Done | Dec 2025 |
| 1.5 | Logging + Observability | Done | Jan 2026 |
| 2 (S2.0.1-S2.0.2) | Cursor-Inspired UI + Scribe Console | Done | Jan 2026 |

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| [`docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md) | Canonical plan (single source of truth) |
| [`docs/planning/WBS_EXPORT_S0.5.xlsx_compatible.md`](planning/WBS_EXPORT_S0.5.xlsx_compatible.md) | WBS table + CSV for Excel |
| [`docs/planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md`](planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md) | Research brief + decisions |
| [`docs/ROADMAP.md`](ROADMAP.md) | Milestones overview |
| [`docs/deploy/OCI_STAGING_RUNBOOK.md`](deploy/OCI_STAGING_RUNBOOK.md) | Staging operations |
| [`docs/release/STAGING_RELEASE_CHECKLIST.md`](release/STAGING_RELEASE_CHECKLIST.md) | Release checklist |

---

*Bu dosya S0.5 planinin aksiyonel ozeti olarak tutulur. Detaylar icin canonical plan'a basvurun.*
