# AKIS Pipeline Migration — Complete Implementation Plan
# Bu doküman Claude Code'a doğrudan verilecek tek dokümandır.

---

## SENİN GÖREVİN

Bu doküman AKIS adlı AI agent pipeline platformunun yeni pipeline mimarisini tanımlar. Hedefiniz Scribe → Proto → Trace sıralı pipeline'ını kurmak.

### Başlamadan Önce Yap:
1. `.claude/CLAUDE.md` dosyasını oku — eğer yoksa veya eskiyse bu dokümandaki CLAUDE.md içeriğiyle güncelle
2. `backend/src/agents/` altındaki 3 mevcut agent'ı oku (ScribeAgent.ts, ProtoAgent.ts, TraceAgent.ts) — sadece referans amaçlı
3. `backend/src/core/` altındaki orchestrator, contracts, state, services yapısını oku
4. `frontend/src/pages/dashboard/agents/` sayfalarını oku
5. `docs/` altındaki tüm dokümanları tara
6. Projedeki mevcut teknolojileri, import path'lerini, auth yapısını, AI service'i anla

### Sonra:
7. Bu dokümandaki fazları sırayla uygula
8. Her faz sonunda bana durum raporu ver ve onay iste
9. Tüm yeni geliştirme `pipeline/` dizininde yapılacak

### Mutlak Kurallar:
- `.env` dosyalarına DOKUNMA — hiçbir `.env`, `.env.local` dosyasını değiştirme, silme, oluşturma
- AKIS renkleri ve logoları değişmesin — mevcut brand token'larını koru
- Mevcut `backend/src/` ve `frontend/src/` yapısına DOKUNMA — sadece import için referans al
- Mevcut kodu silme — eski dosyalar `.legacy.ts` olarak yedeklenir
- `temperature=0` tüm agent prompt'larında
- Model-agnostik prompt'lar yaz — model-specific syntax kullanma
- Her agent'ın PLAYBOOK.md ve prompt template dosyaları olacak
- Her fazda test yaz

---

## BÖLÜM 1 — MİMARİ KARARLAR

### 1.1 — Ayrı Dizinde Geliştirme

Mevcut yapıya dokunulmayacak. Tüm pipeline geliştirmesi `pipeline/` dizininde yapılacak. Mevcut yapıdan auth, db, AI service, MCP adapters import edilecek.

```
devagents/
  backend/src/              ← DOKUNMA (referans amaçlı)
  frontend/src/             ← DOKUNMA (referans amaçlı)
  pipeline/                 ← YENİ — tüm geliştirme burada
    backend/
      agents/
        scribe/
          PLAYBOOK.md
          prompts/clarification.md
          prompts/spec-generation.md
          schemas/spec-schema.json
          ScribeAgent.ts
          SpecContract.ts
        proto/
          PLAYBOOK.md
          prompts/scaffold.md
          ProtoAgent.ts
        trace/
          PLAYBOOK.md
          prompts/test-generation.md
          TraceAgent.ts
      core/
        orchestrator/PipelineOrchestrator.ts
        contracts/PipelineTypes.ts
        contracts/PipelineSchemas.ts
      api/
        pipeline.routes.ts
      db/
        migrations/pipeline-table.ts
    frontend/
      pages/PipelinePage.tsx
      components/
        PipelineProgress.tsx
        ChatMessage.tsx
        SpecPreviewCard.tsx
        FileExplorer.tsx
        AgentStatusIndicator.tsx
        CoverageMatrix.tsx
        CompletionScreen.tsx
        ErrorBoundary.tsx
    docs/
      PIPELINE_CONTRACT.md
      BRAND.md
  .claude/CLAUDE.md
```

### 1.2 — Sadece Senaryo A (Sıfırdan Proje)

Bu iterasyonda SADECE "sıfırdan proje üretme" senaryosu implement edilecek. Mevcut repo üzerine feature ekleme (Senaryo B) sonraki iterasyona bırakıldı. Interface'ler buna uygun olarak `existingRepo?` opsiyonel alanı içerecek ama implement edilmeyecek.

### 1.3 — AI Provider — Sabit, .env'den

Geliştirme sürecinde UI'da model seçimi YOK. `.env`'deki değer okunur.

```
AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-4-6
AI_API_KEY=sk-ant-xxx
```

Tüm agent'lar aynı provider ve modeli kullanır. Prompt template'ler model-agnostik yazılır.

### 1.4 — RAG Sistemi

Bu iterasyonda RAG sistemi KURULMAYACAK. Senaryo A'da agent'ların ihtiyaç duyduğu tüm bilgi:
- Scribe: kullanıcıdan geliyor (chat)
- Proto: spec'ten geliyor (Scribe output)
- Trace: GitHub'dan geliyor (Proto'nun push ettiği kod)

RAG, Senaryo B'de (mevcut repo üzerine feature) gerekli olacak — o zaman implement edilecek.

---

## BÖLÜM 2 — PIPELINE KULLANIM SENARYOLARI VE EDGE CASE'LER

### 2.1 — Happy Path (Tam Başarılı Akış)

