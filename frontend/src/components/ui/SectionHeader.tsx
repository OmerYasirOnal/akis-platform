import { cn } from '../../utils/cn';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h2 className="text-lg font-semibold text-ak-text-primary">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-ak-text-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ak-text-primary">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-ak-text-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
