# AKIS Pipeline — Use Case Document

> Bu dokuman AKIS pipeline sistemindeki tum kullanici senaryolarini, mevcut implementasyon durumlarini ve tez iliskilerini tanimlar.

---

## UC-001: Yeni Fikir ile Pipeline Baslatma (End-to-End)

**Aktor:** Kullanici (yazilim gelistirici)
**On Kosul:** Kullanici giris yapmis olmali. Backend ve frontend calisir durumda.
**Temel Akis:**
1. Kullanici `/pipeline` sayfasina gider
2. Serbest metin olarak proje fikrini yazar ve gonderir
3. Sistem `POST /api/pipelines` endpoint'ine istek atar
4. PipelineOrchestrator yeni pipeline olusturur (stage: `scribe_clarifying`)
5. Scribe fikri analiz eder, gerekirse aciklama sorulari sorar
6. Kullanici sorulara yanit verir (max 3 tur)
7. Scribe structured spec uretir (stage: `awaiting_approval`)
8. Kullanici spec'i inceler ve onaylar
9. Proto onaylanan spec'ten MVP scaffold uretir ve GitHub'a push eder (stage: `proto_building`)
10. Trace Proto'nun push ettigi branch'teki kodu okur ve Playwright testleri yazar (stage: `trace_testing`)
11. Pipeline tamamlanir (stage: `completed`)

**Alternatif Akislar:**
- 6a. Kullanici spec'i reddeder → Scribe geri bildirimle yeniden uretir
- 9a. Proto basarisiz → stage: `failed`, kullanici retry yapabilir
- 10a. Trace basarisiz → stage: `completed_partial` (kod teslim edilir, testler atlanir)
- 10b. Kullanici Trace'i atlar → `POST /api/pipelines/:id/skip-trace`

**Son Kosul:** Pipeline `completed` veya `completed_partial` durumunda. Kullanici repo URL ve test sonuclarini gorur.
**Ilgili Agent:** Scribe + Proto + Trace (sequential)
**Tez Iliskisi:** Tam dogrulama zinciri: Scribe→Insan onayi (human-in-the-loop), Proto→Trace (automated verification), Trace→Otomatik test calistirma. Knowledge integrity'nin 3 katmanli dogrulamasi.
**Durum:** ✅ Mevcut — Tum pipeline akisi calisiyor. `GitHubRESTAdapter` ile dogrudan GitHub REST API kullanilir (MCP Gateway bagimliligina gerek yok). `GITHUB_TOKEN` set ise gercek push, yoksa stub. Pipeline kodu `backend/src/pipeline/` altinda konsolide edildi.

---

## UC-002: Scribe Spec Uretimi ve Kullanici Onayi

**Aktor:** Kullanici
**On Kosul:** Pipeline baslatilmis, stage: `scribe_clarifying`
**Temel Akis:**
1. Scribe kullanicinin fikrini alir ve analiz eder
2. Fikir yeterince net degilse aciklama sorulari sorar (max 3 tur)
3. Kullanici sorulara chat uzerinden yanit verir
4. Scribe tum bilgiyi toplayinca structured spec uretir
5. Spec sunu icerir: Problem Statement, User Stories, Acceptance Criteria, Technical Constraints, Out of Scope
6. Frontend `SpecPreviewCard` ile spec'i gosterir
7. Kullanici "Onayla" veya "Reddet" butonuna tiklar
8. Onaylanirsa pipeline `awaiting_approval` → `proto_building`'e gecer

**Alternatif Akislar:**
- 2a. Fikir cok net → Scribe soru sormadan dogrudan spec uretir
- 4a. AI yaniti JSON parse edilemez → 2 retry, sonra `failed`
- 7a. Kullanici reddederse → UC-003'e dallanir

**Son Kosul:** Structured spec uretilmis ve kullanici tarafindan onaylanmis.
**Ilgili Agent:** Scribe
**Tez Iliskisi:** Human-in-the-loop dogrulama. AI uretiminin insan tarafindan kontrol edilmesi — knowledge integrity'nin temel prensibi.
**Durum:** ✅ Mevcut — Tamamen calisiyor. Multi-round clarification, Zod validation, JSON extraction, spec normalization, confidence scoring (%95-98) hepsi aktif. AI provider dependency injection ile calisir (Anthropic claude-sonnet-4-6).

