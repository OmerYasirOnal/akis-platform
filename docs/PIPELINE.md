# AKIS — Pipeline Akış Detayları

## FSM (Finite State Machine)

Pipeline bir durum makinesi olarak çalışır:

```
scribe_clarifying → scribe_generating → awaiting_approval
→ proto_building → trace_testing → completed | completed_partial

Her adımdan → failed (retryable) | cancelled
```

## Aşamalar

### 1. Scribe — Clarification (scribe_clarifying)

- Kullanıcı fikri alınır (`ScribeInput.idea`)
- Scribe, fikri analiz eder ve 3-5 clarification sorusu üretir
- Sorular önceliklendirilir (P0/P1/P2)
- Kullanıcı wizard arayüzü ile yanıtlar
- Birden fazla tur olabilir (Scribe tatmin olana kadar)

### 2. Scribe — Spec Generation (scribe_generating)

- Tüm yanıtlar toplandıktan sonra Scribe yapılandırılmış spec üretir
- Spec bölümleri: Problem Tanımı, Kullanıcı Hikayeleri, Kabul Kriterleri, Teknik Kısıtlamalar, Kapsam Dışı
- Güven skoru hesaplanır (0-100%):
  - Tamlık (%40): Tüm bölümler dolu mu?
  - Gereksinim Netliği (%30): Given/When/Then formatında mı?
  - Kapsam Tanımı (%20): Out of Scope net mi?
  - Kullanıcı Uyumu (%10): Yanıtlarla tutarlı mı?

### 3. İnsan Onayı (awaiting_approval)

- Kullanıcı spec'i görür: özet + detay (varsayılan kapalı)
- **Onayla**: Repo adı + visibility seçerek Proto'ya geç
- **Reddet**: Geri bildirim ile Scribe'a geri dön

### 4. Proto — Scaffold (proto_building)

- Onaylanan spec alınır
- Dosya yapısı planlanır (AI)
- Scaffold kodu üretilir (AI)
- GitHub repo oluşturulur / branch açılır
- Dosyalar push edilir
- Doğrulama raporu üretilir

### 5. Trace — Test (trace_testing)

- Proto'nun push ettiği GERÇEK kod GitHub'dan okunur
- Endpoint ve route analizi yapılır
- Her AC için Playwright test senaryosu yazılır
- Coverage matrisi üretilir (AC → Test eşlemesi)
- Test dosyaları raporlanır

### 6. Tamamlanma

- **completed**: Tüm aşamalar başarılı
- **completed_partial**: Trace atlandı veya kısmi başarı

## Hata Yönetimi

- Max 3 retry, backoff: [5s, 15s, 30s]
- Stage timeout: 5 dakika
- Tüm hatalar `PipelineError` tipinde (code, message, retryable, recoveryAction)

## Diyagramlar

Detaylı sequence diagram, doğrulama zinciri ve FSM state diagram için bkz:
[`docs/diagrams/pipeline-sequence.md`](diagrams/pipeline-sequence.md)

## SSE Activity Stream

Her aşama gerçek zamanlı progress event'leri yayınlar:

```typescript
{ stage: 'scribe', step: 'analyzing', message: 'Fikir analiz ediliyor...', progress: 25 }
```

Frontend `usePipelineStream` hook'u ile dinler ve UI'da gösterir.
