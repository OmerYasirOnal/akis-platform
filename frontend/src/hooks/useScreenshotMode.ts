import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useScreenshotMode(): boolean {
  const [searchParams] = useSearchParams();
  return useMemo(() => searchParams.get('shot') === '1', [searchParams]);
}
