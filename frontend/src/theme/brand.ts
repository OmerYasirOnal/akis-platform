export const LOGO_PNG_HERO = "/src/assets/branding/akis-official-logo@2x.png";
export const LOGO_PNG_TRANSPARENT = "/src/assets/branding/akis-official-logo@2x.png";
/**
 * Canonical UI logo density variants (single source of truth).
 *
 * Notes:
 * - UI logos must come from `src/assets/branding/` (NOT `/brand/*`).
 * - Keep `LOGO_PNG_HERO` and `LOGO_PNG_TRANSPARENT` stable for backwards compatibility.
 */
export const LOGO_PNG_1X = "/src/assets/branding/akis-official-logo.png";
export const LOGO_PNG_2X = LOGO_PNG_HERO;
export const LOGO_PNG_3X = "/src/assets/branding/akis-official-logo@3x.png";
export const LOGO_ALT = "AKIS";

export const LOGO_SIZES = {
  hero: 112,
  nav: 32,   // Increased from 24 for better visibility in navigation
  sm: 24,    // Increased from 20 for better legibility
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;

