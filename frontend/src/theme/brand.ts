/**
 * Canonical UI logo density variants (single source of truth).
 *
 * Resolved via `new URL(path, import.meta.url)` to produce correct
 * hashed-asset URLs in both Vite dev-server AND production builds.
 * The paths must be relative to THIS file (src/theme/brand.ts).
 */
export const LOGO_PNG_1X = new URL('../assets/branding/akis-official-logo.png', import.meta.url).href;
export const LOGO_PNG_2X = new URL('../assets/branding/akis-official-logo@2x.png', import.meta.url).href;
export const LOGO_PNG_3X = new URL('../assets/branding/akis-official-logo@3x.png', import.meta.url).href;
export const LOGO_A_MARK_PNG_1X = new URL('../assets/branding/akis-a-mark.png', import.meta.url).href;
export const LOGO_A_MARK_PNG_2X = new URL('../assets/branding/akis-mark@2x.png', import.meta.url).href;
export const LOGO_A_MARK_PNG_3X = new URL('../assets/branding/akis-mark@3x.png', import.meta.url).href;
export const LOGO_A_MARK_PNG = LOGO_A_MARK_PNG_1X;
export const LOGO_PNG_HERO = LOGO_PNG_2X;
export const LOGO_PNG_TRANSPARENT = LOGO_PNG_2X;
export const LOGO_ALT = "AKIS";

export const LOGO_SIZES = {
  hero: 120,  // Landing page hero — clamp(72px, 12vw, 120px)
  nav: 36,    // Main navigation bar
  sm: 28,     // Compact: auth pages, footers, sidebar
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;
