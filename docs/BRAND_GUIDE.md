# AKIS Platform — Brand Guide (Single Source of Truth)

**Doküman Versiyonu:** v1.0  
**Hazırlanma Tarihi:** Aralık 2025  
**Amaç:** AKIS marka varlıklarının (logo, favicon, sosyal önizleme) **canonical set** tanımı, dosya/format kuralları, kullanım yüzeyleri ve governance

---

## 1. Kapsam ve Non-Goals

- **Bu doküman ne yapar?**
  - **Canonical** AKIS marka varlık setini tanımlar (hangi dosya, hangi format, nerede durur, nerede kullanılır).
  - Frontend’de logo kullanımını **tek kaynak** üzerinden standardize eden kuralları belirler.
  - A11y + SEO/meta beklentileri (alt metinleri, OG/Twitter görselleri, favicon) için standart koyar.
  - Legacy varlıkları ve kaldırma (deprecation) politikasını tanımlar.

- **Bu doküman ne yapmaz?**
  - ❌ Yeni logo tasarlamaz, renk/shape değiştirmez, rebrand yapmaz.
  - ❌ Uygulama kodunu değiştirmez (bu doküman governance içindir).

---

## 2. Mevcut Durum ve Audit Bulguları (Zorunlu Gerçekler)

Bu bölüm **mevcut envanter** ve proje dokümanlarına dayanır.

### 2.1 Kritik Bulgular (Bugünkü durum)

- **Yanlış uzantı / yanlış format**: `frontend/src/assets/branding/akis-logo.svg` dosyası **gerçekte PNG** (misnamed).  
- **Orphaned assets**: Aşağıdaki dosyalar frontend’de **hiçbir yerde kullanılmıyor**:
  - `frontend/public/brand/akis-logo-flat.png`
  - `frontend/src/assets/branding/akis-logo.png`
  - `frontend/src/assets/branding/akis-logo@2x.png`
  - `frontend/src/assets/branding/akis-logo.svg` (misnamed PNG)
- **Kullanım yolu tutarsızlığı**: Bazı yerler `/brand/...` (public URL) ile, bazı yerler `src/assets/branding/...` (import edilen asset) ile logo çekiyor.
- **Favicon eksik**: `frontend/index.html` içinde favicon linkleri yok; ayrıca canonical favicon dosyaları da yok.
- **Sosyal önizleme eksik**: OG (`og:image`) ve Twitter (`twitter:image`) görselleri ve meta tag standartları **dokümanlarda tanımlı**, ama projede canonical görseller yok.

### 2.2 Dokümanlarla uyum gereklilikleri

- **Design System (logo)**:
  - Birincil logo dosyası: `frontend/src/assets/branding/akis-official-logo@2x.png`
  - @3x varyantı: Phase 9.2’de eklenecek
  - Logo boyut kontratı: `hero=112px (clamp 72→112)`, `nav=24px`, `sm=20px`
  - Görsel optimizasyon hedefi: **Logo asset < 20 KB** ve **@1x/@2x stratejisi**
  - `loading="lazy"` + `decoding="async"` (hero’da eager kullanılabilir)
- **IA / A11y / SEO**:
  - Logo alt metni: **`alt="AKIS"`**
  - Dekoratif görsel: **`alt=""`**
  - OG/Twitter örnekleri: `og:image` ve `twitter:image` ile sosyal kart standardı

---

## 3. Canonical Brand Asset Set (Minimum Professional Set)

AKIS için **minimum profesyonel canonical set**, hem ürün içi UI (import edilen varlıklar) hem de public/meta (favicon + sosyal kart) için aşağıdaki gruplardan oluşur:

### 3.1 Logo varyantları (UI içinde kullanılacak)

- **Primary lockup (ikon + wordmark)**: Ürünün ana logosu (default).
- **Icon / mark-only**: Dar alanlar ve küçük boyutlar (ör. sidebar/mini badge).
- **Wordmark-only**: Yatay alanlarda metin ağırlıklı kullanım (ör. geniş header).
- **Monochrome variants (light/dark)**:
  - **mono-light**: koyu zemin üzerinde tek renk (beyaz/açık)
  - **mono-dark**: açık zemin üzerinde tek renk (siyah/koyu)

