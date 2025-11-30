import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useI18n } from '../i18n/useI18n';

const ContactPage = () => {
  const { t } = useI18n();

  const contactOptions = [
    {
      title: t('contact.demo.title'),
      description: t('contact.demo.description'),
      cta: t('contact.demo.cta'),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
    {
      title: t('contact.sales.title'),
      description: t('contact.sales.description'),
      cta: t('contact.sales.cta'),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
    {
      title: t('contact.support.title'),
      description: t('contact.support.description'),
      cta: t('contact.support.cta'),
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
          {t('contact.label')}
        </p>
        <h1 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          {t('contact.title')}
        </h1>
        <p className="mx-auto max-w-2xl text-base text-ak-text-secondary">
          {t('contact.description')}
        </p>
      </header>

      {/* Contact Options */}
      <section className="grid gap-6 md:grid-cols-3">
        {contactOptions.map((option) => (
          <Card key={option.title} className="flex flex-col items-center bg-ak-surface p-8 text-center">
            <div className="mb-4 text-ak-primary">{option.icon}</div>
            <h2 className="mb-2 text-lg font-semibold text-ak-text-primary">
              {option.title}
            </h2>
            <p className="mb-6 flex-1 text-sm text-ak-text-secondary">
              {option.description}
            </p>
            <Button as={Link} to="/signup" variant="outline" className="w-full justify-center">
              {option.cta}
            </Button>
          </Card>
        ))}
      </section>

      {/* Email Contact */}
      <section className="text-center">
        <Card className="mx-auto max-w-lg bg-ak-surface p-8">
          <p className="text-sm text-ak-text-secondary">
            {t('contact.email')}
          </p>
          <a
            href="mailto:hello@akis.dev"
            className="mt-2 block text-xl font-medium text-ak-primary hover:underline"
          >
            hello@akis.dev
          </a>
          <p className="mt-4 text-xs text-ak-text-secondary/70">
            {t('contact.response')}
          </p>
        </Card>
      </section>
    </div>
  );
};

export default ContactPage;
