# AKIS S0.5 Delivery Plan: Staging Fix + Pilot Demo + Mezuniyet Teslimi

> **Version:** 1.0.0  
> **Date:** 2026-02-07  
> **Status:** Active — Single Source of Truth  
> **Scope:** S0.5.0 (OPS) → S0.5.3 (QA) + M1/M2/M3 Milestones  
> **WBS Export:** [`docs/planning/WBS_EXPORT_S0.5.xlsx_compatible.md`](WBS_EXPORT_S0.5.xlsx_compatible.md)  
> **Research Brief:** [`docs/planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md`](RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md)

---

## Yonetici Ozeti

AKIS Platform staging ortaminda kritik bir base URL hatasi mevcut: frontend `http://localhost:3000`'a istek atiyor (ERR_CONNECTION_REFUSED). Root cause teshis edildi ve 1 satirlik fix (`client.ts` icinde `getApiBaseUrl()` eksik) + backend trust-proxy eksikligi + OAuth redirect URL dogrulama gerektiriyor. Bu sorun pilot demo icin **hard blocker**.

Backend Scribe/Trace/Proto ajanlari fonksiyonel (toplam ~1,900 satir implementasyon), orchestrator calisiyor (Plan-Execute-Reflect-Validate), MCP adapterleri hazir. Frontend'de Scribe console tam, Trace/Proto icin chat arayuzu var ama dedicated console yok. Staging altyapisi (OCI VM + Caddy + Docker Compose + smoke test) kurulu ancak base URL sorunu nedeniyle kullanilabilir degil.

**Oncelik sirasi (STRICT):**
1. Staging base URL + auth + trust-proxy fix (P0 blocker)
2. Pilot access gating + onboarding UX
3. Scribe/Trace/Proto golden path reliability
4. Lightweight RAG (Subat: context packs; Mart: pg_trgm)
5. QA evidence + demo scripti + tez hazirlik

**Takvim:** 3 hafta (7-28 Subat) icinde M1 Pilot Demo; Mart stabilizasyon; Nisan-Mayis mezuniyet.

---

## Degisecek / Degismeyecek

**Degisecek:**
- `frontend/src/services/api/client.ts` — `getApiBaseUrl()` import + kullanim (1 satir fix)
- `frontend/src/services/api/HttpClient.ts` — constructor default'u `getApiBaseUrl()` ile degistir
- `backend/src/server.app.ts` — Fastify `trustProxy` konfigurasyonu ekle
- `backend/src/config/env.ts` — `TRUST_PROXY` env var sema'ya ekle
- Staging `.env` — `TRUST_PROXY=true` ekle
- Smoke test'e "localhost leak" kontrolu ekle
- `docs/NEXT.md` ve `docs/ROADMAP.md` — plan ile senkronize
- Yeni dokumanlar: `docs/planning/` altinda 3 dosya

