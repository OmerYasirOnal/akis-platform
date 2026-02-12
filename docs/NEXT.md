# NEXT — S0.5 Pilot Demo Yürütme Planı

> **Kanonik Plan:** [`docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)  
> **WBS Tablosu:** [`docs/planning/WBS_EXPORT_S0.5.xlsx_compatible.md`](planning/WBS_EXPORT_S0.5.xlsx_compatible.md)  
> **Araştırma Notu:** [`docs/planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md`](planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md)  
> **Araştırma Temeli:** `docs/planning/RESEARCH_DEEP_DIVE_AGENT_ARCHITECTURE.md`  
> **Operasyonel Playbook:** [`docs/planning/AKIS_OPERATIONAL_PLAYBOOK.md`](planning/AKIS_OPERATIONAL_PLAYBOOK.md) (4 Pillar + Moonshot — teyit edilmiş hedef)  
> **Uygulama Haritası:** [`docs/planning/PLAYBOOK_IMPLEMENTATION_MAP.md`](planning/PLAYBOOK_IMPLEMENTATION_MAP.md)  
> **Son Güncelleme:** 2026-02-13 (playbook entegrasyonu + M2 görev planı)

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
| Deploy Edilen Commit | `43b86e7` (canlı `/version` doğrulandı, 2026-02-12 19:55 UTC) |
| S0.5 PR | [#265](https://github.com/OmerYasirOnal/akis-platform-devolopment/pull/265) — onboarding, feedback, context packs, QA docs, 750+ yeni test |
| Smoke Testleri | 12/12 geçti (`staging_smoke.sh --commit 43b86e7`, 2026-02-12 19:55 UTC) |
| Test Sayısı | Backend: 842 + Frontend: 549 = **1,391 toplam** (Phase 1-8 test kampanyası + S0.5 sprint, 2026-02-11) |
| Kod Düzeltmeleri | MCP `/ready` durumu, OAuth hoşgeldin e-postası, agents yönlendirme `/agents/*`, logo güncelleme, güvenlik temizliği, E2E test hizalama, Scribe AGT-8 derin analiz iyileştirmesi, GitHub-style light theme tokenları, jobs user isolation (veri sızıntı fix), expandable logs + smart auto-scroll + light theme kontrast düzeltmesi |
| Şifreleme | Staging'de yapılandırıldı (`/ready` → `encryption.configured: true`) |
| E-posta | Resend.com aktif (`EMAIL_PROVIDER=resend`); `noreply@akisflow.com` domain verified, DKIM+SPF+DMARC geçerli (2026-02-12) |
| Google OAuth | `/ready` → `oauth.google`, `oauth.github`, `oauth.callbackBase` gösteriyor — staging `.env` kimlik bilgilerini doğrulayın |
| MCP Gateway | Always-on staging stack'te (profile kaldırıldı); CI pipeline (PR #266); `GITHUB_TOKEN` aktif, gateway reachable |
| Agent Yönlendirme | Scribe/Trace/Proto → `/agents/*` taşındı; `/dashboard/scribe\|trace\|proto` yeni rotalara yönlendirme yapıyor |
| Scribe AGT-8 | `b723c2d` ile merge + staging deploy tamamlandı (2026-02-12) |
| Son Merge'ler | PR #307 (light theme), PR #305 (jobs user isolation), PR #303 (live agent canvas), PR #302 (scribe AGT-8) — tümü `main`'de |
| Logo | Full wordmark korunuyor (`frontend/src/assets/branding/akis-official-logo@*`), compact/favikon için A-mark only ailesi güncellendi (`frontend/src/assets/branding/akis-a-mark.png`, `akis-mark@2x.png`, `akis-mark@3x.png`, `frontend/public/brand/favicon*`) |

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
| S0.5.1-WL-2 | Katılım akışı (kayıt → AI anahtarı → ilk iş) | Tamamlandı | i18n + job API wiring (2026-02-09) |
| S0.5.1-WL-3 | Geri bildirim yakalama (FeedbackTab entegrasyonu) | Tamamlandı | Feedback table + POST /api/feedback + FeedbackWidget + 16 test (2026-02-09) |
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
| S0.5.1-AGT-7 | Scribe explicit skill contracts (DocPack/ReleaseNotes/Checklist) + deterministic schema tests | Tamamlandı | FACET-style schema reject+retry, Golden Trace replay fixture ve 3-layer assertion (Sec 3.4) eklendi (2026-02-10) |

### Faz D (17-23 Şub) — RAG (PARALEL)

| ID | Görev | Durum | Notlar |
|----|-------|-------|--------|
| S0.5.2-RAG-1 | Araştırma notu + karar kilitleme | Tamamlandı | `docs/agents/CONTEXT_PACKS.md` (2026-02-09) |
| S0.5.2-RAG-2 | Bağlam paketi mekanizması doğrulama | Tamamlandı | contextPacks.ts + 19 doğrulama testi (2026-02-09) |
| S0.5.2-RAG-3 | Context Pack contract: versioned + selectable + auditable metadata (`packId`, `packVersion`, `profile`) | Tamamlandı | Ref 4 + Sec 4.2b + Sec 7.2 hizası: truncation stratejisi, invalid profile reject, contract testleri (2026-02-10) |

### Faz E (24-28 Şub) — KG + M1 PİLOT DEMO

| ID | Görev | Durum | Notlar |
|----|-------|-------|--------|
| S0.5.3-QA-1 | Regresyon kontrol listesi | Tamamlandı | `docs/qa/REGRESSION_CHECKLIST.md` (2026-02-09) |
| S0.5.3-QA-2 | Demo senaryosu (15 dk) | Tamamlandı | `docs/qa/DEMO_SCRIPT_15MIN.md` (2026-02-09) |
| S0.5.3-QA-3 | KG kanıt dokümanı | Tamamlandı | `docs/qa/GRADUATION_EVIDENCE.md` (2026-02-09) |
| S0.5.3-QA-4 | Tez hazırlık notu (taslak) | Tamamlandı | `docs/qa/THESIS_PREP_NOTE.md` (2026-02-09) |
| S0.5.3-QA-5 | 5 golden path için exact URL + pass/fail acceptance matrix + 15dk demo hizası | Tamamlandı | `docs/qa/REGRESSION_CHECKLIST.md` + `docs/qa/DEMO_SCRIPT_15MIN.md` güncellendi (2026-02-10) |
| S0.5.3-DOC-1 | Public portfolio export akışı | Tamamlandı | `scripts/public-repo/export.sh` + `docs/public/` (2026-02-10) |
| S0.5.3-UX-1 | Landing page CTA kontrast + sahte metrikler düzeltme | Tamamlandı | Button contrast fix + capability cards (2026-02-10) |
| S0.5.3-DOC-2 | Screenshot shot list + portfolio referansları | Tamamlandı | `docs/public/assets/SHOTLIST.md` (2026-02-10) |
| S0.5.3-DOC-3 | Public dokümanlar Türkçe-öncelikli + TR özet başlıkları | Tamamlandı | README.md TR, README.en.md EN, teknik doc'lara TR özet (2026-02-10) |
| S0.5.3-UX-2 | Screenshot mode (`?shot=1`) — PII maskeleme | Tamamlandı | `useScreenshotMode` hook + ProfileMenu/AppHeader/FeedbackWidget (2026-02-10) |
| S0.5.3-UX-3 | Button kontrast WCAG AA — tüm CTA'larda `text-ak-bg` → `text-[#111418]` | Tamamlandı | 13 dosyada fix, opacity hover → brightness (2026-02-10) |
| S0.5.3-UX-4 | Automations sidebar + smart-automations erişilebilirliği | Tamamlandı | Sidebar nav item, i18n keys, Web IA güncelleme (2026-02-10) |
| S0.5.3-UX-5 | Logo PNG transparency + duplicate cleanup | Tamamlandı | RGBA transparent logolar, `public/assets/branding/` + `logo.png` silindi (2026-02-10) |
| S0.5.3-UX-6 | Agents Hub kalıcı conversation thread'leri (agent/automation), tür etiketi+ikon, AI kısa başlık üretimi | Tamamlandı | `/agents` içinde localStorage session kalıcılığı, sidebar thread listesi, type+title header, automation run-link mesajları (2026-02-11) |
| S0.5.3-DOC-4 | `/docs/agents/*` sayfalarında TR/EN uyumlu içerik, referans blokları, görsel kart düzeni + link/kontrast stabilizasyonu | Tamamlandı | Scribe/Trace/Proto docs sayfaları i18n tabanlı yeniden düzenlendi; global link style scope daraltıldı, DocsLayout CTA kontrastı düzeltildi (2026-02-11) |
| S0.5.3-UX-7 | Light/Dark theme readability tuning (göz yormayan arkaplan + secondary text contrast) | Tamamlandı | `theme.tokens.css` dark/light metin ve zemin tokenları güncellendi, primary CTA metin görünürlüğü `--ak-on-primary` ile sabitlendi (2026-02-11) |
| S0.5.3-UX-8 | Doküman kalite görünürlüğü: Agent Hub + Job Details | Tamamlandı | Agent Hub completion mesajı + header quality badge, Job Details summary card quality gate (PASS/FAIL) eklendi (2026-02-11) |
| S0.5.3-UX-9 | Trace guided prototype run (3-4 seçenekli soru) + automation execution özeti | Tamamlandı | Trace Console’da preference soruları eklendi (`testDepth/authScope/browserTarget/strictness`), payload’a `tracePreferences` bağlandı; TraceAgent sonuç metadata’sına `automationExecution` (executed/passed/failed/passRate/featureCoverage) eklendi + testler (2026-02-11) |
| S0.5.3-UX-10 | Agent runtime controls (Settings drawer + 5 kademe command + runtime override) + Studio route scaffold | Tamamlandı | `agent-configs` runtime alanları (`runtimeProfile/temperatureValue/commandLevel/settingsVersion`), `/api/agents/jobs` `runtimeOverride` + `effectiveRuntime`, Scribe/Trace/Proto/AgentsHub settings drawer, `/agents/studio` MVP yüzeyi ve toast bildirimleri (2026-02-11) |
| S0.5.3-UX-11 | Multi-Agent Thread Studio v1 (backend kalıcı thread + plan candidate domain + thread SSE) | Tamamlandı | Yeni conversation domain migration (`conversation_threads/messages/tasks/plan_candidates/plan_candidate_builds/thread_trust_snapshots`), `/api/conversations/*` endpoint ailesi, 3 aktif run build guard ve Agents Hub backend thread senkronu (2026-02-11) |
| S0.5.3-UX-12 | Trace “Yaz→Koş→Raporla” coverage görünürlüğü (console + job detail) | Tamamlandı | Trace Console summary kartları (feature/test/duration/failures) + generated test preview, Job Details’e “Automation Coverage” kartı, i18n TR/EN key güncellemeleri ve test güncellemesi (2026-02-11) |
| S0.5.3-OPS-1 | `/ready` MCP diagnostics — her zaman `mcp` objesi + `missingEnv` dizisi | Tamamlandı | Schema fix + diagnostik alanlar + test (2026-02-10) |
| S0.5.3-OPS-2 | Staging smoke + deploy docs contract drift fix (`mcp.github` → `mcp.gatewayReachable`) | Tamamlandı | `scripts/staging_smoke.sh`, OCI workflow metinleri ve staging deploy/checklist dokümanları güncellendi (2026-02-10) |
| S0.5.3-AUTH-1 | Public sayfa 401 console hata temizliği (AuthContext skip on public routes) | Tamamlandı | PR #285 — `requiresAuthResolve()` guard (2026-02-11) |
| S0.5.3-I18N-1 | Docs i18n batch-1 (DocsIndex/GettingStarted/RestApi/Auth/Webhooks/BestPractices) + DocsSectionCard/DocsReferenceList | Tamamlandı | PR #286 — 6 sayfa + 2 ortak bileşen (2026-02-11) |
| S0.5.3-I18N-2 | Docs i18n batch-2 (Integrations/Security/Guides + localhost temizliği) | Tamamlandı | PR #287 — 8 sayfa + i18n 687/687 key parity (2026-02-11) |
| S0.5.3-TRACE-1 | TraceAutomationRunner (gerçek Playwright yürütme motoru + JSON reporter parse) | Tamamlandı | PR #288 — 6 unit test, feature-bazlı sonuç hesaplama (2026-02-11) |
| S0.5.3-TRUST-1 | TrustScoringService (4 güven metriği: Reliability/Hallucination Risk/Task Success/Tool Health) | Tamamlandı | PR #289 — 11 unit test, pure computation (2026-02-11) |
| S0.5.3-STUDIO-1 | Studio backend session CRUD + DB schema + file tree stub | Tamamlandı | PR #290 — migration 0030 + 8 unit test (2026-02-11) |
| S0.5.3-STUDIO-2 | StudioCommandRunner (allowlist) + PatchProposalService (güvenlik doğrulama) | Tamamlandı | PR #291 — 16 unit test, shell:false + path traversal koruması (2026-02-11) |
| S0.5.3-WEBHOOK-1 | Webhook HMAC-SHA256 doğrulama + trigger şema kontrat testleri | Tamamlandı | PR #292 — 16 unit test (2026-02-11) |
| S0.5.3-PTT-1 | usePushToTalk hook (Web Speech API) + docs i18n parity doğrulama scripti | Tamamlandı | PR #293 — voice input + verify_docs_i18n_parity.mjs (2026-02-11) |
| S0.5.3-SYNC-1 | Research gap güncelleme (Sec 9.1 Testing: 1391 test) + NEXT.md final senkron | Tamamlandı | Araştırma dokümanı + planlama tutarlılığı (2026-02-11) |
| S0.5.3-UX-13 | AKIS A-mark only asset family + favicon refresh (transparent) | Tamamlandı | `akis-mark@2x/@3x` eklendi, compact UI `Logo` srcset güncellendi, favicon seti (`ico+16+32+180+512`) A-mark ile güncellendi (2026-02-11) |
| S0.5.3-UX-14 | Scribe quality gate kalibrasyonu (result + diagnostics + artifact fallback) | Tamamlandı | `ScribeAgent` kalite metrikleri (`targetsProduced/documentsRead/filesProduced`) eklendi; `AgentOrchestrator.completeJob` quality input fallback zinciri güçlendirildi (`result` → `diagnostics` → `job_artifacts`); Job Detail fallback skoru backend ile hizalandı; backend/frontend test+build doğrulandı (2026-02-11) |
| S0.5.3-UX-15 | Live Agent Canvas (streaming execution UI) | Tamamlandı | Scribe/Trace/Proto Logs tabları `LiveAgentCanvas` ile değiştirildi; `PhaseProgressBanner`, `InnerMonologue`, `PhaseActivityCards`, `ExpandingFileTree` eklendi; i18n TR/EN + unit testler + `prefers-reduced-motion` desteği tamamlandı (2026-02-12) |
| S0.5.3-AUTH-2 | Signup mail fail davranışı düzeltmesi (false-success kaldırma) | Tamamlandı | `POST /auth/signup/start` artık verification mail gönderimi başarısızsa `EMAIL_DELIVERY_FAILED` (503) dönüyor ve oluşturulan `pending_verification` kullanıcıyı rollback ediyor; staging kök neden: SMTP auth `535` (2026-02-11) |
| S0.5.3-AGT-8 | Scribe derin analiz iyileştirmesi (deep scan + multi-doc + granular progress) | Tamamlandı | 10 fazlı uygulama: (1) maxTokens pipeline fix (4096→docDepth-aware), (2) Scribe AI character prompt, (3) 4 eksik contract kaydı, (4) recursive repo scan (3 seviye, 150 dosya), (5) auto-detect doc pack, (6-7) documentsRead metrik fix + maxTokens wiring, (8) granular chat events, (9) playbook timings, (10) frontend DocScope/DocDepth UI + i18n (2026-02-12) |
| S0.5.3-AUTH-3 | Jobs user isolation (data leak fix) | Tamamlandı | GET /api/agents/jobs, GET /api/agents/jobs/:id, POST cancel, GET stream — requireAuth + payload->>userId filter; 4 integration test (2026-02-12) |
| S0.5.3-UX-16 | GitHub-style light theme tokens | Tamamlandı | theme.tokens.css light palette (Primer), UI_DESIGN_SYSTEM.md token tablosu, SOCIAL_PLATFORM_VISION.md (M2/M3 vizyon) (2026-02-12) |

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
- [x] `/ready` MCP durumu gösteriyor (`mcp.configured`, `mcp.gatewayReachable`, `mcp.baseUrl`, `mcp.missingEnv`, `mcp.error`)
- [x] `.env.staging` şablonu localhost referansları temizlendi, gerçek sırlar kaldırıldı
- [x] Agent yönlendirme: `/agents/*` kanonik, `/dashboard/scribe|trace|proto` yönlendirme
- [x] OAuth hoşgeldin e-postası: yeni OAuth kullanıcılarına hoşgeldin e-postası gönderimi
- [x] E-posta/şifre kayıt + giriş staging'de tam çalışıyor — Resend.com (`EMAIL_PROVIDER=resend`), akisflow.com domain verified, `noreply@akisflow.com` aktif (2026-02-12)
- [x] OAuth yönlendirmeleri staging alanında çalışıyor — Google + GitHub OAuth aktif (2026-02-10)
- [x] Scribe/Trace/Proto golden path'leri çalışıyor — MCP Gateway always-on, `GITHUB_TOKEN` aktif, 3/3 golden path staging'de `completed` (2026-02-12)
- [x] Hata durumlarında anlaşılır mesaj (AGT-6 standart hata zarfı, 39 birim testi)
- [x] Pilot katılım akışı çalışıyor — WL-2 tamamlandı (2026-02-09)
- [x] Demo senaryosu yazılmış (2026-02-09) — prova bekliyor
- [x] KG kanıt dokümanı mevcut (2026-02-09)

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
| 1 | ~~MCP Gateway Docker image CI build pipeline yok~~ | ~~P1~~ | Tamamlandı (2026-02-10): PR #266 — `mcp-gateway-build.yml` workflow eklendi |
| 2 | ~~SMTP deliverability~~ → Resend.com | ~~P1~~ | Tamamlandı (2026-02-12): Resend.com domain verified, `noreply@akisflow.com` aktif, DKIM+SPF+DMARC geçerli |
| 3 | ~~Staging VM `.env` güncelleme~~ | ~~P0~~ | Tamamlandı (2026-02-10): SMTP, OAuth, encryption aktif — MCP Gateway always-on (profile kaldırıldı), `GITHUB_TOKEN` env gerekli |
| 4 | ~~Onboarding akışı (WL-2)~~ | ~~P2~~ | Tamamlandı (2026-02-09): i18n + job API wiring |

---

## M1 Sonrası Kilometre Taşları

| Kilometre Taşı | Hedef | Odak |
|-----------------|-------|------|
| M2: Stabilizasyon | Mart 2026 | Hata düzeltme, pilot geri bildirim, RAG entegrasyonu, tez taslağı, demo video |
| M3: Mezuniyet | Nisan-Mayıs 2026 | Final rapor, sunum slaytları, savunma provası, teslim paketi |

### M2 — Operasyonel Playbook 4 Pillar MVP + RAG

> **Stratejik Hedef:** [`docs/planning/AKIS_OPERATIONAL_PLAYBOOK.md`](planning/AKIS_OPERATIONAL_PLAYBOOK.md)  
> **Gap Analizi:** [`docs/planning/PLAYBOOK_IMPLEMENTATION_MAP.md`](planning/PLAYBOOK_IMPLEMENTATION_MAP.md) (22 görev, 3 sprint)  
> **RAG Plan:** [`docs/planning/RAG_INTEGRATION_PLAN_M2.md`](planning/RAG_INTEGRATION_PLAN_M2.md)  
> **Prototip:** `~/my_small_llm/` (tamamlandı 2026-02-12)  
> **Cursor promptu:** `.cursor/prompts/rag-integration-m2.md`

#### M2 Sprint 1 (1-14 Mart) — Knowledge + Verification Temelleri

| # | Görev | Pillar | Kapsam | Durum |
|---|-------|--------|--------|-------|
| M2-KI-1 | GroundednessScorer | P1 | Claim extraction + evidence matching + 0-1 score | Başlanmadı |
| M2-KI-2 | ClaimDecomposer | P1 | AI-powered atomic claim extraction | Başlanmadı |
| M2-VF-1 | VerificationGateEngine | P2 | Configurable thresholds + pass/fail/warn | Başlanmadı |
| M2-VF-2 | Scribe Verification Gates | P2 | Citation ≥80%, Hallucination ≤5%, Freshness ≤6mo, Conflict=0 | Başlanmadı |
| M2-VF-6 | Agent Risk Profiles | P2 | P0/P1/P2 → gate strictness config | Başlanmadı |

#### M2 Sprint 2 (10-21 Mart) — Full Pipeline + UI

| # | Görev | Pillar | Kapsam | Durum |
|---|-------|--------|--------|-------|
| M2-KI-3 | ConflictDetector | P1 | Kaynak çakışma tespiti | Başlanmadı |
| M2-KI-4 | Cite-or-Block Gate | P1 | AgentOrchestrator enforcement | Başlanmadı |
| M2-VF-3 | Trace Verification Gates | P2 | Coverage ≥90%, Edge Cases ≥5/mod, Validity ≥95% | Başlanmadı |
| M2-VF-4 | Proto Verification Gates | P2 | Build 100%, Security 0 kritik, Convention ≥90% | Başlanmadı |
| M2-FP-1 | FreshnessScheduler | P3 | Cron → stale knowledge detection | Başlanmadı |
| M2-FP-2 | GitHub Releases Sinyal | P3 | MCP adapter genişletme | Başlanmadı |
| M2-UI-1 | CitationBadge | P4 | verified/unverified/blocked/conflict states | Başlanmadı |
| M2-UI-2 | ConfidenceIndicator | P4 | 0-100 + renk kodlaması | Başlanmadı |
| M2-UI-3 | FreshnessLabel | P4 | Tarih + stale/fresh/unknown | Başlanmadı |
| M2-UI-4 | ConflictWarning | P4 | Turuncu uyarı + kaynak listesi | Başlanmadı |
| M2-UI-6 | i18n Integrity Keys | P4 | TR/EN citation/confidence/freshness | Başlanmadı |

#### M2 Sprint 3 (17-31 Mart) — Entegrasyon + RAG

| # | Görev | Pillar | Kapsam | Durum |
|---|-------|--------|--------|-------|
| M2-KI-5 | RAG Integration | P1 | Python microservice bağlantısı | Başlanmadı |
| M2-VF-5 | Orchestrator Gate | P2 | completeJob'da gate check | Başlanmadı |
| M2-FP-3 | CVE/Security Advisory | P3 | NVD + GitHub Security Advisories | Başlanmadı |
| M2-FP-5 | Knowledge Approval Workflow | P3 | API + UI approval flow | Başlanmadı |
| M2-UI-5 | Inline Provenance | P4 | ArtifactPreview citation + kaynak | Başlanmadı |
| M2-RAG-1 | Python RAG Microservice | — | FastAPI + FAISS + sentence-transformers, Docker | Başlanmadı |
| M2-RAG-2 | Hybrid Search | — | Keyword + vector birleştirme | Başlanmadı |
| M2-RAG-3 | RAG Evaluation UI | — | 5 metrik dashboard + halüsinasyon tespiti | Başlanmadı |
| M2-RAG-4 | Knowledge Base Yönetim UI | — | Doküman upload, indeks, semantic search | Başlanmadı |

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
| [`docs/planning/AKIS_OPERATIONAL_PLAYBOOK.md`](planning/AKIS_OPERATIONAL_PLAYBOOK.md) | Operasyonel hedef doküman (4 Pillar + Moonshot) |
| [`docs/planning/PLAYBOOK_IMPLEMENTATION_MAP.md`](planning/PLAYBOOK_IMPLEMENTATION_MAP.md) | Playbook → codebase gap analizi + aksiyon planı |
| [`docs/planning/WBS_EXPORT_S0.5.xlsx_compatible.md`](planning/WBS_EXPORT_S0.5.xlsx_compatible.md) | WBS tablosu + CSV |
| [`docs/planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md`](planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md) | Araştırma notu |
| [`docs/ROADMAP.md`](ROADMAP.md) | Kilometre taşları genel bakış |
| [`docs/deploy/OCI_STAGING_RUNBOOK.md`](deploy/OCI_STAGING_RUNBOOK.md) | Staging operasyonları |
| [`docs/deploy/STAGING_SMOKE_TEST_CHECKLIST.md`](deploy/STAGING_SMOKE_TEST_CHECKLIST.md) | Smoke test kontrol listesi |
| [`docs/qa/REGRESSION_CHECKLIST.md`](qa/REGRESSION_CHECKLIST.md) | Pilot demo regresyon kontrol listesi |
| [`docs/agents/CONTEXT_PACKS.md`](agents/CONTEXT_PACKS.md) | Bağlam paketleri mimari kararı |
| [`docs/planning/SOCIAL_PLATFORM_VISION.md`](planning/SOCIAL_PLATFORM_VISION.md) | M2/M3 social platform vizyonu (feed, marketplace, showcase) |
| [`docs/planning/RAG_INTEGRATION_PLAN_M2.md`](planning/RAG_INTEGRATION_PLAN_M2.md) | M2 RAG entegrasyon planı (mimari + fazlar) |

---

*Bu dosya S0.5 planının aksiyonel özeti olarak tutulur. Detaylar için kanonik plana başvurun.*
