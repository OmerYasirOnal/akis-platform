# AKIS — Ajan Prompt Stratejileri

## Genel İlkeler

- **temperature=0** — Tüm ajan prompt'ları deterministik
- **Model-agnostic** — Model-spesifik syntax yok
- **Tool injection** — Orchestrator tool'ları inject eder, ajanlar kendi client oluşturmaz
- **Inter-agent isolation** — Ajanlar birbirini doğrudan çağırmaz

## Scribe — Spec Yazıcı

### Strateji

Scribe iki aşamada çalışır: clarification + generation.

**Clarification prompt'u:**
- Kullanıcı fikrini analiz et
- Platform/teknoloji gereksinimlerini belirle
- 3-5 clarification sorusu üret (P0/P1/P2 öncelikli)
- Her sorunun nedeni (reason) açıklanmalı

**Generation prompt'u:**
- Tüm kullanıcı yanıtlarını birleştir
- 5 bölümlü yapılandırılmış spec üret
- Öz-inceleme (self-review) uygula
- Güven skoru hesapla

### Doğrulama Kapıları

1. **Self-questioning**: Her bölüm için "Bu yeterince spesifik mi?" kontrolü
2. **Self-review**: Üretilen spec'i tekrar oku, eksik/belirsiz noktaları düzelt
3. **Confidence gate**: Güven skoru < %60 ise ek soru sor

## Proto — MVP Oluşturucu

### Strateji

Proto onaylanan spec'ten çalışır scaffold üretir.

**Prompt yapısı:**
- Spec'i parse et (user stories, AC, constraints)
- Dosya ağacı planla (framework + yapı)
- Her dosya için kod üret
- Package.json, tsconfig, README dahil

### Doğrulama Kapıları

1. **Spec alignment**: Her dosyanın hangi user story'yi karşıladığını belirt
2. **Scaffold integrity**: `package.json` bağımlılıkları tutarlı mı?
3. **Build verification**: Üretilen kodun build edilebilir olduğunu kontrol et

## Trace — Test Yazıcı

### Strateji

Trace, Proto'nun GitHub'a push ettiği GERÇEK kodu okur.

**Prompt yapısı:**
- GitHub'dan tüm dosyaları oku
- Route/endpoint analizi yap
- Her AC için Playwright test yaz
- Coverage matrisi üret

### Doğrulama Kapıları

1. **Code-first**: Spec'e değil, gerçek koda dayalı test yazımı
2. **AC traceability**: Her test hangi AC'yi kapsıyor (matris)
3. **Coverage completeness**: Kapsanmayan AC var mı?

## Verification Chain (Tez Teması)

```
Scribe spec üretir → İNSAN doğrular (human-in-the-loop)
Proto kod üretir   → TRACE doğrular (automated verification)
Trace test yazar   → Testler OTOMATİK çalışır
```

Bu zincir "Knowledge Integrity" temasının temelini oluşturur:
her katman hem kendi çıktısını doğrular hem bir önceki katmanın çıktısına bağlılığını kanıtlar.
