# Knowledge Integrity in AKIS Platform

> Bu belge, AKIS platformunun tez temasını — **Knowledge Integrity & Agent Verification** —
> teknik detaylarıyla açıklar. Jüri değerlendirmesi ve tez yazımı için referans belgedir.

---

## 1. Problem Tanımı

Büyük Dil Modelleri (LLM'ler) yazılım geliştirmede güçlü araçlardır, ancak üç temel
güvenilirlik sorunu taşırlar:

1. **Halüsinasyon:** LLM, gerçek olmayan API'ler, kütüphaneler veya dosya yapıları üretebilir
2. **Bağlam Kayması (Context Drift):** Uzun etkileşimlerde başlangıç gereksinimlerinden sapabilir
3. **Doğrulanamaz Çıktı:** Üretilen kodun gereksinimlere uygunluğunu ölçecek yapısal mekanizma yoktur

Mevcut AI kod üretim araçları (Copilot, Cursor, vb.) **tek-agent** modelinde çalışır:
kullanıcı ister, LLM üretir, kullanıcı doğrular. Bu modelde:

- Doğrulama yükü tamamen kullanıcıya aittir
- Üretim ve doğrulama aynı agent tarafından yapılır (kendi kendini doğrulama paradoksu)
- Gereksinimlerden koda izlenebilirlik (traceability) yoktur

---

## 2. Önerilen Çözüm: Çok Katmanlı Doğrulama Zinciri

AKIS, **üretim ve doğrulamayı yapısal olarak ayırır.** Her katmanda farklı bir doğrulayıcı
devreye girer:

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    SCRIBE    │      │    PROTO     │      │    TRACE     │
│  (Üretici)   │      │  (Üretici)   │      │  (Üretici)   │
│              │      │              │      │              │
│  Fikir →     │      │  Spec →      │      │  Kod →       │
│  Spec        │      │  Scaffold    │      │  Testler     │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    İNSAN     │      │    TRACE     │      │  OTOMATİK    │
│ (Doğrulayıcı)│      │ (Doğrulayıcı)│      │ (Doğrulayıcı)│
│              │      │              │      │              │
│  Spec'i      │      │  Kodu okur,  │      │  Testler     │
│  inceler,    │      │  teste çevirir│      │  çalışır,    │
│  onaylar/    │      │  → coverage  │      │  pass/fail   │
│  reddeder    │      │  matrisi     │      │  raporu      │
└──────────────┘      └──────────────┘      └──────────────┘
```

**Temel prensip:** Hiçbir agent kendi çıktısını doğrulamaz. Doğrulama her zaman
bağımsız bir varlık (insan veya farklı agent) tarafından yapılır.

---

## 3. Doğrulama Katmanları (Detay)

### 3.1. Katman 1: Scribe → İnsan Doğrulaması

**Üretici:** Scribe Agent
**Doğrulayıcı:** İnsan (Human-in-the-Loop)

#### Scribe'ın Öz-Denetim Mekanizmaları

Scribe, spec üretmeden önce kendi kalitesini değerlendirir:

**a) Self-Interrogation (Öz-Sorgulama)**
- Kullanıcı fikri alındıktan sonra Scribe, eksik bilgileri tespit eder
- 3-5 adet clarification sorusu üretir (önceliklendirilmiş: P0/P1/P2)
- Maksimum 3 tur soru-cevap döngüsü
- Her turda önceki yanıtlar bağlama eklenir

**b) Self-Review (Öz-İnceleme)**
- Spec üretildikten sonra Scribe kendi çıktısını 4 boyutta değerlendirir:

| Boyut | Ağırlık | Ölçüt |
|-------|---------|-------|
| Tamlık (Completeness) | %40 | Tüm spec bölümleri dolu mu? |
| Gereksinim Netliği (Requirement Clarity) | %30 | Kabul kriterleri Given/When/Then formatında mı? |
| Kapsam Tanımı (Scope Definition) | %20 | Out-of-Scope net olarak tanımlanmış mı? |
| Kullanıcı Uyumu (User Alignment) | %10 | Yanıtlarla tutarlılık var mı? |

**c) Varsayım Günlüğü (Assumption Log)**
- Scribe, kullanıcının yanıtlamadığı konularda varsayımlar yapar
- Bu varsayımlar spec'te şeffaf olarak gösterilir
- Kullanıcı, varsayımları görerek spec'i daha bilinçli değerlendirir

#### İnsan Kapısı (Human Gate)

Kullanıcı spec'i gördüğünde üç seçeneğe sahiptir:

1. **Onayla:** Spec'i kabul et → Proto aşamasına geç
2. **Düzenle + Onayla:** Spec'i modifiye et → düzenlenmiş hali ile devam
3. **Reddet:** Geri bildirimle Scribe'a geri gönder → döngü başa döner

Bu kapı, **yanlış anlaşılmış gereksinimlerin** ilerlemesini yapısal olarak engeller.

---

### 3.2. Katman 2: Proto → Trace Doğrulaması

**Üretici:** Proto Agent
**Doğrulayıcı:** Trace Agent

#### Proto'nun Çıktı Bütünlüğü

Proto, onaylanan spec'ten scaffold üretirken şu kontrolleri yapar:

- **Minimum dosya sayısı kontrolü:** Scaffold en az belirli sayıda dosya içermeli
- **JSON yapısal doğrulama:** AI çıktısı parse edilir, truncated/malformed JSON repair edilir
- **Dosya yolu normalizasyonu:** Duplikat veya geçersiz path'ler temizlenir

#### Trace'in Bağımsız Doğrulaması

Trace, Proto'nun çıktısını **bağımsız olarak** doğrular. Bu bağımsızlık kritik bir
tasarım kararıdır:

**a) Kaynak Bağımsızlığı**
- Trace, Proto'nun ürettiği kodu **doğrudan Proto'dan almaz**
- Bunun yerine kodu **GitHub'dan okur** (gerçek push edilmiş hali)
- Bu sayede "kendi halüsinasyonunu test eden agent" paradoksu engellenir

**b) AC-Test İzlenebilirlik Matrisi**

Trace, spec'teki her Acceptance Criteria (AC) için test yazarken bir **izlenebilirlik
matrisi** oluşturur:

```
┌──────────────────┬─────────────────────────────────┐
│ Acceptance       │ Test Dosyaları                   │
│ Criteria ID      │                                  │
├──────────────────┼─────────────────────────────────┤
│ AC-1             │ tests/budget-tracking.spec.ts    │
│ AC-2             │ tests/category-management.spec.ts│
│ AC-3             │ tests/monthly-summary.spec.ts    │
│ AC-4             │ tests/data-persistence.spec.ts   │
└──────────────────┴─────────────────────────────────┘
```

Her AC en az bir teste eşlenmelidir. **Kapsam yüzdesi = eşlenmiş AC / toplam AC × 100**.

**c) Given/When/Then Yapısal Eşleme**

Spec'teki kabul kriterleri:
```
Given: Kullanıcı giriş yapmış
When:  Yeni harcama ekler
Then:  Harcama listesinde görünür
```

Trace'in ürettiği test:
```typescript
test('yeni harcama ekleme', async ({ page }) => {
  // Given: Kullanıcı giriş yapmış
  await page.goto('/login');
  await page.fill('#email', 'test@example.com');

  // When: Yeni harcama ekler
  await page.click('[data-testid="add-expense"]');
  await page.fill('#amount', '50');

  // Then: Harcama listesinde görünür
  await expect(page.locator('.expense-list')).toContainText('50');
});
```

---

### 3.3. Katman 3: Otomatik Test Doğrulaması

**Üretici:** Trace Agent (test dosyaları)
**Doğrulayıcı:** Test runtime (Playwright)

Trace'in ürettiği testler çalıştırılabilir (executable) Playwright testleridir.
Bu testler:

- Proto'nun gerçek koduna karşı çalışır
- Pass/fail sonuçları otomatik olarak raporlanır
- Başarısız testler, spec-kod uyumsuzluğunu işaret eder

Bu katman, doğrulama zincirinin **tamamen otomatik** olan son halkasıdır.

---

## 4. Pipeline FSM ve Hata Kurtarma

Pipeline bir Finite State Machine (FSM) olarak modellenmiştir:

```
scribe_clarifying ↔ scribe_generating → awaiting_approval
                                              ↓ (onay)
                                        proto_building
                                              ↓
                                        trace_testing
                                         ↓         ↓
                                    completed   completed_partial
```

### Hata Kurtarma Stratejisi

| Durum | Strateji | Gerekçe |
|-------|----------|---------|
| Scribe hatası | Retry (max 3, backoff) | Geçici AI hatası olabilir |
| Proto hatası | Retry + graceful degradation | GitHub API geçici hata verebilir |
| Trace hatası | Retry veya Skip | Trace başarısız olsa bile Proto çıktısı geçerli |
| Non-retryable hata | Kullanıcıya bildirim + recoveryAction | Kalıcı hata (ör. GitHub bağlı değil) |

**Graceful Degradation:** Trace başarısız olursa pipeline `completed_partial` durumuna
geçer. Kod üretimi başarılıdır, ancak test doğrulaması eksiktir. Kullanıcı bunu
açıkça görür.

**retryable Flag:** Her `PipelineError` bir `retryable` flag'i taşır. Non-retryable
hatalar (ör. `GITHUB_NOT_CONNECTED`) retry bütçesi harcanmadan doğrudan kullanıcıya
bildirilir.

---

## 5. Halüsinasyon Engelleme Mekanizmaları

### 5.1. Yapısal Engeller

| Mekanizma | Nasıl Çalışır | Engellediği Sorun |
|-----------|---------------|-------------------|
| Spec → Kod izlenebilirlik | Her dosya bir AC'ye eşlenir | Gereksiz/hayalet dosya üretimi |
| GitHub'dan kod okuma | Trace gerçek kodu okur, Proto'dan almaz | Kendi halüsinasyonunu test etme |
| Human gate | İnsan spec'i doğrular | Yanlış gereksinim yorumlaması |
| Self-review skoru | Scribe kendi güvenini hesaplar | Düşük kaliteli spec geçişi |
| Varsayım günlüğü | Bilinmeyen bilgi şeffaf hale gelir | Gizli varsayımlar |

### 5.2. Temperature = 0

Tüm agent prompt'larında `temperature=0` kullanılır. Bu:
- Deterministik çıktı sağlar (aynı girdi → benzer çıktı)
- Halüsinasyon olasılığını minimize eder
- Tekrarlanabilirlik (reproducibility) sunar

### 5.3. Yapılandırılmış Çıktı (Structured Output)

Agent'lar serbest metin yerine **Zod schema** ile doğrulanmış JSON üretir:

```typescript
// Scribe çıktısı bu schema'ya uymak ZORUNDA
const StructuredSpecSchema = z.object({
  title: z.string().min(3),
  problemStatement: z.string().min(10),
  userStories: z.array(z.object({
    persona: z.string().min(1),
    action: z.string().min(1),
    benefit: z.string().min(1),
  })).min(1),
  acceptanceCriteria: z.array(z.object({
    id: z.string().min(1),
    given: z.string().min(1),
    when: z.string().min(1),
    then: z.string().min(1),
  })).min(1),
  // ...
});
```

Schema'ya uymayan çıktılar otomatik olarak reddedilir ve retry mekanizması devreye girer.

---

## 6. Karşılaştırmalı Analiz

### Mevcut Araçlarla Karşılaştırma

| Özellik | GitHub Copilot | Cursor | AKIS |
|---------|---------------|--------|------|
| Agent sayısı | 1 | 1 | 3 (specialized) |
| Doğrulama | Kullanıcı | Kullanıcı | İnsan + Agent + Otomatik |
| Spec → Kod izlenebilirlik | Yok | Yok | AC-Test matrisi |
| Halüsinasyon kontrolü | Yok | Kısmi | Yapısal (3 katman) |
| Human-in-the-loop | İmplicit | İmplicit | Explicit (spec approval) |
| Test üretimi | Ayrı talep | Ayrı talep | Otomatik (pipeline) |
| Bağımsız doğrulama | Yok | Yok | Trace ≠ Proto |

### Akademik Çerçeve

AKIS'in Knowledge Integrity yaklaşımı, aşağıdaki akademik kavramlarla örtüşür:

1. **Separation of Concerns:** Üretim ve doğrulama farklı agent'lara ayrılmış
2. **Chain of Verification:** Her katman bir önceki katmanı doğrular
3. **Traceability Matrix:** Gereksinim mühendisliğinden ödünç alınmış izlenebilirlik
4. **Defense in Depth:** Tek bir doğrulama noktası yerine çok katmanlı savunma
5. **Fail-Safe Design:** Doğrulama başarısız olursa sistem güvenli duruma geçer (graceful degradation)

---

## 7. Nicel Sonuçlar

### Platform İstatistikleri (v0.2.0)

| Metrik | Değer |
|--------|-------|
| Toplam birim test | 1576 (1343 backend + 233 frontend) |
| Test başarı oranı | %100 (0 fail, 0 skip) |
| Canlı pipeline sayısı | 4+ (akisflow.com) |
| Ort. pipeline süresi | ~5 dakika |
| Ort. Scribe güven skoru | %88-92 |
| Ort. Trace AC kapsam | %100 |
| Ort. üretilen dosya | ~12-15 |
| Ort. üretilen test | 55+ |
| Hata kodu sayısı | 18 (10 retryable) |
| Retry backoff | [5s, 15s, 30s] |

### Doğrulama Zinciri Etkinliği

4+ canlı pipeline üzerinden gözlemlenen sonuçlar:

1. **Scribe self-review:** Düşük güvenli spec'ler kullanıcıya uyarı ile sunuldu
2. **İnsan kapısı:** Kullanıcılar ortalama 1.2 turda spec'i onayladı
3. **Trace bağımsız doğrulama:** Tüm AC'ler en az bir teste eşlendi (%100 kapsam)
4. **Graceful degradation:** Trace timeout'larında `completed_partial` doğru çalıştı

---

## 8. Sınırlamalar ve Gelecek Çalışma

### Mevcut Sınırlamalar

1. **Test çalıştırma yok:** Trace test yazar ama çalıştırmaz — gelecek sürümde CI entegrasyonu (`ci_running` stage reserved)
2. **Tek dil desteği:** Sadece web uygulamaları (React/Node.js) için optimize
3. **Küçük örneklem:** 4+ pipeline ile istatistiksel anlam sınırlı
4. **Maliyet:** Her pipeline ~$0.15-0.25 API maliyeti

### Gelecek Çalışma

1. **CI/CD Entegrasyonu:** Trace testlerinin otomatik çalıştırılması (GitHub Actions)
2. **Iteratif Geliştirme:** Mevcut koda eklemeler yapabilme (şu an sadece yeni proje)
3. **Multi-Language:** Python, Go, mobile framework desteği
4. **A/B Karşılaştırma:** Doğrulamalı vs. doğrulamasız pipeline çıktı kalitesi ölçümü
5. **Trust Score:** Agent güvenilirlik skoru (çalışma zamanı metriklerinden türetilmiş)

---

## 9. Sonuç

AKIS, LLM tabanlı kod üretiminde **Knowledge Integrity** sorununa yapısal bir çözüm
önerir. Tek-agent modelinden farklı olarak:

- **Üretim ve doğrulama ayrılmıştır** — her agent tek sorumluluk taşır
- **İnsan dahil edilmiştir** — kritik karar noktasında insan kapısı vardır
- **İzlenebilirlik sağlanmıştır** — AC-Test matrisi ile gereksinimden teste zincir kurulur
- **Hatalar yönetilir** — FSM + retry + graceful degradation ile robust pipeline

Bu yaklaşım, AI destekli yazılım geliştirmenin güvenilirliğini artırmak için
uygulanabilir bir mimari sunar.
