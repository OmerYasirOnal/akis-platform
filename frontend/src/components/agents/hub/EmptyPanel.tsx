import type { ReactNode } from 'react';
import { cn } from '../../../utils/cn';

export interface EmptyPanelProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyPanel({
  icon,
  title,
  description,
  action,
  className,
}: EmptyPanelProps) {
  return (
    <div className={cn('flex h-full flex-col items-center justify-center py-10 text-center', className)}>
      {icon && <div className="mb-3 text-3xl text-ak-text-secondary/60">{icon}</div>}
      <p className="text-sm font-semibold text-ak-text-primary">{title}</p>
      <p className="mt-1 max-w-md text-xs text-ak-text-secondary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyPanel;
