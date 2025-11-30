import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ModulesSection from '../components/ModulesSection';
import Button from '../components/common/Button';

/**
 * Landing Page
 * Follows WEB_INFORMATION_ARCHITECTURE.md structure:
 * - Hero
 * - Agents Section
 * - How It Works (3-step)
 * - Final CTA
 */
export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Agents Section */}
      <ModulesSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Final CTA Section */}
      <FinalCTASection />
    </>
  );
}

/**
 * How It Works Section
 * 3-step process: Connect → Configure → Deploy
 */
function HowItWorksSection() {
  const steps = [
    {
      step: 1,
      title: 'Connect',
      description: 'Link your tools with a 2-minute OAuth setup. GitHub, Jira, and Confluence.',
      icon: '🔗',
    },
    {
      step: 2,
      title: 'Configure',
      description: 'Choose your agents and set guardrails. Customize playbooks to your workflow.',
      icon: '⚙️',
    },
    {
      step: 3,
      title: 'Deploy',
      description: 'Sit back and save time. Jobs run autonomously while you focus on what matters.',
      icon: '🚀',
    },
  ];

  return (
    <section className="bg-ak-bg px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-[clamp(28px,4vw,40px)] font-bold text-ak-text-primary">
            Three Steps to Autonomous Workflow
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-ak-text-secondary">
            Get started in minutes. No complex setup required.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-ak-border bg-ak-surface-2 p-8 text-center shadow-lg"
            >
              {/* Step number circle */}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ak-primary text-2xl font-bold text-ak-bg">
                {item.step}
              </div>

              {/* Icon */}
              <div className="mb-4 text-4xl">{item.icon}</div>

              {/* Title */}
              <h3 className="mb-3 text-xl font-semibold text-ak-text-primary">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed text-ak-text-secondary">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Final CTA Section
 * Full-width, high-contrast call to action
 */
function FinalCTASection() {
  return (
    <section className="bg-ak-surface px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="mb-6 text-[clamp(28px,4vw,40px)] font-bold text-ak-text-primary">
          Stop Losing Time to Busywork. Start Building.
        </h2>
        <p className="mb-10 text-lg text-ak-text-secondary">
          Join development teams saving 20+ hours per week with AKIS agents.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button as={Link} to="/signup" variant="primary" size="lg">
            Create Free Account
          </Button>
          <Button as={Link} to="/login" variant="outline" size="lg">
            Already have an account? Sign in
          </Button>
        </div>
      </div>
    </section>
  );
}
