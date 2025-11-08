import Card from '../components/common/Card';
import Button from '../components/common/Button';

const tiers = [
  {
    name: 'Developer',
    price: '$0',
    period: '/month',
    description: 'Solo developers and OSS maintainers exploring AKIS.',
    features: [
      '1 active agent',
      '100 jobs / month',
      'Community support',
      'GitHub + Jira integrations',
    ],
    cta: 'Start for free',
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    description: 'Small teams scaling automation across squads.',
    features: [
      'All agents unlocked',
      'Unlimited jobs',
      'Priority support (Slack)',
      'Team management (5 seats)',
      'SSO (Google, GitHub)',
    ],
    cta: 'Start 14-day trial',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Large organizations with strict compliance needs.',
    features: [
      'Self-hosting option',
      'Dedicated CSM & SLA',
      'Advanced security (SAML, audit logs)',
      'Unlimited seats & API quotas',
      'Custom integrations & onboarding',
    ],
    cta: 'Contact sales',
  },
];

const PricingPage = () => (
  <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
    <header className="space-y-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
        Pricing
      </p>
      <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
        Pricing that scales with your team
      </h1>
      <p className="mx-auto max-w-3xl text-base text-ak-text-secondary">
        Choose a plan that matches your delivery cadence. TODO: add ROI
        calculator and FAQ accordions per IA.
      </p>
    </header>

    <section className="grid gap-6 md:grid-cols-3">
      {tiers.map((tier) => (
        <Card
          key={tier.name}
          className={`flex h-full flex-col gap-6 bg-ak-surface ${
            tier.featured ? 'border-ak-primary shadow-[0_25px_60px_-35px_rgba(7,209,175,0.55)]' : ''
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
            <Button variant={tier.featured ? 'primary' : 'outline'} className="w-full justify-center">
              {tier.cta}
            </Button>
          </div>
        </Card>
      ))}
    </section>

    <section className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-ak-surface">
        <h2 className="text-xl font-semibold text-ak-text-primary">
          Early access perks
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-ak-text-secondary">
          <li>TODO: Lifetime discount messaging</li>
          <li>TODO: Beta feedback program benefits</li>
          <li>TODO: Migration support details</li>
        </ul>
      </Card>

      <Card className="bg-ak-surface">
        <h2 className="text-xl font-semibold text-ak-text-primary">
          ROI snapshot
        </h2>
        <p className="mt-3 text-sm text-ak-text-secondary">
          TODO: embed ROI calculator widget and usage assumptions.
        </p>
      </Card>
    </section>
  </div>
);

export default PricingPage;

