# Canonical Public/Meta Brand Assets (Phase 9.2)

**Durum:** Optimize edilmiş, canonical boyutlarda ve formatlarda  
**Güncelleme Tarihi:** Aralık 2025  
**Amaç:** Phase 9.2 meta/favicon rollout için canonical asset set'i

## Optimize Edilmiş Canonical Dosyalar

Aşağıdaki dosyalar **canonical boyutlarda ve formatlarda** optimize edilmiştir:

### Favicon Set
- `favicon.ico` — **3.3KB** (32x32 ICO, hedef ≤15KB ✅)
- `favicon-16x16.png` — **610B** (16x16 PNG, hedef ≤2KB ✅)
- `favicon-32x32.png` — **1.4KB** (32x32 PNG, hedef ≤4KB ✅)
- `apple-touch-icon.png` — **23KB** (180x180 PNG, hedef ≤15KB ⚠️ biraz büyük ama kabul edilebilir)
- `android-chrome-512x512.png` — **220KB** (512x512 PNG, hedef ≤30KB ❌ placeholder, final asset'te optimize edilmeli)

### Sosyal Önizleme Görselleri
- `og-image.png` — **103KB** (1200x630 PNG, hedef ≤200KB ✅)
- `twitter-card.png` — **99KB** (1200x600 PNG, hedef ≤200KB ✅)

## Notlar ve Kalan İşler

### ✅ Tamamlananlar
- Tüm favicon'lar doğru boyutlara resize edildi
- `favicon.ico` gerçek ICO formatına dönüştürüldü (32x32 single-size, multi-size için gelecekte optimize edilebilir)
- Sosyal görseller doğru boyutlara resize edildi (1200x630 OG, 1200x600 Twitter)
- Dosya boyutları çoğunlukla hedeflere uygun (favicon set <15KB toplam, sosyal görseller <200KB)

### ⚠️ Kalan Optimizasyonlar
- `android-chrome-512x512.png` hala 220KB (hedef ≤30KB). Bu dosya placeholder'dan üretildiği için, final brand asset tasarımı ile birlikte daha agresif optimizasyon yapılabilir.
- `apple-touch-icon.png` 23KB (hedef ≤15KB). Kabul edilebilir ama final asset'te optimize edilebilir.
- `favicon.ico` şu an single-size (32x32). Multi-size ICO (16x16, 32x32 içeren) için gelecekte optimize edilebilir, ancak mevcut versiyon çalışır durumda.

### 📝 Final Asset Beklentileri
Bu dosyalar şu an mevcut brand asset'lerinden üretilmiş placeholder'lardır. Final brand asset tasarımı hazır olduğunda:
1. Tasarım ekibi tarafından üretilen final asset'lerle değiştirilmeli
2. Final asset'lerde dosya boyutu hedefleri tam olarak karşılanmalı
3. `android-chrome-512x512.png` özellikle optimize edilmeli (≤30KB hedef)

## Referans

- `docs/BRAND_GUIDE.md` — canonical dosya isimleri ve boyut hedefleri
- `docs/BRAND_ASSET_INVENTORY.md` — güncel asset envanteri

