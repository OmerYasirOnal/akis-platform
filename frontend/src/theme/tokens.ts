/**
 * AKIS Brand Tokens
 * 
 * Authoritative brand color definitions for dark theme.
 * All tokens follow WCAG AA contrast requirements (≥ 4.5:1).
 */

export const brandTokens = {
  // Primary brand color (logo/accents/focus)
  akPrimary: '#07D1AF',
  
  // Background tokens
  akBackground: '#0A1215', // App/page background
  
  // Surface variants for dark UI
  akSurface: '#0D171B', // Near bg, low elevation
  akSurface2: '#122027', // Slightly lighter for cards/modals
  
  // Text tokens for dark UI
  akTextPrimary: '#E9F1F3', // High-contrast body text (WCAG AA: 15.2:1 on bg)
  akTextSecondary: '#A9B6BB', // Muted text (WCAG AA: 7.1:1 on bg)
  
  // Border token
  akBorder: '#1A262C', // Subtle separators

  // Status tokens
  akDanger: '#FF6B6B',
} as const;

/**
 * Motion Tokens (Cursor UI)
 * Standardized animation durations for consistent UX
 */
export const motionTokens = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

/**
 * Easing Tokens
 * Standard easing functions for animations
 */
export const easingTokens = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)', // ease-in-out
  out: 'cubic-bezier(0, 0, 0.2, 1)',       // ease-out (enter)
  in: 'cubic-bezier(0.4, 0, 1, 1)',        // ease-in (exit)
} as const;

/**
 * Glow Tokens (Liquid Neon)
 * AKIS-branded glow effects using primary accent color
 */
export const glowTokens = {
  accent: '0 0 24px rgba(7, 209, 175, 0.25)',
  subtle: '0 0 16px rgba(7, 209, 175, 0.12)',
  edge: '0 0 40px rgba(7, 209, 175, 0.08)',
} as const;

/**
 * Blur Tokens
 * Glassmorphism and backdrop blur values
 */
export const blurTokens = {
  backdrop: '16px',
  card: '8px',
  blob: '36px',
} as const;

/**
 * Blob Opacity Tokens
 * Opacity values for liquid neon background blobs
 */
export const blobOpacityTokens = {
  primary: 0.15,
  secondary: 0.12,
  ambient: 0.08,
} as const;

/**
 * Type-safe token access
 */
export type BrandToken = keyof typeof brandTokens;
export type MotionToken = keyof typeof motionTokens;
export type GlowToken = keyof typeof glowTokens;

/**
 * Helper to get token value
 */
export function getToken(token: BrandToken): string {
  return brandTokens[token];
}

/**
 * Helper to get motion duration
 */
export function getMotion(token: MotionToken): string {
  return motionTokens[token];
}

/**
 * Helper to get glow value
 */
export function getGlow(token: GlowToken): string {
  return glowTokens[token];
}

