import Card from '../../components/common/Card';
import { useI18n } from '../../i18n/useI18n';

const LegalTermsPage = () => {
  const { t } = useI18n();

  const sections = [
    { title: t('terms.service.title'), content: t('terms.service.content') },
    { title: t('terms.account.title'), content: t('terms.account.content') },
    { title: t('terms.usage.title'), content: t('terms.usage.content') },
    { title: t('terms.intellectual.title'), content: t('terms.intellectual.content') },
    { title: t('terms.liability.title'), content: t('terms.liability.content') },
    { title: t('terms.changes.title'), content: t('terms.changes.content') },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          {t('terms.label')}
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          {t('terms.title')}
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-ak-text-secondary">
          {t('terms.lastUpdated')}
        </p>
      </header>

      {/* Introduction */}
      <section>
        <Card className="bg-ak-surface">
          <p className="text-ak-text-secondary leading-relaxed">
            {t('terms.intro')}
          </p>
        </Card>
      </section>

      {/* Sections */}
      <section className="space-y-6">
        {sections.map((section, index) => (
          <Card key={index} className="bg-ak-surface">
            <h2 className="mb-3 text-lg font-semibold text-ak-text-primary">
              {section.title}
            </h2>
            <p className="text-sm text-ak-text-secondary leading-relaxed">
              {section.content}
            </p>
          </Card>
        ))}
      </section>

      {/* Contact */}
      <section className="text-center">
        <p className="text-sm text-ak-text-secondary">
          Questions? Contact us at{' '}
          <a
            href="mailto:legal@akis.dev"
            className="text-ak-primary hover:underline"
          >
            legal@akis.dev
          </a>
        </p>
      </section>
    </div>
  );
};

export default LegalTermsPage;
