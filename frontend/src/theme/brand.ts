/**
 * Canonical UI logo density variants (single source of truth).
 *
 * Resolved via `new URL(path, import.meta.url)` to produce correct
 * hashed-asset URLs in both Vite dev-server AND production builds.
 * The paths must be relative to THIS file (src/theme/brand.ts).
 */

// ─── Full logo (A mark + AKIS text) ────────────────
export const LOGO_PNG_1X = new URL('../assets/branding/akis-official-logo.png', import.meta.url).href;
export const LOGO_PNG_2X = new URL('../assets/branding/akis-official-logo@2x.png', import.meta.url).href;
export const LOGO_PNG_3X = new URL('../assets/branding/akis-official-logo@3x.png', import.meta.url).href;
export const LOGO_PNG_HERO = LOGO_PNG_2X;
export const LOGO_PNG_TRANSPARENT = LOGO_PNG_2X;

// ─── A Mark only (properly cropped, new assets) ────
export const LOGO_MARK_SVG = new URL('../assets/branding/akis-mark.svg', import.meta.url).href;
export const LOGO_MARK_512 = new URL('../assets/branding/akis-mark-512.png', import.meta.url).href;
export const LOGO_MARK_1024 = new URL('../assets/branding/akis-mark-1024.png', import.meta.url).href;

// Legacy aliases (keep for backward compat)
export const LOGO_A_MARK_PNG_1X = LOGO_MARK_512;
export const LOGO_A_MARK_PNG_2X = LOGO_MARK_1024;
export const LOGO_A_MARK_PNG_3X = LOGO_MARK_1024;
export const LOGO_A_MARK_PNG = LOGO_MARK_512;

export const LOGO_ALT = "AKIS";

export const LOGO_SIZES = {
  hero: 120,  // Landing page hero — clamp(72px, 12vw, 120px)
  nav: 36,    // Main navigation bar
  sm: 28,     // Compact: auth pages, footers, sidebar
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;
