# Roadmap & Milestones

AKIS Platform'un kilometre taşları bu belge üzerinden yönetilir; tek süreç, tek deploy prensibiyle ilerleyen modüler monolit mimariyi referans alır.

> **Schedule Anchor:** `docs/PROJECT_TRACKING_BASELINE.md`  
> **Audit Report:** `docs/DOCS_AUDIT_REPORT.md`

---

## Phase Status Overview

| Phase | Name | Status | Sprint Range |
|-------|------|--------|--------------|
| 9.1 | Dark Theme Unification & Auth UI | ✅ Complete | S0.4.1 - S0.4.3 |
| 9.2 | i18n & Theming Foundations | 🔄 In Progress | S0.4.4 - S0.4.6 |
| 10 | Next Foundations | 📋 Planned | TBD |

### Sprint Checklist (S0.4.x Series)

- [x] S0.4.2 — OAuth Config + Env Schema (PR #90)
- [x] S0.4.3-FE-4 — Docs & .cursor cleanup
- [x] S0.4.4 — Multi-step email auth flow (PR #90)
- [x] S0.4.5 — GitHub OAuth UI wiring
- [ ] S0.4.6 — Scribe Config Dashboard (current)

---

## Phase 9.1 — Dark Theme Unification & Auth UI ✅

**Status:** Complete

**Deliverables:**
- Solid dark hero background (#0A1215)
- ak-surface-2 card patterns
- /login + /signup dark themes
- Focus ring standardization (ak-primary)
- Demo auth flow (frontend-only)

---

## Phase 9.2 — i18n & Theming Foundations (Epic #24)

**Why now?** Phase 9.2, geliştirici deneyimini iyileştirmek, marka tutarlılığını güçlendirmek ve ileride eklenecek locale/tema varyantlarına hazır olmak için gerekli altyapıyı sağlar. Dark tema varsayılan olarak korunurken, kullanıcı-denetimli tema geçişleri ve çok dilli içerik akışları için temel kancalar hazırlanır.

**Linked Work:**
- #24 Phase 9.2 — i18n & Theming Foundations (Epic)
- #25 Phase 9.2 — i18n scaffold (locale klasörleri, mesaj katalogları)
- #26 Phase 9.2 — Theme toggle (varsayılan dark, opt-in light)
- #27 Phase 9.2 — High-res logo rollout (@2x/@3x, favicon seti)
- #28 Phase 9.2 — Spotlight effects (GPU dostu, erişilebilir)
- #29 Phase 9.2 — Lint cleanup (ESLint/Prettier sadeleştirme)

### Deliverables & Acceptance Notes

#### 1. i18n foundation
- `frontend/src/locales/` altında TR ve EN kökleri
- Navigasyon, auth giriş noktaları ve kritik CTA metinleri locale anahtarları üzerinden
- Varsayılan fallback `tr-TR`

#### 2. Theme toggle
- Varsayılan tema dark; light tema opt-in
- Kullanıcı tercihleri `localStorage` ile
- Renk token'ları (`ak-*`) her iki tema için kataloglanmış

#### 3. High-res logo rollout
- `frontend/src/assets/branding/` altında @2x/@3x PNG seti
- README ve docs/ içindeki görsel rozetler güncel logotype ile
- Görsel optimizasyon (20 KB hedef)

#### 4. Spotlight visual effects
- GPU dostu (`transform`, `opacity`) animasyonlar
- `prefers-reduced-motion` desteği
- Performans bütçeleri (LCP < 2.5s, CLS < 0.1)

#### 5. Lint & style cleanup
- ESLint ve Prettier konfigürasyonları sadeleştirilmiş
- CI pipeline'larında lint adımları yeşil

---

## Phase 10 — Next Foundations (Epic #44)

**Why now?** Phase 10, Phase 9.2 sonrası deneyimi sertleştirerek ayakta tutma maliyetini düşürmeyi ve müşteri güvenini artırmayı hedefler.

**Linked Work:**
- #44 Epic — Phase 10: Next Foundations
- #49 Phase 10 — Settings UX refinement
- #47 Phase 10 — Accessibility pass
- #48 Phase 10 — Performance budgets
- #45 Phase 10 — ROI widget (Pricing)
- #46 Phase 10 — FAQ accordion (Landing)

### Deliverables & Acceptance Notes

1. **Settings UX refinement** — Kullanıcı ayarları IA'sı gözden geçirilir, formlar doğrulama ile yeniden düzenlenir
2. **Accessibility pass** — Global ARIA landmark'ları, kontrast denetimleri, klavye erişimi
3. **Performance budgets** — Core Web Vitals hedefleri (LCP, CLS, INP) tanımlanır, CI'ye bütçe kontrolleri
4. **ROI widget (Pricing)** — Pricing sayfasında hesaplayıcı destekli ROI bileşeni
5. **FAQ accordion (Landing)** — Landing sayfasına erişilebilir akordeon bileşeni

---

## Academic Milestones

| Milestone | Date | Deliverable |
|-----------|------|-------------|
| Demo 1 | 2025-01-26 | Working prototype with core agent functionality |
| Final | 2025-05-22 | Complete platform with all three agents |

**Academic Context:**
- Student: Ömer Yasir ÖNAL (2221221562)
- Department: Computer Engineering
- Advisor: Dr. Öğr. Üyesi Nazlı DOĞAN

---

## Agent Implementation Roadmap

| Agent | Core Logic | Config UI | Job Execution | Target Phase |
|-------|------------|-----------|---------------|--------------|
| Scribe | ✅ | 🔄 S0.4.6 | ⚠️ Partial | Phase 9.2 |
| Trace | ⚠️ Scaffold | 📋 | 📋 | Phase 10+ |
| Proto | ⚠️ Scaffold | 📋 | 📋 | Phase 10+ |

---

## Execution Order (Canonical)

```
1. Finish Scribe stabilization (S0.4.6)
   └── Config wizard complete
   └── SearchableSelect functional

2. Phase 9.2 completion
   └── i18n, theming, logo, lint

3. Phase 10 foundations
   └── Settings, a11y, performance, ROI/FAQ

4. Public waitlist-only site mode
   └── Landing + waitlist signup only

5. Ecosystem QR/device-link + mobile companion
   └── Cross-device authentication

6. V2 RepoOps agent (later)
   └── Only when web agents stable
   └── Full MCP adapter suite required
```

---

## V2 Gating Criteria (RepoOps Agent)

Before starting V2 RepoOps development:

| Criterion | Required Status |
|-----------|----------------|
| Scribe, Trace, Proto | Complete + tested |
| GitHub MCP adapter | Production-ready |
| Atlassian MCP adapter | Production-ready |
| Job FSM | Proven (110+ tests) |
| Waitlist site | Launched |
| Mobile companion | QR linking functional |

---

## Reference Documents

- **Schedule Anchor:** `docs/PROJECT_TRACKING_BASELINE.md`
- **Scope & Constraints:** `.cursor/context/CONTEXT_SCOPE.md`
- **Architecture:** `.cursor/context/CONTEXT_ARCHITECTURE.md`
- **Audit Report:** `docs/DOCS_AUDIT_REPORT.md`
- **Next Actions:** `docs/NEXT.md`
- **UI Design:** `docs/UI_DESIGN_SYSTEM.md`
