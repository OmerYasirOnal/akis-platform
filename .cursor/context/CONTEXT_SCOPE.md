# AKIS Platform — Project Scope & Requirements

**Proje Adı:** AKIS
**Bölüm:** Bilgisayar Mühendisliği
**Öğrenci:** Ömer Yasir ÖNAL (2221221562)
**Danışman:** Dr. Öğr. Üyesi Nazlı DOĞAN
**Last Updated:** 2026-01-28 (Gate 4 Context Refresh)

---

## Gate 4 Context Refresh (2026-01-28)

### Current Status Snapshot

**Phase:** Phase 2 (S2.0.1 Cursor-Inspired UI) In Progress (started 2026-01-10)
**Last Completed:** S0.4.6 Scribe Config Dashboard (QA verified 2025-12-27)
**Evidence:** `docs/qa/QA_EVIDENCE_S0.4.6.md`, `docs/qa/QA_EVIDENCE_CURSOR_UI_RELEASE.md`

**Canonical Planning Sources:**
- **Schedule Anchor:** `docs/PROJECT_TRACKING_BASELINE.md` (updated 2026-01-28, Gate 4)
- **Roadmap:** `docs/ROADMAP.md` (updated 2026-01-28, Gate 3)
- **Next Actions:** `docs/NEXT.md` (updated 2026-01-28, Gate 3)
- **Architecture:** `.cursor/context/CONTEXT_ARCHITECTURE.md` (updated 2026-01-28, Gate 4)
- **Documentation Audit:** `docs/DOCS_AUDIT_REPORT.md`

### What Exists Now (Gate 4 Reality)

