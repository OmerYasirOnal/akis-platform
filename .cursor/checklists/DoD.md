---
description: "Definition of Done — AKIS"
---

## Kod
- [ ] TS **strict** uyarısız; `pnpm -r typecheck` temiz.
- [ ] Lint temiz; `pnpm -r lint` temiz (warning kabul edilebilir, error yok).
- [ ] Build temiz; `pnpm -r build` çalışıyor, artefact commit edilmedi.

## Test
- [ ] Frontend vitest: yeni/etkilenen komponent için test(ler).
- [ ] Backend: **fastify.inject** ile en az 1 test.
- [ ] CI `pnpm -r test` yeşil; backend test yoksa “no tests – skipping” mesajı logda.

## Güvenlik
- [ ] `helmet`,`cors`,`rate-limit` kayıtlı.
- [ ] Gizli bilgiler .env’de; **.env.example** güncellendi.
- [ ] Loglarda token/şifre yok; requestId zorunlu.

## Dokümantasyon
- [ ] README/NEXT.md/CHANGELOG notu.
- [ ] .env.example ve ENV_SETUP güncel.

## PR Hijyeni
- [ ] Tek konu; küçük PR; **Conventional Commit** başlığı.
- [ ] Ekran/log kanıtı eklendi.