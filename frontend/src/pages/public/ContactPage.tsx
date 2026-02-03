import { useI18n } from '../../i18n/useI18n';

const CONTACT_EMAIL = 'info@akisflow.com';
const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || null;

const MailIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function ContactPage() {
  const { t } = useI18n();

  const handleCopy = async (text: string, buttonId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const btn = document.getElementById(buttonId);
      if (btn) {
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 2000);
      }
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-16 text-center sm:px-6 lg:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-ak-text-primary sm:text-5xl lg:text-6xl">
          {t('contact.title')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ak-text-secondary">
          {t('contact.description')}
        </p>
      </section>

      {/* Contact Cards */}
      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Email Card */}
          <div className="rounded-2xl border border-ak-border bg-ak-surface p-8 transition-all duration-base hover:-translate-y-1 hover:shadow-ak-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ak-primary/10 text-ak-primary">
              <MailIcon />
            </div>
            <h3 className="text-xl font-bold text-ak-text-primary">{t('contact.email')}</h3>
            <p className="mt-2 text-ak-text-secondary">{t('contact.response')}</p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex-1 rounded-xl bg-ak-surface-2 px-4 py-3 text-center font-medium text-ak-text-primary transition-colors hover:bg-ak-surface"
              >
                {CONTACT_EMAIL}
              </a>
              <button
                id="copy-email-btn"
                onClick={() => handleCopy(CONTACT_EMAIL, 'copy-email-btn')}
                className="group flex h-12 w-12 items-center justify-center rounded-xl border border-ak-border bg-ak-surface-2 text-ak-text-secondary transition-colors hover:bg-ak-surface hover:text-ak-text-primary [&.copied]:border-green-500 [&.copied]:text-green-500"
                title="Copy email"
              >
                <span className="group-[.copied]:hidden"><CopyIcon /></span>
                <span className="hidden group-[.copied]:block"><CheckIcon /></span>
              </button>
            </div>
          </div>

          {/* Phone Card */}
          <div className="rounded-2xl border border-ak-border bg-ak-surface p-8 transition-all duration-base hover:-translate-y-1 hover:shadow-ak-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ak-primary/10 text-ak-primary">
              <PhoneIcon />
            </div>
            <h3 className="text-xl font-bold text-ak-text-primary">Telefon</h3>
            <p className="mt-2 text-ak-text-secondary">
              {CONTACT_PHONE ? 'Mesai saatlerinde arayabilirsiniz.' : 'Yakında aktif olacak.'}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {CONTACT_PHONE ? (
                <>
                  <a
                    href={`tel:${CONTACT_PHONE}`}
                    className="flex-1 rounded-xl bg-ak-surface-2 px-4 py-3 text-center font-medium text-ak-text-primary transition-colors hover:bg-ak-surface"
                  >
                    {CONTACT_PHONE}
                  </a>
                  <button
                    id="copy-phone-btn"
                    onClick={() => handleCopy(CONTACT_PHONE, 'copy-phone-btn')}
                    className="group flex h-12 w-12 items-center justify-center rounded-xl border border-ak-border bg-ak-surface-2 text-ak-text-secondary transition-colors hover:bg-ak-surface hover:text-ak-text-primary [&.copied]:border-green-500 [&.copied]:text-green-500"
                    title="Copy phone"
                  >
                    <span className="group-[.copied]:hidden"><CopyIcon /></span>
                    <span className="hidden group-[.copied]:block"><CheckIcon /></span>
                  </button>
                </>
              ) : (
                <div className="flex-1 rounded-xl bg-ak-surface-2 px-4 py-3 text-center font-medium text-ak-text-secondary">
                  Coming soon
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Cards - Demo, Sales, Support */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Demo */}
          <div className="rounded-xl border border-ak-border bg-ak-surface p-6">
            <h4 className="font-semibold text-ak-text-primary">{t('contact.demo.title')}</h4>
            <p className="mt-2 text-sm text-ak-text-secondary">{t('contact.demo.description')}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Demo Request`}
              className="mt-4 inline-block text-sm font-medium text-ak-primary hover:underline"
            >
              {t('contact.demo.cta')} →
            </a>
          </div>

          {/* Sales */}
          <div className="rounded-xl border border-ak-border bg-ak-surface p-6">
            <h4 className="font-semibold text-ak-text-primary">{t('contact.sales.title')}</h4>
            <p className="mt-2 text-sm text-ak-text-secondary">{t('contact.sales.description')}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Sales Inquiry`}
              className="mt-4 inline-block text-sm font-medium text-ak-primary hover:underline"
            >
              {t('contact.sales.cta')} →
            </a>
          </div>

          {/* Support */}
          <div className="rounded-xl border border-ak-border bg-ak-surface p-6">
            <h4 className="font-semibold text-ak-text-primary">{t('contact.support.title')}</h4>
            <p className="mt-2 text-sm text-ak-text-secondary">{t('contact.support.description')}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Support Request`}
              className="mt-4 inline-block text-sm font-medium text-ak-primary hover:underline"
            >
              {t('contact.support.cta')} →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
