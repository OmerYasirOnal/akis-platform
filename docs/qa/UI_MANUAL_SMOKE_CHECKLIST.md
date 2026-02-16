# UI M2 Manual Smoke Checklist

**Version:** 1.0.0  
**Last Updated:** 2026-02-16  
**Scope:** `/agents`, `/agents/scribe`, `/agents/trace`, `/agents/proto`, `/dashboard/jobs/:id`

---

## 1) Hazırlık

- [ ] Frontend local dev server çalışıyor (`http://127.0.0.1:5173`)
- [ ] Staging erişimi açık (`https://staging.akisflow.com`)
- [ ] En az bir auth yöntemi doğrulandı (OAuth redirect smoke)

---

## 2) Route ve IA Smoke (Local)

- [ ] `/agents` açılıyor, sol panelde agent listesi görünüyor
- [ ] Quick-start yükleniyor, configuration paneli default kapalı
- [ ] `Show configuration` ile panel açılıyor, `Repository` ve `Base Branch` alanları görünüyor
- [ ] Session rail üzerinde `New` ile yeni konuşma açılabiliyor

---

## 3) Scribe Console Smoke

- [ ] `/agents/scribe` açılıyor
- [ ] Config alanı görünüyor (repo/branch/runtime)
- [ ] Logs/Preview/Diff sekmeleri render oluyor
- [ ] GitHub disconnected durumda CTA/hata mesajı doğru

---

## 4) Trace Console Smoke

- [ ] `/agents/trace` açılıyor
- [ ] `plan_only` default
- [ ] `generate_and_run` seçildiğinde invalid URL ile run bloklanıyor
- [ ] Logs/Results sekmeleri render oluyor
- [ ] Boş durumda kullanıcı yönlendirme metni görünüyor

---

## 5) Proto Console Smoke

- [ ] `/agents/proto` açılıyor
- [ ] Guided question flow tamamlanmadan Run butonu kapalı
- [ ] Guided flow tamamlanınca Run butonu aktifleşiyor
- [ ] Artifacts paneli completed state’de görünüyor

---

## 6) Job Detail Trust Smoke

- [ ] `/dashboard/jobs/:id` sayfasında verification summary görünüyor
- [ ] citation/confidence/freshness mapping tutarlı
- [ ] uncertainty/disclaimer metni görünür

---

## 7) i18n ve A11y Smoke

- [ ] EN/TR geçişinde yeni metinlerde fallback key görünmüyor
- [ ] Form inputlarında label/placeholder tutarlı
- [ ] Klavye tab sırası kritik aksiyonlarda bozulmuyor

---

## 8) Staging OAuth Smoke (Minimum)

- [ ] `GET /health` -> `200`
- [ ] `GET /version` -> commit döndürüyor
- [ ] `GET /auth/oauth/github` -> `302` ve `location` `github.com/login/oauth/authorize`

---

## 9) Zorunlu Komutlar

```bash
npm -C frontend run typecheck
npm -C frontend run test
npm -C frontend run test:e2e -- \
  tests/e2e/auth-login-flow.spec.ts \
  tests/e2e/navigation-guards.spec.ts \
  tests/e2e/scribe-console.spec.ts \
  tests/e2e/trace-console.spec.ts \
  tests/e2e/proto-console.spec.ts \
  tests/e2e/agents-hub-ui.spec.ts
```

---

## 10) Kanıt Dosyaları

- `docs/qa/UI_M2_BASELINE_EVIDENCE_2026-02-16.md`
- `docs/qa/UI_MANUAL_SMOKE_EVIDENCE_2026-02-16.md`
- `docs/qa/QA_EVIDENCE_STAGING_SMOKE_PACK.md`

