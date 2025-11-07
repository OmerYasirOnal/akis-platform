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
    <div className="space-y-24">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(7,209,175,0.12),_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(20,29,33,0.75),_transparent_65%)]" />
          <div className="absolute inset-0 opacity-30 mix-blend-overlay" />
        </div>

        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 text-center sm:px-6 lg:px-8">
          <Logo size="hero" className="drop-shadow-[0_35px_55px_rgba(7,209,175,0.25)]" />
          <div className="flex flex-col gap-6">
            <h1 className="text-balance text-4xl font-semibold sm:text-5xl lg:text-6xl">
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
            <Button
              as={Link}
              to="/login"
              size="lg"
              variant="outline"
            >
              Already with AKIS?
            </Button>
          </div>
        </div>
      </section>

      <section
        id="products"
        aria-labelledby="products-heading"
        className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
      >
        <div className="mb-12 flex flex-col gap-4">
          <h2
            id="products-heading"
            className="text-3xl font-semibold text-ak-text-primary sm:text-4xl"
          >
            Platform ürünleri
          </h2>
          <p className="max-w-3xl text-lg text-ak-text-secondary">
            Scribe, Trace ve Proto; uçtan uca yazılım yaşam döngüsünde veri
            odaklı, erişilebilir deneyimler sunar.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {products.map((product) => (
            <Card id={product.id} key={product.id} className="flex flex-col gap-6">
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
                    <li
                      key={item}
                      className="flex items-start gap-2 text-pretty leading-snug"
                    >
                      <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ak-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section
        id="pricing"
        className="relative isolate overflow-hidden bg-ak-surface py-16"
      >
        <div className="absolute inset-0 -z-10 opacity-70 blur-3xl">
          <div className="mx-auto h-48 w-3/4 bg-[radial-gradient(circle_at_top,_rgba(7,209,175,0.25),_transparent_60%)]" />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left sm:px-6 lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold text-ak-text-primary sm:text-3xl">
              Faster — Lower cost — Stronger teams
            </h2>
            <p className="mt-2 max-w-xl text-base text-ak-text-secondary">
              Kapalı beta sürümüne katılın, ürün yol haritasını birlikte
              şekillendirelim.
            </p>
          </div>
          <Button as={Link} to="/signup" size="lg">
            Join the beta
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

