const parseMotionFlag = (value: string | boolean | undefined, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (['false', '0', 'off', 'disabled', 'disable', 'no'].includes(normalized)) {
    return false;
  }

  if (['true', '1', 'on', 'enabled', 'enable', 'yes'].includes(normalized)) {
    return true;
  }

  return fallback;
};

export const MOTION_BUDGETS = {
  ROUTE_TRANSITIONS_JS: '≤6 KB gzipped',
} as const;

export const ROUTE_TRANSITION_PRESETS = {
  'fade-slide': {
    duration: 180,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter: {
      from: { opacity: 0, transform: 'translate3d(0, 6px, 0)' },
      to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
    },
    exit: {
      from: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      to: { opacity: 0, transform: 'translate3d(0, -4px, 0)' },
    },
  },
} as const;

export type RouteTransitionPresetKey = keyof typeof ROUTE_TRANSITION_PRESETS;

export type RouteTransitionPreset = (typeof ROUTE_TRANSITION_PRESETS)[RouteTransitionPresetKey];

export const DEFAULT_ROUTE_TRANSITION_PRESET: RouteTransitionPresetKey = 'fade-slide';

export const MOTION_FEATURE_FLAGS = {
  ROUTE_TRANSITIONS: parseMotionFlag(import.meta.env?.VITE_MOTION_ENABLED, true),
} as const;

export type MotionFeatureKey = keyof typeof MOTION_FEATURE_FLAGS;

export type MotionFeatureFlags = typeof MOTION_FEATURE_FLAGS;


