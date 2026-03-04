# AKIS Platform

**AI Agent Orchestration System** — Otonom AI agentları ile tekrarlayan yazılım geliştirme görevlerini otomatikleştirin.

AKIS Platform, dokümantasyon güncellemeleri, test planı üretimi ve hızlı prototipleme için özelleşmiş AI agentlarını yönetir — geliştiriciler önemli işlere odaklanabilsin diye.

> **Canlı staging:** [staging.akisflow.com](https://staging.akisflow.com) | **Durum:** Tüm sistemler çalışır durumda

---

## Ne Yapar

AKIS, yapılandırılmış bir orkestrasyon hattı üzerinden üç özelleşmiş AI agentı çalıştırır:

| Agent | Amaç | Nasıl Çalışır |
|-------|---------|-------------|
| **Scribe** | Dokümantasyon üretimi | GitHub üzerinden kaynak kodu analiz eder → Markdown dokümanlar üretir → PR açar |
| **Trace** | Test planı üretimi | Kod yapısını okur → edge case'ler ve kapsam önerileriyle test senaryoları üretir |
| **Proto** | Hızlı prototipleme | Spec/fikir alır → çalışan kod iskeleti oluşturur → yeni branch'e commit eder |

Her agent **Plan → Execute → Reflect** hattını izler; deterministik promptlar, 0–100 kalite skoru ve tam trace loglama ile.

---

## Mimari

```
                    ┌─────────────────────┐
                    │   React SPA (Vite)  │
                    │   Tailwind CSS      │
                    │   i18n (EN/TR)      │
                    └────────┬────────────┘
                             │ HTTPS
                    ┌────────▼────────────┐
                    │   Caddy (Edge Proxy) │
                    │   Auto-TLS, Static  │
                    └────────┬────────────┘
                             │
              ┌──────────────▼──────────────┐
              │     Fastify Backend (TS)     │
              │  ┌─────────────────────────┐ │
              │  │   AgentOrchestrator     │ │
              │  │   FSM: pending→running  │ │
              │  │   →completed|failed     │ │
              │  ├─────────────────────────┤ │
              │  │ Auth │ Jobs │ SSE │ API │ │
              │  └─────────────────────────┘ │
              └──────┬──────────────┬────────┘
                     │              │
              ┌──────▼──────┐ ┌────▼───────┐
              │ PostgreSQL  │ │MCP Gateway │
              │ Drizzle ORM │ │ GitHub API │
              └─────────────┘ └────────────┘
```

### Teknoloji Yığını

| Katman | Teknoloji | Notlar |
|-------|-----------|-------|
| **Frontend** | React 19, Vite 7, Tailwind 4 | Lazy loading, vendor chunking ile SPA |
| **Backend** | Fastify 4, TypeScript (strict) | Modüler monolit, pino logging |
| **Veritabanı** | PostgreSQL 16, Drizzle ORM | 12+ tablo, migration sistemi |
| **AI Entegrasyonu** | OpenAI / OpenRouter | Kullanıcı sağladığı anahtarlar, AES-256-GCM şifreli |
| **Harici Servisler** | MCP Protocol adaptörleri | Doğrudan vendor SDK yok — hepsi MCP üzerinden |
| **Auth** | JWT in HTTP-only cookie | E-posta/şifre (çok adımlı) + OAuth (GitHub, Google) |
| **Deployment** | OCI Free Tier, Docker Compose, Caddy | Tek ARM64 VM, auto-HTTPS |
| **CI/CD** | GitHub Actions | Her PR'da typecheck + lint + build + test |

### Önemli Tasarım Kararları

- **Sadece MCP entegrasyonları** — Agent işlemleri (repo, commit, PR, Jira ticket vb.) yalnızca MCP adaptörleri üzerinden yapılır. Octokit, jira-client SDK yok. OAuth ve bağlantı testleri için gerekli minimal HTTP çağrıları hariç.
- **Orchestrator pattern** — `AgentOrchestrator`, agent yaşam döngüsünün tamamına sahiptir. Agentlar birbirini çağırmaz.
- **FSM (Finite State Machine)** — Job'lar `pending → running → completed | failed | awaiting_approval` akışını izler.
- **Contract-first agentlar** — Her agentın `Contract` + `Playbook` vardır. Promptlar deterministik (temp=0: AI sıcaklık parametresi, tekrarlanabilir çıktı).
- **Context packs** — Agent başına statik dosya paketleri; repodan seçilen dosyalar AI'ya bağlam olarak verilir. Token verimli, debug edilebilir.

### Terimler

| Terim | Açıklama |
|-------|----------|
| **FSM** (Finite State Machine) | Sonlu durum makinesi; job'ların pending → running → completed/failed akışını yönetir |
| **Job** | Bir agent çalıştırması; kullanıcının tetiklediği tek bir görev (örn. Scribe ile doküman üretimi) |
| **SSE** (Server-Sent Events) | Sunucudan istemciye tek yönlü gerçek zamanlı veri akışı; job ilerlemesi canlı izlenir |
| **temp=0** | AI model sıcaklık parametresi; 0 = deterministik, tekrarlanabilir çıktı |
| **Contract-first** | Her agentın girdi/çıktı şeması (Contract) ve faz tanımları (Playbook) vardır; çıktı doğrulanabilir |
| **Context packs** | Agent başına statik dosya paketleri; repodan seçilen dosyalar AI'ya bağlam olarak verilir, token verimli ve debug edilebilir |

---

## Proje Metrikleri

| Metrik | Değer |
|--------|-------|
| **Test sayısı** | 1.344 (797 backend + 547 frontend) |
| **Test dosyası** | 106 (unit, component, E2E) |
| **Kaynak dosya** | 322 TypeScript/TSX |
| **Satır sayısı** | ~58.000 TS/TSX |
| **API endpoint** | ~89 |
| **i18n anahtarı** | ~500 (İngilizce + Türkçe) |
| **Git commit** | 369+ |
| **CI kalite kapıları** | typecheck, lint, build, test — hepsi yeşil |

---

## Staging Ortamı

**URL:** [staging.akisflow.com](https://staging.akisflow.com)

| Kontrol | Durum |
|-------|--------|
| `/health` | `{"status":"ok"}` |
| `/ready` | DB bağlı, şifreleme yapılandırılmış, SMTP aktif, OAuth (Google + GitHub) |
| `/version` | Commit SHA, build zamanı, semver |
| Smoke testler | 12/12 geçiyor |
| Frontend | Lazy-loaded SPA, 276 kB main chunk |
| TLS | Caddy ile otomatik (Let's Encrypt) |

**Altyapı:** Tek OCI ARM64 VM (24GB RAM) → Caddy → Docker Compose (backend + postgres + MCP gateway)

---

## Özellikler

### Platform
- 6 haneli doğrulama kodlarıyla çok adımlı e-posta/şifre kimlik doğrulama
- OAuth giriş (GitHub, Google) ve hoş geldin e-postası
- 3 adımlı onboarding ile dashboard (GitHub bağla → AI anahtarı ekle → ilk agentı çalıştır)
- Sayfalama, filtreleme ve gerçek zamanlı SSE (Server-Sent Events) streaming ile job (agent çalıştırması) geçmişi
- Agents Hub — tüm agentlar için merkezi keşif sayfası
- Geri bildirim widget'ı (yüzen buton, puan + mesaj)
- i18n desteği (İngilizce + Türkçe, ~500 anahtar)
- Error envelope pattern ile standart hata yönetimi

### Agent Sistemi
- FSM yaşam döngüsü yönetimi ile AgentOrchestrator
- Agent örneklemesi için Factory + Registry pattern
- Agent başına faz tanımları ile Playbook sistemi
- Plan → Execute → Reflect/Critique hattı
- Tamamlandıktan sonra 0–100 kalite skoru
- Tam gözlemlenebilirlik için TraceRecorder
- Gerçek zamanlı güncellemeler için JobEventBus → SSE
- Takılı job tespiti için StaleJobWatchdog
- Agent başına token/dosya limitleri ile context packs

### Güvenlik
- JWT in HTTP-only, Secure, SameSite cookie'ler (7 gün süre)
- Kullanıcı AI anahtarları için AES-256-GCM şifreleme
- bcrypt şifre hashleme
- Rate limiting (env ile yapılandırılabilir)
- Helmet güvenlik başlıkları
- UI'da API anahtarı maskeleme (sadece son 4 karakter)
- SSE stream'lerinde hassas veri redaksiyonu

### DevOps
- Her PR'da kalite kapıları ile GitHub Actions CI/CD
- Docker multi-arch build (amd64 + arm64)
- Health check, versiyon doğrulama, otomatik rollback ile staging deploy
- Staging'de MCP Gateway her zaman açık (manuel profil aktivasyonu yok)
- 12 otomatik kontrollü smoke test scripti
- Zararsız hata yönetimi ile veritabanı migration

---

## Hızlı Başlangıç (Yerel Geliştirme)

```bash
# Klonla
git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git
cd akis-platform-devolopment/devagents

# Bağımlılıkları yükle
pnpm install

# Backend
cp backend/.env.example backend/.env
# backend/.env dosyasını veritabanı URL ve secret'larla düzenle
pnpm -C backend dev

# Frontend (ayrı terminal)
pnpm -C frontend dev
# → http://localhost:5173 (/api backend:3000'e proxy edilir)
```

Kurulum detayları: [`docs/ENV_SETUP.md`](docs/ENV_SETUP.md)

---

## Testleri Çalıştırma

```bash
# Tüm kalite kapıları (CI'da çalışanlar)
pnpm -r typecheck && pnpm -r lint && pnpm -r build && pnpm -r test

# Sadece backend (797 test, node:test runner)
pnpm -C backend test:unit

# Sadece frontend (547 test, Vitest + Testing Library)
pnpm -C frontend test

# E2E (Playwright — auth akışları, agent konsolları, navigasyon)
pnpm -C frontend test:e2e
```

---

## Dil Politikası

Dokümantasyon **Türkçe-primary**: açıklama ve takip metinleri Türkçe; teknik terimler (JWT, MCP, SSE, FSM), komutlar ve agent promptları İngilizce kalır.

---

## Dokümantasyon

| Konu | Bağlantı |
|-------|------|
| Güncel sprint durumu | [`docs/NEXT.md`](docs/NEXT.md) |
| Roadmap ve kilometre taşları | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| Ortam değişkenleri | [`docs/ENV_SETUP.md`](docs/ENV_SETUP.md) |
| API spesifikasyonu | [`backend/docs/API_SPEC.md`](backend/docs/API_SPEC.md) |
| Agent contract'ları | [`docs/agents/AGENT_CONTRACTS_S0.5.md`](docs/agents/AGENT_CONTRACTS_S0.5.md) |
| Agent iş akışları | [`backend/docs/AGENT_WORKFLOWS.md`](backend/docs/AGENT_WORKFLOWS.md) |
| Staging runbook | [`docs/deploy/OCI_STAGING_RUNBOOK.md`](docs/deploy/OCI_STAGING_RUNBOOK.md) |
| Rollback runbook | [`docs/deploy/STAGING_ROLLBACK_RUNBOOK.md`](docs/deploy/STAGING_ROLLBACK_RUNBOOK.md) |
| Release checklist | [`docs/release/STAGING_RELEASE_CHECKLIST.md`](docs/release/STAGING_RELEASE_CHECKLIST.md) |
| Smoke checklist | [`docs/ops/STAGING_SMOKE_CHECKLIST.md`](docs/ops/STAGING_SMOKE_CHECKLIST.md) |

---

## Proje Durumu

| Faz | Durum | Açıklama |
|-------|--------|-------------|
| 0.1–0.3 | Tamamlandı | Temel, mimari, core engine (Kas 2025) |
| 0.4 | Tamamlandı | Web shell, temel engine (Ara 2025) |
| 1.0 | Tamamlandı | Scribe/Trace/Proto early access (Ara 2025) |
| 1.5 | Tamamlandı | Logging + observability katmanı (Oca 2026) |
| 2.0 | Tamamlandı | Cursor-inspired UI + Scribe konsolu (Oca 2026) |
| **S0.5** | **Aktif** | **Pilot demo — staging, UX, agent güvenilirliği, 1.344 test** |

**Güncel kilometre taşı:** M1 Pilot Demo → 28 Şubat 2026

| Kilometre Taşı | Hedef | Odak |
|-----------|--------|-------|
| **M1: Pilot Demo** | Şub 2026 | Canlı staging, golden path'ler, 30/30 görev tamam |
| M2: Stabilizasyon | Mar 2026 | Bug fix, pilot geri bildirimi, pg_trgm, tez taslağı |
| M3: Mezuniyet | May 2026 | Final rapor, sunum, savunma |

---

## Katkıda Bulunma

- Branch adlandırma: `feat/S0.5.X-kısa-açıklama` veya `fix/S0.5.X-kısa-açıklama`
- Conventional Commits: `feat|fix|chore|docs(scope): mesaj`
- PR'lar: küçük (≤ 300 LoC), squash merge, GitHub issue ile bağlantılı
- CI geçmeli: typecheck + lint + build + test

---

## Lisans

MIT License — bkz. [LICENSE](LICENSE)

---

**İstanbul Fatih Sultan Mehmet Üniversitesi'nde lisans bitirme projesi olarak [Ömer Yasir Önal](https://github.com/OmerYasirOnal) tarafından geliştirilmiştir.**
