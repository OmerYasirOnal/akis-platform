import { useEffect, useRef, useState } from 'react';

interface UseTypewriterResult {
  displayedText: string;
  isTyping: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useTypewriter(text: string, speed = 30): UseTypewriterResult {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const previousTargetRef = useRef<string>('');
  const displayedTextRef = useRef<string>('');

  useEffect(() => {
    displayedTextRef.current = displayedText;
  }, [displayedText]);

  useEffect(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (prefersReducedMotion()) {
      setDisplayedText(text);
      setIsTyping(false);
      previousTargetRef.current = text;
      return;
    }

    if (text === previousTargetRef.current) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    if (displayedTextRef.current !== previousTargetRef.current) {
      setDisplayedText(previousTargetRef.current);
    }

    previousTargetRef.current = text;

    if (text.length === 0) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    let visibleChars = 0;
    lastFrameTimeRef.current = 0;
    setDisplayedText('');
    setIsTyping(true);

    const step = (time: number) => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = time;
      }

      const elapsed = time - lastFrameTimeRef.current;
      if (elapsed >= speed) {
        const advanceBy = Math.max(1, Math.floor(elapsed / speed));
        visibleChars = Math.min(text.length, visibleChars + advanceBy);
        lastFrameTimeRef.current = time;
        setDisplayedText(text.slice(0, visibleChars));
      }

      if (visibleChars >= text.length) {
        setIsTyping(false);
        animationFrameRef.current = null;
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(step);
    };

    animationFrameRef.current = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [speed, text]);

  return { displayedText, isTyping };
}

export default useTypewriter;
