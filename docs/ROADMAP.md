# Roadmap & Milestones

AKIS Platform'un kilometre taşları bu belge üzerinden yönetilir; tek süreç, tek deploy prensibiyle ilerleyen modüler monolit mimariyi referans alır. Doküman; frontend'in Vite tabanlı SPA yapısına, backend'in Fastify + Drizzle/PostgreSQL yığınına ve MCP adaptör katmanına dokunmadan, saf dokümantasyon gereksinimlerini kayda geçirir.

### Phase Status

- [x] Phase 9.1 — Dark Theme Unification & Auth UI
- [ ] Phase 9.2 — i18n & Theming Foundations
- [ ] Phase 10 — Next Foundations
- [x] S0.4.3-FE-4 — Docs & .cursor cleanup (bu çalışma)

## Phase 9.2 — i18n & Theming Foundations (Epic #24)

**Why now?** Phase 9.2, geliştirici deneyimini iyileştirmek, marka tutarlılığını güçlendirmek ve ileride eklenecek locale/tema varyantlarına hazır olmak için gerekli altyapıyı sağlar. Dark tema varsayılan olarak korunurken, kullanıcı-denetimli tema geçişleri ve çok dilli içerik akışları için temel kancalar hazırlanır; aynı sprintte logotype güncellemeleri ve lint temizlikleriyle UI/UX bütünlüğü garantilenir.

**Linked Work**

- #24 Phase 9.2 — i18n & Theming Foundations (Epic)
- #25 Phase 9.2 — i18n scaffold (locale klasörleri, mesaj katalogları, dil anahtarları)
- #26 Phase 9.2 — Theme toggle (varsayılan dark, opt-in light, token eşlemesi)
- #27 Phase 9.2 — High-res logo rollout (@2x/@3x, favicon seti, README rozetleri)
- #28 Phase 9.2 — Spotlight effects (GPU dostu, erişilebilir)
- #29 Phase 9.2 — Lint cleanup (ESLint/Prettier ayarlarının sadeleştirilmesi)

### Deliverables & Acceptance Notes

#### 1. i18n foundation

- `frontend/src/locales/` altında TR ve EN kökleri oluşturulmuş, mesaj katalogları ana modüllere lazy-load edilebilecek şekilde yapılandırılmış olmalı.
- Navigasyon, auth giriş noktaları ve kritik CTA metinleri locale anahtarları üzerinden okunmalı; varsayılan fallback `tr-TR` olmalı.
- Dil anahtarı seçimleri, routing veya context değişiminde FOUC üretmeden çalışmalı ve docs/ dizini güncel kullanım notları içermeli.

#### 2. Theme toggle

- Varsayılan tema dark olarak kalmalı; light tema opt-in olup kullanıcı tercihleri `localStorage` veya eşdeğer hafif depolama ile anımsanmalı.
- Renk token'ları (`ak-*`) hem dark hem light için kataloglanmalı; Design System belgesindeki varyantlar güncellemeyle eşleşmeli.
- Tema geçişi kritik sayfalarda yeniden yükleme gerektirmeden (client-side) gerçekleşmeli ve odak/focus stilleri bozulmamalı.

#### 3. High-res logo rollout

- `frontend/src/assets/branding/` altında @2x/@3x PNG seti ve güncel favicon paketleri eklenmeli; düşük çözünürlükten referanslar temizlenmeli.
- README ve docs/ içindeki görsel rozetler yeni logotype ile hizalanmalı; alt metinler (“AKIS”) korunmalı.
- Build çıktılarında gereksiz büyük dosyalar barınmamalı; görsel optimizasyon metrikleri (20 KB hedefler) not düşülmeli.

#### 4. Spotlight visual effects

- Spotlight/hover efektleri GPU dostu (`transform`, `opacity`) animasyonlarla uygulanmalı; `prefers-reduced-motion` kullanıcılarını zorlamamalı.
- Efektler kritik etkileşimleri bloklamamalı, sadece görsel vurguyu güçlendirmeli; fallback halinde içerikler okunabilir kalmalı.
- Performans bütçeleri (LCP < 2.5s, CLS < 0.1) korunmalı; docs/WEB_INFORMATION_ARCHITECTURE.md referansları güncellenmeli.

#### 5. Lint & style cleanup

- ESLint ve Prettier konfigürasyonları Phase 9.2 kapsamındaki i18n/theming değişikliklerini destekleyecek şekilde sadeleştirilmeli; yeni kurallar kod tabanına uygulanmalı.
- Kapsam yalnızca linting/format konfigürasyonuyla sınırlı kalmalı; runtime davranışı değiştirilmemeli.
- CI pipeline'larında (backend/frontend job'ları) lint adımlarının yeşil geçtiği doğrulanmalı; docs/README.md statüsü güncellenmeli.

---

## Phase 10 — Next Foundations (Epic #44)

**Why now?** Phase 10, Phase 9.2 sonrası deneyimi sertleştirerek ayakta tutma maliyetini düşürmeyi ve müşteri güvenini artırmayı hedefler. Settings UX iyileştirmeleri, erişilebilirlik öncelikleri, performans bütçeleri ve pazarlama yüzünü güçlendiren ROI/FAQ bileşenleri aynı sprintte planlanır.

**Linked Work**

- #44 Epic — Phase 10: Next Foundations
- #49 Phase 10 — Settings UX refinement
- #47 Phase 10 — Accessibility pass
- #48 Phase 10 — Performance budgets
- #45 Phase 10 — ROI widget (Pricing)
- #46 Phase 10 — FAQ accordion (Landing)

### Deliverables & Acceptance Notes

1. **Settings UX refinement** — Kullanıcı ayarları IA'sı gözden geçirilir, formlar doğrulama ile yeniden düzenlenir ve docs/README.md referansları güncellenir.
2. **Accessibility pass** — Global ARIA landmark'ları, kontrast denetimleri ve klavye erişimi kilit ekranlarda doğrulanır; rehber `docs/ENV_SETUP.md` ve Design System'de not edilir.
3. **Performance budgets** — Core Web Vitals hedefleri (LCP, CLS, INP) tanımlanır ve CI workflow'una hafif bütçe kontrolleri eklenir.
4. **ROI widget (Pricing)** — Pricing sayfasında hesaplayıcı destekli ROI bileşeni eklenir; analytics olayları belgelendirilir.
5. **FAQ accordion (Landing)** — Landing sayfasına erişilebilir akordeon bileşeni eklenir; collapse/expand durumu ekran okuyucu dostu şekilde uygulanır.

---

Diğer faz başlıkları Phase 10 ilerledikçe güncellenecektir. Tüm roadmap kararları, `docs/CONTEXT_SCOPE.md` ve `docs/UI_DESIGN_SYSTEM.md` ile birlikte okunmalıdır.
