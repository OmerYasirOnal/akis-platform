import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
}

/**
 * Hook to reveal content on scroll with fade-in + translate animation.
 * Respects prefers-reduced-motion by skipping animations.
 */
export function useScrollReveal(options: UseScrollRevealOptions = {}) {
  const { threshold = 0.1, rootMargin = '0px 0px -40px 0px', delay = 0 } = options;
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setRevealed(true);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            timeoutId = setTimeout(() => setRevealed(true), delay);
            break;
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [threshold, rootMargin, delay]);

  return { ref, revealed };
}
