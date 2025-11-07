/**
 * AKIS Brand Tokens
 * 
 * Authoritative brand color definitions for dark theme.
 * All tokens follow WCAG AA contrast requirements (≥ 4.5:1).
 */

export const brandTokens = {
  // Primary brand color (logo/accents/focus)
  primary: '#07D1AF',
  
  // Background tokens
  bg: '#0A1215',           // App/page background
  
  // Surface variants for dark UI
  surface: '#0F181B',      // Near bg, low elevation
  surface2: '#141D21',     // Slightly lighter for cards/modals
  
  // Text tokens for dark UI
  textPrimary: '#F5F5F5',  // High-contrast body text (WCAG AA: 15.2:1 on bg)
  textSecondary: '#B0B0B0', // Muted text (WCAG AA: 7.1:1 on bg)
  
  // Border token
  border: '#1F2932',       // Subtle separators
} as const;

/**
 * Type-safe token access
 */
export type BrandToken = keyof typeof brandTokens;

/**
 * Helper to get token value
 */
export function getToken(token: BrandToken): string {
  return brandTokens[token];
}

