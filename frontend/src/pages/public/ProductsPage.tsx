import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/useI18n';
import Button from '../../components/common/Button';

function ProductCard({
  module,
  icon,
}: {
  module: 'scribe' | 'trace' | 'proto';
  icon: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="group relative rounded-2xl border border-ak-border bg-ak-surface-2 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-ak-primary/40 hover:shadow-ak-elevation-2">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ak-primary/10 text-ak-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-ak-primary/20">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-semibold text-ak-text-primary">
        {t(`products.${module}.title`)}
      </h3>
      <p className="mb-6 text-sm leading-relaxed text-ak-text-secondary">
        {t(`products.${module}.description`)}
      </p>
      <ul className="space-y-2 text-sm text-ak-text-secondary">
        {[1, 2, 3].map((i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ak-primary" />
            <span>{t(`products.${module}.bullet${i}`)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ScribeIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const TraceIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
  </svg>
);

const ProtoIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

export default function ProductsPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      <section className="px-4 py-16 text-center sm:px-6 lg:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-ak-text-primary sm:text-5xl lg:text-6xl">
          {t('products.title')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ak-text-secondary">
          {t('products.subtitle')}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="grid gap-8 md:grid-cols-3">
          <ProductCard module="scribe" icon={<ScribeIcon />} />
          <ProductCard module="trace" icon={<TraceIcon />} />
          <ProductCard module="proto" icon={<ProtoIcon />} />
        </div>

        <div className="mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button as={Link} to="/docs" variant="outline" size="lg">
            {t('products.cta.docs')}
          </Button>
          <Button as={Link} to="/signup" variant="primary" size="lg">
            {t('products.cta.getStarted')}
          </Button>
          <Button as={Link} to="/login" variant="ghost" size="lg">
            {t('products.cta.login')}
          </Button>
        </div>
      </section>
    </div>
  );
}