```
ADIM 1: BAŞLANGIÇ
├─ Kullanıcı pipeline sayfasına gelir
├─ Textarea'ya fikrini yazar: "React ile todo app istiyorum, Google login olsun"
├─ "Başlat" butonuna basar
└─ Pipeline oluşturulur, stage: scribe_clarifying

ADIM 2: SCRIBE — SORU SORMA
├─ Scribe fikri analiz eder
├─ Eksik bilgiler varsa max 3 tur soru sorar:
│   "1. Veritabanı tercihiniz var mı?"
│   "2. İlk versiyonda mutlaka olması gereken özellikler neler?"
├─ Kullanıcı cevaplar
├─ Yeterli bilgi toplandığında stage: scribe_generating
└─ NOT: Fikir çok net ise soru sormadan direkt spec üretebilir

ADIM 3: SCRIBE — SPEC ÜRETİMİ
├─ Scribe yapılandırılmış spec üretir
├─ Stage: awaiting_approval
├─ UI'da SpecPreviewCard gösterilir:
│   ┌──────────────────────────────────────┐
│   │ 📋 Todo App with Google Auth          │
│   │ Problem: ...                          │
│   │ 3 User Stories | 5 Acceptance Criteria│
│   │ Stack: React + Supabase              │
│   │                                       │
│   │ [Detayları Gör ▼]                    │
│   │ [✅ Onayla] [✏️ Düzenle] [🔄 Yeniden]│
│   └──────────────────────────────────────┘
├─ Kullanıcı "Detayları Gör" ile tüm spec'i okuyabilir
├─ Kullanıcı "Düzenle" ile spec'i inline düzenleyebilir
├─ Kullanıcı "Yeniden Üret" ile feedback yazıp tekrar ürettirebilir
└─ Kullanıcı "Onayla" basarsa → ADIM 4'e geçilir

ADIM 4: PROTO — REPO OLUŞTURMA VE KOD ÜRETİMİ
├─ Onay sonrası kullanıcıya sorulur:
│   "Repo adı ne olsun?" [input] + "Public/Private?" [toggle]
├─ Kullanıcı cevaplar
├─ Stage: proto_building
├─ UI'da progress gösterilir:
│   ⚡ Proto: Kod üretiliyor...
│   [████████░░░░░░] Dosyalar oluşturuluyor...
├─ Proto scaffold üretir, GitHub'da repo oluşturur, kodu push eder, PR açar
├─ Tamamlandığında FileExplorer gösterilir:
│   ┌──────────────────────────────┐
│   │ 📁 todo-app                   │
│   │  ├── 📁 src                   │
│   │  │  ├── App.tsx               │
│   │  │  ├── 📁 components         │
│   │  │  └── 📁 lib                │
│   │  ├── package.json             │
│   │  └── README.md                │
│   └──────────────────────────────┘
│   Dosyaya tıkla → içerik modal'da açılır
└─ Stage: trace_testing (otomatik geçiş)

ADIM 5: TRACE — TEST YAZIMI
├─ Stage: trace_testing
├─ Trace Proto'nun push ettiği kodu GitHub'dan okur
├─ UI'da progress gösterilir:
│   🧪 Trace: Testler yazılıyor...
│   [████████████░░] Kod analiz ediliyor...
├─ Playwright e2e testleri üretir
├─ Coverage matrix oluşturur
├─ Tamamlandığında CoverageMatrix gösterilir:
│   ┌─────────────────────────────┬───────────┐
│   │ Acceptance Criteria          │ Test      │
│   ├─────────────────────────────┼───────────┤
│   │ ✅ Google ile login          │ auth.spec │
│   │ ✅ Task oluşturma            │ crud.spec │
│   │ ✅ Task silme                │ crud.spec │
│   │ ⚠️ Task filtreleme          │ —         │
│   └─────────────────────────────┴───────────┘
│   Coverage: 4/5 (%80)
└─ Stage: completed

ADIM 6: TAMAMLANDI — CompletionScreen
├─ Stage: completed
├─ UI'da CompletionScreen gösterilir:
│   ┌──────────────────────────────────────────┐
│   │ ✅ Pipeline Tamamlandı!                   │
│   │                                           │
│   │ 📊 Özet                                   │
│   │ • Spec: 3 user story, 5 acceptance crit.  │
│   │ • Kod: 12 dosya, 847 satır               │
│   │ • Test: 8 test, %80 coverage              │
│   │ • Süre: 2dk 34sn                          │
│   │ • Maliyet: ~$0.52                         │
│   │                                           │
│   │ 🔗 Bağlantılar                            │
│   │ [GitHub Repo] [Pull Request]              │
│   │                                           │
│   │ 💻 Projeyi Çalıştır                       │
│   │ ┌──────────────────────────────────────┐  │
│   │ │ git clone https://github.com/user/.. │  │
│   │ │ cd todo-app                          │  │
│   │ │ npm install                          │  │
│   │ │ npm run dev                          │  │
│   │ └──────────────────────────────────────┘  │
│   │ [📋 Kopyala]                              │
│   │                                           │
│   │ 📁 Dosyalar  📋 Spec  🧪 Testler         │
│   │ [tab content — FileExplorer/Spec/Tests]   │
│   │                                           │
│   │ Sonraki Adımlar                           │
│   │ [🚀 Yeni Pipeline Başlat]                 │
│   └──────────────────────────────────────────┘
│
├─ Kullanıcı tab'lar arasında geçiş yapabilir:
│   • Dosyalar tab: FileExplorer (dosyalara tıklayıp içerik görebilir)
│   • Spec tab: Tam structured spec dokümanı
│   • Testler tab: Test dosyaları + coverage matrix
│
├─ "Projeyi Çalıştır" bölümü:
│   Proto'nun ürettiği projeye özel komutlar gösterilir
│   Tek tıkla kopyalanabilir clipboard'a
│
└─ "Yeni Pipeline Başlat" → Temiz bir pipeline sayfasına yönlendirir
```

### 2.2 — Hata Senaryoları ve Error Handling

Her aşamada oluşabilecek hatalar ve kullanıcıya gösterilecek mesajlar:

#### SCRIBE HATALARI

