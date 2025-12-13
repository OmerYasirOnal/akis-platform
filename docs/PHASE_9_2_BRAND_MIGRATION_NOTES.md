# Phase 9.2 — Brand Migration Notes (UI Logo Standardization)

**Doküman Versiyonu:** v1.0  
**Tarih:** Aralık 2025  
**Scope:** UI tarafında logo render’ını tek kaynağa indirgeme (`Logo` komponenti) ve `/brand` logo img referanslarını kaldırma  

---

## 1. Neden (Context)

`docs/BRAND_ASSET_INVENTORY.md` audit bulgularına göre UI içinde logo kullanımı **tutarsızdı**:

- `/brand/...` (public URL) üzerinden manuel `<img>` kullanımları vardı.
- Çoklu fallback ve `onError` ile farklı dosyalar arasında “swap” yapılıyordu (fragile).
- Canonical logo kaynağı olan `Logo` komponenti her yerde kullanılmıyordu.

Phase 9.2 hedefi: **tek source of truth** (Design System + `Logo` komponenti) ve `/brand` klasörünün yalnızca **meta/favicons** için ayrılması.

---

## 2. Bu PR’da Yapılanlar (High-level)

### 2.1 UI (Header/Hero/Footer) standardizasyonu

- **`frontend/src/components/Header.tsx`**
  - Header’daki manuel `/brand/...` logo `<img>` kaldırıldı.
  - Yerine canonical `Logo` komponenti eklendi (**size: `nav`**).
  - `onError` fallback zinciri kaldırıldı (tek kaynak).

- **`frontend/src/components/Hero.tsx`**
  - Hero’daki manuel `/brand/...` logo `<img>` kaldırıldı.
  - Yerine canonical `Logo` komponenti eklendi (**size: `hero`**).
  - Logo davranışı `Logo` komponenti kontratı ile uyumlu (hero için eager, diğerleri lazy).

- **`frontend/src/components/Footer.tsx`**
  - Footer’daki manuel `/brand/...` logo `<img>` kaldırıldı.
  - Yerine canonical `Logo` komponenti eklendi (**size: `sm`**).
  - `onError` fallback kaldırıldı (tek kaynak).

### 2.2 Auth sayfalarına logo eklenmesi

Aşağıdaki auth sayfalarına, layout’ı bozmadan **küçük canonical logo** eklendi (Brand Guide yüzey kuralları ile uyumlu):

- `frontend/src/pages/auth/LoginEmail.tsx`
- `frontend/src/pages/auth/LoginPassword.tsx`
- `frontend/src/pages/auth/SignupEmail.tsx`
- `frontend/src/pages/auth/SignupPassword.tsx`
- `frontend/src/pages/auth/SignupVerifyEmail.tsx`
- `frontend/src/pages/auth/PrivacyConsent.tsx`
- `frontend/src/pages/auth/WelcomeBeta.tsx`
- (Legacy/tek-adım sayfalar) `frontend/src/pages/auth/Login.tsx`, `frontend/src/pages/auth/Signup.tsx`

Not: Auth akışında logo **`Logo` komponenti** ile render edilir; alt metin davranışı canonical olarak `alt="AKIS"`’dir.

---

### 2.3 High-Res Logo Rollout (UI density variants) ✅

Brand Guide canonical set’e göre UI logoları için **1x/2x/3x** density varyantları eklendi ve `Logo` komponenti `srcset` ile density-aware hale getirildi:

- `frontend/src/assets/branding/akis-official-logo.png` (1x)
- `frontend/src/assets/branding/akis-official-logo@2x.png` (2x, mevcut primary)
- `frontend/src/assets/branding/akis-official-logo@3x.png` (3x)

`frontend/src/theme/brand.ts` density kontratı genişletildi (mevcut export’lar kırılmadan) ve `Logo` komponenti aynı surface size kontratını koruyarak uygun density seçimini tarayıcıya bıraktı.

---

## 3. Meta/Favicons Entegrasyonu (Tamamlandı)

Phase 9.2’nin “meta” kısmı tamamlandı:

- **Favicon seti eklendi** (`frontend/public/brand/` altında):
  - `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-512x512.png`
  - **Not:** Meta asset’leri şu an placeholder kaynaklardan üretildi; final asset’ler tasarım ekibi tarafından üretilecek.
  - **Known exception:** `android-chrome-512x512.png` halen placeholder ve hedef dosya boyutunun üzerinde; final asset ile değiştirilecek.
- **Sosyal önizleme görselleri eklendi** (`frontend/public/brand/` altında):
  - `og-image.png`, `twitter-card.png`
  - **Not:** Şu an placeholder kaynaklardan üretildi (boyutlar canonical; final görseller ile değiştirilecek)
- **`frontend/index.html` meta/link tag’leri tamamlandı**:
  - Favicon `<link>` tag’leri eklendi (canonical `/brand/*` path’leri)
  - Open Graph meta tag’leri eklendi (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
  - Twitter Card meta tag’leri eklendi (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)

**Placeholder Notu:** `frontend/public/brand/TEMP_NOTES.md` dosyasında placeholder dosyalarının durumu ve sonraki adımlar belgelenmiştir.

---

## 4. Acceptance Checklist

- [x] UI kaynak kodunda (`frontend/src/**`) **logo amaçlı** `/brand/...` referansı kalmadı.
- [x] Header/Hero/Footer logo render’ı tek kaynağa indirildi: `Logo` komponenti.
- [x] Fragile `onError` fallback zincirleri kaldırıldı (tek source of truth).
- [x] Auth sayfalarında logo eksikleri, minimal değişiklikle `Logo` komponentiyle tamamlandı.
- [x] High-Res Logo Rollout tamamlandı: canonical UI logo density varyantları (1x/2x/3x) mevcut ve `Logo` `srcset` ile wired.
- [x] Meta/favicons çalışması için `/brand` yalnızca public/meta dosyalarına ayrıldı (UI logoları için kullanılmıyor).
- [x] `index.html` favicon + OG/Twitter meta entegrasyonu tamamlandı (canonical `/brand/*` path’leri ile).
- [x] Canonical favicon ve sosyal görsel placeholder’ları mevcut (TEMP_NOTES.md ile işaretli; final asset’ler tasarım ekibi tarafından üretilecek).

---

## 5. Referanslar

- `docs/BRAND_GUIDE.md` — canonical set, klasör politikası ve kullanım kuralları
- `docs/BRAND_ASSET_INVENTORY.md` — audit bulguları (misnamed SVG, orphaned assets, eksik favicon/OG)
- `docs/UI_DESIGN_SYSTEM.md` — logo size kontratı ve optimizasyon hedefleri
- `docs/WEB_INFORMATION_ARCHITECTURE.md` — A11y alt metin ve SEO/meta beklentileri


