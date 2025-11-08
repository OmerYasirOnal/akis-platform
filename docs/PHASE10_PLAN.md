# Phase 10 — Next Foundations Plan

## Goals
- Sertleşmiş ayarlar deneyimi: kullanıcı/account konfigürasyonlarında daha az sürtünme, daha fazla rehberlik.
- Erişilebilirlik paritesi: dark/light tema ve yeni bileşenlerde WCAG 2.1 AA uyumu.
- Performans görünürlüğü: Core Web Vitals için ölçülebilir bütçeler ve otomasyon.
- Pazarlama yüzü güçlendirme: Pricing ROI widget'ı ve Landing FAQ akordeonu ile daha net değer önerisi.

## Candidate Work Items
- [ ] #49 Settings UX refinement
- [ ] #47 Accessibility pass (global)
- [ ] #48 Performance budgets & monitoring
- [ ] #45 ROI widget (Pricing)
- [ ] #46 FAQ accordion (Landing)

## Acceptance Gates
- `npm run lint`, `npm run typecheck`, `npm run build` root seviyesinde yeşil.
- Lighthouse / WebPageTest raporlarında LCP < 2.5s, CLS < 0.1, INP < 200ms.
- Erişilebilirlik kontrolleri (axe, keyboard traversal) kritik akışlarda engel/tuş kapaması üretmiyor.
- Yeni bileşenlerin (ROI widget, FAQ) analytics olayları ve dokümantasyonu güncel.

## Out of Scope
- Backend auth yeniden yazımı veya MCP adapter yatırımı.
- Mobil native uygulama yüzeyleri.
- Pricing stratejisinde metin/plan değişiklikleri (yalnızca UI bileşenleri).