---

## UC-003: Spec Duzenleme ve Yeniden Uretim

**Aktor:** Kullanici
**On Kosul:** Scribe spec uretmis, stage: `awaiting_approval`
**Temel Akis:**
1. Kullanici spec'i inceler ve eksik/yanlis buldugu noktalari belirler
2. "Reddet" butonuna tiklar ve geri bildirim yazar
3. `POST /api/pipelines/:id/reject` endpoint'i cagirilir
4. Orchestrator Scribe'in `regenerateSpec(feedback)` metodunu cagirirS
5. Scribe geri bildirimi conversation history'ye ekler ve spec'i yeniden uretir
6. Yeni spec kullaniciya gosterilir
7. Kullanici yeni spec'i onaylar veya tekrar reddeder

**Alternatif Akislar:**
- 5a. Yeniden uretim basarisiz → stage: `failed`
- 7a. Kullanici birden fazla kez reddedebilir (limit yok)

**Son Kosul:** Kullanici memnun oldugu bir spec ile pipeline devam eder.
**Ilgili Agent:** Scribe
**Tez Iliskisi:** Iteratif dogrulama — insan geri bildirimi ile AI ciktisinin iyilestirilmesi. Knowledge integrity'de "correction loop" kavrami.
**Durum:** ✅ Mevcut — Rejection endpoint (`POST /reject`), Scribe `regenerateSpec(feedback)` metodu ve conversation history entegrasyonu calisiyor. `extractPreviousQA` fonksiyonu artik `spec_rejected` mesajlarini da AI prompt'una dahil ediyor (fix: bu session'da duzeltildi). Geri bildirim AI'a `[KULLANICI REDDETTi]` formatinda iletiliyor.

---

## UC-004: Proto MVP Scaffold Uretimi ve GitHub Push

**Aktor:** Sistem (otomatik, kullanici onayi sonrasi tetiklenir)
**On Kosul:** Spec onaylanmis, repo adi ve gorunurluk secilmis, stage: `proto_building`
**Temel Akis:**
1. Orchestrator Proto agent'a onaylanan spec'i ve repo bilgisini gecirir
2. Proto AI'dan scaffold dosyalari uretir (dosya listesi + icerik)
3. Proto GitHub'da repo olusturur (veya mevcut repo'ya branch acar)
4. Branch adi: `proto/scaffold-{timestamp}`
5. Her dosya tek tek commit edilir
6. PR acilir (basarisiz olursa kod zaten push edilmis, non-fatal)
7. Output: `{ ok, branch, repo, repoUrl, files[], prUrl?, setupCommands[] }`

**Alternatif Akislar:**
- 2a. AI yaniti truncated → JSON repair mekanizmasi devreye girer (bracket-closing)
- 3a. Repo zaten var → hata yakalanir, mevcut repo'ya branch acilir
- 3b. GitHub token yok/gecersiz → `GITHUB_NOT_CONNECTED` hatasi, kullaniciya bildirilir
- 5a. Commit basarisiz → 3 retry (backoff: 5s, 15s, 30s)
- dryRun=true → GitHub islemleri atlanir, sadece dosya plani donulur

**Son Kosul:** GitHub'da yeni branch olusturulmus, scaffold dosyalari push edilmis, output'ta gercek URL donulmus.
**Ilgili Agent:** Proto
**Tez Iliskisi:** Agent verification framework — Proto'nun urettigi kod Trace tarafindan dogrulanacak. Uretilen artifact'in traceability'si.
**Durum:** ✅ Mevcut — AI scaffold uretimi tamamen calisiyor (dosya listesi, icerik, setup komutlari, JSON repair, truncation handling). `server.app.ts`'de `GITHUB_TOKEN` varsa `GitHubRESTAdapter` ile gercek push yapilir (`createRepository`, `createBranch`, `commitFile`, `createPR`). Yoksa stub inject edilir. MCP Gateway bagimliligi kaldirildi, dogrudan GitHub REST API v3 kullaniliyor.

