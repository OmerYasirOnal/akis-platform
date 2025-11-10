import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { cn } from '../utils/cn';

interface ModuleCardProps {
  module: 'scribe' | 'trace' | 'proto';
  className?: string;
}

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
        'group relative rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-[var(--glass-mid)] p-8 backdrop-blur-[var(--blur-card)] transition-all duration-[var(--transition-smooth)] hover:border-[var(--accent)]/40 hover:shadow-[0_0_24px_var(--edge-glow)]',
        className
      )}
    >
      {/* Subtle edge glow on hover */}
      <div className="absolute inset-0 rounded-[var(--radius-lg)] opacity-0 shadow-[var(--shadow-glow)] transition-opacity duration-[var(--transition-smooth)] group-hover:opacity-30" />

      <div className="relative z-10">
        <h3 className="mb-3 text-[clamp(28px,3vw,32px)] font-semibold text-[var(--text)]">
          {t(titleKey)}
        </h3>
        
        <p className="mb-6 text-[clamp(14px,1.5vw,16px)] leading-relaxed text-[var(--muted)]">
          {t(subKey)}
        </p>

        <ul className="mb-8 space-y-3">
          {bullets.map((bulletKey, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-[clamp(14px,1.5vw,16px)] text-[var(--text)]/90"
            >
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
              <span>{t(bulletKey)}</span>
            </li>
          ))}
        </ul>

        <Link
          to={`/agents/${module}`}
          className="inline-block rounded-[var(--radius-md)] border border-[var(--glass-bdr)] bg-[var(--glass-top)] px-6 py-2.5 text-sm font-medium text-[var(--text)] transition-all duration-[var(--transition-base)] hover:bg-[var(--glass-mid)] hover:border-[var(--accent)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
        >
          Explore
        </Link>
      </div>
    </div>
  );
}

