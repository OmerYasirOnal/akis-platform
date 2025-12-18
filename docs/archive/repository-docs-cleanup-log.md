# Repository Docs Cleanup Log

## 1. Özet
Audit raporunda belirtilen yeniden yapılandırma adımlarının ilk turu tamamlandı. Scope dokümanı artık eski Next.js/Prisma tablosunu içermiyor, `.cursor` kuralları MCP katmanının gerçek klasör yolunu açıkça tanımlıyor, README ve ROADMAP giriş noktaları güncel kanonik belgelere yönlendiriyor ve arşiv klasörü "legacy" dosyalar için açıklayıcı bir not içeriyor.

## 2. Yapılan Değişiklikler (Dosya Bazlı)
- `.cursor/context/CONTEXT_SCOPE.md`: Eski “Kullanılacak Teknolojiler” tablosu kaldırıldı, yerine CONTEXT_ARCHITECTURE’ye yönlendiren kısa bir not eklendi.
- `.cursor/rules/rules.mdc`: MCP adapter’larının yalnızca `backend/src/services/mcp/` altında tutulması gerektiği açıkça belirtildi.
- `.cursor/prompts/03_MCP_LAYER_SCAFFOLD.md`: Yanlış `backend/src/mcp/` yolu `backend/src/services/mcp/` olarak düzeltildi.
- `docs/archive/backend-project-deep-audit-report.md`: Dosyanın arşiv amaçlı saklandığını belirten not eklendi.
- `README.md`: “Canonical Docs” listesi ve Quickstart başlığı güncellendi; kullanıcılar doğrudan Scope, Architecture, UI ve IA dokümanlarına ulaşabiliyor.
- `docs/ROADMAP.md`: Faz durumlarını gösteren `[x]/[ ]` listesi eklendi (Phase 9.1 tamamlandı olarak işaretlendi).
- `docs/repository-docs-cleanup-log.md`: Bu temizliğin insan okuması için log’u oluşturuldu.

## 3. Çalıştırılan Kontroller
- Otomatik test veya lint komutu çalıştırılmadı (yalnızca dokümantasyon ve .cursor güncellemeleri yapıldı).

## 4. Açık Sorular / TODO’lar
- Audit raporunda adı geçen `backend/docs/PROJECT_DEEP_AUDIT_REPORT.md` artık repo içinde bulunmuyor. Eğer eski içerik başka bir yerde tutuluyorsa, `docs/archive/` altına taşınması ve not düşülmesi gerekebilir.
- `docs/constraints.md` dokümanı halen aktif; legacy sayılıp sayılmayacağına mimari ekip karar vermeli.

## [2025-12-04] S0.4.3-FE-4 – Final docs & .cursor cleanup
Bu iterasyonda README ve `.cursor` context dosyaları tam hizaya getirildi; `docs/constraints.md` platform kısıtlarının kanonik kaynağı olarak işaretlendi ve Scope belgesi ilgili teknik dokümanlara referans verir hale geldi. MCP scaffold promptu ve rules dosyası mevcut klasör yapısıyla birebir uyumlu, arşiv klasörü ise legacy audit notuyla etiketlendi. Böylece Cursor oturumları güncel kaynaklara yönlendirilecek.

**Canonical docs updated:**
- `.cursor/context/CONTEXT_SCOPE.md` → Mimari/UI/API kaynaklarına referans eklendi.
- `.cursor/context/CONTEXT_ARCHITECTURE.md` → OCI/Free Tier kısıtları için `docs/constraints.md` bağlantısı eklendi.
- `README.md` → Canonical Docs listesine `docs/constraints.md`, `backend/docs/API_SPEC.md`, `backend/docs/AGENT_WORKFLOWS.md` eklendi.
- `.cursor/rules/rules.mdc` ve `.cursor/prompts/03_MCP_LAYER_SCAFFOLD.md` → Önceki düzeltmeler doğrulandı; MCP yolu tutarlılığı korundu.

**Archived docs:**
- `docs/archive/backend-project-deep-audit-report.md` → “Bu belge arşivlendi” notu korunarak final durumu teyit edildi.

**Deleted docs:** Yok.

**.cursor updates:**
- Scope/Architecture dosyaları arasında yönlendirmeler tamamlandı; MCP scaffold promptu doğru klasörü gösteriyor.

**Open questions / TODO'lar:**
- `backend/docs/PROJECT_DEEP_AUDIT_REPORT.md` hâlâ bulunamıyor; varsa eski içerik arşive eklenmeli.
- Frontend içerik TODO'ları (FAQ, ROI widget vb.) roadmap'e göre insan ekibi tarafından planlanmalı.

## [2025-12-06] S0.4.4-FE-Auth – Cursor-style multi-step auth flows (planning phase)

**Mevcut Durum (Baseline):**
- Backend auth endpoints: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Backend: Tek adımlı signup (name+email+password) ve login (email+password)
- Frontend: `frontend/src/pages/auth/Login.tsx` ve `Signup.tsx` - tek sayfalık formlar
- OAuth entegrasyonu yok, email doğrulama yok, data sharing consent yok
- `backend/docs/Auth.md` mevcut değil

**Hedef:**
Cursor tarzı çok adımlı auth deneyimi:
- **Login:** Email adımı → Password adımı
- **Signup:** Name+Email → Password → Email verification (6 digit) → Beta notice → Data sharing consent
- OAuth butonları (Google/GitHub) UI'da var ama disabled/placeholder
- Yeni rotalar: `/auth/login/password`, `/auth/signup/password`, `/auth/signup/verify-email`, `/auth/welcome-beta`, `/auth/privacy-consent`

**Yapılacaklar:**
1. Dokümantasyon güncellemeleri (CONTEXT_ARCHITECTURE, CONTEXT_SCOPE, IA, API_SPEC, yeni Auth.md)
2. Frontend multi-step UI implementasyonu
3. Backend: yeni endpoints tasarımı (başlangıçta stub olabilir)
4. Quality gates (lint, typecheck, test)

