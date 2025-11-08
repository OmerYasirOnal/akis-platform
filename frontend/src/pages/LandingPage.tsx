import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../components/branding/Logo';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const products = [
  {
    id: 'scribe',
    title: 'Scribe',
    description:
      'Kaynak kod değişikliklerini otomatik olarak dokümana dönüştürür; ekipleriniz hiçbir detayı kaçırmaz.',
    useCases: [
      'Pull request’lerden otomatik doküman',
      'Release notu taslağı',
      'README senkronizasyonu',
    ],
  },
  {
    id: 'trace',
    title: 'Trace',
    description:
      'Test süreçlerini orkestre eder, flaky alanları ve riskli noktaları ortaya çıkarır.',
    useCases: [
      'Jira’dan test senaryosu üretimi',
      'Flaky alan raporu',
      'Kapsama önerileri',
    ],
  },
  {
    id: 'proto',
    title: 'Proto',
    description:
      'Spesifikasyonlardan MVP iskeleti çıkarır; CRUD, auth ve test altyapısı hazır gelir.',
    useCases: [
      'Spesifikasyondan MVP şablonu',
      'CRUD + auth başlangıç kiti',
      'Smoke test başlangıcı',
    ],
  },
];

const painPoints = [
  {
    title: 'Outdated documentation',
    description:
      'Engineers spend hours syncing documentation that quickly drifts. AKIS keeps knowledge current automatically.',
  },
  {
    title: 'Manual test planning',
    description:
      'QA teams translate tickets into test cases by hand. Trace generates coverage and catches flaky areas.',
  },
  {
    title: 'Slow prototyping',
    description:
      'Shipping MVPs takes weeks. Proto scaffolds production-ready projects so teams can validate faster.',
  },
];

const howItWorks = [
  {
    step: '1. Connect',
    copy: 'Link GitHub, Jira ve Confluence hesaplarınızı dakikalar içinde bağlayın.',
  },
  {
    step: '2. Configure',
    copy: 'Playbook’lar ve guardrail’lerle agent davranışını yönetin.',
  },
  {
    step: '3. Deploy',
    copy: 'AKIS işi devralırken ekibiniz müşteri değerine odaklansın.',
  },
];

const trustSignals = [
  'Transparent playbooks ve tam audit logları',
  'MCP adapter katmanı ile izole entegrasyonlar',
  'OCI dostu kaynak kullanımı ve optimize edilmiş performans',
];

const LandingPage: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (!location.hash) {
      return;
    }

    const element = document.querySelector(location.hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  return (
    <div className="space-y-24 bg-ak-bg">
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 text-center sm:px-6 lg:px-8">
        <Logo size="hero" />
        <div className="flex flex-col gap-6">
          <h1 className="text-balance text-4xl font-semibold text-ak-text-primary sm:text-5xl lg:text-6xl">
            Software development’s new center
          </h1>
          <p className="mx-auto max-w-3xl text-pretty text-lg text-ak-text-secondary sm:text-xl">
            AKIS; planlama, dokümantasyon ve kalite süreçlerini yapay zekâ ile
            yeniden şekillendirir. Tek merkezden yönet, ekibini güçlendir.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button as={Link} to="/signup" size="lg">
            Get Early Access
          </Button>
          <Button as={Link} to="/login" size="lg" variant="outline">
            Already with AKIS?
          </Button>
        </div>
      </section>

      <section className="border-y border-ak-border bg-ak-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-4 py-10 text-xs uppercase tracking-[0.35em] text-ak-text-secondary sm:px-6 lg:px-8">
          <span>Trusted by TODO: partner logos</span>
          <span>Weekly hours saved: TODO</span>
          <span>Coverage uplift: TODO</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
            Friction
          </p>
          <h2 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
            Why teams lose 40% of their week
          </h2>
          <p className="max-w-3xl text-base text-ak-text-secondary">
            Tekrarlayan işler üretkenliği düşürüyor. AKIS, sıkıcı görevleri
            devralıp ekibinizi Iverson’a bağlar.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {painPoints.map((pain) => (
            <Card key={pain.title} className="bg-ak-surface">
              <h3 className="text-xl font-semibold text-ak-text-primary">
                {pain.title}
              </h3>
              <p className="mt-3 text-sm text-ak-text-secondary">{pain.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section
        id="products"
        aria-labelledby="products-heading"
        className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
      >
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
            Products
          </p>
          <h2
            id="products-heading"
            className="text-3xl font-semibold text-ak-text-primary sm:text-4xl"
          >
            Meet the AKIS agents
          </h2>
          <p className="max-w-3xl text-base text-ak-text-secondary">
            Scribe, Trace ve Proto; uçtan uca yazılım yaşam döngüsünde veri
            odaklı, erişilebilir deneyimler sunar.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {products.map((product) => (
            <Card id={product.id} key={product.id} className="flex flex-col gap-6 bg-ak-surface">
              <div>
                <h3 className="text-2xl font-semibold text-ak-text-primary">
                  {product.title}
                </h3>
                <p className="mt-3 text-sm text-ak-text-secondary">
                  {product.description}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/70">
                  Use cases
                </span>
                <ul className="mt-3 space-y-2 text-sm text-ak-text-primary/90">
                  {product.useCases.map((item) => (
                    <li key={item} className="flex items-start gap-2 leading-snug">
                      <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ak-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant="ghost" as={Link} to={`/agents/${product.id}`}>
                Explore {product.title}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
            Flow
          </p>
          <h2 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
            How AKIS slots into your workflow
          </h2>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {howItWorks.map((step) => (
            <Card key={step.step} className="bg-ak-surface">
              <span className="text-sm font-medium uppercase tracking-[0.25em] text-ak-text-secondary/70">
                {step.step}
              </span>
              <p className="mt-3 text-sm text-ak-text-secondary">{step.copy}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ak-text-secondary/80">
            Trust
          </p>
          <h2 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
            Built for developers, by developers
          </h2>
        </header>
        <Card className="bg-ak-surface">
          <ul className="space-y-3 text-sm text-ak-text-secondary">
            {trustSignals.map((signal) => (
              <li key={signal} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ak-primary" />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section
        id="pricing"
        className="bg-ak-surface px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <h2 className="text-2xl font-semibold text-ak-text-primary sm:text-3xl">
              Faster — lower cost — stronger teams
            </h2>
            <p className="mt-2 max-w-xl text-base text-ak-text-secondary">
              Kapalı beta sürümüne katılın, ürün yol haritasını birlikte
              şekillendirelim.
            </p>
          </div>
          <Button as={Link} to="/pricing" size="lg" variant="secondary">
            View pricing
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-ak-text-primary sm:text-4xl">
          Stop losing time to busywork. Start building.
        </h2>
        <p className="mt-3 text-base text-ak-text-secondary">
          TODO: Add social proof metrics and waitlist CTA copy.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button as={Link} to="/signup" size="lg">
            Create free account
          </Button>
          <Button as={Link} to="/docs/getting-started" variant="outline" size="lg">
            Explore docs
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