> Not: Mevcut projede `akis-official-logo@2x.png` “primary lockup” rolünü üstleniyor. Diğer varyantlar (mark-only, wordmark-only, mono) Phase 9.2 kapsamında canonical set’e tamamlanacak.

### 3.2 Favicon set (public/meta)

Favicon set’i **tarayıcı/OS** seviyesinde kullanılır ve build pipeline’ına import edilmez; bu yüzden **public** altında yaşamalıdır.

- **Zorunlu boyutlar** (Design System): `16x16`, `32x32`, `180x180`, `512x512` + `.ico`
- **Kaynak**: Icon/mark-only varyantından üretilmeli (lockup değil).
- **Arka plan**: Şeffaf PNG (RGBA) tercih edilir; ICO içinde de şeffaflık desteklenmelidir.

### 3.3 Sosyal önizleme görselleri (public/meta)

Sosyal önizleme (Open Graph/Twitter) görselleri **public URL** olmalı ve meta tag’lerde referanslanmalıdır.

- **Open Graph**: `og-image.png` (önerilen: `1200x630`)
- **Twitter Card**: `twitter-card.png` (önerilen: `1200x600` veya `1200x630`)
- **Arka plan**: Brand dark (örn. `ak-bg`) üzerinde yüksek kontrastlı lockup/wordmark
- **Alt metin**: Meta tag’ler alt text taşımaz; görsel üstündeki metin okunabilir olmalı

---

## 4. Klasör Politikası: Public vs Imported Assets

Bu repo içinde marka varlıklarını iki ana sınıfa ayırıyoruz:

### 4.1 `frontend/src/assets/branding/` (Imported app assets)

- **Ne girer?**
  - Uygulama UI içinde React üzerinden render edilen **logo/marka** varlıkları (lockup, mark-only, wordmark-only, mono varyantları).
- **Nasıl kullanılır?**
  - **Sadece import (Vite asset pipeline)** veya `Logo` komponenti üzerinden.
  - Doğrudan `/brand/...` URL ile kullanılmaz.
- **Neden?**
  - Hash’lenmiş asset yönetimi, cache busting, tree-shaking ve referans kontrolü.

### 4.2 `frontend/public/brand/` (Public URLs, metadata, favicons)

- **Ne girer?**
  - **Favicon seti** (ICO + PNG’ler)
  - **Sosyal önizleme görselleri** (`og-image.png`, `twitter-card.png`)
  - (Opsiyonel) “Press-kit” gibi dış dünyaya servis edilecek statik dosyalar
- **Nasıl kullanılır?**
  - `index.html` meta/link tag’leri üzerinden veya dış linklerde `https://.../brand/...` URL’leriyle.
- **Ne girmez?**
  - Uygulama içinde kullanılan primary logo kopyaları (UI logoları `src/assets/branding/`’de olmalı).

---

## 5. Canonical Dosya Adları ve Format Kuralları

### 5.1 İsimlendirme standardı

- **Prefix**: tüm dosyalar `akis-` ile başlar.
- **Varyant isimleri**:
  - `official-logo` = primary lockup (ikon + wordmark)
  - `official-mark` = icon/mark-only
  - `official-wordmark` = wordmark-only
  - `mono-light` / `mono-dark` = tek renk varyantlar
- **Density**:
  - `@2x`, `@3x` suffix’i retina yoğunluklarını belirtir.
  - `@1x` için suffix kullanılmaz (örn. `akis-official-logo.png`).
- **Format-uzantı doğruluğu**:
  - **Dosya uzantısı formatla eşleşmek zorunda.**
  - Envanterdeki mevcut hata: `akis-logo.svg` aslında PNG (bu, policy ihlalidir).

### 5.2 Format standardı

