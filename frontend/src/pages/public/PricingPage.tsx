import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

// Check icon
const CheckIcon = () => (
  <svg className="h-5 w-5 text-ak-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  highlighted?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Developer',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for individual developers and small projects.',
    features: [
      'Scribe Agent (unlimited runs)',
      '100 AI API calls/month',
      'GitHub integration',
      'Basic job history',
      'Community support',
    ],
    cta: 'Get Started Free',
    ctaLink: '/signup',
  },
  {
    name: 'Team',
    price: '$49',
    period: 'per month',
    description: 'For growing teams that need more power and collaboration.',
    features: [
      'Everything in Developer',
      'Unlimited AI API calls',
      'Jira & Confluence integration',
      'Team workspace (up to 10)',
      'Advanced job analytics',
      'Priority support',
      'Custom model selection',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/signup',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For organizations with advanced security and compliance needs.',
    features: [
      'Everything in Team',
      'Unlimited team members',
      'SSO & SAML integration',
      'On-premise deployment option',
      'Custom agent development',
      'Dedicated success manager',
      'SLA guarantees',
      'Audit logs & compliance',
    ],
    cta: 'Contact Sales',
    ctaLink: 'mailto:enterprise@akis.dev',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-16 text-center sm:px-6 lg:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-ak-text-primary sm:text-5xl lg:text-6xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ak-text-secondary">
          Start free and scale as you grow. No hidden fees, no surprises.
          Choose the plan that fits your development workflow.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-8 transition-all duration-base ${
                tier.highlighted
                  ? 'border-ak-primary bg-ak-surface-2 shadow-ak-glow'
                  : 'border-ak-border bg-ak-surface hover:-translate-y-1 hover:shadow-ak-lg'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-ak-primary px-4 py-1 text-sm font-semibold text-[#111418]">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-ak-text-primary">{tier.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold text-ak-text-primary">{tier.price}</span>
                  <span className="ml-2 text-ak-text-secondary">/{tier.period}</span>
                </div>
                <p className="mt-4 text-ak-text-secondary">{tier.description}</p>
              </div>

              <ul className="mb-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckIcon />
                    <span className="text-ak-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.ctaLink.startsWith('mailto:') ? (
                <a
                  href={tier.ctaLink}
                  className={`block w-full rounded-xl py-3 text-center font-semibold transition-all ${
                    tier.highlighted
                      ? 'bg-ak-primary text-[#111418] hover:brightness-110 active:brightness-95'
                      : 'border border-ak-border bg-ak-surface-2 text-ak-text-primary hover:bg-ak-surface'
                  }`}
                >
                  {tier.cta}
                </a>
              ) : (
                <Link
                  to={tier.ctaLink}
                  className={`block w-full rounded-xl py-3 text-center font-semibold transition-all ${
                    tier.highlighted
                      ? 'bg-ak-primary text-[#111418] hover:brightness-110 active:brightness-95'
                      : 'border border-ak-border bg-ak-surface-2 text-ak-text-primary hover:bg-ak-surface'
                  }`}
                >
                  {tier.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-ak-border bg-ak-surface px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-ak-text-primary">Frequently Asked Questions</h2>
          <div className="mt-12 space-y-8 text-left">
            <div>
              <h3 className="text-lg font-semibold text-ak-text-primary">
                Can I switch plans later?
              </h3>
              <p className="mt-2 text-ak-text-secondary">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ak-text-primary">
                Do you offer a free trial?
              </h3>
              <p className="mt-2 text-ak-text-secondary">
                The Developer plan is free forever. For Team features, we offer a 14-day free trial with no credit card required.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ak-text-primary">
                What AI models are supported?
              </h3>
              <p className="mt-2 text-ak-text-secondary">
                AKIS supports OpenAI (GPT-4, GPT-4o) and OpenRouter models. You can bring your own API keys or use our managed service.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ak-text-primary">
                How does billing work?
              </h3>
              <p className="mt-2 text-ak-text-secondary">
                Team and Enterprise plans are billed monthly. We accept all major credit cards and can provide invoices for enterprise customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 text-center sm:px-6 lg:py-24">
        <h2 className="text-3xl font-bold text-ak-text-primary">
          Ready to Transform Your Development?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ak-text-secondary">
          Join developers who are already using AKIS to automate their workflows.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button as={Link} to="/signup" variant="primary" size="lg">
            Get Started Free
          </Button>
          <Button as={Link} to="/docs" variant="outline" size="lg">
            Read Documentation
          </Button>
        </div>
      </section>
    </div>
  );
}