```
HATA: AI_RATE_LIMITED
├─ Durum: AI provider rate limit'e takıldı
├─ Kullanıcıya: "AI servisi şu an yoğun. Birkaç saniye içinde otomatik olarak tekrar denenecek..."
├─ Davranış: 3 kez retry (5sn, 15sn, 30sn), sonra failed
└─ Recovery: "Tekrar Dene" butonu

HATA: AI_PROVIDER_ERROR
├─ Durum: AI servisi genel hata döndü
├─ Kullanıcıya: "AI servisi geçici bir hata yaşıyor. Lütfen tekrar deneyin."
├─ Davranış: 2 kez retry, sonra failed
└─ Recovery: "Tekrar Dene" butonu

HATA: AI_INVALID_RESPONSE
├─ Durum: AI geçerli JSON/spec formatında yanıt üretmedi
├─ Kullanıcıya: "Spec oluşturulurken beklenmeyen bir yanıt alındı. Tekrar deneniyor..."
├─ Davranış: 3 kez retry (farklı prompt varyasyonu ile), sonra failed
└─ Recovery: "Tekrar Dene" butonu — fikri yeniden ifade etme önerisiyle

HATA: SCRIBE_EMPTY_IDEA
├─ Durum: Kullanıcı boş veya çok kısa fikir yazdı
├─ Kullanıcıya: "Lütfen fikrinizi biraz daha detaylı açıklayın. Örneğin: 'React ile bir todo uygulaması istiyorum, kullanıcılar Google ile giriş yapabilsin.'"
├─ Davranış: Pipeline başlamaz, input validation hatası
└─ Recovery: Kullanıcı daha detaylı yazar

HATA: SCRIBE_SPEC_VALIDATION_FAILED
├─ Durum: Üretilen spec minimum gereksinimleri karşılamıyor (0 user story vb.)
├─ Kullanıcıya: "Spec oluşturuldu ama yeterli detay içermiyor. Daha fazla bilgi vererek tekrar deneyelim."
├─ Davranış: Scribe'a otomatik feedback gönderilir, tekrar üretir
└─ Recovery: Max 2 tekrar, sonra mevcut haliyle kullanıcıya gösterilir
```

#### PROTO HATALARI

```
HATA: GITHUB_NOT_CONNECTED
├─ Durum: Kullanıcının GitHub OAuth bağlantısı yok
├─ Kullanıcıya: "GitHub hesabınız bağlı değil. Devam etmek için GitHub hesabınızı bağlayın."
├─ Davranış: Pipeline pause — awaiting_approval stage'de kalır
├─ UI: [GitHub Bağla] butonu gösterilir
└─ Recovery: GitHub bağlandıktan sonra "Devam Et" butonu aktif olur

HATA: GITHUB_REPO_EXISTS
├─ Durum: Aynı isimde repo zaten var
├─ Kullanıcıya: "'{repoName}' adında bir repo zaten mevcut. Farklı bir isim seçin."
├─ Davranış: Pipeline pause — kullanıcıdan yeni isim istenir
├─ UI: Repo adı input'u tekrar gösterilir
└─ Recovery: Kullanıcı farklı isim girer

HATA: GITHUB_PERMISSION_DENIED
├─ Durum: OAuth token'ın repo oluşturma izni yok
├─ Kullanıcıya: "GitHub izinleriniz repo oluşturmaya yetmiyor. Lütfen GitHub bağlantınızı yenileyip 'repo' iznini verin."
├─ UI: [GitHub İzinlerini Güncelle] butonu
└─ Recovery: Re-auth sonrası devam

HATA: GITHUB_API_ERROR
├─ Durum: GitHub API genel hata (500, timeout vb.)
├─ Kullanıcıya: "GitHub'a bağlanırken bir sorun oluştu. Lütfen birkaç dakika sonra tekrar deneyin."
├─ Davranış: 3 kez retry, sonra failed
└─ Recovery: "Tekrar Dene" butonu

HATA: PROTO_SCAFFOLD_GENERATION_FAILED
├─ Durum: AI scaffold üretemedi veya geçersiz kod üretti
├─ Kullanıcıya: "Kod üretilirken bir sorun oluştu. Spec'i basitleştirmeyi deneyebilirsiniz."
├─ Davranış: 2 kez retry, sonra failed
└─ Recovery: "Tekrar Dene" veya "Spec'e Dön ve Düzenle" butonları

HATA: PROTO_PUSH_FAILED
├─ Durum: Kod üretildi ama GitHub'a push edilemedi
├─ Kullanıcıya: "Kod başarıyla üretildi ama GitHub'a yüklenirken sorun oluştu."
├─ Davranış: Retry push (3 kez). Kod kaybolmaz — bellekte tutulur.
├─ UI: Dosyalar FileExplorer'da gösterilir (push olmasa bile)
└─ Recovery: "Push'u Tekrar Dene" butonu
```

#### TRACE HATALARI

```
HATA: TRACE_CODE_READ_FAILED
├─ Durum: Proto'nun push ettiği kod GitHub'dan okunamadı
├─ Kullanıcıya: "Üretilen kod GitHub'dan okunamadı. Tekrar deneniyor..."
├─ Davranış: 3 kez retry, sonra failed
└─ Recovery: "Tekrar Dene" butonu

HATA: TRACE_EMPTY_CODEBASE
├─ Durum: Branch'te okunabilir kaynak kod dosyası bulunamadı
├─ Kullanıcıya: "Üretilen projede test yazılabilecek kaynak kod bulunamadı."
├─ Davranış: Failed
└─ Recovery: "Spec'e Dön" — muhtemelen Proto düzgün scaffold üretmemiş

HATA: TRACE_TEST_GENERATION_FAILED
├─ Durum: AI test üretemedi
├─ Kullanıcıya: "Test dosyaları oluşturulurken sorun oluştu. Tekrar deneniyor..."
├─ Davranış: 2 kez retry, sonra failed
└─ Recovery: "Tekrar Dene" veya "Pipeline'ı Tamamla (Testsiz)" butonları
```

#### GENEL PIPELINE HATALARI

