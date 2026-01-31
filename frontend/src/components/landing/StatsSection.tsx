import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/useI18n';

/**
 * Animated counter hook
 */
function useCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView || hasStarted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [startOnView, hasStarted]);

  useEffect(() => {
    if (!hasStarted && startOnView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, hasStarted, startOnView]);

  return { count, ref };
}

interface StatItemProps {
  value: number;
  suffix?: string;
  label: string;
  description: string;
}

function StatItem({ value, suffix = '', label, description }: StatItemProps) {
  const { count, ref } = useCounter(value, 2000);

  return (
    <div
      ref={ref}
      className="group relative flex flex-col items-center p-6 text-center"
    >
      {/* Value */}
      <div className="mb-2 flex items-baseline gap-1">
        <span className="text-[clamp(40px,8vw,64px)] font-bold tracking-tight text-ak-primary transition-transform duration-300 group-hover:scale-110">
          {count}
        </span>
        <span className="text-[clamp(24px,4vw,40px)] font-semibold text-ak-primary">
          {suffix}
        </span>
      </div>

      {/* Label */}
      <h3 className="mb-2 text-lg font-semibold text-ak-text-primary">
        {label}
      </h3>

      {/* Description */}
      <p className="text-sm text-ak-text-secondary">
        {description}
      </p>
    </div>
  );
}

/**
 * Stats Section
 * Showcases key metrics with animated counters
 */
export default function StatsSection() {
  const { t } = useI18n();

  const stats: StatItemProps[] = [
    {
      value: 20,
      suffix: '+',
      label: t('landing.stats.hoursSaved'),
      description: t('landing.stats.hoursSavedDesc'),
    },
    {
      value: 500,
      suffix: '+',
      label: t('landing.stats.teamsUsing'),
      description: t('landing.stats.teamsUsingDesc'),
    },
    {
      value: 50000,
      suffix: '+',
      label: t('landing.stats.jobsRun'),
      description: t('landing.stats.jobsRunDesc'),
    },
    {
      value: 99,
      suffix: '%',
      label: t('landing.stats.uptime'),
      description: t('landing.stats.uptimeDesc'),
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-ak-primary/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full bg-ak-primary/10 px-4 py-1.5 text-sm font-medium text-ak-primary">
            {t('landing.stats.label')}
          </span>
          <h2 className="mb-4 text-[clamp(28px,4vw,40px)] font-bold text-ak-text-primary">
            {t('landing.stats.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-ak-text-secondary">
            {t('landing.stats.subtitle')}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative rounded-2xl border border-ak-border bg-ak-surface-2/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-ak-primary/40 hover:shadow-ak-elevation-2"
            >
              <StatItem {...stat} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
