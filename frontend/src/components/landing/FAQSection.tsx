import { useState } from 'react';
import { useI18n } from '../../i18n/useI18n';
import { cn } from '../../utils/cn';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-ak-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-ak-primary"
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold text-ak-text-primary">
          {question}
        </span>
        <span
          className={cn(
            'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-ak-border bg-ak-surface-2 transition-all duration-300',
            isOpen && 'rotate-180 border-ak-primary bg-ak-primary text-ak-bg'
          )}
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {/* Answer - collapsible */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-ak-text-secondary">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * FAQ Section
 * Accordion-style frequently asked questions
 */
export default function FAQSection() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: t('landing.faq.q1'),
      answer: t('landing.faq.a1'),
    },
    {
      question: t('landing.faq.q2'),
      answer: t('landing.faq.a2'),
    },
    {
      question: t('landing.faq.q3'),
      answer: t('landing.faq.a3'),
    },
    {
      question: t('landing.faq.q4'),
      answer: t('landing.faq.a4'),
    },
    {
      question: t('landing.faq.q5'),
      answer: t('landing.faq.a5'),
    },
    {
      question: t('landing.faq.q6'),
      answer: t('landing.faq.a6'),
    },
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full bg-ak-primary/10 px-4 py-1.5 text-sm font-medium text-ak-primary">
            {t('landing.faq.label')}
          </span>
          <h2 className="mb-4 text-[clamp(28px,4vw,40px)] font-bold text-ak-text-primary">
            {t('landing.faq.title')}
          </h2>
          <p className="mx-auto max-w-xl text-lg text-ak-text-secondary">
            {t('landing.faq.subtitle')}
          </p>
        </div>

        {/* FAQ accordion */}
        <div className="rounded-2xl border border-ak-border bg-ak-surface-2 px-6">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <p className="mt-8 text-center text-ak-text-secondary">
          {t('landing.faq.stillQuestions')}{' '}
          <a
            href="/contact"
            className="font-semibold text-ak-primary underline-offset-2 hover:underline"
          >
            {t('landing.faq.contactUs')}
          </a>
        </p>
      </div>
    </section>
  );
}