- **UI logoları**: PNG (RGBA, şeffaf) veya gerçek SVG (vector)  
  - Eğer SVG kullanılırsa, dosya **gerçek SVG** olmalıdır (PNG içeremez).
- **Favicon**: `favicon.ico` (multi-size) + PNG boyutları
- **Sosyal görseller**: PNG (opaque background; platform uyumluluğu için)

---

## 6. Canonical Asset Tablosu (Acceptance Criteria için zorunlu)

Bu tablo **tek kaynak**tır. Bu tabloda olmayan bir marka dosyası, `frontend/` altında **kalıcı** olamaz.

> Boyut hedefleri: Design System’e göre logo asset hedefi **< 20 KB**. Pratikte lockup/mono/mark varyantlarında hedefler aşağıdaki gibi belirlenmiştir.

### 6.1 Canonical UI Logo Assets (`frontend/src/assets/branding/`)

| Canonical dosya adı | Format | Yoğunluk | Hedef dosya boyutu | Transparan | Kullanım (surface) | Not |
|---|---|---:|---:|---|---|---|
| `akis-official-logo.png` | PNG | 1x | ≤ 20 KB | ✅ | `Logo` default (hero/nav/sm) | ✅ Mevcut (drop-in; final logo ile overwrite edilebilir) |
| `akis-official-logo@2x.png` | PNG | 2x | ≤ 40 KB | ✅ | `Logo` default (hero/nav/sm) | **Mevcut** ama optimize edilmeli |
| `akis-official-logo@3x.png` | PNG | 3x | ≤ 60 KB | ✅ | High-DPI fallback | ✅ Mevcut (drop-in; final logo ile overwrite edilebilir) |
| `akis-official-mark.png` | PNG | 1x | ≤ 12 KB | ✅ | Çok küçük alanlar, favicon kaynağı | Phase 9.2 |
| `akis-official-mark@2x.png` | PNG | 2x | ≤ 24 KB | ✅ | Çok küçük alanlar | Phase 9.2 |
| `akis-official-wordmark.png` | PNG | 1x | ≤ 20 KB | ✅ | Geniş yatay kullanım (opsiyonel) | Phase 9.2 |
| `akis-official-wordmark@2x.png` | PNG | 2x | ≤ 40 KB | ✅ | Geniş yatay kullanım (opsiyonel) | Phase 9.2 |
| `akis-official-logo-mono-light.png` | PNG | 1x | ≤ 20 KB | ✅ | Koyu zeminde tek renk | Phase 9.2 |
| `akis-official-logo-mono-dark.png` | PNG | 1x | ≤ 20 KB | ✅ | Açık zeminde tek renk | Phase 9.2 |

### 6.2 Canonical Public/Meta Assets (`frontend/public/brand/`)

| Canonical dosya adı | Format | Piksel | Hedef dosya boyutu | Transparan | Kullanım | Not |
|---|---|---:|---:|---|---|---|
| `favicon.ico` | ICO | multi | ≤ 15 KB | ✅ | Browser favicon | Phase 9.2 |
| `favicon-16x16.png` | PNG | 16x16 | ≤ 2 KB | ✅ | Browser tab fallback | Phase 9.2 |
| `favicon-32x32.png` | PNG | 32x32 | ≤ 4 KB | ✅ | Browser tab fallback | Phase 9.2 |
| `apple-touch-icon.png` | PNG | 180x180 | ≤ 15 KB | ✅ | iOS home screen | Phase 9.2 |
| `android-chrome-512x512.png` | PNG | 512x512 | ≤ 30 KB | ✅ | PWA/Android | Phase 9.2 |
| `og-image.png` | PNG | 1200x630 | ≤ 200 KB | ❌ | Open Graph | Phase 9.2 |
| `twitter-card.png` | PNG | 1200x600 (veya 1200x630) | ≤ 200 KB | ❌ | Twitter Card | Phase 9.2 |

---

## 7. Kullanım Yüzeyleri (Usage Surfaces) ve Boyut Kontratı

