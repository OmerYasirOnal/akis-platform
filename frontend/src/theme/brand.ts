export const LOGO_PNG_HERO = "/src/assets/branding/akis-official-logo@2x.png";
export const LOGO_PNG_TRANSPARENT = "/src/assets/branding/akis-official-logo@2x.png";
export const LOGO_ALT = "AKIS";

export const LOGO_SIZES = {
  hero: 112,
  nav: 24,
  sm: 20,
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;

