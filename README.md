# AKIS Platform

**AI Agent Workflow Engine** — Tekrarlayan yazilim gelistirme gorevlerini otonom ajanlarla otomatiklestirin.

AKIS Platform, AI destekli ajanlari orkestra ederek dokumantasyon guncellemesi, test uretimi ve MVP prototipleme islerini yonetir. Boylece gelistiriciler asil ise odaklanabilir.

---

## AKIS Nedir?

AKIS, yazilim gelistirme sureclerindeki tekrarlayan gorevleri otomatiklestiren bir **AI ajan platformudur**. Uc temel ajan sunar:

- **Scribe** — Kod degisikliklerinde teknik dokumantasyonu otomatik gunceller
- **Trace** — Spesifikasyon ve kod analizinden test senaryolari uretir
- **Proto** — AI destekli hizli MVP prototipleme

Platform, OCI Free Tier uzerinde calisacak sekilde optimize edilmis **modular monolith** mimarisine sahiptir.

---

## Mimari Ozet

| Katman | Teknoloji |
|--------|-----------|
| Backend | Fastify + TypeScript (Node 20+) |
| Veritabani | PostgreSQL + Drizzle ORM |
| Frontend | React + Vite SPA + Tailwind CSS |
| Entegrasyonlar | MCP (Model Context Protocol) adapterleri |
| Edge Proxy | Caddy (staging/production, auto-HTTPS) |
| Konteyner | Docker Compose (backend + postgres) |

```
Frontend (React SPA)  →  Caddy (edge proxy)  →  Backend (Fastify)  →  MCP Gateway
                                                       ↓
                                                  PostgreSQL
```

> **Onemli:** Dis servis entegrasyonlari yalnizca MCP adapterleri uzerinden yapilir (`backend/src/services/mcp/`). Dogrudan REST SDK kullanimi yasaktir.

---

## Planlama Zinciri (Kanonik)

```
docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md   (kanonik plan — tek kaynak)
          |
docs/ROADMAP.md                                          (milestone gorunumu)
          |
docs/NEXT.md                                             (anlik aksiyonlar)
```

| Dokuman | Amac |
|---------|------|
| [`docs/NEXT.md`](docs/NEXT.md) | Simdiki sprint gorevleri ve durumlari |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Milestone ozeti ve kabul kriterleri |
| [`docs/planning/`](docs/planning/) | Kanonik teslimat plani ve WBS |

---

## S0.5 Calisma Bicimi

> **Hedef:** 28 Subat 2026 — Pilot Demo (M1)  
> **Scope freeze:** 21 Subat 2026 sonrasi yeni feature yok

### Kurallar

- Her gorev bir **Task ID** ile tanimlanir (ornek: `S0.5.0-OPS-2`)
- Her gorev icin **GitHub Issue** zorunludur
- PR'lar kucuk tutulur (≤ 300 LoC), **Squash & Merge** kullanilir
- **Conventional Commits:** `feat|fix|chore|docs(scope): mesaj`
- Kritik kararlar `docs/NEXT.md` § Critical Decisions altinda kilitlidir

### Kritik Kararlar (Ozet)

- `TRUST_PROXY=true` staging `.env`'de (Caddy proxy)
- `VITE_BACKEND_URL` staging/production build'de set edilmez
- `AUTH_COOKIE_DOMAIN` bos birakilir
- GitHub OAuth callback: `https://staging.akisflow.com/auth/oauth/github/callback`

---

## Staging / Deploy Gercekligi

AKIS, tek bir OCI ARM64 VM uzerinde calisir:

- **Caddy** — Edge proxy, otomatik HTTPS, statik frontend servisi
- **Docker Compose** — Backend + PostgreSQL + opsiyonel MCP Gateway
- **Frontend** — Vite ile statik build, Caddy tarafindan sunulur

