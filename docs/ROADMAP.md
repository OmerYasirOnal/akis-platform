# AKIS Platform — Roadmap & Milestones

> **Canonical Plan:** [`docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)  
> **Immediate Actions:** [`docs/NEXT.md`](NEXT.md)  
> **Last Updated:** 2026-02-07

---

## Current Status

| Item | Value |
|------|-------|
| **Active Phase** | S0.5 — Staging Fix + Pilot Demo |
| **Next Milestone** | M1: Pilot Demo (28 Subat 2026) |
| **Scope** | Scribe / Trace / Proto agents only |
| **Environment** | Staging (staging.akisflow.com) — OCI Free Tier |
| **Status Vocabulary** | Done / In Progress / Not Started / Blocked (per PM_NAMING_SYSTEM) |

---

## Milestones

| Milestone | Target Date | Focus | Status |
|-----------|-------------|-------|--------|
| **M1: Pilot Demo** | 28 Subat 2026 | Staging fix + Scribe/Trace/Proto golden paths + pilot onboarding | **In Progress** |
| **M2: Stabilization** | 31 Mart 2026 | Bug fix, pilot feedback, pg_trgm prototype, tez taslagi | Not Started |
| **M3: Graduation** | Mayis 2026 | Final rapor, sunum, demo video, teslim paketi | Not Started |

---

## Phase Overview

### Completed Phases

| Phase | Name | Date Range | Status |
|-------|------|------------|--------|
| 0.1 | Foundation Setup | Nov 1-7, 2025 | Done |
| 0.2 | Architecture Definition | Nov 8-17, 2025 | Done |
| 0.3 | Core Engine Scaffold | Nov 18-27, 2025 | Done |
| 0.4 | Web Shell + Basic Engine | Nov 28 - Dec 4, 2025 | Done |
| 1 | Scribe/Trace/Proto Early Access | Dec 13-25, 2025 | Done |
| 1.5 | Logging + Observability Layer | Dec 26, 2025 - Jan 9, 2026 | Done |
| 2 | Cursor-Inspired UI + Scribe Console | Jan 10 - Feb 6, 2026 | Done |

### Active Phase

| Phase | Name | Date Range | Status |
|-------|------|------------|--------|
| **S0.5** | **Staging Fix + Pilot Demo** | **Feb 7-28, 2026** | **In Progress** |

**S0.5 Sprints:**

| Sprint | Dates | Focus | Workstreams |
|--------|-------|-------|-------------|
| S0.5.0 | Feb 7-9 | Staging base URL fix + trust-proxy + deploy | WS-OPS |
| S0.5.1 | Feb 10-21 | Pilot access + agent reliability | WS-WAITLIST, WS-AGENTS |
| S0.5.2 | Feb 10-23 | Demo UX + RAG research | WS-UX, WS-RAG |
| S0.5.3 | Feb 24-28 | QA evidence + demo script + M1 | WS-QA |

### Future Phases

| Phase | Name | Date Range | Status |
|-------|------|------------|--------|
| M2 | Stabilization + Academic Prep | Mar 1-31, 2026 | Not Started |
| M3 | Graduation Delivery | Apr-May 2026 | Not Started |

---

## M1: Pilot Demo — Definition of Done (28 Subat 2026)

- [ ] Staging'de localhost referansi sifir (bundle grep check)
- [ ] Health/ready/version endpoint'leri 200 donuyor
- [ ] Email/password signup + login calisiyor
- [ ] OAuth redirect'leri staging domain'inde calisiyor
- [ ] Scribe golden path calisiyor (dry-run)
- [ ] Trace golden path calisiyor
- [ ] Proto golden path calisiyor
- [ ] Hata durumlarinda kullaniciya anlasilir mesaj
- [ ] Pilot onboarding akisi calisiyor
- [ ] Demo scripti yazilmis ve prova edilmis
- [ ] QA evidence dokumani mevcut

---

## M2: Stabilization — Definition of Done (31 Mart 2026)

- [ ] Pilot geri bildirimleri toplanmis ve triajlanmis
- [ ] P0/P1 buglar sifir
- [ ] Golden path basari orani %90+
- [ ] pg_trgm retrieval prototype (opsiyonel)
- [ ] Tez taslagi: giris + literatur + yontem
- [ ] Demo videosu kaydedilmis (5-10 dk)

---

## M3: Graduation — Definition of Done (Mayis 2026)

- [ ] Final rapor tamamlanmis ve onaylanmis
- [ ] Sunum slaytlari (15-20 slayt)
- [ ] Demo videosu final versiyonu
- [ ] Canli demo en az 2 kez prova edilmis
- [ ] Teslim paketi: kod + dokumanlar + video + sunum

---

## Scope Rules

### In-Scope (S0.5)
- Scribe, Trace, Proto agents
- Staging reliability + base URL correctness
- Pilot onboarding UX (minimal)
- Feedback capture
- Lightweight RAG (context packs; pg_trgm March)

### Out-of-Scope
- Developer / Coder agent
- New integrations (Slack, Teams)
- RBAC / admin panel
- Pricing/billing implementation
- Auth redesign
- Heavy vector DB / external RAG services
- Production environment (staging sufficient)
- Mobile native

---

## Architecture Constraints (Non-Negotiable)

| Component | Technology | Rule |
|-----------|-----------|------|
| Backend | Fastify + TypeScript + Drizzle | No Express/Nest/Prisma |
| Frontend | React + Vite + Tailwind | No SSR/Next.js |
| Database | PostgreSQL 16 | OCI Free Tier |
| Integrations | MCP adapters only | No direct vendor SDKs |
| Auth | Existing JWT + email/password + OAuth | Do not redesign |
| Deployment | OCI VM + Caddy + Docker Compose | Single VM staging |

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| [`docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md) | Canonical plan (single source of truth) |
| [`docs/planning/WBS_EXPORT_S0.5.xlsx_compatible.md`](planning/WBS_EXPORT_S0.5.xlsx_compatible.md) | WBS + CSV for Excel |
| [`docs/planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md`](planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md) | Research brief |
| [`docs/NEXT.md`](NEXT.md) | Immediate action items |
| [`docs/PROJECT_TRACKING_BASELINE.md`](PROJECT_TRACKING_BASELINE.md) | Historical schedule anchor |
| [`.cursor/context/CONTEXT_SCOPE.md`](../.cursor/context/CONTEXT_SCOPE.md) | Scope & requirements |
| [`.cursor/context/CONTEXT_ARCHITECTURE.md`](../.cursor/context/CONTEXT_ARCHITECTURE.md) | Technical architecture |

---

*Roadmap, canonical plan ile senkronize tutulur. Detay ve gorev takibi icin NEXT.md ve WBS Export'a basvurun.*
