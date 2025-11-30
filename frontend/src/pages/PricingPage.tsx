import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useI18n } from '../i18n/useI18n';

const PricingPage = () => {
  const { t } = useI18n();

  const tiers = [
    {
      name: t('pricing.starter.name'),
      price: t('pricing.starter.price'),
      period: t('pricing.starter.period'),
      description: t('pricing.starter.description'),
      features: [
        t('pricing.starter.feature1'),
        t('pricing.starter.feature2'),
        t('pricing.starter.feature3'),
        t('pricing.starter.feature4'),
      ],
      cta: t('pricing.starter.cta'),
      ctaLink: '/signup',
    },
    {
      name: t('pricing.pro.name'),
      price: t('pricing.pro.price'),
      period: t('pricing.pro.period'),
      description: t('pricing.pro.description'),
      features: [
        t('pricing.pro.feature1'),
        t('pricing.pro.feature2'),
        t('pricing.pro.feature3'),
        t('pricing.pro.feature4'),
        t('pricing.pro.feature5'),
      ],
      cta: t('pricing.pro.cta'),
      ctaLink: '/signup?plan=pro',
      featured: true,
    },
    {
      name: t('pricing.enterprise.name'),
      price: t('pricing.enterprise.price'),
      period: t('pricing.enterprise.period'),
      description: t('pricing.enterprise.description'),
      features: [
        t('pricing.enterprise.feature1'),
        t('pricing.enterprise.feature2'),
        t('pricing.enterprise.feature3'),
        t('pricing.enterprise.feature4'),
        t('pricing.enterprise.feature5'),
      ],
      cta: t('pricing.enterprise.cta'),
      ctaLink: '/contact',
    },
  ];

  const faqs = [
    { q: t('pricing.faq.q1'), a: t('pricing.faq.a1') },
    { q: t('pricing.faq.q2'), a: t('pricing.faq.a2') },
    { q: t('pricing.faq.q3'), a: t('pricing.faq.a3') },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          {t('pricing.label')}
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          {t('pricing.title')}
        </h1>
        <p className="mx-auto max-w-3xl text-base text-ak-text-secondary">
          {t('pricing.subtitle')}
        </p>
      </header>

      {/* Pricing Tiers */}
      <section className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`flex h-full flex-col gap-6 bg-ak-surface ${
              tier.featured
                ? 'border-ak-primary shadow-[0_25px_60px_-35px_rgba(7,209,175,0.55)]'
                : ''
            }`}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-ak-text-secondary/60">
                {tier.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-ak-text-primary">
                  {tier.price}
                </span>
                <span className="text-sm text-ak-text-secondary">
                  {tier.period}
                </span>
              </div>
              <p className="text-sm text-ak-text-secondary">{tier.description}</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2 text-sm text-ak-text-secondary">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ak-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div>
              <Button
                as={Link}
                to={tier.ctaLink}
                variant={tier.featured ? 'primary' : 'outline'}
                className="w-full justify-center"
              >
                {tier.cta}
              </Button>
            </div>
          </Card>
        ))}
      </section>

      {/* Early Access & ROI */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-ak-surface">
          <h2 className="text-xl font-semibold text-ak-text-primary">
            {t('pricing.earlyAccess.title')}
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-ak-text-secondary">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ak-primary" />
              <span>{t('pricing.earlyAccess.item1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ak-primary" />
              <span>{t('pricing.earlyAccess.item2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ak-primary" />
              <span>{t('pricing.earlyAccess.item3')}</span>
            </li>
          </ul>
        </Card>

        <Card className="bg-ak-surface">
          <h2 className="text-xl font-semibold text-ak-text-primary">
            {t('pricing.roi.title')}
          </h2>
          <p className="mt-3 text-sm text-ak-text-secondary">
            {t('pricing.roi.description')}
          </p>
        </Card>
      </section>

      {/* FAQ */}
      <section className="space-y-8">
        <h2 className="text-center text-2xl font-semibold text-ak-text-primary">
          {t('pricing.faq.title')}
        </h2>
        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="bg-ak-surface">
              <h3 className="font-medium text-ak-text-primary">{faq.q}</h3>
              <p className="mt-2 text-sm text-ak-text-secondary">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
