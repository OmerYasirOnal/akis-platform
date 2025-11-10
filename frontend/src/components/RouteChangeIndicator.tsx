import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * RouteChangeIndicator - Tracks route changes for UI feedback
 * Provides `isNavigating` state that can be consumed by other components
 * (e.g., Header logo spin animation)
 */
let isNavigatingState = false;
const subscribers = new Set<() => void>();

const notifySubscribers = () => {
  subscribers.forEach((callback) => callback());
};

export const setIsNavigating = (value: boolean) => {
  if (isNavigatingState !== value) {
    isNavigatingState = value;
    notifySubscribers();
  }
};

export const useRouteChangeIndicator = () => {
  const [isNavigating, setIsNavigatingLocal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Subscribe to global state changes
    const callback = () => {
      setIsNavigatingLocal(isNavigatingState);
    };
    subscribers.add(callback);
    setIsNavigatingLocal(isNavigatingState);

    return () => {
      subscribers.delete(callback);
    };
  }, []);

  useEffect(() => {
    // Set navigating state on route change
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return; // Skip animation
    }

    setIsNavigating(true);
    setIsNavigatingLocal(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
      setIsNavigatingLocal(false);
    }, 400); // Match transition duration

    return () => {
      clearTimeout(timer);
      setIsNavigating(false);
      setIsNavigatingLocal(false);
    };
  }, [location.key]);

  return isNavigating;
};

