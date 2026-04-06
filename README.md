<p align="center">
  <img src="akis-logo.png" alt="AKIS Logo" width="120" />
</p>

<h1 align="center">AKIS Platform</h1>

<p align="center">
  <strong>Adaptive Knowledge Integrity System</strong><br/>
  Yapay Zeka Destekli Çok Ajanlı Yazılım Geliştirme Platformu
</p>

<p align="center">
  <img src="https://img.shields.io/badge/sürüm-0.2.0-blue" alt="Sürüm" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Fastify-4-black?logo=fastify" alt="Fastify" />
  <img src="https://img.shields.io/badge/Claude_API-Sonnet_4.6-D97757?logo=anthropic" alt="Claude" />
  <img src="https://img.shields.io/badge/lisans-MIT-green" alt="Lisans" />
</p>

---

## Nedir?

AKIS, doğal dilde anlatılan bir yazılım fikrini üç özelleştirilmiş yapay zeka ajanı aracılığıyla **çalışır durumda bir projeye** dönüştüren açık kaynaklı bir platformdur. Her aşamada bilgi bütünlüğü (Knowledge Integrity) doğrulama mekanizmaları ile çıktı kalitesi garanti altına alınır.

```
Kullanıcı Fikri → [Scribe] → Spec → [İnsan Onayı] → [Proto] → Kod → [Trace] → Testler → ✓ Proje
```

---

## Mimari Genel Bakış

AKIS, **modüler monolit** mimari üzerine kurulmuş bir AI ajan orkestrasyon sistemidir. Tüm ajan iletişimi merkezi bir `PipelineOrchestrator` üzerinden yönetilir; ajanlar birbirini doğrudan çağırmaz.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React 19 + Vite 7)                 │
│                                                                 │
│   Dashboard ─ Workflow Chat ─ Canlı Önizleme ─ Kod Görüntüle   │
│                         │  SSE  │                               │
├─────────────────────────┼───────┼───────────────────────────────┤
│                 Backend (Fastify 4 + TypeScript)                │
│                                                                 │
│   REST API ─ Auth (JWT + OAuth) ─ AI Service ─ GitHub Service   │
│                         │                                       │
│              ┌──────────┴──────────┐                            │
│              │ Pipeline Orchestrator│                            │
│              │   (Durum Makinesi)   │                            │
│              └──┬─────┬─────┬──────┘                            │
│                 │     │     │                                    │
│           ┌─────┴┐ ┌─┴────┐ ┌┴─────┐                           │
│           │Scribe│ │Proto │ │Trace │                            │
│           │Agent │ │Agent │ │Agent │                            │
│           └──────┘ └──────┘ └──────┘                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│   PostgreSQL 16 (Drizzle ORM) │ Claude API │ GitHub REST API    │
└─────────────────────────────────────────────────────────────────┘
```

### Pipeline Durum Makinesi (FSM)

Pipeline deterministik bir sonlu durum makinesi olarak çalışır. Her geçiş tek yönlüdür ve hata durumunda retry mekanizması devreye girer:

```
scribe_clarifying → scribe_generating → awaiting_approval
    → proto_building → trace_testing → completed | completed_partial

Her aşamadan → failed (max 3 retry, backoff: 5s/15s/30s) | cancelled
```

---

## Ajan Mimarisi

### Scribe — Spesifikasyon Yazıcı

Kullanıcının serbest metin fikrini yapılandırılmış bir yazılım spesifikasyonuna dönüştürür. İki aşamalı çalışır:

**1. Clarification Aşaması:** Fikri analiz eder, önceliklendirilmiş (P0/P1/P2) 3-5 soru üretir. Kullanıcı yanıtlarına göre ek turlar açabilir.

**2. Spec Üretimi:** Yanıtlar toplandıktan sonra yapılandırılmış spec üretir:
- Problem Tanımı, Kullanıcı Hikayeleri (Given/When/Then), Kabul Kriterleri
- Teknik Kısıtlamalar, Kapsam Dışı bölümleri
- **Güven Skoru** (0-100%): Tamlık (%40) + Gereksinim Netliği (%30) + Kapsam Tanımı (%20) + Kullanıcı Uyumu (%10)
- Öz-sorgulama ve öz-inceleme (self-interrogation, self-review) ile çıktı doğrulaması

### Proto — MVP Oluşturucu

Onaylanan spesifikasyonu alır, çalışır durumda bir MVP scaffold üretir ve GitHub'a push eder.

**İşlem Akışı:**
1. Spec'teki kullanıcı hikayelerini dosya yapısı planına dönüştürür
2. Her dosya için AI ile kaynak kod üretir (bileşenler, route'lar, stiller)
3. GitHub REST API ile hedef repoda yeni branch açar (`proto/scaffold-{timestamp}`)
4. Dosyaları commit'ler ve push eder
5. Scaffold bütünlük doğrulaması: dosya sayısı, dizin yapısı, bağımlılık tutarlılığı
6. Pull Request oluşturur

**Çıktı:** `{ branch, repo, repoUrl, files[], prUrl, setupCommands[], verificationReport }`

### Trace — Test Yazıcı

Proto'nun ürettiği **gerçek kodu** GitHub'dan okuyarak Playwright E2E testleri yazar. Serbest metin değil, commit'lenmiş kodu analiz eder.

**İşlem Akışı:**
1. Proto'nun push ettiği branch'teki dosyaları GitHub REST API ile okur
2. Route, endpoint ve bileşen analizi yapar
3. Her Kabul Kriteri (AC) için Playwright test senaryosu üretir
4. **AC → Test İzlenebilirlik Matrisi** oluşturur (hangi test hangi AC'yi doğruluyor)
5. Test dosyalarını raporlar

**Çıktı:** `{ testFiles[], coverageMatrix, testSummary, traceability[] }`

### Ajan Arası Sözleşme (Inter-Agent Contract)

Ajanlar birbirini doğrudan çağırmaz. Tüm iletişim tiplenmiş TypeScript arayüzleri üzerinden PipelineOrchestrator aracılığıyla gerçekleşir:

```typescript
ScribeInput  → ScribeOutput { spec: StructuredSpec, confidence: number }
                    ↓ [İnsan Onayı]