```
HATA: AI_KEY_MISSING
├─ Durum: .env'de AI API key tanımlı değil
├─ Kullanıcıya: "AI servisi yapılandırılmamış. Sistem yöneticisiyle iletişime geçin."
├─ Davranış: Pipeline başlamaz
└─ Recovery: .env'ye key eklenmeli (dev mode)

HATA: PIPELINE_TIMEOUT
├─ Durum: Herhangi bir stage 5 dakikadan uzun sürdü
├─ Kullanıcıya: "İşlem beklenenden uzun sürdü. Pipeline duraklatıldı."
├─ Davranış: Stage failed olarak işaretlenir
└─ Recovery: "Kaldığı Yerden Devam Et" butonu (aynı stage'i tekrar çalıştırır)

HATA: PIPELINE_CANCELLED
├─ Durum: Kullanıcı pipeline'ı iptal etti
├─ Kullanıcıya: "Pipeline iptal edildi."
├─ Davranış: Mevcut stage durdurulur, partial output varsa korunur
└─ Recovery: "Yeni Pipeline Başlat" butonu

HATA: NETWORK_ERROR
├─ Durum: İnternet bağlantısı kesildi
├─ Kullanıcıya: "Bağlantı kesildi. Bağlantı geri geldiğinde otomatik olarak devam edilecek."
├─ Davranış: Frontend reconnect listener, backend idempotent retry
└─ Recovery: Bağlantı gelince otomatik resume
```

### 2.3 — UI Hata Gösterim Kuralları

Her hata mesajı şu yapıda gösterilir:
```
┌──────────────────────────────────────────┐
│ ⚠️ [Hata Başlığı]                        │
│                                           │
│ [Kullanıcı dostu açıklama]               │
│                                           │
│ [Birincil Aksiyon] [İkincil Aksiyon]     │
│                                           │
│ ▼ Teknik Detaylar (genişletilebilir)     │
│   Error code: GITHUB_REPO_EXISTS          │
│   Pipeline ID: abc-123                    │
│   Stage: proto_building                   │
└──────────────────────────────────────────┘
```