**Degismeyecek:**
- Auth akislari (signup/login/OAuth endpoint'leri) — sadece env/config dogrulugu
- Backend framework (Fastify), ORM (Drizzle), frontend framework (React/Vite)
- MCP adapter mimarisi
- Caddyfile routing (zaten dogru)
- Docker Compose servis topolojisi
- Database semasi (mevcut tablolar yeterli)

---

## 1) Mevcut Durum Goruntusu (Technical Snapshot)

### Staging Topolojisi

```
Internet --> Caddy (443/80) --> backend:3000 (Fastify)
                            --> /srv/frontend (static SPA)
                            --> db:5432 (PostgreSQL 16)
                            --> mcp-gateway:4010 (opsiyonel)
```

- **VM:** OCI Free Tier ARM64, 4 OCPU, 24GB RAM
- **Domain:** `staging.akisflow.com` (Caddy auto-TLS via Let's Encrypt)
- **Env dosyasi:** `/opt/akis/.env` (server uzerinde, git disinda)
- **Frontend:** Vite build output, Caddy tarafindan statik servis
- **Deploy:** GitHub Actions workflow (`oci-staging-deploy.yml`) veya manual script

### Root Cause: Frontend localhost Sorunu

**Teshis edildi.** Kok neden `frontend/src/services/api/client.ts` satirinde:

```typescript
// BUG: getApiBaseUrl() cagrilmiyor, HttpClient constructor default'u kullaniliyor
const httpClient = new HttpClient();
// HttpClient constructor: baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
// Build sirasinda VITE_BACKEND_URL set edilmediginde -> localhost:3000 bundle'a hardcode oluyor
```

**Diger API servisleri (`agents.ts`, `ai-keys.ts`, `integrations.ts` vb.) DOGRU calisiyor** — hepsi `new HttpClient(getApiBaseUrl())` kullaniyor. `getApiBaseUrl()` fonksiyonu staging'de `window.location.origin` (= `https://staging.akisflow.com`) donduruyor.

**Etkilenen istemci:** Sadece `client.ts`'deki `api` nesnesi (jobs, health, ready, version, dashboard metrics).

**Fix:** 2 dosyada degisiklik:
1. `client.ts`: `import { getApiBaseUrl } from './config'` + `new HttpClient(getApiBaseUrl())`
2. `HttpClient.ts` constructor default: `getApiBaseUrl()` (geri donus stratejisi olarak)

### Root Cause #2: Trust Proxy Eksikligi

- `backend/.env.example`'da `TRUST_PROXY=false` tanimli
- AMA `backend/src/config/env.ts` sema'sinda `TRUST_PROXY` yok, kod tarafindan okunmuyor
- `backend/src/server.app.ts`'de `Fastify({ trustProxy: ... })` ayari YOK
- **Etki:** Caddy arkasinda `request.protocol` = 'http', `request.hostname` yanlis olabilir
- **Cookie riski:** `AUTH_COOKIE_SECURE=true` ise, Fastify HTTPS oldugunu bilmedigi icin cookie set etmeyebilir

### OAuth Staging Uyumsuzlugu Hipotezi

- `backend/src/api/auth.oauth.ts` satir 302: `redirectUri = config.BACKEND_URL + '/auth/oauth/{provider}/callback'`
- Staging `.env`'de `BACKEND_URL=https://staging.akisflow.com` dogru set edilmis
- OAuth provider dashboard'larinda (GitHub, Google) callback URL'lerin staging domain'e isaret ettiginden emin olunmali
- **Risk:** OAuth provider'da hala `http://localhost:3000/auth/oauth/...` kayitli olabilir

### DB Guvenilirlik Hipotezi

- `docker-compose.yml`'de PostgreSQL 16 health check var (`pg_isready`)
- `pgdata` named volume ile persistence saglanmis
- `DATABASE_URL` service name (`db:5432`) uzerinden, dogru
- **Risk:** Migration'lar deploy sirasinda calismiyor olabilir (kontrol edilmeli)

### Agent Hazirlik Durumu

| Ajan | Backend | Frontend Console | Golden Path | Demo Ready |
|------|---------|-----------------|-------------|------------|
| Scribe | Fonksiyonel (1,387 satir) | `/agents/scribe` (tam + LiveAgentCanvas) | Golden Path + E2E | Hazir |
| Trace | Fonksiyonel (316 satir) | `/agents/trace` (tam + LiveAgentCanvas) | Golden Path + E2E | Hazir |
| Proto | Fonksiyonel (189 satir) | `/agents/proto` (tam + LiveAgentCanvas) | Golden Path + E2E | Hazir |

### Varolan (Kanitli)

- **Stack:** Fastify 4.x + Drizzle + React 19 + Vite + Tailwind — mandated arch ile tam uyumlu
- **Auth:** Cok adimli email/password + OAuth (Google/GitHub) — QA verified, DOKUNMA
- **Orchestrator:** `AgentOrchestrator.ts` (1,415 satir) — Plan-Execute-Reflect-Validate pipeline
- **MCP Adapterleri:** GitHub (674 satir), Jira (261), Confluence (309) — fonksiyonel
- **Job FSM:** 110/110 test gecen
- **Playbook Sistemi:** Her ajan icin playbook tanimli
- **Staging infra:** Caddy + Docker Compose + smoke test + rollback runbook
- **Observability:** Trace spec + StepTimeline + ExplainableTimeline UI

### Eksik (Pilot Demo Blocker'lar)

1. **KRITIK:** Frontend base URL hatasi (staging'de localhost leak)
2. **KRITIK:** Backend trust-proxy eksikligi (Caddy arkasi cookie/protocol sorunu)
3. **YUKSEK:** OAuth provider callback URL dogrulama (staging domain)
4. **YUKSEK:** Trace/Proto dedicated console sayfalari yok
5. **ORTA:** Golden path senaryolari tanimlanmamis ve test edilmemis
6. **ORTA:** Pilot onboarding UX yok (waitlist -> signup -> first job)
7. **DUSUK:** RAG/context stratejisi tanimlanmamis (Subat icin context packs yeterli)

---

## 2) Kapsam ve Kapsam Disi

### Kapsam Dahili (In-Scope)

- Scribe / Trace / Proto golden path demo akilari
- Trace console sayfasi (minimal, Scribe console referans alinarak)
- Proto console sayfasi (minimal)
- Agent contract standardizasyonu (input/output semalari, hata kodlari)
- Lightweight RAG (onerilecek yaklasim, Subat icin context packs)
- Pilot onboarding UX (signup -> AI key -> first job)
- Geri bildirim toplama (FeedbackTab entegrasyonu)
- Staging base URL, trust-proxy, OAuth correctness fix
- Demo scripti ve video icin golden path senaryolari
- Bitirme projesi tez dokumantasyonu (final rapor, sunum, demo video)

### Kapsam Disi (Out-of-Scope)

- Developer/Coder agent gelistirmesi
- V2 RepoOps agenti
- Yeni entegrasyonlar (Slack, Teams, vs.)
- RBAC / admin paneli
- Pricing/billing gercek implementasyonu
- Auth yeniden tasarimi
- Heavy vector DB veya harici RAG servisleri
- Mobil native
- Production ortami (staging yeterli)
- Performans optimizasyonu (OCI kisitlari icinde kabul edilebilir)

---

## 3) Milestone Tanimlari (Definition of Done)

### M1: Subat Sonu Pilot Demo (28 Subat 2026)

**Definition of Done (tumu pass/fail):**
- [x] `staging.akisflow.com` uzerinde HIC bir `localhost` referansi yok (grep bundle check)
- [x] `/health`, `/ready`, `/version` 200 donuyor (smoke test script'i)
- [x] Email/password signup + login calisiyor (staging uzerinde canli test)
- [x] OAuth redirect'leri `staging.akisflow.com` domain'inde calisiyor (GitHub provider)
- [x] Scribe golden path: config -> run -> plan -> result goruntuleme (dry-run)
- [x] Trace golden path: spec giris -> test plani ciktisi goruntuleme
- [x] Proto golden path: feature giris -> scaffold ciktisi goruntuleme
- [x] Hata durumlarinda kullaniciya anlasilir mesaj gosteriliyor
- [x] Pilot kullanici invite -> signup -> AI key -> first job akisi calisiyor
- [x] Demo scripti yazilmis: `docs/qa/DEMO_SCRIPT_15MIN.md`
- [x] QA evidence dokumani: `docs/qa/GRADUATION_EVIDENCE.md`

### M2: Mart — Stabilizasyon ve Akademik Hazirlik (1-31 Mart 2026)

**Definition of Done:**
- [ ] Pilot geri bildirimleri toplanmis ve triajlanmis (GitHub Issues)
- [ ] Kritik buglar fixlenmis (P0/P1 sifir)
- [ ] Golden path basari orani %90+ (3 ajandan en az 2'si tutarli sonuc veriyor)
- [ ] pg_trgm retrieval prototype calisiyor (opsiyonel, zamana bagli)
- [ ] Tez taslagi: giris + literatur + yontem bolumleri
- [ ] Demo videosu kaydedilmis (5-10 dakika)

### M3: Mezuniyet Teslimi (Nisan-Mayis 2026)

**Definition of Done:**
- [ ] Final rapor tamamlanmis ve danismana onaylatilmis
- [ ] Sunum slaytlari (15-20 slayt) hazir
- [ ] Demo videosu final versiyonu
- [ ] Canli demo en az 2 kez prova edilmis
- [ ] Teslim paketi: kod + dokumanlar + video + sunum

---

## 4) Is Akislari (Workstreams)

### WS-OPS: Staging & Base URL Dogrulugu (PRIORITY 0 — BLOCKER)

**Amac:** Staging'deki `localhost` leak'i ve auth/cookie sorunlarini kalici olarak coz.

**S0.5.0-OPS-1: Frontend base URL fix**
- Dosya: `frontend/src/services/api/client.ts`
- Degisiklik: `import { getApiBaseUrl } from './config'` + `new HttpClient(getApiBaseUrl())`
- Dosya: `frontend/src/services/api/HttpClient.ts`
- Degisiklik: Constructor default'u `getApiBaseUrl()` ile degistir (import guard ile)
- Kabul kriteri: `grep -r 'localhost:3000' frontend/dist/` staging build'inde 0 sonuc
- Bagimlilk: Yok

**S0.5.0-OPS-2: Backend trust-proxy implementasyonu**
- Dosya: `backend/src/config/env.ts` — `TRUST_PROXY` sema'ya ekle (z.enum default 'false')
- Dosya: `backend/src/server.app.ts` — `Fastify({ trustProxy: env.TRUST_PROXY === 'true' })`
- Kabul kriteri: Caddy arkasinda `request.protocol === 'https'` ve `request.hostname === 'staging.akisflow.com'`
- Bagimlilk: Yok

**S0.5.0-OPS-3: Staging env dogrulama ve OAuth callback kontrolu**
- `/opt/akis/.env` icerigini dogrula: `BACKEND_URL`, `FRONTEND_URL`, `CORS_ORIGINS` = `https://staging.akisflow.com`
- `AUTH_COOKIE_SECURE=true`, `TRUST_PROXY=true` set edilmis
- GitHub OAuth App settings: callback URL = `https://staging.akisflow.com/auth/oauth/github/callback`
- Kabul kriteri: OAuth login akisi staging'de calisiyor (redirect loop yok)
- Bagimlilk: S0.5.0-OPS-1, S0.5.0-OPS-2

**S0.5.0-OPS-4: Smoke test'e "localhost leak" kontrolu ekle**
- Dosya: `scripts/staging_smoke.sh`
- Yeni test: `curl -sf $HOST/ | grep -c 'localhost:3000'` = 0 (frontend bundle kontrolu)
- Kabul kriteri: Smoke test 6. item olarak localhost leak kontrolu yapiyor
- Bagimlilk: S0.5.0-OPS-1

**S0.5.0-OPS-5: DB migration ve health dogrulama**
- SSH ile staging'e baglan, `docker compose exec db pg_isready` calistir
- `docker compose logs backend --tail=50` ile migration basarisini dogrula
- Kabul kriteri: `/ready` endpoint'i `{"ready":true}` donuyor
- Bagimlilk: Yok

**S0.5.0-OPS-6: Deploy + full smoke test**
- GitHub Actions veya manual deploy script ile staging'e deploy
- `./scripts/staging_smoke.sh` ile full smoke
- Kabul kriteri: Tum 5+1 smoke test pass
- Bagimlilk: S0.5.0-OPS-1 ~ S0.5.0-OPS-5

### WS-WAITLIST: Pilot Access & Onboarding

**Amac:** Waitlist kullanicilarini kontrollu sekilde pilot'a davet et.

**S0.5.1-WL-1: Minimal allowlist/invite stratejisi tasarla**
- Yaklasim: Email davet + signup linki (ek kod gerektirmez)
- Staging'de signup acik birak, waitlist'e manuel email gonder
- Kabul kriteri: Strateji dokumante edilmis, takimca onaylanmis
- Bagimlilk: S0.5.0-OPS-6

**S0.5.1-WL-2: Pilot onboarding akisi**
- Signup -> Email verification (mock/console) -> AI key setup (Settings > AI Keys) -> First job
- "Getting Started" bilgi karti DashboardPage'e ekle (3-4 adim gosteren kart)
- Kabul kriteri: Yeni kullanici signup'tan ilk job'a 5 dakikada ulasabiliyor
- Bagimlilk: S0.5.0-OPS-6

**S0.5.1-WL-3: Feedback capture**
- Mevcut `FeedbackTab` bilesenini `JobDetailPage`'deki Outputs tab'ina entegre et
- Minimal: thumbs up/down + opsiyonel metin kutusu
- Backend: `POST /api/agents/jobs/:id/feedback` (mevcut mu kontrol et, yoksa ekle)
- Kabul kriteri: Kullanici job sonrasi geri bildirim birakabiliyor
- Bagimlilk: S0.5.1-WL-2

### WS-AGENTS: Scribe/Trace/Proto Reliability

**Amac:** Her ajan icin contract-first, deterministic, golden path calisan cikti.

**S0.5.1-AGT-1: Agent contract dogrulama ve dokumantasyonu**
- Her ajan icin (`scribe`, `trace`, `proto`):
  - Input schema: mevcut Zod validation'i `backend/src/api/agents.ts`'de dogrula
  - Output contract: `backend/src/agents/{type}/{Type}Agent.ts` icindeki return type'i dokumante et
  - Error codes: `AgentOrchestrator` hata mapping'ini kontrol et
- Cikti: `docs/agents/AGENT_CONTRACTS_S0.5.md` (tek dosya, 3 ajan)
- Kabul kriteri: Her ajan icin input schema + output format + error codes listelenmis
- Bagimlilk: Yok

**S0.5.1-AGT-2: Playbook determinizm ayarlari**
- `backend/src/core/agents/playbooks/` icindeki her playbook'u incele
- `temperature: 0` ve/veya `seed` parametresi ayarla (AI service uzerinden)
- System prompt'larini gozden gecir ve sabitlenmis mi kontrol et
- Kabul kriteri: Ayni input ile ayni prompt uretiliyor (seed/temp kontrolu)
- Bagimlilk: Yok

**S0.5.1-AGT-3: Scribe golden path end-to-end dogrulama**
- Senaryo: staging uzerinde dry-run documentation job
- Input: kendi repo (devagents), baseBranch=main, targetPath=README.md, dryRun=true
- Pass kriteri: Job completed, plan goruntulenebilir, preview tab'da markdown var
- Kabul kriteri: 3 denemenin en az 2'si basarili
- Bagimlilk: S0.5.0-OPS-6, S0.5.1-AGT-1

**S0.5.1-AGT-4: Trace golden path dogrulama**
- Senaryo: spec text'inden test plani uretimi
- Input: "User login with email and password. Password must be 8+ chars."
- Pass kriteri: Job completed, Gherkin-like output goruntuleniyor
- Kabul kriteri: 3 denemenin en az 2'si basarili
- Bagimlilk: S0.5.0-OPS-6, S0.5.1-AGT-1

**S0.5.1-AGT-5: Proto golden path dogrulama**
- Senaryo: feature tanindan scaffold uretimi
- Input: "Simple todo app with CRUD operations"
- Pass kriteri: Job completed, dosya listesi goruntuleniyor
- Kabul kriteri: 3 denemenin en az 2'si basarili
- Bagimlilk: S0.5.0-OPS-6, S0.5.1-AGT-1

**S0.5.1-AGT-6: Hata handling standardizasyonu**
- Kontrol: AI key yoksa ne oluyor? MCP baglantisi yoksa? Bos input gonderilirse?
- Her durum icin kullanici-dostu mesaj tanimla ve `AgentOrchestrator`'da uygula
- Kabul kriteri: 5 hata senaryosunun hepsinde UI anlasilir mesaj gosteriyor
- Bagimlilk: S0.5.1-AGT-1

### WS-RAG: Lightweight Knowledge System

**S0.5.2-RAG-1: Research brief ve karar**
- `docs/planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md` icinde RAG bolumu
- Subat karari: Context packs (mevcut) ile devam, ek is yok
- Mart karari: pg_trgm + knowledge_chunks tablosu (zamana bagli)
- Kabul kriteri: Brief yazilmis, "context packs Feb / pg_trgm March" karari kilitlenmis
- Bagimlilk: Yok

**S0.5.2-RAG-2: Context pack mekanizmasi dogrulama**
- Mevcut ScribeAgent'in repo context toplama mantigi calisiyor mu kontrol et
- 50+ dosya okuyor, chunking yapiyor — performans staging'de kabul edilebilir mi
- Kabul kriteri: Scribe golden path'te context dogru toplaniyor (logs'dan dogrulanir)
- Bagimlilk: S0.5.1-AGT-3

### WS-UX: Demo UX & IA

**S0.5.2-UX-1: Trace console sayfasi**
- Dosya: `frontend/src/pages/dashboard/agents/DashboardAgentTracePage.tsx`
- Referans: `DashboardAgentScribePage.tsx` (simplified)
- Minimal: Spec textarea + model secimi + Run butonu + sonuc goruntuleme
- Kabul kriteri: `/agents/trace` route'u calisiyor, job baslatilabiliyor
- Bagimlilk: S0.5.0-OPS-6

**S0.5.2-UX-2: Proto console sayfasi**
- Dosya: `frontend/src/pages/dashboard/agents/DashboardAgentProtoPage.tsx`
- Minimal: Feature textarea + model secimi + Run butonu + sonuc goruntuleme
- Kabul kriteri: `/agents/proto` route'u calisiyor, job baslatilabiliyor
- Bagimlilk: S0.5.0-OPS-6

**S0.5.2-UX-3: Dashboard "Getting Started" karti**
- DashboardPage'e 3-4 adimli onboarding karti ekle
- Adimlar: 1) AI Key ekle 2) GitHub bagla 3) Ilk Scribe job'ini calistir 4) Sonucu incele
- Kabul kriteri: Yeni kullanici dashboard'da ne yapacagini biliyor
- Bagimlilk: S0.5.1-WL-2

### WS-QA: Demo Readiness & Evidence

**S0.5.3-QA-1: Regression checklist**
- `docs/qa/REGRESSION_CHECKLIST.md` olustur
- Icerigi: auth login, auth signup, Scribe run, Trace run, Proto run, job list, job detail
- Kabul kriteri: Checklist olusturulmus, her item pass/fail
- Bagimlilk: S0.5.1-AGT-3 ~ S0.5.1-AGT-5

**S0.5.3-QA-2: Demo scripti**
- `docs/qa/DEMO_SCRIPT_15MIN.md` olustur
- Icerigi: 15 dakikalik canli demo akisi (intro -> login -> Scribe -> Trace -> Proto -> Q&A)
- Kabul kriteri: Script yazilmis, 1 kez prova edilmis, timing dogrulanmis
- Bagimlilk: S0.5.3-QA-1

**S0.5.3-QA-3: QA evidence dokumani**
- `docs/qa/GRADUATION_EVIDENCE.md` olustur
- Screenshot + log excerpts (secret icermeyen) + pass/fail tablosu
- Kabul kriteri: Tum golden path'ler evidence ile dokumante edilmis
- Bagimlilk: S0.5.3-QA-2

**S0.5.3-QA-4: Tez hazirlik notu**
- `docs/qa/THESIS_PREP_NOTE.md` olustur
- Bolum basliklari: Giris, Problem, Literatur, Yontem, Uygulama, Sonuc
- Kabul kriteri: Danismana gosterilebilir taslak
- Bagimlilk: Yok

---

## 5) RAG Strateji Karari

### Onerilen 3 Secenek

| # | Yaklasim | Karmasiklik | Guvenilirlik | OCI Uyumu |
|---|----------|-------------|--------------|-----------|
| 1 | **Context Packs Only** (mevcut) | Dusuk | Orta | Mukemmel |
| 2 | **Postgres pg_trgm + basit retrieval** | Orta | Yuksek | Iyi |
| 3 | **Postgres pgvector embedding + retrieval** | Yuksek | Yuksek | Orta |

### Onerilen: Secenek 2 — pg_trgm

- Zaten Postgres kullaniyoruz, ek altyapi yok
- `pg_trgm` uzantisi OCI Free Tier'da aktif edilebilir
- Full-text search + trigram similarity yeterli baslangic icin
- Embedding gerektirmiyor (model bagimliligi yok)
- Tez icin "lightweight RAG" olarak sunulabilir

### Rollout

- **Subat:** Context packs ile devam (mevcut hali, degisiklik yok)
- **Mart:** `knowledge_chunks` tablosu + pg_trgm index + basit retrieval endpoint
- **Nisan (opsiyonel):** pgvector ile embedding denemesi (sadece tez icin gerekirse)

### Yapilmayacak

- Harici vector DB servisi (Pinecone, Weaviate, Chroma)
- Heavy embedding modelleri (local veya cloud)
- Karmasik chunking stratejileri
- RAG evaluation framework

---

## 6) Golden Path Senaryolari

### Scribe Golden Path

- **Senaryo:** Bir GitHub repo'sunun README dosyasini guncelleyen documentation job
- **Input:** owner=test-org, repo=sample-repo, baseBranch=main, targetPath=README.md, dryRun=true
- **Beklenen Output:** Plan JSON + generated markdown + diff preview
- **Hata Durumu:** GitHub baglantisi yoksa -> "GitHub baglantinizi kontrol edin" mesaji
- **Minimal UI:** Scribe console -> config doldur -> calistir -> Logs/Preview/Diff tab'lari

### Trace Golden Path

- **Senaryo:** Bir requirements spec'inden test plani uretimi
- **Input:** spec="Kullanici giris yapabilmeli, sifre 8+ karakter, email dogrulama gerekli"
- **Beklenen Output:** Gherkin formatli test senaryolari + coverage matrix
- **Hata Durumu:** Spec bos ise -> "Lutfen bir gereksinim spesifikasyonu girin" mesaji
- **Minimal UI:** Trace console -> spec textarea -> model sec -> calistir -> sonuc goruntule

### Proto Golden Path

- **Senaryo:** Basit bir todo app prototipi uretimi
- **Input:** feature="Todo list with add/delete/mark-complete features"
- **Beklenen Output:** Scaffold file listesi + temel kod dosyalari
- **Hata Durumu:** Feature tanimi bos ise -> "Lutfen bir ozellik tanimi girin" mesaji
- **Minimal UI:** Proto console -> feature textarea -> model sec -> calistir -> scaffold goruntule

---

## 7) Oncelik Sirasi (STRICT)

```
Phase A (7-9 Sub):   WS-OPS      — Staging base URL fix + trust-proxy + DB check + deploy + smoke
Phase B (10-14 Sub): WS-WAITLIST + WS-UX — Pilot access + Trace/Proto console + onboarding
Phase C (14-21 Sub): WS-AGENTS   — Contract dogrulama + golden path test + hata handling
Phase D (17-23 Sub): WS-RAG      — Research brief + context pack dogrulama (paralel)
Phase E (24-28 Sub): WS-QA       — Regression + demo script + evidence + M1 PILOT DEMO
```

---

## 8) Calisma Takvimi

### Subat 2026 (Haftalik)

| Hafta | Tarih | Odak | Gorevler | Teslimat |
|-------|-------|------|----------|----------|
| H1 | 7-9 Sub | **Phase A: WS-OPS** | S0.5.0-OPS-1~6, plan dokumanlari | Staging calisiyor, localhost leak fix, smoke pass |
| H2 | 10-16 Sub | **Phase B: WS-WAITLIST + WS-UX** | S0.5.1-WL-1~3, S0.5.2-UX-1~3 | Trace/Proto console, onboarding flow, feedback |
| H3 | 17-23 Sub | **Phase C+D: WS-AGENTS + WS-RAG** | S0.5.1-AGT-1~6, S0.5.2-RAG-1~2 | Golden paths verified, contracts documented |
| H4 | 24-28 Sub | **Phase E: WS-QA + M1** | S0.5.3-QA-1~4, final deploy, demo prova | **M1: PILOT DEMO**, QA evidence |

### Mart-Mayis 2026 (Aylik)

| Ay | Odak | Teslimat |
|----|------|----------|
| Mart | M2: Stabilizasyon | Bug fix, pilot feedback triaj, pg_trgm prototype (opsiyonel), tez taslagi, demo video |
| Nisan | M3 prep: Tez yazimi | Tez govdesi, sunum slaytlari, kullanici rehberi |
| Mayis | M3: Mezuniyet teslimi | Final rapor, savunma provasi, teslim paketi |

---

## 9) Riskler ve Azaltma Stratejileri

| Risk | Olasilik | Etki | Azaltma Kurali |
|------|----------|------|----------------|
| **Staging-only risk:** Demo sirasinda staging cokerse | Orta | Yuksek | Demo oncesi smoke test zorunlu; rollback runbook hazir; video yedek kaydedilmis |
| **Auth/OAuth correctness:** Cookie set edilmez veya redirect basarisiz | Orta | Kritik | Phase A'da trust-proxy + cookie + OAuth callback dogrulama; staging'de canli auth test zorunlu |
| **DB instability:** Migration basarisiz veya data kaybi | Dusuk | Yuksek | Named volume persistence; deploy oncesi backup; `/ready` endpoint DB health kontrolu |
| **Scope creep:** Yeni feature istekleri plani bozar | Yuksek | Orta | 21 Subat scope freeze; her degisiklik change-request; bu plan single source of truth |
| **Model reliability:** LLM ciktilari tutarsiz | Orta | Orta | temperature=0, system prompt sabitlenmis, dry-run modu, 3 denemeden 2 basari yeterli |
| **Zaman riski:** 3 hafta cok az | Yuksek | Yuksek | Golden path only focus; nice-to-have ertele; Trace/Proto console minimal |
| **OCI Free Tier:** CPU/RAM yetersiz | Dusuk | Yuksek | Tek job/seferlik; background worker yok; minimal dependencies |

---

## 10) Ready-to-Build Gate

Implementation baslamadan once su kosullar saglanmis olmali:

- [ ] Bu plan dokumani okunmus ve takimca onaylanmis
- [ ] Arastirma brief'indeki 7 karar kilitlenmis
- [ ] GitHub OAuth App settings'de staging callback URL dogrulanmis
- [ ] Staging VM'ye SSH erisimi ve `/opt/akis/.env` duzenleme yetkisi var
- [ ] `pnpm -r typecheck && pnpm -r lint && pnpm -r build` lokal'de gecen
- [ ] Git working tree temiz, main branch guncel

---

## Kilitlenecek Kararlar (Decisions to Lock)

1. **Frontend build env:** Staging build sirasinda `VITE_BACKEND_URL` set edilMEyecek (mevcut `VITE_API_URL=/api` yeterli, `getApiBaseUrl()` window.location.origin kullanacak)
2. **Trust proxy:** `TRUST_PROXY=true` staging `.env`'ye eklenecek, backend kodda implement edilecek
3. **Cookie domain:** `AUTH_COOKIE_DOMAIN` bos birakilacak (tek domain, subdomain sharing gereksiz)
4. **OAuth callbacks:** GitHub OAuth App'de callback URL `https://staging.akisflow.com/auth/oauth/github/callback` olarak guncellenecek
5. **RAG Subat:** Context packs (degisiklik yok); Mart'ta pg_trgm degerlendirilecek
6. **Pilot access:** Email davet + acik signup (invite code eklenmeyecek)
7. **Scope freeze:** 21 Subat'tan sonra yeni feature eklenmez

---

## Ilgili Dokumanlar

| Dokuman | Amac |
|---------|------|
| [`docs/planning/WBS_EXPORT_S0.5.xlsx_compatible.md`](WBS_EXPORT_S0.5.xlsx_compatible.md) | WBS tablo + CSV (Excel uyumlu) |
| [`docs/planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md`](RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md) | Teknik arastirma brief'i |
| [`docs/NEXT.md`](../NEXT.md) | Aksiyonel todo listesi |
| [`docs/ROADMAP.md`](../ROADMAP.md) | Yuksek seviye milestone'lar |
| [`docs/deploy/OCI_STAGING_RUNBOOK.md`](../deploy/OCI_STAGING_RUNBOOK.md) | Staging operations |
| [`docs/release/STAGING_RELEASE_CHECKLIST.md`](../release/STAGING_RELEASE_CHECKLIST.md) | Release checklist |

---

*Bu dokuman AKIS S0.5 teslimat planinin **tek kaynagi**dir. Tum degisiklikler bu dosya uzerinden yapilir.*
