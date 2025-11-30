import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { cn } from '../utils/cn';

interface ModuleCardProps {
  module: 'scribe' | 'trace' | 'proto';
  className?: string;
}

/**
 * Agent Module Card
 * Design system: bg-ak-surface-2, border-ak-border, rounded-2xl, shadow-lg
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
        'group relative rounded-2xl border border-ak-border bg-ak-surface-2 p-8 shadow-lg transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-xl hover:border-ak-primary/40',
        className
      )}
    >
      {/* Agent label */}
      <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-ak-text-secondary/70">
        AGENT
      </span>

      {/* Title */}
      <h3 className="mb-4 text-2xl font-semibold text-ak-text-primary">
        {t(titleKey)}
      </h3>

      {/* Description */}
      <p className="mb-6 text-sm leading-relaxed text-ak-text-secondary">
        {t(subKey)}
      </p>

      {/* Feature bullets */}
      <ul className="mb-8 space-y-3">
        {bullets.map((bulletKey, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-sm text-ak-text-primary"
          >
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ak-primary" />
            <span>{t(bulletKey)}</span>
          </li>
        ))}
      </ul>

      {/* Action links */}
      <div className="flex flex-col gap-3">
        <Link
          to={`/agents/${module}`}
          className="text-sm font-medium text-ak-primary transition-colors hover:text-ak-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ak-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ak-bg"
        >
          View details
        </Link>
        <Link
          to={`/dashboard/agents/${module}/run`}
          className="text-sm font-medium text-ak-primary transition-colors hover:text-ak-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ak-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ak-bg"
        >
          Run agent
        </Link>
      </div>
    </div>
  );
}
