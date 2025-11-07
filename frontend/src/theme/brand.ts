/**
 * AKIS Brand Asset Registry
 *
 * Tek bir kaynaktan logo yollarını ve meta verilerini sağlar.
 * Tüm bileşenler bu dosyadan tüketmelidir.
 */

import logoPng from '../assets/branding/akis-logo.png';

/**
 * Ana logo (PNG, şeffaf arka plan)
 */
export const AKIS_LOGO_URL = logoPng;

/**
 * Yüksek DPI varyasyonu hazır olduğunda bu sabite güncellenmelidir.
 * Şimdilik tek çözünürlük kullanılmaktadır.
 */
export const AKIS_LOGO_2X_URL: string | null = null;

/**
 * Erişilebilirlik için alt metin
 */
export const AKIS_LOGO_ALT = 'AKIS';

/**
 * Standart yükseklikler (px)
 */
export const AKIS_LOGO_DEFAULT_HEIGHT = {
  desktop: 28,
  mobile: 24,
} as const;

/**
 * Landing kahraman bölümünde önerilen logo yüksekliği (px).
 * Masaüstünde ~112px (≈ h-28), mobilde daha küçük ölçekte hizalanır.
 */
export const AKIS_LOGO_HERO_HEIGHT = 112;

