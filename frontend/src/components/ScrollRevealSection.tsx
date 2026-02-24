import { useScrollReveal } from '../hooks/useScrollReveal';
import { cn } from '../utils/cn';

interface ScrollRevealSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function ScrollRevealSection({
  children,
  className,
  delay = 0,
}: ScrollRevealSectionProps) {
  const { ref, revealed } = useScrollReveal({ delay });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'transition-all duration-500 ease-out',
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
    >
      {children}
    </div>
  );
}
