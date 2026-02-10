import { useMemo } from 'react';

export function useScreenshotMode(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('shot') === '1';
  }, []);
}
