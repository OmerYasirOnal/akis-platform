import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

export interface SectionCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  actions,
  className,
  bodyClassName,
  children,
}: SectionCardProps) {
  return (
    <section className={cn('rounded-xl border border-ak-border bg-ak-surface', className)}>
      <header className="flex items-start justify-between gap-3 border-b border-ak-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ak-text-primary">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ak-text-secondary">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

export default SectionCard;