---

## UC-005: Trace Test Yazimi (Proto Output'undan)

**Aktor:** Sistem (otomatik, Proto basarili olduktan sonra tetiklenir)
**On Kosul:** Proto basarili, output'ta gercek repo/branch bilgisi var, stage: `trace_testing`
**Temel Akis:**
1. Orchestrator Trace agent'a Proto output'undan `{ repoOwner, repo, branch }` gecirir
2. Trace GitHub API ile branch'teki dosyalari listeler
3. Kaynak dosyalari filtreler (.ts, .tsx, .js, .jsx, .vue, .svelte, .css, .html)
4. Her dosyanin icerigini okur
5. AI'dan Playwright e2e testleri yazar (Page Object Model pattern)
6. Her acceptance criteria icin coverage matrix olusturur (ac-1 → test dosyasi eslesmesi)
7. Test dosyalarini yeni branch'e push eder (`trace/tests-{timestamp}`)
8. PR acar (non-fatal)
9. Output: `{ ok, testFiles[], coverageMatrix, testSummary, branch?, prUrl? }`

**Alternatif Akislar:**
- 2a. Dosya listesi bos → `TRACE_EMPTY_CODEBASE` hatasi
- 5a. AI test uretimi basarisiz → 2 retry
- 6a. Spec yoksa acceptance criteria mapping atlanir
- Trace basarisiz → pipeline `completed_partial`'e duser

**Son Kosul:** Proto'nun urettigi koda uygun Playwright testleri yazilmis, coverage matrix elde edilmis.
**Ilgili Agent:** Trace
**Tez Iliskisi:** Automated verification — AI uretilen kodun AI tarafindan dogrulanmasi. Knowledge integrity'nin "makineden makineye dogrulama" katmani. Coverage matrix tez raporuna dahil edilecek metrik.
**Durum:** ✅ Mevcut — Trace agent kodu tamamen yazilmis: `readCodebase()` (listFiles + getFileContent + filtering), `generateTests()` (AI + retry + JSON parse), `pushTestFiles()` (branch + commit + PR), coverage matrix olusturma. Orchestrator handoff dogru: `Proto.output.branch → Trace.input.branch`. `GitHubRESTAdapter` ile gercek GitHub islemleri yapilabilir (`GITHUB_TOKEN` gerekli). Stub modunda `listFiles()` bos donuyor → `TRACE_EMPTY_CODEBASE` (beklenen davranis).

---

## UC-006: Pipeline Durumunu Goruntuleme ve Takip

**Aktor:** Kullanici
**On Kosul:** En az bir pipeline baslatilmis
**Temel Akis:**
1. Kullanici `/pipeline` sayfasina gider
2. Frontend `GET /api/pipelines` ile gecmis pipeline'lari yukler (son 10)
3. Kullanici bir pipeline secer veya aktif pipeline otomatik yuklenir
4. `PipelineProgress` bileseninde hangi asamada oldugu gosterilir
5. `ChatMessage` bilesenlerinde conversation history gosterilir
6. Aktif asamalarda (clarifying, generating, building, testing) frontend 2 saniyede bir poll yapar
7. Stage degisikliklerinde UI otomatik guncellenir
8. Terminal durumlarda (completed, failed, cancelled) polling durur

**Alternatif Akislar:**
- 2a. Hic pipeline yoksa → "Welcome" ekrani gosterilir
- 6a. Network hatasi → sessizce retry (polling devam eder)

**Son Kosul:** Kullanici pipeline'in guncel durumunu ve gecmisini gorebilir.
**Ilgili Agent:** Hepsi (goruntuleme)
**Tez Iliskisi:** UI/UX integrity layer — kullaniciya seffaf durum bilgisi, confidence score'lari ve verification gostergeleri sunma.
**Durum:** ✅ Mevcut — Tamamen calisiyor. 2s polling, pipeline history dropdown, progress bar, chat mesajlari, spec preview, agent status indicator, completion/error ekranlari hepsi aktif.

---

## UC-007: Basarisiz Adimi Tekrar Deneme

