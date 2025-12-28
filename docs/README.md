# AKIS Platform Dokümantasyon

Bu klasör, AKIS Platform'un teknik dokümantasyonunu içerir.

## 📐 Web Sitesi Tasarım Dokümanları (YENİ)

AKIS Platform web sitesi için kapsamlı tasarım ve bilgi mimarisi dokümanları:

### [**Web Information Architecture**](./WEB_INFORMATION_ARCHITECTURE.md) 
Sayfa yapıları, içerik organizasyonu ve kullanıcı akışları:
- **Site mimarisi (Sitemap):** Public marketing site + authenticated dashboard
- **Detaylı sayfa içerikleri:** Landing page, agent pages, pricing, docs, dashboard
- **Kullanıcı akışları:** İlk ziyaret → kayıt → ilk agent çalıştırma
- **Hedef kitle analizi:** Teknik liderler, C-level, bireysel geliştiriciler
- **SEO ve analytics:** Meta tags, structured data, conversion events
- **Responsive stratejiler:** Mobile-first approach, breakpoints, adaptive layouts

### [**UI Design System**](./UI_DESIGN_SYSTEM.md)
Görsel tasarım sistemi, marka token'ları ve UI komponentleri:
- **Renk paleti:** Dark theme (#0A1215 bg, #07D1AF primary), WCAG AA compliance
- **Tipografi:** System font stack, type scale, responsive typography
- **Spacing & Layout:** Grid systems, elevation, shadows
- **Component library:** Buttons, inputs, cards, modals, navigation, tables, toasts
- **Animasyonlar:** Transitions, hover effects, loading states
- **Accessibility:** Focus states, ARIA patterns, keyboard navigation
- **Tailwind config:** Complete configuration özeti

**Kullanım:** 
- Frontend geliştirme sırasında referans rehber olarak kullanın
- Yeni component geliştirirken ilgili bölüme bakın
- Design token'ları değişirse `tailwind.config.js`'i güncelleyin

---

## 📋 Kontrol Listeleri

Kalite, güvenlik ve performans kontrolleri için:

- [Definition of Done (DoD)](../.cursor/checklists/DoD.md)
- [Security Checklist](../.cursor/checklists/Security.md)
- [Performance Checklist](../.cursor/checklists/Performance.md)

## 🏗️ Mimari Dokümantasyon

- [Architecture Context](../.cursor/context/CONTEXT_ARCHITECTURE.md)
- [Scope Context](../.cursor/context/CONTEXT_SCOPE.md)

## 👨‍💻 Geliştirme Rehberleri

- [Cursor + Codex Strategy](../CURSOR_CODEX_STRATEGY.md)
- [Rules & Guardrails](../.cursor/rules/rules.mdc)
- [Constraints](../.cursor/constraints.md)
- [Glossary](../.cursor/glossary.md)