Kurallar:
- Hata mesajları Türkçe (kullanıcı dili)
- Teknik detay gizli, açılabilir (developer'lar için)
- Her hatada en az 1 aksiyon butonu olmalı
- "Tekrar Dene" her yerde olmalı
- Geri dönüş yolu her zaman açık olmalı (Spec'e dön, Yeni başlat, vb.)

### 2.4 — Stage Geçiş Kuralları

```
scribe_clarifying ──→ scribe_generating     (yeterli bilgi toplandığında)
scribe_clarifying ──→ scribe_generating     (3 tur soru sorulduktan sonra zorla)
scribe_generating ──→ awaiting_approval     (spec üretildiğinde)
scribe_generating ──→ scribe_clarifying     (spec validation failed → ek soru)
scribe_generating ──→ failed                (3 retry sonrası)
awaiting_approval ──→ proto_building        (kullanıcı onayladığında)
awaiting_approval ──→ scribe_generating     (kullanıcı "yeniden üret" dediğinde)
proto_building    ──→ trace_testing         (proto tamamlandığında — OTOMATİK)
proto_building    ──→ failed                (retry sonrası)
trace_testing     ──→ completed             (trace tamamlandığında)
trace_testing     ──→ completed_partial     (trace failed ama proto başarılı)
failed            ──→ (önceki stage)        ("Tekrar Dene" ile)
failed            ──→ scribe_clarifying     ("Baştan Başla" ile)
ANY               ──→ cancelled             (kullanıcı iptal)
```

Önemli: `completed_partial` state'i — Trace başarısız olsa bile Proto'nun ürettiği kod kaybolmaz. Kullanıcı kodu alabilir, testler olmadan devam edebilir.

### 2.5 — Pipeline Sonrası Kullanıcı Akışı

Pipeline tamamlandıktan sonra kullanıcının yapabileceği şeyler:

**A. Projeyi locale çekme:**
CompletionScreen'de gösterilir:
```bash
git clone https://github.com/{user}/{repo}.git
cd {repo}
npm install
npm run dev
```
Bu komutlar Proto'nun ürettiği projeye özel olarak dinamik oluşturulur. "Kopyala" butonu ile tek tıkla clipboard'a kopyalanır.

**B. Spec'i indirme:**
Kullanıcı spec dokümanını Markdown olarak indirebilir.

**C. Dosyaları inceleme:**
FileExplorer tab'ında tüm dosyaları görebilir, tıklayıp içeriklerini okuyabilir.

**D. Yeni pipeline başlatma:**
"Yeni Pipeline Başlat" butonu ile temiz bir sayfa açılır.

**E. Pipeline history'den erişim:**
Tüm tamamlanmış pipeline'lar history dropdown'dan erişilebilir. Her pipeline'ın CompletionScreen'ine tekrar dönülebilir.

### 2.6 — Retry ve İdempotency Kuralları

- Her retry denemesi aynı input ile yapılır (idempotent)
- Scribe retry: Aynı conversation history gönderilir
- Proto retry: Aynı spec gönderilir. Eğer repo zaten oluşturulduysa, sadece push tekrarlanır.
- Trace retry: Aynı repo/branch bilgisi gönderilir
- Her agent max 3 retry hakkına sahip (configurable)
- Retry'lar arasında exponential backoff: 5sn, 15sn, 30sn

---

## BÖLÜM 3 — PIPELINE DATA FLOW (Interface Tanımları)

### 3.1 — PipelineTypes.ts

```typescript
// ─── SCRIBE ───────────────────────────────────────

export interface ScribeInput {
  idea: string;
  context?: string;
  targetStack?: string;
  existingRepo?: {              // Senaryo B için — bu iterasyonda implement edilmeyecek
    owner: string;
    repo: string;
    branch: string;
  };
}

export interface ScribeClarification {
  questions: Array<{
    id: string;
    question: string;
    reason: string;
    suggestions?: string[];
  }>;
}

export interface StructuredSpec {
  title: string;
  problemStatement: string;
  userStories: Array<{
    persona: string;
    action: string;
    benefit: string;
  }>;
  acceptanceCriteria: Array<{
    id: string;
    given: string;
    when: string;
    then: string;
  }>;
  technicalConstraints: {
    stack?: string;
    integrations?: string[];
    nonFunctional?: string[];
  };
  outOfScope: string[];
}

export interface ScribeOutput {
  spec: StructuredSpec;
  rawMarkdown: string;
  confidence: number;
  clarificationsAsked: number;
}

export type ScribeMessageType =
  | { type: 'user_idea'; content: string }
  | { type: 'clarification'; content: ScribeClarification }
  | { type: 'user_answer'; content: string }
  | { type: 'spec_draft'; content: ScribeOutput }
  | { type: 'spec_approved'; content: StructuredSpec }
  | { type: 'spec_rejected'; content: { feedback: string } };

// ─── PROTO ────────────────────────────────────────

export interface ProtoInput {
  spec: StructuredSpec;
  repoName: string;
  repoVisibility: 'public' | 'private';
  owner: string;
  baseBranch?: string;
  dryRun?: boolean;
}

export interface ProtoOutput {
  ok: boolean;
  branch: string;
  repo: string;                 // "owner/repo"
  repoUrl: string;              // "https://github.com/owner/repo"
  files: Array<{
    filePath: string;
    content: string;
    linesOfCode: number;
  }>;
  prUrl?: string;
  setupCommands: string[];      // ["npm install", "npm run dev"] — dinamik
  metadata: {
    filesCreated: number;
    totalLinesOfCode: number;
    stackUsed: string;
    committed: boolean;
  };
}

// ─── TRACE ────────────────────────────────────────

export interface TraceInput {
  repoOwner: string;
  repo: string;
  branch: string;
  spec?: StructuredSpec;
  dryRun?: boolean;
}

export interface TraceOutput {
  ok: boolean;
  testFiles: Array<{
    filePath: string;
    content: string;
    testCount: number;
  }>;
  coverageMatrix: Record<string, string[]>;
  testSummary: {
    totalTests: number;
    coveragePercentage: number;
    coveredCriteria: string[];
    uncoveredCriteria: string[];
  };
  branch?: string;
  prUrl?: string;
}

// ─── PIPELINE ─────────────────────────────────────

export type PipelineStage =
  | 'scribe_clarifying'
  | 'scribe_generating'
  | 'awaiting_approval'
  | 'proto_building'
  | 'trace_testing'
  | 'completed'
  | 'completed_partial'     // Trace failed ama Proto başarılı
  | 'failed'
  | 'cancelled';

export interface PipelineError {
  code: string;
  message: string;              // Kullanıcı dostu (Türkçe)
  technicalDetail?: string;     // Developer için (İngilizce)
  retryable: boolean;
  recoveryAction?: 'retry' | 'edit_spec' | 'reconnect_github' | 'start_over';
}

export interface PipelineMetrics {
  startedAt: Date;
  scribeCompletedAt?: Date;
  approvedAt?: Date;
  protoCompletedAt?: Date;
  traceCompletedAt?: Date;
  totalDurationMs?: number;
  clarificationRounds: number;
  retryCount: number;
  estimatedCost?: number;       // USD
}

export interface PipelineState {
  id: string;
  userId: string;
  stage: PipelineStage;
  title?: string;               // Scribe'ın spec title'ından alınır — history'de gösterilir

  scribeConversation: ScribeMessageType[];
  scribeOutput?: ScribeOutput;
  approvedSpec?: StructuredSpec;
  protoOutput?: ProtoOutput;
  traceOutput?: TraceOutput;

  metrics: PipelineMetrics;
  error?: PipelineError;

  createdAt: Date;
  updatedAt: Date;
}
```

---

## BÖLÜM 4 — AGENT PLAYBOOK YAPISI

Her agent için `PLAYBOOK.md` dosyası, agent'ın nasıl davranacağını tanımlar. Bu dosyalar agent'ın system prompt'una ek bağlam olarak eklenir.

### 4.1 — Scribe PLAYBOOK.md İçeriği

```
Role: Conversational Spec Writer
Goal: Kullanıcının serbest metin fikrini, yazılım geliştirme için kullanılabilir yapılandırılmış bir spec dokümanına çevirmek.

DAVRANIŞLAR:
1. Kullanıcının fikrini oku ve analiz et.
2. Aşağıdaki zorunlu bilgiler eksikse soru sor:
   - Uygulamanın temel amacı (ne yapacak?)
   - Hedef kullanıcı (kim kullanacak?)
   - İlk versiyondaki temel özellikler (MVP scope)
   - Teknoloji tercihi (varsa)
3. Aşağıdaki bilgiler belirsizse opsiyonel soru sor:
   - Authentication tipi (login gerekiyorsa)
   - Veritabanı tercihi
   - 3rd party entegrasyonlar
   - Dağıtım hedefi (web, mobile, desktop)
4. Max 3 tur soru sor. 3 turdan sonra elindeki bilgiyle spec üret.
5. Fikir çok net ve detaylıysa soru sormadan direkt spec üret.
6. Her sorunun yanında "neden sorduğunu" kısaca açıkla.
7. Soruları grupla — tek mesajda 2-4 soru sor, tek tek sorma.

YAPMA:
- 3 turdan fazla soru sorma
- Kullanıcının teknik bilgisini varsayma
- Fikir hakkında yargıda bulunma
- Kullanıcının verdiği bilgileri değiştirme veya "daha iyisini biliyorum" tavrı takınma

OUTPUT FORMAT:
StructuredSpec JSON formatında üret + rawMarkdown olarak insan-okunabilir versiyon.
Confidence score: toplanan bilgi miktarına göre 0-1 arası.
```

### 4.2 — Proto PLAYBOOK.md İçeriği

```
Role: MVP Scaffold Builder
Goal: Onaylanmış spec dokümanından çalışır bir MVP kod tabanı üretmek ve GitHub'a push etmek.

DAVRANIŞLAR:
1. Spec'teki problem statement, user stories ve technical constraints'i oku.
2. Uygun tech stack belirle (spec'teki tercih varsa onu kullan).
3. Şu yapıyı her projede oluştur:
   - README.md (proje açıklaması, kurulum, çalıştırma)
   - package.json (dependencies)
   - .gitignore
   - src/ dizini (ana uygulama kodu)
   - Temel routing/page yapısı
   - Çevre değişkenleri için .env.example
4. Kullanıcının GitHub hesabında yeni repo oluştur.
5. Kodu feature branch'e push et, main'e PR aç.

YAPMA:
- Gereksiz boilerplate ekleme (minimal ama çalışır)
- Test dosyaları ekleme (bu Trace'in işi)
- CI/CD pipeline ekleme (scope dışı)
- Kullanıcının belirtmediği teknolojileri ekleme

SETUP COMMANDS:
Her projeye özel setup komutlarını output'a ekle:
- git clone komutu
- dependency install komutu
- dev server başlatma komutu
```

### 4.3 — Trace PLAYBOOK.md İçeriği

```
Role: Code Verifier — Test Writer
Goal: Proto'nun ürettiği kod tabanını okuyup kapsamlı Playwright e2e testleri yazmak.

DAVRANIŞLAR:
1. GitHub'dan Proto'nun push ettiği branch'teki tüm kaynak dosyaları oku.
2. Dosya yapısını, route'ları, component'ları analiz et.
3. Spec'teki acceptance criteria'ları oku (varsa).
4. Her acceptance criteria için en az 1 test yaz.
5. Ek olarak: sayfa navigasyonu, form validation, error state testleri yaz.
6. Page Object Model pattern kullan.
7. Coverage matrix oluştur: hangi acceptance criteria → hangi test dosyası.

TEST DOSYASI YAPISI:
tests/
  e2e/
    auth.spec.ts         (authentication testleri)
    [feature].spec.ts    (feature bazlı testler)
  page-objects/
    BasePage.ts
    [page].page.ts
  playwright.config.ts

YAPMA:
- Unit test yazma (sadece e2e)
- Testleri koşma (sadece yaz)
- Mevcut kodu değiştirme
- Gereksiz mock/stub ekleme

OUTPUT:
- Test dosyaları (content olarak)
- Coverage matrix (acceptance criteria ↔ test mapping)
- testSummary (toplam test sayısı, coverage yüzdesi, kapsanmayan criteria'lar)
```

---

## BÖLÜM 5 — UYGULAMA FAZLARI

### FAZ 0 — Temel Hazırlık

**0.1** CLAUDE.md'yi kontrol et. Mevcut yolu: `.claude/CLAUDE.md`. İçeriğini bu dokümanla uyumlu hale getir. CLAUDE.md şunları içermeli:
- Project overview (pipeline mimarisi)
- Critical rules (.env koruma, brand koruma)
- Pipeline data flow özeti
- Key directories
- Dev mode açıklaması

**0.2** `pipeline/` dizin yapısını oluştur (Bölüm 1.1'deki yapıya göre).

**0.3** Eski dokümanları arşivle:
```
docs/_archive/ altına taşınacaklar:
- docs/agents/AGENT_CONTRACTS_S0.5.md
- docs/agents/CONTEXT_PACKS.md
- docs/UI_DESIGN_SYSTEM.md
- docs/WEB_INFORMATION_ARCHITECTURE.md
- docs/FAQ.md
- docs/public/assets/SHOTLIST.md
- docs/public/assets/UI_VERIFICATION_REPORT.md
- backend/docs/AGENT_WORKFLOWS.md
```

**0.4** `pipeline/docs/BRAND.md` oluştur — `docs/UI_DESIGN_SYSTEM.md`'den AKIS renk kodlarını, logo bilgilerini, tipografiyi çıkar.

**0.5** Dev mode altyapısı: `.env.example`'a `DEV_MODE=true`, `DEV_SKIP_AUTH=true` ekle. Backend'de dev bypass middleware oluştur.

**0.6** Migration branch: `git checkout -b dev/pipeline-migration`

**Commit:** `chore: setup pipeline directory, archive old docs, add dev mode infrastructure`

---

### FAZ 1 — Interface, Contract ve Playbook Tanımları

**1.1** `pipeline/backend/core/contracts/PipelineTypes.ts` — Bölüm 3'teki tüm interface'ler.

**1.2** `pipeline/backend/core/contracts/PipelineSchemas.ts` — Zod validation schema'ları. Mevcut `AgentContract` base class'ını extend et.

**1.3** Agent PLAYBOOK.md dosyaları — Bölüm 4'teki içeriklerle.

**1.4** Agent prompt template dosyaları:
```
scribe/prompts/clarification.md
scribe/prompts/spec-generation.md
scribe/schemas/spec-schema.json
proto/prompts/scaffold.md
trace/prompts/test-generation.md
```

**1.5** `pipeline/docs/PIPELINE_CONTRACT.md` — Pipeline lifecycle, API endpoint'leri, hata kodları dokümanı.

**1.6** Error code enum'ları — Bölüm 2.2'deki tüm hata kodları typed olarak tanımlanacak.

**Test:** Schema validation testleri — geçerli/geçersiz input'lar, edge case'ler.

**Commit:** `feat: define pipeline types, schemas, playbooks, prompt templates, error codes`

---

### FAZ 2 — Scribe Agent

**2.1** `ScribeAgent.ts` — İki aşamalı: Clarification + Spec Generation. Mevcut AI Service import edilir.

**2.2** `SpecContract.ts` — Input/output validation. Min 1 user story, min 1 acceptance criteria zorunlu.

**2.3** Clarification logic:
- Fikri analiz et, eksik zorunlu bilgileri tespit et
- Max 3 tur soru, tur sayacı conversation state'te tutulur
- 3 turdan sonra veya yeterli bilgi varsa spec generation'a geç

**2.4** Spec generation logic:
- Tüm conversation history + kullanıcı fikri → AI'a gönder
- JSON mode ile StructuredSpec formatında yanıt iste
- rawMarkdown versiyonunu da oluştur
- Confidence score hesapla
- Output validation: spec minimum gereksinimleri karşılıyor mu?

**2.5** Retry logic: AI hataları için 3 retry, spec validation fail için 2 retry (farklı prompt ile).

**Test:**
- Net fikir ("React todo app, Google login, Supabase") → soru sormadan spec üretir
- Belirsiz fikir ("bir uygulama istiyorum") → 2-3 tur soru sorar → spec üretir
- Çok kısa fikir ("app") → validation error
- AI hatası → retry → başarılı
- 3 tur soru sonrası → mevcut bilgiyle spec üretir (eksik olsa bile)

**Commit:** `feat: implement Scribe as conversational spec writer`

---

### FAZ 3 — Proto Agent

**3.1** `ProtoAgent.ts` — StructuredSpec tüketen, repo oluşturan, scaffold push eden agent.

**3.2** Spec → scaffold logic:
- Spec'teki stack, user stories, constraints'i prompt'a aktar
- AI ile scaffold üret
- Her dosyanın content'ini ProtoOutput formatında döndür
- setupCommands dinamik oluştur (projeye göre)

**3.3** GitHub integration:
- Mevcut GitHub MCP adapter'ı import et
- Repo oluştur (repoName + visibility kullanıcıdan alınır)
- Feature branch oluştur: `proto/scaffold-{timestamp}`
- Dosyaları commit et, push et
- Main'e PR aç

**3.4** Error handling:
- GITHUB_NOT_CONNECTED → pipeline pause
- GITHUB_REPO_EXISTS → kullanıcıdan yeni isim iste
- GITHUB_PERMISSION_DENIED → re-auth yönlendirmesi
- PROTO_PUSH_FAILED → kodu bellekte tut, push retry

**Test:**
- StructuredSpec → scaffold output + doğru dosya yapısı
- Dry run → GitHub'a gitmeden preview
- GitHub repo exists → hata + recovery
- AI hata → retry

**Commit:** `feat: implement Proto with GitHub repo creation and scaffold push`

---

### FAZ 4 — Trace Agent

**4.1** `TraceAgent.ts` — Proto output'undan kodu okuyup Playwright testleri yazan agent.

**4.2** Code reader utility — GitHub MCP ile branch dosyalarını oku.

**4.3** Test generation logic:
- Dosya yapısını analiz et (route'lar, component'lar, API endpoint'ler)
- Spec'teki acceptance criteria'ları al
- Her criteria için en az 1 test yaz
- Page Object Model pattern uygula
- Coverage matrix oluştur

**4.4** Graceful degradation:
- Trace başarısız olsa bile pipeline completed_partial olarak tamamlanabilir
- "Pipeline'ı Tamamla (Testsiz)" seçeneği sunulur

**Test:**
- ProtoOutput (repo + branch + files) → test dosyaları
- Acceptance criteria → coverage matrix eşleşmesi
- Boş codebase → anlamlı hata
- AI hatası → retry → completed_partial fallback

**Commit:** `feat: implement Trace with code reading and Playwright test generation`

---

### FAZ 5 — Pipeline Orchestration

**5.1** Database migration — `pipelines` tablosu:
```sql
CREATE TYPE pipeline_stage AS ENUM (
  'scribe_clarifying', 'scribe_generating', 'awaiting_approval',
  'proto_building', 'trace_testing',
  'completed', 'completed_partial', 'failed', 'cancelled'
);

CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  stage pipeline_stage NOT NULL DEFAULT 'scribe_clarifying',
  title TEXT,
  scribe_conversation JSONB DEFAULT '[]',
  scribe_output JSONB,
  approved_spec JSONB,
  proto_output JSONB,
  trace_output JSONB,
  metrics JSONB DEFAULT '{}',
  error JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pipelines_user_id ON pipelines(user_id);
CREATE INDEX idx_pipelines_stage ON pipelines(stage);
```

**5.2** `PipelineOrchestrator.ts`:
```
startPipeline(userId, input)     → Scribe başlat
sendMessage(pipelineId, message) → Scribe ile chat
approveSpec(pipelineId, spec?)   → Proto başlat
rejectSpec(pipelineId, feedback) → Scribe'a feedback gönder
onProtoComplete(pipelineId)      → Trace başlat (otomatik)
retryStage(pipelineId)           → Mevcut stage'i tekrar çalıştır
cancelPipeline(pipelineId)       → İptal
getStatus(pipelineId)            → Durum
listPipelines(userId)            → Kullanıcının pipeline listesi
```

**5.3** API routes:
```
POST   /api/pipelines                    → Başlat
GET    /api/pipelines                    → Liste (history)
GET    /api/pipelines/:id                → Durum + conversation + outputs
POST   /api/pipelines/:id/message        → Scribe'a mesaj
POST   /api/pipelines/:id/approve        → Spec onayla (opsiyonel düzenlenmiş spec body'de)
POST   /api/pipelines/:id/reject         → Spec reddet (feedback body'de)
POST   /api/pipelines/:id/retry          → Mevcut stage'i tekrar dene
POST   /api/pipelines/:id/skip-trace     → Trace'i atla, completed_partial
DELETE /api/pipelines/:id                → İptal
```

**5.4** WebSocket veya SSE — stage geçişleri ve agent durumu gerçek zamanlı.

**5.5** Stage geçiş kuralları — Bölüm 2.4'teki state machine'i implement et.

**Test:**
- Full happy path: start → message → approve → proto complete → trace complete → completed
- Error → retry → success
- Cancel mid-pipeline
- Timeout handling
- Concurrent pipeline'lar (aynı kullanıcı birden fazla pipeline)

**Commit:** `feat: PipelineOrchestrator with lifecycle, API routes, real-time events`

---

### FAZ 6 — Frontend Pipeline UI

**6.1** `PipelinePage.tsx` — Ana sayfa. AKIS renkleri korunacak (BRAND.md referans). Tek chat ekranı.

**6.2** Layout:
```
┌─────────────────────────────────────────────────────┐
│  🔷 AKIS      [Pipeline History ▼]     [Settings ⚙] │
├─────────────────────────────────────────────────────┤
│  ● Scribe ──────── ○ Proto ──────── ○ Trace         │
│  [stage indicator + animasyon]                        │
├─────────────────────────────────────────────────────┤
│  [Chat mesajları alanı — scrollable]                 │
│  ...                                                 │
│  [SpecPreviewCard / FileExplorer / CoverageMatrix]   │
│  [CompletionScreen — pipeline bittiğinde]            │
│  [ErrorBoundary — hata durumlarında]                 │
├─────────────────────────────────────────────────────┤
│  [Mesaj input + gönder butonu]                       │
└─────────────────────────────────────────────────────┘
```

**6.3** Component'lar:
- `PipelineProgress.tsx` — 3 adımlı progress bar, aktif agent vurgulu, animasyonlu geçiş
- `ChatMessage.tsx` — Kullanıcı/agent mesaj bubble'ları, agent ikonu + rengi ile ayrışma
- `SpecPreviewCard.tsx` — Spec preview + detay açma + onay/düzenle/yeniden butonları
- `FileExplorer.tsx` — Tree view, dosyaya tıklayınca modal'da içerik gösterimi
- `CoverageMatrix.tsx` — Acceptance criteria ↔ test eşleşme tablosu
- `CompletionScreen.tsx` — Bölüm 2.1 Adım 6'daki tam tamamlanma ekranı (özet, linkler, setup komutları, tab'lı dosya/spec/test görünümü)
- `AgentStatusIndicator.tsx` — "Düşünüyor...", "Kod üretiliyor..." animasyonlu gösterge
- `ErrorBoundary.tsx` — Hata kartı gösterimi (Bölüm 2.3 formatında)
- `RepoNameInput.tsx` — Proto aşamasında repo adı + visibility seçimi

**6.4** Pipeline History dropdown — üst nav'da. Tıklayınca eski pipeline'lar listelenir (title + stage + tarih).

**6.5** Gerçek zamanlı güncellemeler — WebSocket/SSE ile stage geçişleri, agent durumu canlı güncelleme.

**6.6** Responsive — mobile'da da çalışmalı (tek kolon layout).

**Test:**
- Her component ayrı render testi
- Happy path UI flow (baştan sona)
- Hata durumlarında doğru component gösterimi
- Loading/empty state'ler

**Commit:** `feat: Pipeline UI — chat, progress, spec approval, file explorer, completion screen`

---

### FAZ 7 — Entegrasyon ve Dokümanlar

**7.1** Pipeline route'larını mevcut Fastify server'a mount et. Frontend'de mevcut React router'a pipeline sayfasını ekle.

**7.2** Doküman güncellemeleri:
- `docs/ARCHITECTURE.md` → Pipeline bölümü ekle
- `docs/DEVELOPMENT.md` → Dev mode, pipeline çalıştırma talimatları
- `docs/CHANGELOG.md` → Pipeline migration entry
- `README.md` + `README.en.md` → Tagline güncelle

**7.3** End-to-end test: Tam bir pipeline akışını baştan sona test et (dev mode'da).

**Commit:** `feat: integrate pipeline with main app, update docs, e2e test`

---

## BÖLÜM 6 — CLAUDE.MD İÇERİĞİ

`.claude/CLAUDE.md` dosyası şu içeriğe güncellenecek:

```markdown
# AKIS Platform — Claude Code Guide

## Project Overview
AKIS is a 3-agent sequential pipeline: Scribe → Proto → Trace.
- Scribe: Conversational spec writer — understands user idea, asks clarifying questions, produces structured spec
- Proto: MVP builder — takes approved spec, creates GitHub repo, generates code scaffold, pushes to GitHub
- Trace: Code verifier — reads Proto's generated code from GitHub, writes Playwright e2e tests

## Active Development
All new pipeline development is in the `pipeline/` directory.
Do NOT modify files in `backend/src/` or `frontend/src/` directly.
Import existing utilities (auth, db, AI service, MCP) from the main codebase.

## Critical Rules
- NEVER modify any .env or .env.local file
- NEVER delete or overwrite existing files without creating .legacy.ts backup
- All agent communication goes through PipelineOrchestrator — agents never call each other
- temperature=0 for all agent prompts
- Preserve AKIS branding (colors, logos) — reference pipeline/docs/BRAND.md
- Model-agnostic prompts — no model-specific syntax

## Pipeline Data Flow
ScribeInput (idea) → ScribeClarification (questions) → user answers → ScribeOutput (StructuredSpec)
→ [User Approval] → ProtoInput (spec + repoName) → ProtoOutput (branch + files + repoUrl)
→ TraceInput (repo + branch) → TraceOutput (testFiles + coverageMatrix)

## Key Directories
pipeline/backend/agents/{scribe,proto,trace}/   — New agent implementations + playbooks
pipeline/backend/core/orchestrator/             — PipelineOrchestrator
pipeline/backend/core/contracts/                — Types, schemas, error codes
pipeline/frontend/                              — Pipeline UI
pipeline/docs/                                  — Pipeline documentation
backend/src/                                    — Existing codebase (reference + imports only)

## Dev Mode
DEV_MODE=true in .env:
- Auth bypassed (auto-login as dev user)
- AI key from .env (not user settings)
- GitHub can use dry-run mode

## Error Handling
All errors use PipelineError type with: code, message (Turkish), technicalDetail, retryable, recoveryAction.
See pipeline/backend/core/contracts/PipelineTypes.ts for error codes.
```

---

## BÖLÜM 7 — DEĞERLENDİRME KRİTERLERİ

Pipeline geliştirmesi tamamlandı sayılacak kriterler:

| Metrik | Hedef | Nasıl Test Edilir |
|--------|-------|-------------------|
| Scribe spec kalitesi | 5 farklı fikir → spec'ler okunabilir | 5 farklı seviyede fikir dene |
| Proto scaffold | npm install && npm run dev hatasız (%80+) | 5 farklı stack'te dene |
| Trace coverage | Acceptance criteria'nın %80+ kapsanması | Coverage matrix kontrol |
| Pipeline success rate | %70+ end-to-end tamamlanma | 10 farklı fikir dene |
| Hata recovery | Tüm retry senaryoları çalışıyor | Her hata kodunu simüle et |
| UI | Tüm stage'ler doğru gösteriliyor | Manual UI walkthrough |
| Maliyet | Pipeline başına <$1.00 | Token usage loglama |
