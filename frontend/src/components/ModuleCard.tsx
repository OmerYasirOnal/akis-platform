import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { cn } from '../utils/cn';

interface ModuleCardProps {
  module: 'scribe' | 'trace' | 'proto';
  className?: string;
}

/**
 * Agent Module Card
 * Glass morphism effect with mint-glow hover transitions
 */
export default function ModuleCard({ module, className }: ModuleCardProps) {
  const { t } = useI18n();

  const titleKey = `modules.${module}.title` as const;
  const subKey = `modules.${module}.sub` as const;
  const bullets = [
    `modules.${module}.b1`,
    `modules.${module}.b2`,
    `modules.${module}.b3`,
  ] as const;

  return (
    <div
      className={cn(
        'group relative rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-[var(--glass-mid)] p-8 backdrop-blur-[var(--blur-card)] transition-all duration-300',
        'hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-[0_0_24px_var(--edge-glow)]',
        className
      )}
    >
      {/* Subtle edge glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] opacity-0 shadow-[var(--shadow-glow)] transition-opacity duration-300 group-hover:opacity-30" />

      <div className="relative z-10">
        {/* Agent label */}
        <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--muted)]/70">
          AGENT
        </span>

        {/* Title */}
        <h3 className="mb-4 text-2xl font-semibold text-[var(--text)]">
          {t(titleKey)}
        </h3>

        {/* Description */}
        <p className="mb-6 text-sm leading-relaxed text-[var(--muted)]">
          {t(subKey)}
        </p>

        {/* Feature bullets */}
        <ul className="mb-8 space-y-3">
          {bullets.map((bulletKey, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-sm text-[var(--text)]/90"
            >
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
              <span>{t(bulletKey)}</span>
            </li>
          ))}
        </ul>

        {/* Action links */}
        <div className="flex flex-col gap-3">
          <Link
            to={`/agents/${module}`}
            className="text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            View details
          </Link>
          <Link
            to={`/dashboard/agents/${module}/run`}
            className="text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            Run agent
          </Link>
        </div>
      </div>
    </div>
  );
}
