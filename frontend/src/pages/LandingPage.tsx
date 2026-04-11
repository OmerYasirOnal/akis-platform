import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { LOGO_MARK_SVG } from '../theme/brand';

const STEPS = [
  {
    icon: '💬',
    title: 'Fikrinizi Anlatın',
    description: 'Scribe agent fikirlerinizi yapılandırılmış bir spec\'e çevirir. Sorular sorar, detayları netleştirir.',
  },
  {
    icon: '🔨',
    title: 'Otomatik Prototipleme',
    description: 'Proto agent onaylanan spec\'ten çalışan bir MVP scaffold üretir ve GitHub\'a push eder.',
  },
  {
    icon: '✅',
    title: 'Otomatik Test',
    description: 'Trace agent üretilen koda özel Playwright e2e testleri yazar ve aynı branch\'e ekler.',
  },
];

const PROVIDERS = [
  { name: 'Anthropic', desc: 'Claude' },
  { name: 'OpenAI', desc: 'GPT-4o' },
  { name: 'OpenRouter', desc: 'Multi-model' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/chat', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ak-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#07D1AF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ak-bg text-ak-text-primary">
      {/* Nav */}
      <nav aria-label="Ana navigasyon" className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={LOGO_MARK_SVG} alt="AKIS" className="h-8 w-8" />
          <span className="text-lg font-extrabold tracking-tight text-[#07D1AF]">AKIS</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/docs')}
            className="text-sm text-ak-text-secondary hover:text-ak-text-primary transition-colors"
          >
            Docs
          </button>
          <button
            onClick={() => navigate('/login')}
            className="rounded-lg bg-[#07D1AF] px-4 py-2 text-sm font-semibold text-[#0A1215] hover:brightness-110 transition"
          >
            Giriş Yap
          </button>
        </div>
      </nav>

      {/* Hero — fills viewport minus nav */}
      <main>
      <section className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 pb-16 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Fikirden Koda,{' '}
          <span className="text-[#07D1AF]">Dakikalar İçinde.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ak-text-secondary leading-relaxed">
          AI destekli agent'lar ile yazılım geliştirme sürecinizi hızlandırın.
          Fikrinizi anlatın, AKIS spec yazarken siz onaylayın, kod ve testler otomatik oluşsun.
        </p>
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate('/signup')}
            className="rounded-lg bg-[#07D1AF] px-8 py-3 text-sm font-semibold text-[#0A1215] hover:brightness-110 transition"
          >
            Başla
          </button>
          <button
            onClick={() => navigate('/docs')}
            className="rounded-lg border border-ak-border px-8 py-3 text-sm font-semibold text-ak-text-secondary hover:border-ak-text-secondary transition"
          >
            Dokümantasyon
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <h2 className="text-center text-2xl font-bold mb-12">Nasıl Çalışır?</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="rounded-2xl border border-ak-border bg-ak-surface/50 p-6 text-center"
            >
              <div className="text-3xl mb-3">{step.icon}</div>
              <div className="mb-1 text-xs font-medium text-[#07D1AF] uppercase tracking-wider">Adım {i + 1}</div>
              <h3 className="text-base font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-ak-text-secondary leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Providers */}
      <section className="px-4 py-12 max-w-4xl mx-auto text-center">
        <h2 className="text-lg font-semibold mb-6 text-ak-text-secondary">Desteklenen AI Sağlayıcılar</h2>
        <div className="flex justify-center gap-6 flex-wrap">
          {PROVIDERS.map((p) => (
            <div key={p.name} className="rounded-xl border border-ak-border bg-ak-surface/30 px-6 py-3">
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="text-xs text-ak-text-secondary">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-ak-border px-4 py-8 text-center">
        <p className="text-xs text-ak-text-secondary">
          AKIS Platform — FSMVÜ Bitirme Projesi &copy; 2026
        </p>
        <p className="mt-1 text-xs text-ak-text-secondary/60">
          Ömer Yasir Önal — Dr. Öğr. Üyesi Nazlı Doğan
        </p>
      </footer>
    </div>
  );
}
