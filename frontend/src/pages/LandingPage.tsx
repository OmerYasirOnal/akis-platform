import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import Hero from '../components/Hero';
import ModulesSection from '../components/ModulesSection';
import StatsSection from '../components/landing/StatsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FAQSection from '../components/landing/FAQSection';
import Button from '../components/common/Button';
import ScrollRevealSection from '../components/ScrollRevealSection';
import { cn } from '../utils/cn';

/**
 * Landing Page
 * Premium enterprise-grade landing page with:
 * - Hero
 * - Stats Section (animated counters)
 * - Agents Section
 * - Features Section
 * - How It Works (3-step)
 * - Testimonials
 * - FAQ
 * - Final CTA
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <ScrollRevealSection delay={100}>
        <StatsSection />
      </ScrollRevealSection>
      <ScrollRevealSection delay={150}>
        <ModulesSection />
      </ScrollRevealSection>
      <ScrollRevealSection delay={200}>
        <FeaturesSection />
      </ScrollRevealSection>
      <ScrollRevealSection delay={100}>
        <HowItWorksSection />
      </ScrollRevealSection>
      <ScrollRevealSection delay={150}>
        <TestimonialsSection />
      </ScrollRevealSection>
      <ScrollRevealSection delay={100}>
        <FAQSection />
      </ScrollRevealSection>
      <ScrollRevealSection delay={150}>
        <FinalCTASection />
      </ScrollRevealSection>
    </>
  );
}

/**
 * How It Works Section - Premium Enterprise Design
 * 3-step process with connected timeline, glass cards, and mint accents
 */
function HowItWorksSection() {
  const { t } = useI18n();

  const steps = [
    {
      step: 1,
      title: t('landing.howItWorks.step1.title'),
      description: t('landing.howItWorks.step1.description'),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      ),
    },
    {
      step: 2,
      title: t('landing.howItWorks.step2.title'),
      description: t('landing.howItWorks.step2.description'),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      step: 3,
      title: t('landing.howItWorks.step3.title'),
      description: t('landing.howItWorks.step3.description'),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-ak-primary/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-20 text-center">
          <span className="mb-4 inline-block rounded-full bg-ak-primary/10 px-4 py-1.5 text-sm font-medium text-ak-primary">
            {t('landing.howItWorks.badge')}
          </span>
          <h2 className="mb-4 text-[clamp(28px,4vw,40px)] font-bold text-ak-text-primary">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-ak-text-secondary">
            {t('landing.howItWorks.subtitle')}
          </p>
        </div>

        {/* Steps with connected timeline */}
        <div className="relative">
          {/* Horizontal connector line (desktop only) */}
          <div className="absolute left-0 right-0 top-[60px] hidden h-[2px] bg-gradient-to-r from-transparent via-ak-primary/30 to-transparent md:block" />

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
                <div className="relative rounded-2xl border border-ak-border bg-ak-surface-2 p-8 shadow-ak-elevation-1 transition-all duration-300 hover:-translate-y-1 hover:border-ak-primary/40 hover:shadow-ak-elevation-2">
                  {/* Step number badge - positioned at top center */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ak-primary bg-ak-bg text-sm font-bold text-ak-primary shadow-ak-glow-sm">
                      {item.step}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-4 text-center">
                    {/* Icon */}
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-ak-primary/10 text-ak-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-ak-primary/20">
                      {item.icon}
                    </div>

                    {/* Title */}
                    <h3 className="mb-3 text-xl font-semibold text-ak-text-primary">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-ak-text-secondary">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Vertical connector (mobile only) */}
                {index < steps.length - 1 && (
                  <div className="mx-auto h-8 w-[2px] bg-gradient-to-b from-ak-primary/30 to-transparent md:hidden" />
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
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-ak-primary/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-3xl text-center">
        {/* Badge */}
        <span className="mb-6 inline-block rounded-full bg-ak-primary/10 px-4 py-1.5 text-sm font-medium text-ak-primary">
          {t('landing.cta.badge')}
        </span>

        <h2 className="mb-6 text-[clamp(28px,4vw,40px)] font-bold text-ak-text-primary">
          {t('landing.cta.title')}
        </h2>
        <p className="mb-10 text-lg text-ak-text-secondary">
          {t('landing.cta.subtitle')}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button as={Link} to="/signup" variant="primary" size="lg">
            {t('landing.cta.createAccount')}
          </Button>
          <Button as={Link} to="/login" variant="outline" size="lg">
            {t('landing.cta.signIn')}
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-ak-text-secondary">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-ak-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>{t('landing.cta.trust1')}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-ak-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>{t('landing.cta.trust2')}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-ak-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>{t('landing.cta.trust3')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
