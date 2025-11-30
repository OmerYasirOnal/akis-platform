import Card from '../components/common/Card';
import { useI18n } from '../i18n/useI18n';

const ChangelogPage = () => {
  const { t } = useI18n();

  const releases = [
    {
      version: 'v0.4.0',
      title: t('changelog.v0_4_0.title'),
      date: t('changelog.v0_4_0.date'),
      items: [
        t('changelog.v0_4_0.item1'),
        t('changelog.v0_4_0.item2'),
        t('changelog.v0_4_0.item3'),
        t('changelog.v0_4_0.item4'),
        t('changelog.v0_4_0.item5'),
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          {t('changelog.label')}
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          {t('changelog.title')}
        </h1>
        <p className="mx-auto max-w-2xl text-base text-ak-text-secondary">
          {t('changelog.description')}
        </p>
      </header>

      {/* Releases */}
      <section className="space-y-8">
        <h2 className="text-xl font-semibold text-ak-text-primary">
          {t('changelog.latest')}
        </h2>

        {releases.map((release) => (
          <Card key={release.version} className="bg-ak-surface">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-ak-primary/10 px-3 py-1 text-sm font-medium text-ak-primary">
                  {release.version}
                </span>
                <h3 className="font-semibold text-ak-text-primary">{release.title}</h3>
              </div>
              <span className="text-sm text-ak-text-secondary">{release.date}</span>
            </div>
            <ul className="space-y-2 text-sm text-ak-text-secondary">
              {release.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ak-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </section>

      {/* Subscribe */}
      <section className="text-center">
        <Card className="bg-ak-surface p-8">
          <h2 className="mb-2 text-lg font-semibold text-ak-text-primary">
            {t('changelog.subscribe')}
          </h2>
          <p className="mb-4 text-sm text-ak-text-secondary">
            {t('changelog.subscribeDescription')}
          </p>
          <div className="mx-auto flex max-w-md gap-2">
            <input
              type="email"
              placeholder="email@example.com"
              className="flex-1 rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/50"
            />
            <button className="rounded-xl bg-ak-primary px-6 py-2 text-sm font-medium text-ak-bg transition-colors hover:bg-ak-primary/90">
              Subscribe
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default ChangelogPage;