| Kaynak | Aciklama |
|--------|----------|
| [`docs/deploy/OCI_STAGING_RUNBOOK.md`](docs/deploy/OCI_STAGING_RUNBOOK.md) | Staging operasyonlari (SSOT) |
| [`docs/deploy/STAGING_SMOKE_TEST_CHECKLIST.md`](docs/deploy/STAGING_SMOKE_TEST_CHECKLIST.md) | Smoke test kontrol listesi |
| [`docs/deploy/STAGING_ROLLBACK_RUNBOOK.md`](docs/deploy/STAGING_ROLLBACK_RUNBOOK.md) | Geri alma proseduru |

> Detayli prosedurler icin yukaridaki kanonik dokumanlara basvurun. Bu README'de uzun komut bloklari tekrarlanmaz.

---

## Guvenlik Notlari

- **Gercek secret'lar asla git'e commit edilmez** — Yalnizca `.env.example` dosyalari commit edilir
- API anahtarlari UI'da maskelenir (son 4 karakter gorunur)
- Session tabanli kimlik dogrulama: HttpOnly, Secure, SameSite cookie'ler
- Staging erisim bilgileri (IP, SSH key, token) yalnizca yerel ortam, GitHub Secrets veya password manager'da bulunur

Detaylar icin: [`docs/deploy/OCI_STAGING_RUNBOOK.md`](docs/deploy/OCI_STAGING_RUNBOOK.md) § Security.

---

## Katki ve PR Akisi

### Zorunlu Issue/PR Yasam Dongusu

1. **Baslamadan once:** Gorev icin GitHub Issue olustur (veya mevcut olani dogrula)
   - Task ID baslika ekle, `scope:S0.5` + `status:Not Started` + alan etiketleri ata
2. **PR actiginda:** Issue'yu PR description'da bagla: `Closes #123` veya `Fixes #123`
   - Issue durumunu `status:In Progress` yap
3. **PR merge edildikten sonra:** Issue otomatik kapanir (closing keyword ile)
   - Issue etiketini `status:Done` yap
   - `docs/NEXT.md` gorev durumunu guncelle
4. **Kapsam genislerse:** Orijinal issue'yu sisirme, yeni issue olustur ve bagla

### Teknik Kontrol Listesi

- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`
- CI gecmeli: `pnpm -r typecheck && pnpm -r lint && pnpm -r build && pnpm -r test`
- Detayli kurallar: [`.cursor/rules/rules.mdc`](.cursor/rules/rules.mdc)

---

## Dokumantasyon

| Konu | Baglanti |
|------|----------|
| Yerel gelistirme | [`docs/local-dev/LOCAL_DEV_QUICKSTART.md`](docs/local-dev/LOCAL_DEV_QUICKSTART.md) |
| Ortam degiskenleri | [`docs/ENV_SETUP.md`](docs/ENV_SETUP.md) |
| API spesifikasyonu | [`backend/docs/API_SPEC.md`](backend/docs/API_SPEC.md) |
| Ajan is akislari | [`backend/docs/AGENT_WORKFLOWS.md`](backend/docs/AGENT_WORKFLOWS.md) |
| MCP kurulumu | [`docs/GITHUB_MCP_SETUP.md`](docs/GITHUB_MCP_SETUP.md) |
| Tam dokumantasyon indeksi | [`docs/README.md`](docs/README.md) |

---

## Proje Durumu

| Faz | Durum | Aciklama |
|-----|-------|----------|
| 0.1–0.4 | ✅ Tamamlandi | Temel altyapi, Web Shell |
| 1.0–2.0 | ✅ Tamamlandi | Scribe MVP, Cursor-Inspired UI |
| S0.5 | 🔄 Devam Ediyor | Pilot Demo — Staging fix, UX, Agent reliability |

**Guncel milestone:** S0.5 — Pilot Demo (Hedef: 28 Subat 2026)

Detaylar icin: [`docs/NEXT.md`](docs/NEXT.md)

---

## Lisans

MIT License — bkz. [LICENSE](LICENSE)
