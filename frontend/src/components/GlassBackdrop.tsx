import { useEffect, useRef } from 'react';

interface GlassBackdropProps {
  className?: string;
}

/**
 * Liquid Glassmorphism backdrop with animated blobs
 * Uses GPU-friendly transforms and opacity only
 * Respects prefers-reduced-motion
 */
export default function GlassBackdrop({ className }: GlassBackdropProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = prefersReducedMotionMedia.matches;
    if (prefersReducedMotion) {
      return; // Skip animation
    }

    const blobs = container.querySelectorAll<HTMLDivElement>('[data-blob]');
    if (blobs.length === 0) return;

    let time = 0;
    const speed = 0.0003; // Low frequency drift

    const animate = () => {
      time += 16; // ~60fps

      blobs.forEach((blob, index) => {
        const phase = (time * speed) + (index * Math.PI * 0.5);
        const x = Math.sin(phase) * 20;
        const y = Math.cos(phase * 0.7) * 15;
        const scale = 1 + Math.sin(phase * 0.5) * 0.1;

        blob.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        blob.style.opacity = String(0.4 + Math.sin(phase * 0.3) * 0.1);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className || ''}`}
      aria-hidden="true"
    >
      {/* Blob 1 - Top left */}
      <div
        data-blob
        className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[var(--accent)]/20 blur-[40px]"
        style={{
          transform: 'translate(0, 0) scale(1)',
          opacity: 0.4,
          willChange: 'transform, opacity',
        }}
      />

      {/* Blob 2 - Top right */}
      <div
        data-blob
        className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-[var(--accent)]/15 blur-[32px]"
        style={{
          transform: 'translate(0, 0) scale(1)',
          opacity: 0.35,
          willChange: 'transform, opacity',
        }}
      />

      {/* Blob 3 - Bottom center */}
      <div
        data-blob
        className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--accent)]/18 blur-[36px]"
        style={{
          transform: 'translate(0, 0) scale(1)',
          opacity: 0.4,
          willChange: 'transform, opacity',
        }}
      />

      {/* Blob 4 - Middle left */}
      <div
        data-blob
        className="absolute left-0 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[var(--accent)]/12 blur-[28px]"
        style={{
          transform: 'translate(0, 0) scale(1)',
          opacity: 0.3,
          willChange: 'transform, opacity',
        }}
      />

      {/* Blob 5 - Bottom right */}
      <div
        data-blob
        className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-[var(--accent)]/10 blur-[28px]"
        style={{
          transform: 'translate(0, 0) scale(1)',
          opacity: 0.25,
          willChange: 'transform, opacity',
        }}
      />
    </div>
  );
}
