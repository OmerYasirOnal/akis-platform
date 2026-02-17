import { useI18n } from '../../i18n/useI18n';

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
}

function TestimonialCard({ quote, author, role, company }: TestimonialProps) {
  // Generate initials from author name
  const initials = author
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="group relative flex flex-col rounded-2xl border border-ak-border bg-ak-surface-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-ak-primary/40 hover:shadow-ak-elevation-2">
      {/* Quote icon */}
      <svg
        className="mb-4 h-8 w-8 text-ak-primary/30"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>

      {/* Quote text */}
      <blockquote className="mb-6 flex-1 text-ak-text-primary">
        <p className="text-base leading-relaxed">&ldquo;{quote}&rdquo;</p>
      </blockquote>

      {/* Author info */}
      <div className="flex items-center gap-3 border-t border-ak-border pt-4">
        {/* Avatar placeholder */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ak-primary/10 text-sm font-semibold text-ak-primary">
          {initials}
        </div>

        <div>
          <p className="font-semibold text-ak-text-primary">{author}</p>
          <p className="text-sm text-ak-text-secondary">
            {role} · {company}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Testimonials Section
 * Social proof from real users
 */
export default function TestimonialsSection() {
  const { t } = useI18n();

  const testimonials: TestimonialProps[] = [
    {
      quote: t('landing.testimonials.t1.quote'),
      author: t('landing.testimonials.t1.author'),
      role: t('landing.testimonials.t1.role'),
      company: t('landing.testimonials.t1.company'),
    },
    {
      quote: t('landing.testimonials.t2.quote'),
      author: t('landing.testimonials.t2.author'),
      role: t('landing.testimonials.t2.role'),
      company: t('landing.testimonials.t2.company'),
    },
    {
      quote: t('landing.testimonials.t3.quote'),
      author: t('landing.testimonials.t3.author'),
      role: t('landing.testimonials.t3.role'),
      company: t('landing.testimonials.t3.company'),
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ak-primary/5 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full bg-ak-primary/10 px-4 py-1.5 text-sm font-medium text-ak-primary">
            {t('landing.testimonials.label')}
          </span>
          <h2 className="mb-4 text-[clamp(28px,4vw,40px)] font-bold text-ak-text-primary">
            {t('landing.testimonials.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-ak-text-secondary">
            {t('landing.testimonials.subtitle')}
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-12 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-ak-text-secondary opacity-80">
            {t('landing.testimonials.trustedBy')}
          </p>
        </div>
      </div>
    </section>
  );
}
