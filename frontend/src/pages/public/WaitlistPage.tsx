import { useI18n } from '../../i18n/useI18n';
import Button from '../../components/common/Button';
import Logo from '../../components/branding/Logo';
import { openWaitlist } from '../../utils/waitlist';

/**
 * Waitlist Page
 * Dedicated landing page for waitlist signups
 */
export default function WaitlistPage() {
  const { t } = useI18n();

  const benefits = [
    t('waitlist.page.benefits.1') || 'Priority access to new features',
    t('waitlist.page.benefits.2') || 'Founding member pricing',
    t('waitlist.page.benefits.3') || 'Direct line to the team',
    t('waitlist.page.benefits.4') || 'Shape the product roadmap',
  ];

  const handleJoinWaitlist = () => {
    // Default UTM for direct page visits
    openWaitlist('website', 'waitlist_page');
  };

  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo size="sm" linkToHome={false} />
        </div>

        {/* Title */}
        <h1 className="mb-4 text-[clamp(32px,6vw,48px)] font-bold leading-tight text-ak-text-primary">
          {t('waitlist.page.title') || 'Join the AKIS Waitlist'}
        </h1>

        {/* Subtitle */}
        <p className="mb-10 text-lg leading-relaxed text-ak-text-secondary">
          {t('waitlist.page.subtitle') || 'Be the first to experience AI-powered development automation.'}
        </p>

        {/* Benefits Card */}
        <div className="mb-10 rounded-2xl border border-ak-border bg-ak-surface-2 p-8 text-left shadow-ak-elevation-1">
          <h2 className="mb-6 text-center text-lg font-semibold text-ak-primary">
            {t('waitlist.page.benefits.title') || 'Early Access Benefits'}
          </h2>
          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-ak-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-ak-text-secondary">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleJoinWaitlist}
          variant="primary"
          size="lg"
          className="w-full sm:w-auto"
        >
          {t('waitlist.page.cta') || 'Join the Waitlist'}
        </Button>

        {/* Privacy Note */}
        <p className="mt-6 text-sm text-ak-text-secondary/70">
          {t('waitlist.page.privacy') || 'We respect your privacy. No spam, ever.'}
        </p>
      </div>
    </section>
  );
}