Bu bölüm, mevcut `Logo` komponenti boyut kontratıyla birebir uyumlu olmalıdır.

### 7.1 `Logo` komponenti kontratı (mevcut)

- **hero**: CSS `height: clamp(72px, 12vw, 112px)`
- **nav**: `24px`
- **sm**: `20px`

### 7.2 Surface → size → varyant kuralı

- **Hero (Landing / agent hero / marketing hero)**
  - **size**: `hero`
  - **varyant**: **primary lockup**
  - **alt**: `AKIS`
  - **loading**: `eager`
  - **decoding**: `async`

- **Header/Navigation**
  - **size**: `nav`
  - **varyant**: primary lockup (default) veya wordmark-only (opsiyonel, Phase 9.2)
  - **alt**: `AKIS` (veya bağlama göre `AKIS Platform` *yalnızca SEO gerekçesi varsa*; default `AKIS`)
  - **loading**: `lazy`
  - **decoding**: `async`

- **Footer/Utility**
  - **size**: `sm`
  - **varyant**: primary lockup veya mark-only (alan darsa)
  - **alt**: `AKIS`
  - **loading**: `lazy`
  - **decoding**: `async`

- **Dekoratif tekrarlar (ör. “logo wall”, placeholder marka listeleri)**
  - **alt**: `""` (boş)
  - Eğer yanında isim metni zaten varsa, tekrar eden logolar dekoratif sayılır.

---

## 8. Accessibility (A11y) Kuralları

### 8.1 Alt metin standardı

- **AKIS logo (bilgilendirici)**: `alt="AKIS"` (canonical)
- **Dekoratif görsel**: `alt=""` ve mümkünse `aria-hidden="true"`
- **Logo link ise**:
  - Link metni yoksa `aria-label="AKIS"` eklenebilir (ama alt metin zaten “AKIS” ise gereksiz tekrar yapmayın).

### 8.2 Renk/kontrast

- Logo, `ak-bg` üzerinde kullanılmalı; mono varyant seçimi zemine göre yapılmalı (dark vs light).

---

## 9. SEO / Meta Kuralları (OG + Twitter)

### 9.1 Canonical dosya konumu ve URL kuralı

- Sosyal görseller ve faviconlar `frontend/public/brand/` altında tutulur ve prod ortamında şu şekilde servis edilir:
  - `https://<DOMAIN>/brand/og-image.png`
  - `https://<DOMAIN>/brand/twitter-card.png`
  - `https://<DOMAIN>/brand/favicon.ico`

### 9.2 Meta tag standardı (örnek)

> Not: IA dokümanında OG/Twitter örnekleri bulunur; bu projede canonical path `"/brand/..."` olarak standardize edilmiştir.

- **Open Graph**:
  - `og:title`, `og:description`, `og:url`, `og:image`
- **Twitter**:
  - `twitter:card=summary_large_image`
  - `twitter:title`, `twitter:description`, `twitter:image`

---

## 10. Performans / Görsel Optimizasyon Kuralları

### 10.1 Dosya boyutu hedefleri

- **Logo (PNG)**: hedef **< 20 KB** (Design System kuralı)
- **Sosyal kart**: hedef **≤ 200 KB**
- Bu hedefler sağlanamıyorsa:
  - Önce **asset optimizasyonu** (ImageOptim/Squoosh) uygulanır.
  - Gerekirse boyut/renk sayısı azaltılır (logo görsel bütünlüğü bozulmadan).

### 10.2 @1x/@2x stratejisi

- UI logoları için **en az** `@1x` ve `@2x` sağlanmalıdır.
- `@3x` opsiyoneldir ama Phase 9.2 deliverable’ıdır (Design System).

### 10.3 Loading/decoding standardı

- Hero logo: `loading="eager" decoding="async"`
- Diğer tüm logolar: `loading="lazy" decoding="async"`

---

## 11. Deprecation Policy (Legacy varlıklar)

### 11.1 “Legacy” tanımı