**Aktor:** Kullanici
**On Kosul:** Pipeline `failed` durumunda
**Temel Akis:**
1. Kullanici hata detaylarini `PipelineErrorCard`'da gorur
2. Hata mesaji Turkce ve anlasilir: kod, mesaj, teknik detay, kurtarma onerisi
3. Kullanici "Tekrar Dene" butonuna tiklar
4. `POST /api/pipelines/:id/retry` endpoint'i cagirilir
5. Orchestrator hangi asamanin basarisiz oldugunu belirler:
   - `protoOutput` var ama `traceOutput` yok → Trace'i retry
   - `approvedSpec` var ama `protoOutput` yok → Proto'yu retry
   - Hicbiri yok → Scribe'i retry
6. Belirlenen asama arka planda yeniden calistirilir
7. Basarili olursa pipeline normal akisa devam eder

**Alternatif Akislar:**
- 6a. Retry da basarisiz → tekrar `failed`, kullanici yine retry yapabilir (max 3 deneme dahili)
- Kullanici "Yeni Pipeline Baslat" secebilir (mevcut pipeline cancelled olur)

**Son Kosul:** Basarisiz asama basariyla tamamlanmis ve pipeline devam ediyor.
**Ilgili Agent:** Basarisiz olan agent (Scribe/Proto/Trace)
**Tez Iliskisi:** Fault tolerance ve recovery — agent verification framework'unda hata yonetimi ve otomatik kurtarma mekanizmasi.
**Durum:** ✅ Mevcut — Retry logic orchestrator'da implementate. Stage detection, backoff (5s, 15s, 30s), max 3 retry, hata kodlari (`PipelineErrors.ts`'de 19 farkli kod) hepsi aktif. UI'da retry butonu ve hata detaylari gosteriliyor.

---

## UC-008: Pipeline Iptal Etme

**Aktor:** Kullanici
**On Kosul:** Pipeline terminal olmayan bir durumda (scribe_clarifying, scribe_generating, awaiting_approval, proto_building, trace_testing)
**Temel Akis:**
1. Kullanici iptal etmek istedigi pipeline'i secer
2. `DELETE /api/pipelines/:id` endpoint'ini cagiran bir butona tiklar
3. Orchestrator `cancelPipeline()` metodunu cagiriir
4. Pipeline stage'i `cancelled` olarak guncellenir
5. Arka planda calisan islemler (varsa) tamamlanir ama sonuclari yok sayilir
6. UI iptal durumunu gosterir

**Alternatif Akislar:**
- 2a. Pipeline zaten terminal durumda (completed, cancelled) → hata: "Cannot cancel"
- Kullanici iptal sonrasi yeni pipeline baslat butonunu kullanabilir

**Son Kosul:** Pipeline `cancelled` durumunda, kullanici yeni pipeline baslatabilir.
**Ilgili Agent:** Hicbiri (orchestrator islemi)
**Tez Iliskisi:** Kullanici kontrolu — human-in-the-loop prensibinin negatif yonu: kullanici islemi durdurmak istediginde sistem buna saygi gostermeli.
**Durum:** ✅ Mevcut — `cancelPipeline()` orchestrator'da implementate. Stage validation, UI'da iptal butonu ve "Yeni Baslat" secenegi aktif.

---

## Ozet Tablosu

| UC | Baslik | Durum | Not |
|----|--------|-------|-----|
| UC-001 | End-to-end pipeline | ✅ Mevcut | GitHubRESTAdapter ile tam calisir (GITHUB_TOKEN gerekli) |
| UC-002 | Scribe spec + onay | ✅ Mevcut | — |
| UC-003 | Spec duzenleme | ✅ Mevcut | — |
| UC-004 | Proto scaffold + push | ✅ Mevcut | GitHubRESTAdapter ile dogrudan GitHub REST API v3 |
| UC-005 | Trace test yazimi | ✅ Mevcut | GITHUB_TOKEN yoksa stub modda TRACE_EMPTY_CODEBASE |
| UC-006 | Durum goruntuleme | ✅ Mevcut | 2s polling, dashboard entegrasyonu |
| UC-007 | Retry | ✅ Mevcut | — |
| UC-008 | Iptal | ✅ Mevcut | — |
