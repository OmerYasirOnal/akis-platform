import { createElement, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_ROUTE_TRANSITION_PRESET,
  ROUTE_TRANSITION_PRESETS,
  type RouteTransitionPreset,
  type RouteTransitionPresetKey,
} from './motion.config';
import { useMotion } from './MotionProvider';

type TransitionPhase = {
  opacity: number;
  transform: string;
};

type RouteTransitionContainerProps = {
  children: ReactNode;
  locationKey: string;
  preset?: RouteTransitionPresetKey;
};

type TransitionTimers = {
  exitTimeout?: number;
  cleanupTimeout?: number;
  exitRaf?: number;
  enterStartRaf?: number;
  enterRaf?: number;
};

const applyPhase = (node: HTMLElement, phase: TransitionPhase) => {
  node.style.opacity = String(phase.opacity);
  node.style.transform = phase.transform;
};

const stopTimers = (timers: TransitionTimers) => {
  if (timers.exitTimeout) {
    window.clearTimeout(timers.exitTimeout);
    timers.exitTimeout = undefined;
  }

  if (timers.cleanupTimeout) {
    window.clearTimeout(timers.cleanupTimeout);
    timers.cleanupTimeout = undefined;
  }

  if (timers.exitRaf) {
    window.cancelAnimationFrame(timers.exitRaf);
    timers.exitRaf = undefined;
  }

  if (timers.enterStartRaf) {
    window.cancelAnimationFrame(timers.enterStartRaf);
    timers.enterStartRaf = undefined;
  }

  if (timers.enterRaf) {
    window.cancelAnimationFrame(timers.enterRaf);
    timers.enterRaf = undefined;
  }
};

const getPresetConfig = (presetKey: RouteTransitionPresetKey | undefined) => {
  if (!presetKey) {
    return ROUTE_TRANSITION_PRESETS[DEFAULT_ROUTE_TRANSITION_PRESET];
  }

  return ROUTE_TRANSITION_PRESETS[presetKey] ?? ROUTE_TRANSITION_PRESETS[DEFAULT_ROUTE_TRANSITION_PRESET];
};

export const RouteTransitionContainer = ({
  children,
  locationKey,
  preset,
}: RouteTransitionContainerProps) => {
  const motion = useMotion();
  const [renderedChildren, setRenderedChildren] = useState<ReactNode>(children);
  const lastRenderedKeyRef = useRef(locationKey);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const transitionTimersRef = useRef<TransitionTimers>({});

  const presetConfig = useMemo<RouteTransitionPreset>(() => {
    return getPresetConfig(preset);
  }, [preset]);

  useEffect(() => {
    const timersRef = transitionTimersRef;
    return () => {
      stopTimers(timersRef.current);
    };
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    node.style.transition = 'none';
    applyPhase(node, presetConfig.enter.to);
  }, [presetConfig]);

  useEffect(() => {
    if (lastRenderedKeyRef.current === locationKey) {
      setRenderedChildren(children);
    }
  }, [children, locationKey]);

  useEffect(() => {
    if (lastRenderedKeyRef.current === locationKey) {
      return;
    }

    const node = containerRef.current;
    if (!node) {
      lastRenderedKeyRef.current = locationKey;
      setRenderedChildren(children);
      return;
    }

    stopTimers(transitionTimersRef.current);

    if (!motion.isFeatureEnabled('ROUTE_TRANSITIONS')) {
      lastRenderedKeyRef.current = locationKey;
      setRenderedChildren(children);
      applyPhase(node, presetConfig.enter.to);
      node.style.transition = 'none';
      node.style.willChange = '';
      return;
    }

    const { duration, easing, exit, enter } = presetConfig;
    const transitionValue = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;

    node.style.transition = 'none';
    node.style.willChange = 'opacity, transform';
    applyPhase(node, exit.from);

    transitionTimersRef.current.exitRaf = window.requestAnimationFrame(() => {
      node.style.transition = transitionValue;
      applyPhase(node, exit.to);
    });

    transitionTimersRef.current.exitTimeout = window.setTimeout(() => {
      lastRenderedKeyRef.current = locationKey;
      setRenderedChildren(children);

      transitionTimersRef.current.enterStartRaf = window.requestAnimationFrame(() => {
        const currentNode = containerRef.current;
        if (!currentNode) {
          return;
        }

        currentNode.style.transition = 'none';
        applyPhase(currentNode, enter.from);

        transitionTimersRef.current.enterRaf = window.requestAnimationFrame(() => {
          currentNode.style.transition = transitionValue;
          applyPhase(currentNode, enter.to);

          transitionTimersRef.current.cleanupTimeout = window.setTimeout(() => {
            if (!containerRef.current) {
              return;
            }

            containerRef.current.style.willChange = '';
          }, duration + 32);
        });
      });
    }, duration);
  }, [children, locationKey, motion, presetConfig]);

  return createElement(
    'div',
    {
      ref: containerRef,
      className: 'h-full will-change-auto',
      'data-route-transition': '',
    },
    renderedChildren,
  );
};


