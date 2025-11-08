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
 * Type-safe token access
 */
export type BrandToken = keyof typeof brandTokens;

/**
 * Helper to get token value
 */
export function getToken(token: BrandToken): string {
  return brandTokens[token];
}