Aşağıdaki dosyalar **canonical değildir** ve Phase 9.2 rollout ile kaldırılmalıdır:

- `frontend/public/brand/akis-logo.png`
- `frontend/public/brand/akis-logo-horizontal.png`
- `frontend/public/brand/akis-logo-flat.png` (**orphaned**)
- `frontend/public/brand/akis-icon.png`
- `frontend/src/assets/branding/akis-logo.png` (**orphaned**)
- `frontend/src/assets/branding/akis-logo@2x.png` (**orphaned**)
- `frontend/src/assets/branding/akis-logo.svg` (**misnamed PNG + orphaned**)

### 11.2 Arşivleme/kaldırma akışı

- **Sprint içi**: önce tüm referanslar canonical set’e taşınır (kod değişikliği).
- **Sonra**:
  - Legacy dosyalar **frontend build path’inden** kaldırılır (silinir).
  - Eğer “tarihsel referans” gerekirse, ayrı bir yerde saklanır: `docs/brand/legacy/` (opsiyonel; build’e girmez).

---

## 12. Duplicate Önleme (Governance)

### 12.1 Yeni asset ekleme kuralı

- Yeni bir marka görseli eklemek için:
  - `docs/BRAND_GUIDE.md` tablosu güncellenmeli (canonical listeye eklenmeli)
  - `docs/BRAND_ASSET_INVENTORY.md` güncellenmeli (audit)
  - Dosya uzantısı/format uyumu doğrulanmalı (örn. `.svg` gerçekten SVG olmalı)

### 12.2 PR Review Checklist (Brand)

- [ ] Dosya adı ve uzantısı doğru mu? (`.svg` gerçekten SVG mi?)
- [ ] Aynı varlığın duplicate varyantı var mı?
- [ ] Dosya boyutu hedefleri sağlandı mı? (logo <20KB hedefi)
- [ ] UI tarafında logo kullanımı **sadece** `Logo` komponenti üzerinden mi?
- [ ] Public tarafta sadece favicon + OG/Twitter görselleri mi var?
- [ ] A11y: `alt="AKIS"` ve dekoratifte `alt=""` kuralı uygulandı mı?

---

## 13. Phase 9.2 Rollout — Migration Checklist (Acceptance)

### 13.1 Minimum kabul kriterleri

- [ ] Canonical asset tablosundaki **tüm** dosyalar repo’da mevcut (ve doğru klasörde)
- [ ] `akis-logo.svg` problemi çözülmüş (format/uzantı uyumlu)
- [ ] Orphaned/legacy asset’ler frontend build path’inden kaldırılmış
- [ ] Uygulama içinde logo referansları **tek kaynak**: `Logo` komponenti + `frontend/src/theme/brand.ts`
- [ ] `frontend/index.html` favicon + OG/Twitter meta tag’leri içeriyor
- [ ] `og-image.png` ve `twitter-card.png` prod URL standardına uygun

### 13.2 Uygulama adımları (özet)

- **Logo standardizasyonu**
  - [ ] Header/Hero/Footer gibi yerlerde `/brand/...` ile logo çekme kaldırılır; `Logo` komponenti kullanılır
  - [ ] Auth akışlarındaki “AKIS Logo - Small/Large” beklentisi karşılanır (logo eklenir)
- **Public/meta**
  - [ ] Favicon seti eklenir (`/brand/favicon...`)
  - [ ] Sosyal görseller eklenir (`/brand/og-image.png`, `/brand/twitter-card.png`)
- **Cleanup**
  - [ ] Legacy dosyalar silinir veya `docs/brand/legacy/` altına taşınır (opsiyonel)

---

## 14. Referanslar

- `docs/BRAND_ASSET_INVENTORY.md` — mevcut durum ve sorunlar
- `docs/UI_DESIGN_SYSTEM.md` — logo ölçüleri, optimizasyon hedefleri, loading/decoding
- `docs/WEB_INFORMATION_ARCHITECTURE.md` — A11y alt metin, SEO meta/OG/Twitter beklentileri


