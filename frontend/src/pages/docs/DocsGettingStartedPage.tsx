import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useI18n } from '../../i18n/useI18n';

const DocsGettingStartedPage = () => {
  const { t } = useI18n();

  const steps = [
    { number: 1, text: t('docs.gettingStarted.step1') },
    { number: 2, text: t('docs.gettingStarted.step2') },
    { number: 3, text: t('docs.gettingStarted.step3') },
    { number: 4, text: t('docs.gettingStarted.step4') },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-4">
        <nav className="text-sm text-ak-text-secondary">
          <Link to="/docs" className="hover:text-ak-primary">
            {t('docs.index.label')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ak-text-primary">{t('docs.gettingStarted.title')}</span>
        </nav>
        <h1 className="text-3xl font-semibold text-ak-text-primary">
          {t('docs.gettingStarted.title')}
        </h1>
        <p className="text-ak-text-secondary">
          {t('docs.gettingStarted.description')}
        </p>
      </header>

      {/* Introduction */}
      <section>
        <Card className="bg-ak-surface">
          <p className="text-ak-text-secondary leading-relaxed">
            {t('docs.gettingStarted.content')}
          </p>
        </Card>
      </section>

      {/* Steps */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ak-text-primary">Quick Start Steps</h2>
        {steps.map((step) => (
          <Card key={step.number} className="flex items-start gap-4 bg-ak-surface">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ak-primary/10 text-sm font-semibold text-ak-primary">
              {step.number}
            </span>
            <p className="text-ak-text-secondary">{step.text}</p>
          </Card>
        ))}
      </section>

      {/* CTA */}
      <section className="text-center">
        <Button as={Link} to="/signup" variant="primary">
          {t('cta.getStarted')}
        </Button>
      </section>

      {/* Navigation */}
      <section className="flex justify-between border-t border-ak-border pt-6">
        <Link
          to="/docs"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          ← {t('docs.index.title')}
        </Link>
        <Link
          to="/docs/agents"
          className="text-sm text-ak-text-secondary hover:text-ak-primary"
        >
          {t('docs.agents.title')} →
        </Link>
      </section>
    </div>
  );
};

export default DocsGettingStartedPage;
