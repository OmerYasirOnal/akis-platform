import { Link } from 'react-router-dom';

interface DocsRef {
  label: string;
  href: string;
}

interface DocsReferenceListProps {
  title: string;
  items: DocsRef[];
}

export function DocsReferenceList({ title, items }: DocsReferenceListProps) {
  return (
    <section className="rounded-2xl border border-ak-border bg-ak-surface p-6">
      <h2 className="text-xl font-semibold text-ak-text-primary">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-ak-text-secondary">
        {items.map((item) => (
          <li key={item.href}>
            <Link className="text-ak-primary hover:underline" to={item.href}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
