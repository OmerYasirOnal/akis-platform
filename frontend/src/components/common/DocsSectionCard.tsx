import type { ReactNode } from 'react';

interface DocsSectionCardProps {
  title: string;
  children: ReactNode;
  variant?: 'default' | 'accent';
}

export function DocsSectionCard({ title, children, variant = 'default' }: DocsSectionCardProps) {
  const border = variant === 'accent' ? 'border-ak-primary/20 bg-ak-primary/5' : 'border-ak-border bg-ak-surface';
  return (
    <section className={`rounded-2xl border ${border} p-6`}>
      <h2 className="text-xl font-semibold text-ak-text-primary">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
