import Card from '../../components/common/Card';
import { useI18n } from '../../i18n/useI18n';

const LegalPrivacyPage = () => {
  const { t } = useI18n();

  const sections = [
    { title: t('privacy.collection.title'), content: t('privacy.collection.content') },
    { title: t('privacy.use.title'), content: t('privacy.use.content') },
    { title: t('privacy.sharing.title'), content: t('privacy.sharing.content') },
    { title: t('privacy.security.title'), content: t('privacy.security.content') },
    { title: t('privacy.rights.title'), content: t('privacy.rights.content') },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          {t('privacy.label')}
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          {t('privacy.title')}
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-ak-text-secondary">
          {t('privacy.lastUpdated')}
        </p>
      </header>

      {/* Introduction */}
      <section>
        <Card className="bg-ak-surface">
          <p className="text-ak-text-secondary leading-relaxed">
            {t('privacy.intro')}
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
            href="mailto:privacy@akis.dev"
            className="text-ak-primary hover:underline"
          >
            privacy@akis.dev
          </a>
        </p>
      </section>
    </div>
  );
};

export default LegalPrivacyPage;