ProtoInput   → ProtoOutput  { branch: string, files: FileInfo[], prUrl: string }
                    ↓
TraceInput   → TraceOutput  { testFiles: TestFile[], coverageMatrix: CoverageMatrix }
```

### Doğrulama Zinciri (Knowledge Integrity)

AKIS'in temel farkı her aşamada çıktı doğrulaması yapmasıdır:

| Aşama | Doğrulayan | Yöntem |
|-------|-----------|--------|
| Scribe → Spec | **İnsan** | Kullanıcı spec'i inceler, onaylar veya reddeder |
| Proto → Kod | **Trace** | Üretilen kodu okuyup test yazar |
| Trace → Testler | **Otomatik** | Testler çalıştırılarak doğrulanır |

Bu zincir, yapay zeka çıktısının her katmanda bağımsız bir doğrulayıcı tarafından kontrol edilmesini sağlar.

---

## Teknoloji Yığını

| Katman | Teknoloji | Detay |
|--------|-----------|-------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4 | SPA, SSE ile gerçek zamanlı akış, StackBlitz canlı önizleme |
| **Backend** | Fastify 4, TypeScript | Plugin mimarisi, provider-agnostic AI servisi |
| **Veritabanı** | PostgreSQL 16, Drizzle ORM | Tip güvenli şema, migration desteği |
| **AI** | Anthropic Claude API (Sonnet 4.6) | temperature=0, JSON çıktı, güven skorlaması |
| **Entegrasyon** | GitHub REST API | Repo oluşturma, branch, commit, PR — OAuth ile kullanıcı kimlik doğrulama |
| **Test** | Vitest, Playwright | Birim testler + AI tarafından üretilen E2E testler |
| **Altyapı** | Docker, Caddy, OCI ARM64 | SSE için `flush_interval -1`, ücretsiz bulut katmanı |

---

## Özellikler

- **Sıralı Çok Ajan Pipeline** — Scribe → İnsan Kapısı → Proto → Trace
- **Gerçek Zamanlı İzleme** — SSE ile canlı ajan aktivite akışı
- **Canlı Önizleme** — StackBlitz WebContainer ile tarayıcıda çalışan uygulama
- **Kod Görüntüleyici** — Syntax highlighted dosya inceleme
- **GitHub Entegrasyonu** — Otomatik repo, branch, commit, PR
- **Dev Modu** — Pipeline sonrası chat tabanlı iteratif geliştirme (DevAgent)
- **Ajan Metrikleri** — Performans, güven skoru, başarı oranı takibi
- **OAuth** — GitHub ve Google ile oturum açma
- **Türkçe Arayüz** — Tamamen Türkçeleştirilmiş kullanıcı deneyimi
- **Glassmorphism UI** — Modern, saydam yüzeylerle tasarlanmış arayüz

---

## Proje Yapısı

```
devagents/
├── backend/                    Fastify 4 + TypeScript
│   └── src/
│       ├── pipeline/           Pipeline kodu
│       │   ├── agents/         Scribe, Proto, Trace ajanları
│       │   │   ├── scribe/     ScribeAgent.ts, prompts/, schemas/
│       │   │   ├── proto/      ProtoAgent.ts, prompts/
│       │   │   └── trace/      TraceAgent.ts, prompts/
│       │   ├── core/           PipelineOrchestrator, FSM, contracts
│       │   ├── adapters/       GitHubRESTAdapter
│       │   └── api/            pipeline.routes.ts
│       ├── api/                REST API route'ları (auth, github)
│       ├── db/                 Drizzle ORM şema + migration
│       └── services/           AI, auth, email servisleri
├── frontend/                   React 19 + Vite 7 SPA
│   └── src/
│       ├── pages/dashboard/    Overview, Workflows, Agents, Settings
│       ├── components/         Chat, Preview, StatusBadge, Pipeline
│       └── services/api/       HTTP client'lar
├── deploy/                     Docker, Caddy, deploy betikleri
├── docs/                       Mimari ve API dokümantasyonu
└── scripts/                    Veritabanı ve yardımcı betikler
```

---

## Kurulum

### Gereksinimler

- Node.js 20+ ve pnpm 9+
- Docker & Docker Compose
- Anthropic API anahtarı
- GitHub OAuth uygulaması (opsiyonel)

### Hızlı Başlangıç

```bash
# Klonla
git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git
cd akis-platform-devolopment

# Veritabanını başlat
./scripts/db-up.sh

# Backend
cd backend
cp .env.example .env       # API anahtarlarını düzenle
pnpm install && pnpm dev   # → http://localhost:3000

# Frontend (ayrı terminal)
cd frontend
pnpm install && pnpm dev   # → http://localhost:5173
```

Tarayıcıda `http://localhost:5173/dashboard` adresine git.

### Ortam Değişkenleri

Gerekli değişkenler için `backend/.env.example` dosyasına bak. Detaylı açıklama: [`docs/ENV_SETUP.md`](docs/ENV_SETUP.md)

---

## Katkıda Bulunma

Katkıda bulunmak için [`CONTRIBUTING.md`](CONTRIBUTING.md) dosyasını oku.

## Lisans

MIT — detaylar için [`LICENSE`](LICENSE) dosyasına bak.
