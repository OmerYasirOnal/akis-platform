# AKIS — LIVE ACTIVITY STREAM WRAPPER

Bu prompt AKIS_LIVE_ACTIVITY_STREAM_FOR_CLAUDE_CODE.md dokümanını çalıştırmadan ÖNCE okunmalıdır.

---

## KRİTİK UYARILAR

### 1. Backend AI Service raw fetch() kullanıyor
Backend Anthropic SDK DEĞİL, raw `fetch()` kullanıyor. Bu streaming (stream: true) yapamayacağın anlamına gelir. AMA SSE activity stream farklı bir şey — AI token streaming değil, "şu adımdayım" mesajları. Bu YAPILIR.

### 2. Fastify versiyonu
`reply.hijack()` Fastify 4+ gerektirir. Versiyonu kontrol et:
```bash
grep "fastify" backend/package.json | head -3
```
Fastify 3 ise `reply.raw.write()` yeterli olabilir ama `hijack()` yerine farklı bir yaklaşım gerekir.

### 3. Mevcut pipeline endpoint yapısı
Mevcut endpoint'ler `/api/pipelines/:id` formatında. Live Activity dokümanı `/api/pipeline/:id/stream` kullanıyor. TUTARLI ol — mevcut yapıya uygun endpoint kullan:
```
GET /api/pipelines/:id/stream
```

### 4. Agent run fonksiyonlarına pipelineId geçirme
Bu EN KRİTİK kısım. Agent'ların `run()` fonksiyonlarında pipelineId yoksa, orchestrator'dan geçirilmeli. Bu TEK gerekli refactor.

### 5. Öncelik sırası
1. FAZ 0 — Keşif (OKU, anla)
2. FAZ 1 — Backend: ActivityEmitter + SSE endpoint
3. FAZ 2 — Agent'lara emitActivity çağrıları ekle
4. FAZ 3 — Frontend: usePipelineStream hook + ActivityLog bileşeni
5. FAZ 4 — Polish ve edge case'ler

### 6. Chat view entegrasyonu
Live Activity dokümanı StageTimeline'a entegrasyonu anlatıyor. Ama bizim ana görünüm artık Chat tab'ı. ActivityLog'u CHAT VIEW'a da ekle — ThinkingSteps bileşeninin yerine veya yanına.

Chat'te şöyle görünmeli:
```
[S] Scribe
  ▾ Spec oluşturuluyor...
    15:23:01  Kullanıcı fikrini analiz ediyor
    15:23:02  Varsayımları belirleniyor
    15:23:03  Claude AI çağrılıyor...
    15:23:18  Yanıt parse ediliyor
    ● Spec doğrulaması yapılıyor...
```

Mevcut statik ThinkingSteps'i SSE ile gelen GERÇEK activity mesajlarıyla DEĞİŞTİR. SSE bağlantısı yoksa veya activity yoksa, mevcut statik adımlar FALLBACK olarak kalsın.

---

## ÇALIŞTIRMA

Önce bu wrapper'ı oku, sonra ana dokümanı çalıştır:

```
@AKIS_LIVE_ACTIVITY_STREAM_FOR_CLAUDE_CODE.md Read and execute step by step. 

CRITICAL NOTES:
- Use /api/pipelines/:id/stream (not /api/pipeline/:id/stream)
- Check Fastify version before using reply.hijack()
- Agent run() functions need pipelineId parameter — this is the main refactor
- Also integrate ActivityLog into WorkflowChatView (replace static ThinkingSteps with real SSE activities)
- If SSE fails to connect, fall back to existing static ThinkingSteps
- Work in act mode.
```

---

## TEST SONRASI KONTROL

Live Activity Stream çalıştıktan sonra şunları kontrol et:

1. **SSE bağlantısı kuruluyor mu?**
   - Browser console'da `EventSource` hatası yok mu?
   - Network tab'da `/api/pipelines/:id/stream` isteği var mı? `text/event-stream` dönüyor mu?

2. **Activity mesajları akıyor mu?**
   - Pipeline çalışırken chat'te gerçek zamanlı mesajlar görünüyor mu?
   - Timestamp'ler doğru mu?
   - Progress bar ilerliyor mu?

3. **Mevcut polling HÂLÂ çalışıyor mu?**
   - SSE olmasa bile pipeline stage geçişleri oluyor mu?
   - 2s polling devam ediyor mu?

4. **Pipeline tamamlandığında SSE kapanıyor mu?**
   - Completed olduktan sonra EventSource close ediliyor mu?
   - Memory leak yok mu?

5. **Sayfa yenilenince tekrar bağlanıyor mu?**

6. **Build temiz mi?**
   ```bash
   cd frontend && npx tsc --noEmit && npm run build
   cd ../backend && npx tsc --noEmit
   ```
