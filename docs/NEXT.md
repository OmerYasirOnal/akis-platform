# NEXT — S0.5 Pilot Demo Yürütme Planı

> **Kanonik Plan:** [`docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)  
> **WBS Tablosu:** [`docs/planning/WBS_EXPORT_S0.5.xlsx_compatible.md`](planning/WBS_EXPORT_S0.5.xlsx_compatible.md)  
> **Araştırma Notu:** [`docs/planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md`](planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md)  
> **Son Güncelleme:** 2026-02-09

---

## Planlama Zinciri

```
docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md   (kanonik plan — tek doğru kaynak)
          |
docs/ROADMAP.md                                          (kilometre taşları genel bakış)
          |
docs/NEXT.md                                             (bu dosya — anlık eylem planı)
```

---

## Staging Durumu

| Alan | Değer |
|------|-------|
| URL | https://staging.akisflow.com |
| Deploy Edilen Commit | `c3ead3c` (PR #246 + #247 merge) |
| Smoke Testleri | 10/10 otomatik test tanımlı (`staging_smoke.sh`) |
| Kod Düzeltmeleri | MCP `/ready` durumu, OAuth hoşgeldin e-postası, agents yönlendirme `/agents/*`, logo güncelleme, güvenlik temizliği, E2E test hizalama |
| Şifreleme | Staging'de yapılandırıldı (`/ready` → `encryption.configured: true`) |
| E-posta | SMTP şablonu hazır (`/ready` → `email.configured`, `email.host`, `email.port`, `email.from`); OAuth hoşgeldin e-postası eklendi |
| Google OAuth | `/ready` → `oauth.google`, `oauth.github`, `oauth.callbackBase` gösteriyor — staging `.env` kimlik bilgilerini doğrulayın |
| MCP Gateway | Docker image henüz GHCR'da yok; `profiles: [mcp]` ile opsiyonel — CI build pipeline gerekli |
| Agent Yönlendirme | Scribe/Trace/Proto → `/agents/*` taşındı; `/dashboard/scribe\|trace\|proto` yeni rotalara yönlendirme yapıyor |
| Logo | Tek kaynak: `frontend/public/brand/logo.png` + 3 density varyantı güncellendi |

---

## Güncel Odak: S0.5 — Pilot Demo (Hedef: 28 Şubat 2026)

### Faz A (7-9 Şub) — STAGING DÜZELTMELERİ (P0 ENGELLEYICI) ✅

| ID | Görev | Durum | Notlar |
|----|-------|-------|--------|
| S0.5.0-OPS-1 | Frontend base URL düzeltmesi (`config.ts` production koruma) | Tamamlandı | PR #217 + PR #226 |
| S0.5.0-OPS-2 | Backend trust-proxy (`env.ts` + `server.app.ts`) | Tamamlandı | PR #230 |
| S0.5.0-OPS-3 | Staging env + OAuth callback doğrulama | Tamamlandı | PR #232 |
| S0.5.0-OPS-4 | Smoke test'e localhost sızıntı kontrolü ekle | Tamamlandı | PR #233 |
| S0.5.0-OPS-5 | DB migration ve health doğrulama | Tamamlandı | PR #234 |
| S0.5.0-OPS-6 | Tam deploy + smoke test | Tamamlandı | PR #235 |
| S0.5.0-AUTH-PRIVACY | `/auth/privacy-consent` 404 (Caddy yönlendirme) | Tamamlandı | PR #231 |
| S0.5.0-OAUTH-GOOGLE | Google login `invalid_client` staging'de | Tamamlandı | PR #232 |

### Faz B (10-16 Şub) — PİLOT ERİŞİM + UX

| ID | Görev | Durum | Notlar |
|----|-------|-------|--------|
| S0.5.1-WL-1 | Davet stratejisi (e-posta + açık kayıt) | Tamamlandı | SMTP aktarım + Türkçe şablonlar (PR #238) |
| S0.5.1-WL-1b | Doğrulama sonrası hoşgeldin e-postası | Tamamlandı | `sendWelcomeEmail` + 4 birim testi |
| S0.5.1-WL-2 | Katılım akışı (kayıt → AI anahtarı → ilk iş) | Başlanmadı | Getting Started kartı |
| S0.5.1-WL-3 | Geri bildirim yakalama (FeedbackTab entegrasyonu) | Başlanmadı | Bağımlılık: WL-2 |
| S0.5.2-UX-1 | Trace konsol sayfası | Tamamlandı | PR #236 |
| S0.5.2-UX-2 | Proto konsol sayfası | Tamamlandı | PR #236 |
| S0.5.2-UX-3 | Dashboard Getting Started kartı | Tamamlandı | 3 adımlı kart + 6 birim + 5 E2E test |
| S0.5.2-UX-4 | Agents Hub sidebar giriş noktası | Tamamlandı | PR #246 |

### Faz C (14-21 Şub) — AGENT GÜVENİLİRLİĞİ

| ID | Görev | Durum | Notlar |
|----|-------|-------|--------|
| S0.5.1-AGT-1 | Agent sözleşme dokümantasyonu (3 ajan) | Tamamlandı | `docs/agents/AGENT_CONTRACTS_S0.5.md` |
| S0.5.1-AGT-2 | Playbook determinizm (temp=0, prompt sabit) | Tamamlandı | prompt-constants.ts + 17 birim testi |
| S0.5.1-AGT-3 | Scribe golden path doğrulama | Tamamlandı | 12 E2E test |
| S0.5.1-AGT-4 | Trace golden path doğrulama | Tamamlandı | 10 E2E test |
| S0.5.1-AGT-5 | Proto golden path doğrulama | Tamamlandı | 12 E2E test |
| S0.5.1-AGT-6 | Hata işleme standardizasyonu | Tamamlandı | Standart hata zarfı + 39 birim testi |

### Faz D (17-23 Şub) — RAG (PARALEL)

| ID | Görev | Durum | Notlar |
|----|-------|-------|--------|
| S0.5.2-RAG-1 | Araştırma notu + karar kilitleme | Başlanmadı | Bağlam paketleri Şub, pg_trgm Mart |
| S0.5.2-RAG-2 | Bağlam paketi mekanizması doğrulama | Başlanmadı | Bağımlılık: AGT-3 |

### Faz E (24-28 Şub) — KG + M1 PİLOT DEMO

| ID | Görev | Durum | Notlar |
|----|-------|-------|--------|
| S0.5.3-QA-1 | Regresyon kontrol listesi | Başlanmadı | Bağımlılık: AGT-3~5 |
| S0.5.3-QA-2 | Demo senaryosu (15 dk) | Başlanmadı | Bağımlılık: QA-1 |
| S0.5.3-QA-3 | KG kanıt dokümanı | Başlanmadı | Bağımlılık: QA-2 |
| S0.5.3-QA-4 | Tez hazırlık notu (taslak) | Başlanmadı | |

---

## Agent Görev Tanımları (İngilizce)

> Agent task definitions are in English for international compatibility and technical precision.

### Scribe Agent

**Purpose:** Automated documentation generation from source code.

| Field | Value |
|-------|-------|
| Route | `/agents/scribe` |
| Input | GitHub repository + branch + optional file patterns |
| Output | Generated documentation files (Markdown), committed to a new branch |
| Golden Path | User selects repo → selects branch → clicks "Run Scribe" → agent clones, analyzes code, generates docs → creates PR |
| Error Codes | `MISSING_DEPENDENCY` (MCP not configured), `GITHUB_NOT_CONNECTED` (no GitHub token), `AI_KEY_MISSING` (no AI provider key) |
| Dependencies | GitHub MCP adapter, AI provider (OpenAI/OpenRouter), GitHub OAuth connection |

### Trace Agent

**Purpose:** Automated test plan and test case generation from source code analysis.

| Field | Value |
|-------|-------|
| Route | `/agents/trace` |
| Input | GitHub repository + branch + target module/directory |
| Output | Test plan document (Markdown) with test cases, edge cases, and coverage recommendations |
| Golden Path | User selects repo → selects branch → specifies target → clicks "Run Trace" → agent analyzes code structure → generates test plan |
| Error Codes | Same as Scribe (`MISSING_DEPENDENCY`, `GITHUB_NOT_CONNECTED`, `AI_KEY_MISSING`) |
| Dependencies | GitHub MCP adapter, AI provider, GitHub OAuth connection |

### Proto Agent

**Purpose:** Rapid prototyping assistant — converts ideas/specs into working code scaffolds.

| Field | Value |
|-------|-------|
| Route | `/agents/proto` |
| Input | GitHub repository + branch + specification/idea description |
| Output | Prototype code scaffold committed to a new branch |
| Golden Path | User selects repo → selects branch → describes prototype → clicks "Run Proto" → agent generates scaffold → creates PR |
| Error Codes | Same as Scribe (`MISSING_DEPENDENCY`, `GITHUB_NOT_CONNECTED`, `AI_KEY_MISSING`) |
| Dependencies | GitHub MCP adapter, AI provider, GitHub OAuth connection |

---

## M1 Tamamlanma Kriterleri (28 Şubat 2026)

- [x] `staging.akisflow.com` üzerinde hiç `localhost` referansı yok
- [x] `/health`, `/ready`, `/version` 200 dönüyor
- [x] `/ready` MCP durumu gösteriyor (`mcp.configured`, `mcp.github`, `mcp.baseUrl`)
- [x] `.env.staging` şablonu localhost referansları temizlendi, gerçek sırlar kaldırıldı
- [x] Agent yönlendirme: `/agents/*` kanonik, `/dashboard/scribe|trace|proto` yönlendirme
- [x] OAuth hoşgeldin e-postası: yeni OAuth kullanıcılarına hoşgeldin e-postası gönderimi
- [ ] E-posta/şifre kayıt + giriş staging'de çalışıyor — SMTP env değişkenleri gerekli
- [ ] OAuth yönlendirmeleri staging alanında çalışıyor — Google OAuth env değişkenleri gerekli
- [ ] Scribe/Trace/Proto golden path'leri çalışıyor — AI anahtar + şifreleme + MCP env değişken gerekli
- [x] Hata durumlarında anlaşılır mesaj (AGT-6 standart hata zarfı, 39 birim testi)
- [ ] Pilot katılım akışı çalışıyor — WL-2 bekleniyor
- [ ] Demo senaryosu yazılmış ve prova edilmiş
- [ ] KG kanıt dokümanı mevcut

---

## Kritik Kararlar (Kilitli)

1. Frontend build'de `VITE_BACKEND_URL` ayarlanmayacak (çalışma zamanı çözümleme)
2. `TRUST_PROXY=true` staging `.env`'ye eklenecek
3. `AUTH_COOKIE_DOMAIN` boş bırakılacak
4. GitHub OAuth callback: `https://staging.akisflow.com/auth/oauth/github/callback`
5. RAG Şubat: bağlam paketleri; Mart: pg_trgm
6. Pilot erişim: e-posta davet + açık kayıt
7. **Kapsam dondurma: 21 Şubat sonrası yeni özellik yok**

---

## Bilinen Sorunlar / Takip Gerektiren Konular

| # | Konu | Öncelik | Notlar |
|---|------|---------|--------|
| 1 | MCP Gateway Docker image CI build pipeline yok | P1 | GHCR'a image push edilmeli; `profiles: [mcp]` kaldırılana kadar agent'lar staging'de MCP kullanamazlar |
| 2 | SMTP deliverability (SPF/DKIM/DMARC) | P1 | güzelhosting DNS yapılandırması gerekli — `OCI_STAGING_RUNBOOK.md` Bölüm 3.7 |
| 3 | Staging VM `.env` güncelleme | P0 | MCP, SMTP, OAuth, logo URL değişkenleri güncellenmeli |
| 4 | Onboarding akışı (WL-2) | P2 | Getting Started kartı mevcut; tam akış henüz bağlanmamış |

---

## M1 Sonrası Kilometre Taşları

| Kilometre Taşı | Hedef | Odak |
|-----------------|-------|------|
| M2: Stabilizasyon | Mart 2026 | Hata düzeltme, pilot geri bildirim, pg_trgm prototip, tez taslağı, demo video |
| M3: Mezuniyet | Nisan-Mayıs 2026 | Final rapor, sunum slaytları, savunma provası, teslim paketi |

---

## Tamamlanmış Fazlar (Geçmiş)

| Faz | İsim | Durum | Tarih |
|-----|------|-------|-------|
| 0.1-0.3 | Temel + Mimari + Çekirdek Motor | Tamamlandı | Kasım 2025 |
| 0.4 | Web Shell + Temel Motor | Tamamlandı | Aralık 2025 |
| 1 | Scribe/Trace/Proto Erken Erişim | Tamamlandı | Aralık 2025 |
| 1.5 | Loglama + Gözlemlenebilirlik | Tamamlandı | Ocak 2026 |
| 2 (S2.0.1-S2.0.2) | Cursor-Esinli UI + Scribe Konsolu | Tamamlandı | Ocak 2026 |

---

## Referans Dokümanlar

| Doküman | Amaç |
|---------|------|
| [`docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md) | Kanonik plan (tek doğru kaynak) |
| [`docs/planning/WBS_EXPORT_S0.5.xlsx_compatible.md`](planning/WBS_EXPORT_S0.5.xlsx_compatible.md) | WBS tablosu + CSV |
| [`docs/planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md`](planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md) | Araştırma notu |
| [`docs/ROADMAP.md`](ROADMAP.md) | Kilometre taşları genel bakış |
| [`docs/deploy/OCI_STAGING_RUNBOOK.md`](deploy/OCI_STAGING_RUNBOOK.md) | Staging operasyonları |
| [`docs/deploy/STAGING_SMOKE_TEST_CHECKLIST.md`](deploy/STAGING_SMOKE_TEST_CHECKLIST.md) | Smoke test kontrol listesi |

---

*Bu dosya S0.5 planının aksiyonel özeti olarak tutulur. Detaylar için kanonik plana başvurun.*