**✅ Functional & Stable (Evidence-Based):**
- S0.4.1-S0.4.5: Landing, OAuth, theme, dashboard, i18n (All Done)
- S0.4.6: Scribe Config Dashboard Steps 1-5 (Done, QA verified `docs/qa/QA_EVIDENCE_S0.4.6.md`)
- Job FSM: 110/110 tests passing (verified in BASELINE)
- GitHub MCP Adapter: Functional (verified in BASELINE V2 gating table)
- **Authentication:** Multi-step email/password + verification primary, OAuth (Google/GitHub) available
  - Canonical flow: `backend/docs/Auth.md` (JWT-based, email/password primary, OAuth implemented S0.4.2 PR #90)
  - QA verified: `docs/qa/QA_EVIDENCE_S0.4.6.md` (2025-12-27 PASS)
- **Stack:** Fastify + Drizzle + React/Vite (verified `backend/package.json`, `frontend/package.json`)

**🔄 In Progress:**
- S2.0.1: Cursor-Inspired UI + Liquid Neon Layer (QA started 2026-01-10)
  - Cursor-inspired UI components
  - Liquid Neon background layer
  - Responsive design updates

**⚠️ Broken / Unstable:**
- Phase 1 (S1.0.1, S1.0.2): Not Started, milestone PAST DUE (2025-12-25)
  - Scribe basic flow (Orchestrator routing, UI output, reflection)
  - Trace/Proto MVP scaffolds
  - QA sign-off NOT FOUND
- S1.5.1, S1.5.2: Status unknown (no QA evidence)
  - Job logging v1
  - Token/cost tracking
- Atlassian MCP Adapter: Scaffold only (not production-ready)
- V2 RepoOps: BLOCKED (3/7 gating criteria unmet)

**📋 Planned Next:**
- S2.0.2: Scribe Console Enhancement (Not Started)
- Phase 1 completion (requires clarification/replanning)
- Phase 2.5: Early users + usage metrics
- Phase 3: Brand + content + final delivery

### Execution Order (Gate 4 Updated)

**DONE:**
1. ✅ Phase 0.4 (S0.4.1-S0.4.6): Web shell + basic engine + Scribe config (Complete)
2. ✅ S1.5.0: SDTA document final (Ayşe) (Complete)

**CURRENT:**
3. 🔄 Phase 2 (S2.0.1): Cursor-Inspired UI + Liquid Neon Layer (In Progress)

**NEXT:**
4. 📋 S2.0.2: Scribe Console Enhancement
5. ⚠️ Phase 1 backfill: Clarify/replan S1.0.1, S1.0.2 (past due)
6. 📋 Phase 2.5: Early users, usage metrics, pricing, templates
7. 📋 Phase 3: Brand, content, final delivery

**BLOCKED:**
- V2 RepoOps agent: Gated by Phase 1 completion (Scribe/Trace/Proto MVPs, QA sign-off)

---

---

### 1. Problem Tanımı ve Motivasyon

#### 1.1. Giriş
Günümüz yazılım geliştirme süreçleri (“Software Development Life Cycle – SDLC”) artan kod karmaşıklığı, sürekli değişen gereksinimler ve hızlanan pazara çıkış beklentileri nedeniyle ekipler için önemli operasyonel zorluklar barındırmaktadır. Bu projede, yazılım ekiplerinin verimliliğini düşüren ve maliyetlerini artıran üç ana problem alanı tanımlanmıştır.

#### 1.2. Tanımlanan Problemler
1.  **Eskimiş Dokümantasyon**
    Yazılım projelerinde kod tabanı dinamik olarak değişirken, bu değişikliklerin teknik dokümantasyona (örneğin Confluence) yansıtılması manuel bir süreçtir ve sıklıkla gecikmektedir. Bu durum, dokümanların hızla güncelliğini yitirmesine, bilgi güvenilirliğinin azalmasına ve özellikle ekip içinde yeni katılan geliştiricilerin adaptasyon (onboarding) sürecinin uzamasına yol açmaktadır.
2.  **Yüksek Test Otomasyon Maliyeti**
    Kalite güvencesi (Quality Assurance – QA) süreçlerinde, manuel olarak hazırlanan test senaryolarının otomasyon kodlarına (örneğin Cucumber) dönüştürülmesi yoğun zaman ve efor gerektirir. Bu yüksek maliyet, test kapsamının daralmasına, test süresinin uzamasına ve yazılımın güvenilirliğinin azalmasına neden olmaktadır.
3.  **Yavaş MVP Prototipleme**
    Yeni iş fikirleri veya özelliklerin, en temel çalışan prototipe (Minimum Viable Product – MVP) dönüştürülmesi analiz, tasarım, kodlama ve test süreçlerinin manuel yürütülmesi nedeniyle günler hatta haftalar sürebilmektedir. Bu yavaşlık, kurumların pazara yenilikleri hızlı sunma ve geri bildirim alma yeteneğini azaltmakta; sonuç olarak rekabet gücü düşmektedir.

#### 1.3. Motivasyon ve Katkı
Bu projenin motivasyonu; yazılım geliştirme süreçlerindeki tekrarlayan, düşük katma değerli görevlerin otomasyona aktarılmasıyla ekiplerin yaratıcı ve stratejik işlere odaklanabilmelerini sağlamaktır. Akademik ve uygulamalı düzeyde bu çalışma şu katkıları hedefler:
* LLM (Large Language Model) tabanlı otonom ajanların yazılım mühendisliği süreçlerine uygulanması ve bu ajanların “iş şablonları (playbooks)” ile “tasarım/kabul sözleşmeleri (design/acceptance contracts)” biçiminde yapılandırılması.
* Ekiplerin iş akışlarına minimum müdahale ile entegre çalışabilen, modüler ve izlenebilir bir otomasyon platformunun geliştirilmesi.
* Geliştirici verimliliğini artırarak operasyonel maliyetleri düşürmek ve yazılım üretim sürecine “değer ekonomisi” (value economy) bağlamında katkıda bulunmak.

#### 1.4. Amaç (Purpose)
Bu projenin amacı, yazılım geliştirme ekiplerine tekrarlayan görevlerden kurtulma imkânı sağlayarak zamanı geri kazandırmak ve ekiplerin yüksek katma değerli işlere odaklanmasına imkân tanımaktır. Bu doğrultuda, “AKIS Platform” adı verilen ve bir “Yapay Zekâ Ajanı İş Akışı Motoru” (AI Agent Workflow Engine) üzerine kurulu sistem geliştirilerek, dokümantasyon güncelleme, test otomasyonu üretimi ve MVP prototipleme süreçleri otomatikleştirilecektir. Bu sayede hem kalite güvence edilir hem de süreçlerin çevikliği artırılır.

#### 1.5. Hedefler (Goals)
Bu amacı gerçekleştirmek üzere belirlenen somut, ölçülebilir ve izlenebilir hedefler aşağıda sunulmuştur:
* **H1.** Otonom ajanların görev akışlarını koordine eden ve kullanıcıya web tabanlı bir yönetim arayüzü sunan modüler sistem altyapısını geliştirmek.
* **H2.** Yazılım geliştirme sürecindeki mevcut araçları (GitHub, Jira, Confluence) değiştirmeden entegre şekilde çalışabilen güvenli API bağlantılarını sağlamak.
* **H3.** Teknik dokümantasyonları güncelleyebilen (AKIS Scribe), otomasyon test kodları üretebilen (AKIS Trace) ve verilen gereksinimlerden çalışan prototipler çıkarabilen (AKIS Proto) üç otonom ajanı tasarlayıp hayata geçirmek.
* **H4.** Platformun çıktı kalitesini ölçmek için North Star Metric olarak “kazanılan zamân”ı tanımlamak ve alt metriklerle (Doc Accuracy Score, Diff-Coverage, First-Run Green, Time-to-MVP) izleme altyapısını oluşturmak.
* **H5.** Platformun yüksek güvenlik, kalite güvencesi ve yönetişim standartlarına uygunluğunu sağlamak amacıyla Definition of Done (DoD) kontrol listesi, guard-rails ve hata yönetimi süreçlerini yazılım ve belge düzeyinde uygulamak.
* **H6.** Akademik ve endüstriyel paydaşlara sunulmak üzere, çalışan prototip, kullanıcı dokümantasyonu, demo videosu ve akademik raporu teslim etmek.

---

### 2. Proje Kapsamı (Scope)

#### 2.1 Kapsamın Tanımı
Bu proje, yazılım geliştirme süreçlerinde (SDLC) sıklıkla karşılaşılan dokümantasyon güncelleme, test otomasyonu üretimi ve MVP prototipleme gibi görevlerdeki verimsizlikleri azaltmayı amaçlamaktadır. Platform, “AKIS Platform” adıyla modüler olarak tasarlanmış bir Yapay Zekâ Ajanı İş Akışı Motoru (AI Agent Workflow Engine) temelinde geliştirilecektir. Amaç, yazılım ekiplerine zaman kazandırmak ve yüksek katma değerli işler için kapasite açmak olduğundan, işlevsellik, ölçeklenebilirlik ve kullanıcı deneyimi bir arada gözetilecektir.
Bu kapsam ifadesi, projenin ne yapılacağını, kimin için, hangi sınırlar içinde yapılacağını açıklar. Ürün kapsamının yanı sıra, yöntem, teslimatlar, kısıtlar ve başarı kriterleri de bu bölümde yer almalıdır.

> Uygulama ayrıntıları için `.cursor/context/CONTEXT_ARCHITECTURE.md` (mimari/teknoloji), `backend/docs/API_SPEC.md` (Fastify uçları), `backend/docs/AGENT_WORKFLOWS.md` (ajan yaşam döngüsü) ve `docs/UI_DESIGN_SYSTEM.md` + `docs/WEB_INFORMATION_ARCHITECTURE.md` (UI & IA) belgelerini referans alın.

#### 2.2 Kapsama Dahil Olanlar (In-Scope)
Proje kapsamında gerçekleştirilecek başlıca öğeler şunlardır:

**A. Platform Çekirdeği ve Temel Özellikler**
* **A1.** Kullanıcı yönetimi ve kimlik doğrulama: Kullanıcıların sistemde güvenli şekilde oturum açmaları ve profillerini yönetebilmeleri (S0.4.2, S0.4.4 ile tamamlandı - çok adımlı e-posta doğrulamalı kayıt/giriş sistemi).
* **A2.** Web tabanlı yönetim arayüzü: Kullanıcının dashboard üzerinden GitHub deposu listeleme, ajan görev geçmişi görüntüleme ve ayarlarını yapılandırabilme.
* **A3.** Ajan görev izleme modülü: Çalıştırılan ajanların durumları (başarılı, başarısız, beklemede) ve log kayıtlarının erişilebilir olması.
* **A4.** Ajan ayarları paneli: Kullanıcıların, projede yer alan ajanların (Scribe, Trace, Proto) temel parametrelerini (örn. otomasyon onayı, branch stratejisi) belirleyebilmesi.

**A1. Kimlik Doğrulama ve Kullanıcı Kaydı Detayları (S0.4.2 + S0.4.4)**

AKIS Platform, Cursor tarzı bir çok adımlı kimlik doğrulama akışı kullanır. Bu yaklaşım, kullanıcı deneyimini iyileştirmek ve güvenliği artırmak için her adımı ayrı bir ekranda sunar.

**Çok Adımlı Kayıt Akışı (5 Adım):**
1. **Ad + E-posta** (`/signup` → `POST /auth/signup/start`): Kullanıcı adını ve e-posta adresini girer. Sistem 6 haneli doğrulama kodu gönderir.
2. **Şifre Oluştur** (`/signup/password` → `POST /auth/signup/password`): Kullanıcı şifresini belirler (minimum 8 karakter).
3. **E-posta Doğrulama** (`/signup/verify-email` → `POST /auth/verify-email`): 6 haneli kodu girerek e-postasını doğrular. Bu adımda hesap aktif hale gelir ve JWT oturum çerezi oluşturulur.
4. **Beta Hoşgeldin Ekranı** (`/auth/welcome-beta`): Kullanıcıya beta sürümü hakkında bilgi verilir (sadece frontend, backend çağrısı yok).
5. **Veri Paylaşım Onayı** (`/auth/privacy-consent` → `POST /auth/update-preferences`): Kullanıcı isteğe bağlı olarak anonim kullanım verilerinin paylaşımına izin verir.

**Çok Adımlı Giriş Akışı (2 Adım):**
1. **E-posta Kontrolü** (`/login` → `POST /auth/login/start`): Kullanıcı e-posta adresini girer. Sistem hesabın var olup olmadığını ve doğrulanmış olduğunu kontrol eder.
2. **Şifre Girişi** (`/login/password` → `POST /auth/login/complete`): Şifre doğrulanır ve JWT oturum çerezi oluşturulur. Eğer kullanıcı veri paylaşım onayını daha önce vermediyse, `/auth/privacy-consent` sayfasına yönlendirilir.

**Güvenlik ve Oturum Modeli:**
- **JWT Tabanlı Oturumlar:** Stateless JWT tokenları HTTP-only çerezlerde saklanır (7 gün geçerlilik).
- **E-posta Doğrulama:** 6 haneli kodlar 15 dakika geçerlidir ve kullanımdan sonra geçersiz olur.
- **Hız Sınırlaması:** 15 dakikada en fazla 3 doğrulama denemesi (rate limiting).
- **Şifre Güvenliği:** bcrypt ile hash'leme (12 rounds), ARM uyumlu `@node-rs/bcrypt` kullanılır.

**✅ Implemented Features (S0.4.2 + S0.4.4 Done):**
- **OAuth Integration:** Google and GitHub OAuth available (implemented S0.4.2, PR #90)
  - Evidence: `backend/docs/Auth.md` confirms OAuth available
  - Email/password remains primary authentication method
  - OAuth serves as alternative sign-in option

**Future Features (Out of Scope - Post S0.4.x):**
- **Password Reset:** Email-based password reset flow (not yet implemented)
- **Email Change:** Allow users to update email addresses (not yet implemented)
- **Two-Factor Authentication (2FA):** TOTP-based additional security layer (optional, not yet implemented)

**B. Otonom Ajanlar**
* **B1. AKIS Scribe:** Kod değişikliklerini analiz ederek ilgili teknik dokümantasyonu (örneğin Confluence sayfaları) güncelleyen ajan.
* **B2. AKIS Trace:** Jira biletlerinden kabul kriterlerini çıkararak test senaryoları üretip otomasyon test koduna dönüştüren ajan.
* **B3. AKIS Proto:** Bir fikir ya da gereksinim girişinden yola çıkarak, analiz-tasarım-kod-test adımlarını yöneten ve çalışan bir prototip ortaya çıkaran ajan.

**C. Entegrasyonlar**
* **En1.** GitHub API ile entegrasyon: Depolara erişim, commit/PR verilerinin işlenmesi.
* **En2.** Jira API ile entegrasyon: Gereksinim ve bilet verilerinin okunması.
* **En3.** Confluence API ile entegrasyon: Dokümantasyon sayfalarının okunması ve güncellenmesi.

**D. Akademik ve Teknik Dokümantasyon Çıktıları**
* **D1.** Proje Kapsamı ve Gereksinimler Dokümanı (bu belge).
* **D2.** Çözüm Tasarımı ve Teknik Analiz Dokümanı.
* **D3.** Final Raporu, demo videosu ve kullanıcı dokümantasyonu.

#### 2.3 Kapsam Dışı Olanlar (Out-of-Scope)
Projenin başarıyla tamamlanabilmesi ve kaynak/zaman kısıtlarının yönetilebilir olması için aşağıdaki unsurlar bilinçli olarak kapsam dışı bırakılmıştır:
1.  Kullanıcıların kendi ajanlarını kodlama ya
    da “no-code/low-code agent creation wizard” düzenleyebilmesi.
2.  Tam kurumsal yönetim özellikleri: Rol bazlı erişim kontrolü (RBAC), takım yönetimi, on-premise dağıtım alternatifleri.
3.  Slack, Microsoft Teams, VS Code gibi araçlarla derin çift yönlü entegrasyonlar.
4.  Ücretli LLM modelleri ya da yüksek kaynak gerektiren AI servislerinin sürekli kullanılmasına yönelik optimizasyon çalışmaları.
5.  Kod inceleme (code review) veya kod yeniden yapılandırma (refactoring) ajanlarının geliştirilmesi.
6.  Otomatik dağıtım (deployment) veya Docker, CI/CD pipeline entegrasyonlarının tam üretim düzeyinde ele alınması.
7.  Karmaşık SaaS faturalandırma, abonelik yönetimi ya da çok katmanlı abonelik modelleri.

#### 2.4 Kısıtlar ve Varsayımlar (Constraints & Assumptions)
* **Zaman:** Bu proje, ilgili akademik takvime bağlıdır; ilk dönemde demo teslimi için 26 Ocak, final için 22 Mayıs son tarihleri geçerlidir.
* **Kaynak/Ekip:** Ekip iki (2) kişiden oluşmaktadır (Ömer Yasir ÖNAL, Ayşe Serra GÜMÜŞ).
* **Maliyet ve araçlar:** Bütçe sıfıra yakın olup; tüm bulut hizmetleri, API’ler ve araçlar ücretsiz veya öğrenci lisanslarıyla kullanılacaktır.
* **Altyapı:** Platform barındırılması için ücretsiz seviyede kaynaklara sahip bir Oracle (OCI) bulut sunucusu kullanılacaktır; bu durum performans ve optimizasyon açısından kısıtlayıcıdır.
* **Teknoloji seçimi:** Kullanılacak teknolojiler öneri düzeyindedir; ileride değişebilir.
* **Değişim yönetimi:** Proje kapsamı “Kapsama Dahil Olanlar” ile “Kapsam Dışı Olanlar” çerçevesinde netleştirilmiş olup, kapsam kaymasını (scope creep) önlemek amacıyla herhangi bir ek özellik ancak resmi değişim (change-request) süreciyle değerlendirilecektir.

#### 2.5 Kullanılacak Teknolojiler (Technology Stack)

Bu bölüm artık ayrı bir tablo barındırmamaktadır. Teknik stack kararlarının tek doğruluk kaynağı `.cursor/context/CONTEXT_ARCHITECTURE.md` dosyasıdır (SSOT). Lütfen mimari, teknoloji seçimi veya yapı klasörleriyle ilgili her türlü soruda söz konusu dokümana başvurun.

#### 2.6 Beklenen Çıktılar (Deliverables)
1.  Web tabanlı çalışan bir prototip: Platformun temel iş akışlarını (ajan yönetimi, entegrasyon, ajanın işlevselliği) gerçekleştirebilir olması.
2.  Üç temel ajan (Scribe, Trace, Proto) için minimum işlevsellik: Dokümantasyon güncelleme, test üretimi ve prototip çıkarımı.
3.  Demo sunumu ve kullanıcı dokümantasyonu: Platformun nasıl kullanılacağına dair rehber ve canlı gösterim.
4.  Teknik dokümantasyon seti: Sistem mimarisi, API detayları, ajan sözleşmeleri ve metodoloji açıklamaları.
