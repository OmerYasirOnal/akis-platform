import type { ReactNode } from 'react';
import Card from '../components/common/Card';

type PagePlaceholderProps = {
  title: string;
  description?: string;
  items?: string[];
  children?: ReactNode;
};

const PagePlaceholder = ({
  title,
  description,
  items,
  children,
}: PagePlaceholderProps) => {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          Placeholder
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-base text-ak-text-secondary">
            {description}
          </p>
        ) : null}
      </header>

      {items && items.length > 0 ? (
        <Card className="bg-ak-surface-2">
          <ul className="space-y-2 text-sm text-ak-text-secondary">
            {items.map((item) => (
              <li key={item}>TODO: {item}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {children ?? (
        <Card className="bg-ak-surface-2 text-sm text-ak-text-secondary">
          TODO: Flesh out content per information architecture.
        </Card>
      )}
    </div>
  );
};

export default PagePlaceholder;

