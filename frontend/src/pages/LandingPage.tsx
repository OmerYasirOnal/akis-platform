import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ModulesSection from '../components/ModulesSection';
import Button from '../components/common/Button';
import { cn } from '../utils/cn';

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
 * How It Works Section - Premium Enterprise Design
 * 3-step process with connected timeline, glass cards, and mint accents
 */
function HowItWorksSection() {
  const steps = [
    {
      step: 1,
      title: 'Connect',
      description: 'Link your tools with a 2-minute OAuth setup. GitHub, Jira, and Confluence.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      ),
    },
    {
      step: 2,
      title: 'Configure',
      description: 'Choose your agents and set guardrails. Customize playbooks to your workflow.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      step: 3,
      title: 'Deploy',
      description: 'Sit back and save time. Jobs run autonomously while you focus on what matters.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-20 text-center">
          <h2 className="mb-4 text-[clamp(28px,4vw,40px)] font-bold text-[var(--text)]">
            Three Steps to Autonomous Workflow
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--muted)]">
            Get started in minutes. No complex setup required.
          </p>
        </div>

        {/* Steps with connected timeline */}
        <div className="relative">
          {/* Horizontal connector line (desktop only) */}
          <div className="absolute left-0 right-0 top-[60px] hidden h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent md:block" />

          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            {steps.map((item, index) => (
              <div
                key={item.step}
                className={cn(
                  'group relative',
                  // Staggered animation delay
                  index === 0 && 'md:translate-y-0',
                  index === 1 && 'md:translate-y-4',
                  index === 2 && 'md:translate-y-0'
                )}
              >
                {/* Card */}
                <div className="relative rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-[var(--glass-mid)] p-8 backdrop-blur-[var(--blur-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-[0_0_24px_var(--edge-glow)]">
                  {/* Step number badge - positioned at top center */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--bg)] text-sm font-bold text-[var(--accent)] shadow-[0_0_16px_var(--edge-glow)]">
                      {item.step}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-4 text-center">
                    {/* Icon */}
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] transition-all duration-300 group-hover:scale-110 group-hover:bg-[var(--accent)]/20">
                      {item.icon}
                    </div>

                    {/* Title */}
                    <h3 className="mb-3 text-xl font-semibold text-[var(--text)]">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-[var(--muted)]">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Vertical connector (mobile only) */}
                {index < steps.length - 1 && (
                  <div className="mx-auto h-8 w-[2px] bg-gradient-to-b from-[var(--accent)]/30 to-transparent md:hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Final CTA Section
 * Glass morphism with mint accent, high-contrast call to action
 */
function FinalCTASection() {
  return (
    <section className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--glass-top)] to-transparent" />

      <div className="relative mx-auto max-w-3xl text-center">
        {/* Decorative glow */}
        <div className="absolute -inset-4 -z-10 rounded-3xl bg-[var(--accent)]/5 blur-3xl" />

        <h2 className="mb-6 text-[clamp(28px,4vw,40px)] font-bold text-[var(--text)]">
          Stop Losing Time to Busywork. Start Building.
        </h2>
        <p className="mb-10 text-lg text-[var(--muted)]">
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
