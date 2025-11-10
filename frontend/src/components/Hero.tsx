import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import GlassBackdrop from './GlassBackdrop';

export default function Hero() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLearnMore = () => {
    navigate('/docs');
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
      <GlassBackdrop />
      
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <h1 className="mb-6 text-balance font-heading text-[clamp(48px,8vw,88px)] font-semibold leading-[1.1] tracking-tight text-[var(--text)]">
          {t('hero.title')}
        </h1>
        
        <p className="mx-auto mb-12 max-w-2xl text-balance text-[clamp(16px,2vw,18px)] leading-relaxed text-[var(--muted)]">
          {t('hero.sub')}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={handleGetStarted}
            className="group relative rounded-[var(--radius-md)] bg-[var(--accent)] px-8 py-4 text-[clamp(16px,1.5vw,18px)] font-medium text-[var(--bg)] shadow-[var(--shadow-card)] transition-all duration-[var(--transition-smooth)] hover:shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            {t('cta.primary')}
          </button>
          
          <button
            onClick={handleLearnMore}
            className="rounded-[var(--radius-md)] border border-[var(--glass-bdr)] bg-[var(--glass-top)] px-8 py-4 text-[clamp(16px,1.5vw,18px)] font-medium text-[var(--text)] backdrop-blur-[var(--blur-card)] transition-all duration-[var(--transition-base)] hover:bg-[var(--glass-mid)] hover:border-[var(--accent)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            {t('cta.secondary')}
          </button>
        </div>
      </div>
    </section>
  );
}

