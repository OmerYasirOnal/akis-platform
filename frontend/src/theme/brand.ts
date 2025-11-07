/**
 * AKIS Brand Asset Paths
 * 
 * Centralized source of truth for brand asset references.
 * All components should import logo paths from here to avoid path inconsistencies.
 */

// Primary logo (transparent PNG)
import logoPng from '../assets/branding/akis-logo.png';

/**
 * Primary logo path (PNG, transparent background)
 * Use this for standard resolution displays
 */
export const logoPath = logoPng;

/**
 * High-DPI logo path (PNG @2x, if available)
 * Note: If akis-logo@2x.png exists, it should be imported here
 * For now, using the regular logo for all resolutions
 */
export const logoPath2x: string | null = null;

/**
 * Logo alt text
 */
export const logoAlt = 'AKIS';

/**
 * Logo default size (height in pixels)
 * Desktop: ~24-28px, Mobile: ~20-24px
 */
export const logoDefaultHeight = {
  desktop: 28, // ~h-7 in Tailwind (28px)
  mobile: 24,  // ~h-6 in Tailwind (24px)
} as const;

