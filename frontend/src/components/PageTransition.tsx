import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * PageTransition - Lightweight crossfade/blur wrapper for route content
 * Uses transform/opacity only for 60fps performance
 * Respects prefers-reduced-motion
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [key, setKey] = useState(location.key);

  useEffect(() => {
    if (location.key !== key) {
      setIsTransitioning(true);
      
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = prefersReducedMotion ? 0 : 250;

      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setKey(location.key);
        setIsTransitioning(false);
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    } else {
      setDisplayChildren(children);
    }
  }, [location.key, children, key]);

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (prefersReducedMotion) {
    return <>{displayChildren}</>;
  }

  return (
    <div
      className={cn(
        'transition-opacity duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        isTransitioning ? 'opacity-0' : 'opacity-100'
      )}
      style={{
        willChange: isTransitioning ? 'opacity' : 'auto',
      }}
    >
      {displayChildren}
    </div>
  );
}

