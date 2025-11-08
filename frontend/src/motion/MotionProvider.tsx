import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import {
  MOTION_FEATURE_FLAGS,
  type MotionFeatureFlags,
  type MotionFeatureKey,
} from './motion.config';

type MotionContextValue = {
  isReducedMotionPreferred: boolean;
  featureFlags: MotionFeatureFlags;
  isFeatureEnabled: (feature: MotionFeatureKey) => boolean;
  isAnyMotionEnabled: boolean;
};

const defaultFlags = Object.keys(MOTION_FEATURE_FLAGS).reduce(
  (acc, key) => {
    acc[key as MotionFeatureKey] = false;
    return acc;
  },
  {} as Record<MotionFeatureKey, boolean>,
) as MotionFeatureFlags;

const MotionContext = createContext<MotionContextValue>({
  isReducedMotionPreferred: true,
  featureFlags: defaultFlags,
  isFeatureEnabled: () => false,
  isAnyMotionEnabled: false,
});

const getSystemReducedMotionPreference = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const deriveResolvedFlags = (
  prefersReducedMotion: boolean,
  previousFlags: MutableRefObject<MotionFeatureFlags | null>,
) => {
  if (prefersReducedMotion) {
    if (previousFlags.current && Object.values(previousFlags.current).every((value) => value === false)) {
      return previousFlags.current;
    }

    const reduced = Object.keys(MOTION_FEATURE_FLAGS).reduce(
      (acc, key) => {
        acc[key as MotionFeatureKey] = false;
        return acc;
      },
      {} as Record<MotionFeatureKey, boolean>,
    ) as MotionFeatureFlags;

    previousFlags.current = reduced;

    return reduced;
  }

  const enabledFlags = { ...MOTION_FEATURE_FLAGS };
  previousFlags.current = enabledFlags;

  return enabledFlags;
};

type MotionProviderProps = {
  children: ReactNode;
};

export const MotionProvider = ({ children }: MotionProviderProps) => {
  const prefersReducedMotionRef = useRef<boolean>(getSystemReducedMotionPreference());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(prefersReducedMotionRef.current);
  const resolvedFlagsRef = useRef<MotionFeatureFlags | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      prefersReducedMotionRef.current = event.matches;
      setPrefersReducedMotion(event.matches);
    };

    handleChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const resolvedFlags = useMemo<MotionFeatureFlags>(() => {
    return deriveResolvedFlags(prefersReducedMotion, resolvedFlagsRef);
  }, [prefersReducedMotion]);

  const contextValue = useMemo<MotionContextValue>(() => {
    const isFeatureEnabled = (feature: MotionFeatureKey) => Boolean(resolvedFlags[feature]);
    const isAnyMotionEnabled = Object.values(resolvedFlags).some(Boolean);

    return {
      isReducedMotionPreferred: prefersReducedMotion,
      featureFlags: resolvedFlags,
      isFeatureEnabled,
      isAnyMotionEnabled,
    };
  }, [prefersReducedMotion, resolvedFlags]);

  return <MotionContext.Provider value={contextValue}>{children}</MotionContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMotion = () => useContext(MotionContext);


