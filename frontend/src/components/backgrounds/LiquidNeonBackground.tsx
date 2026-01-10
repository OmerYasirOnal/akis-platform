import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

export interface LiquidNeonBackgroundProps {
  /** Enable/disable the background. Default: true */
  enabled?: boolean;
  /** Intensity level. Default: 'subtle' */
  intensity?: 'subtle' | 'accent' | 'vibrant';
  /** Respect reduced motion preference. Default: true */
  respectReducedMotion?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Liquid Neon Background
 * 
 * AKIS-branded background effect with animated gradient blobs.
 * Uses CSS-only animations for performance on OCI Free Tier.
 * Respects prefers-reduced-motion and provides opt-in control.
 */
export function LiquidNeonBackground({
  enabled = true,
  intensity = 'subtle',
  respectReducedMotion = true,
  className,
}: LiquidNeonBackgroundProps) {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    if (!respectReducedMotion) {
      setShouldAnimate(true);
      return;
    }

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setShouldAnimate(!mediaQuery.matches);
    
    // Check localStorage preference
    const storedPref = localStorage.getItem('akis-reduced-motion');
    if (storedPref !== null) {
      setShouldAnimate(storedPref !== 'true');
    } else {
      setShouldAnimate(!mediaQuery.matches);
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [respectReducedMotion]);

  if (!enabled) return null;

  // Intensity-based opacity multipliers
  const opacityMultiplier = {
    subtle: 1,
    accent: 1.5,
    vibrant: 2,
  }[intensity];

  const baseOpacity = {
    primary: 0.15 * opacityMultiplier,
    secondary: 0.12 * opacityMultiplier,
    tertiary: 0.10 * opacityMultiplier,
    ambient: 0.08 * opacityMultiplier,
  };

  // Cap opacity at reasonable levels
  const clampedOpacity = {
    primary: Math.min(baseOpacity.primary, 0.3),
    secondary: Math.min(baseOpacity.secondary, 0.25),
    tertiary: Math.min(baseOpacity.tertiary, 0.2),
    ambient: Math.min(baseOpacity.ambient, 0.15),
  };

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 -z-10 overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      {/* Primary blob - top left */}
      <div
        className={cn(
          'absolute -left-32 -top-32 h-96 w-96 rounded-full bg-ak-primary blur-blob',
          shouldAnimate && 'animate-blob-drift'
        )}
        style={{
          opacity: clampedOpacity.primary,
          willChange: shouldAnimate ? 'transform, opacity' : 'auto',
        }}
      />

      {/* Secondary blob - top right */}
      <div
        className={cn(
          'absolute -right-24 top-16 h-80 w-80 rounded-full bg-ak-primary blur-blob',
          shouldAnimate && 'animate-blob-drift-alt'
        )}
        style={{
          opacity: clampedOpacity.secondary,
          animationDelay: '-5s',
          willChange: shouldAnimate ? 'transform, opacity' : 'auto',
        }}
      />

      {/* Tertiary blob - bottom center */}
      <div
        className={cn(
          'absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-ak-primary blur-blob',
          shouldAnimate && 'animate-blob-drift'
        )}
        style={{
          opacity: clampedOpacity.tertiary,
          animationDelay: '-10s',
          animationDuration: '22s',
          willChange: shouldAnimate ? 'transform, opacity' : 'auto',
        }}
      />

      {/* Ambient blob - mid left (hidden on mobile for performance) */}
      <div
        className={cn(
          'absolute left-0 top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-full bg-ak-primary blur-blob md:block',
          shouldAnimate && 'animate-blob-drift-alt'
        )}
        style={{
          opacity: clampedOpacity.ambient,
          animationDelay: '-8s',
          animationDuration: '28s',
          willChange: shouldAnimate ? 'transform, opacity' : 'auto',
        }}
      />

      {/* Edge blob - bottom right (hidden on mobile/tablet for performance) */}
      <div
        className={cn(
          'absolute -bottom-16 -right-16 hidden h-56 w-56 rounded-full bg-ak-primary blur-blob lg:block',
          shouldAnimate && 'animate-blob-drift'
        )}
        style={{
          opacity: clampedOpacity.ambient,
          animationDelay: '-15s',
          animationDuration: '30s',
          willChange: shouldAnimate ? 'transform, opacity' : 'auto',
        }}
      />
    </div>
  );
}

export default LiquidNeonBackground;
