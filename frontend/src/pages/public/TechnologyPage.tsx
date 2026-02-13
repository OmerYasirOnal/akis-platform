/**
 * TechnologyPage — Showcases the AKIS ecosystem technology stack
 * Covers: AKIS Platform, Piri (Kumru 2B), Jarvis (MLX), Quantization
 * Fully i18n-aware with consistent AKIS design language
 */

import { useI18n } from '../../i18n/useI18n';

/* ─────────────────────────────────────────────────────────────────────────────
   Reusable Components
   ───────────────────────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-center gap-3">
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--accent)]/40 sm:w-16" />
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
        {children}
      </span>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--accent)]/40 sm:w-16" />
    </div>
  );
}

function Divider() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--glass-bdr)] to-transparent" />
    </div>
  );
}

interface TechCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}

function TechCard({ icon, title, subtitle, description }: TechCardProps) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-transparent p-6 backdrop-blur-[var(--blur-card)] transition-all duration-[var(--transition-smooth)] hover:border-[var(--accent)]/40 hover:shadow-[0_0_24px_rgba(0,212,177,0.12)]">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--accent)]/5 blur-2xl transition-all duration-500 group-hover:bg-[var(--accent)]/10" />
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 transition-colors duration-300 group-hover:bg-[var(--accent)]/20">
          {icon}
        </div>
        <h3 className="mb-1 text-lg font-semibold text-[var(--text)]">{title}</h3>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
          {subtitle}
        </p>
        <p className="flex-1 text-sm leading-relaxed text-[var(--muted)]">{description}</p>
      </div>
    </div>
  );
}

interface StatCardProps {
  value: string;
  label: string;
  detail?: string;
}

function StatCard({ value, label, detail }: StatCardProps) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-transparent p-5 backdrop-blur-[var(--blur-card)]">
      <span className="text-3xl font-bold text-[var(--accent)]">{value}</span>
      <span className="mt-1 text-sm font-medium text-[var(--text)]">{label}</span>
      {detail && <span className="mt-0.5 text-xs text-[var(--muted)]">{detail}</span>}
    </div>
  );
}

interface BenchmarkRowProps {
  model: string;
  speed: string;
  ram: string;
  highlight?: boolean;
}

function BenchmarkRow({ model, speed, ram, highlight }: BenchmarkRowProps) {
  return (
    <div
      className={`grid grid-cols-3 gap-4 rounded-lg px-4 py-3 text-sm ${
        highlight
          ? 'border border-[var(--accent)]/20 bg-[var(--accent)]/5'
          : 'border border-transparent'
      }`}
    >
      <span className={`font-medium ${highlight ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>
        {model}
      </span>
      <span className="text-center text-[var(--muted)]">{speed}</span>
      <span className="text-right text-[var(--muted)]">{ram}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SVG Icons
   ───────────────────────────────────────────────────────────────────────────── */

const PlatformIcon = () => (
  <svg className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
  </svg>
);

const BrainIcon = () => (
  <svg className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const ChipIcon = () => (
  <svg className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
  </svg>
);

const MicIcon = () => (
  <svg className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);


const CompressIcon = () => (
  <svg className="h-6 w-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────────────────────── */

export default function TechnologyPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ═══════════════════════════════════════════════════════════════════════
         HERO SECTION
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <SectionLabel>{t('tech.hero.label')}</SectionLabel>
          <h1 className="mb-6 text-[clamp(32px,5vw,52px)] font-semibold leading-[1.15] tracking-tight text-[var(--text)]">
            {t('tech.hero.title')}
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            {t('tech.hero.subtitle')}
          </p>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════════
         ECOSYSTEM OVERVIEW
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <SectionLabel>{t('tech.ecosystem.label')}</SectionLabel>
            <h2 className="text-[clamp(28px,4vw,40px)] font-semibold text-[var(--text)]">
              {t('tech.ecosystem.headline')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--muted)]">
              {t('tech.ecosystem.description')}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            <TechCard
              icon={<PlatformIcon />}
              title={t('tech.ecosystem.akis.title')}
              subtitle={t('tech.ecosystem.akis.subtitle')}
              description={t('tech.ecosystem.akis.description')}
            />
            <TechCard
              icon={<BrainIcon />}
              title={t('tech.ecosystem.piri.title')}
              subtitle={t('tech.ecosystem.piri.subtitle')}
              description={t('tech.ecosystem.piri.description')}
            />
            <TechCard
              icon={<MicIcon />}
              title={t('tech.ecosystem.jarvis.title')}
              subtitle={t('tech.ecosystem.jarvis.subtitle')}
              description={t('tech.ecosystem.jarvis.description')}
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════════
         STATS
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <SectionLabel>{t('tech.stats.label')}</SectionLabel>
            <h2 className="text-[clamp(28px,4vw,40px)] font-semibold text-[var(--text)]">
              {t('tech.stats.headline')}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard value="39K+" label={t('tech.stats.loc')} detail={t('tech.stats.locDetail')} />
            <StatCard value="52" label={t('tech.stats.tokSec')} detail="Qwen3-8B MLX" />
            <StatCard value="3" label={t('tech.stats.agents')} detail="Scribe, Trace, Proto" />
            <StatCard value="4-bit" label={t('tech.stats.quant')} detail={t('tech.stats.quantDetail')} />
            <StatCard value="35+" label={t('tech.stats.tools')} detail={t('tech.stats.toolsDetail')} />
            <StatCard value="91" label={t('tech.stats.chunks')} detail={t('tech.stats.chunksDetail')} />
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════════
         MLX & QUANTIZATION
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <SectionLabel>{t('tech.mlx.label')}</SectionLabel>
            <h2 className="text-[clamp(28px,4vw,40px)] font-semibold text-[var(--text)]">
              {t('tech.mlx.headline')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--muted)]">
              {t('tech.mlx.description')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-transparent p-6 backdrop-blur-[var(--blur-card)]">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10">
                <ChipIcon />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[var(--text)]">{t('tech.mlx.unified.title')}</h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">{t('tech.mlx.unified.body')}</p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-transparent p-6 backdrop-blur-[var(--blur-card)]">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10">
                <CompressIcon />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[var(--text)]">{t('tech.mlx.quant.title')}</h3>
              <p className="text-sm leading-relaxed text-[var(--muted)]">{t('tech.mlx.quant.body')}</p>
            </div>
          </div>

          {/* Benchmark Table */}
          <div className="mt-10 rounded-[var(--radius-xl)] border border-[var(--glass-bdr)] bg-gradient-to-br from-[var(--glass-top)] via-transparent to-[var(--accent)]/5 p-6 backdrop-blur-[var(--blur-card)] sm:p-8">
            <h3 className="mb-6 text-center text-lg font-semibold text-[var(--text)]">
              {t('tech.mlx.benchmark.title')}
            </h3>
            <div className="grid grid-cols-3 gap-4 border-b border-[var(--glass-bdr)] pb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              <span>{t('tech.mlx.benchmark.model')}</span>
              <span className="text-center">{t('tech.mlx.benchmark.speed')}</span>
              <span className="text-right">{t('tech.mlx.benchmark.ram')}</span>
            </div>
            <div className="mt-2 space-y-1">
              <BenchmarkRow model="Qwen3-4B-4bit" speed="~75 tok/s" ram="2.8 GB" />
              <BenchmarkRow model="Qwen3-8B-4bit" speed="~52 tok/s" ram="4.7 GB" highlight />
              <BenchmarkRow model="DeepSeek-R1-14B" speed="~35 tok/s" ram="~9 GB" />
              <BenchmarkRow model="DeepSeek-R1-32B" speed="~18 tok/s" ram="~20 GB" />
              <BenchmarkRow model="Kumru 2B (MPS)" speed="~21.7 tok/s" ram="4.2 GB" />
            </div>
            <p className="mt-4 text-center text-xs text-[var(--muted)]">
              {t('tech.mlx.benchmark.note')}
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════════
         TECH STACK
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <SectionLabel>{t('tech.stack.label')}</SectionLabel>
            <h2 className="text-[clamp(28px,4vw,40px)] font-semibold text-[var(--text)]">
              {t('tech.stack.headline')}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* AI & ML */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-transparent p-5 backdrop-blur-[var(--blur-card)]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
                {t('tech.stack.ai.title')}
              </h3>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li>Kumru 2B — Turkish LLM</li>
                <li>Qwen3 — General Reasoning</li>
                <li>DeepSeek-R1 — Deep Thinking</li>
                <li>MLX — Apple Silicon Inference</li>
                <li>FAISS — Vector Search</li>
                <li>HuggingFace Transformers</li>
              </ul>
            </div>
            {/* Backend */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-transparent p-5 backdrop-blur-[var(--blur-card)]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
                {t('tech.stack.backend.title')}
              </h3>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li>Fastify + TypeScript</li>
                <li>FastAPI + Python</li>
                <li>PostgreSQL + Drizzle ORM</li>
                <li>MCP Protocol Adapters</li>
                <li>JWT + OAuth (GitHub, Google)</li>
                <li>SSE Real-time Events</li>
              </ul>
            </div>
            {/* Frontend & UI */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-transparent p-5 backdrop-blur-[var(--blur-card)]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
                {t('tech.stack.frontend.title')}
              </h3>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li>React + Vite</li>
                <li>SwiftUI (macOS Desktop)</li>
                <li>Gradio Chat UI</li>
                <li>i18n (TR / EN)</li>
                <li>Tailwind CSS</li>
                <li>WebSocket Real-time</li>
              </ul>
            </div>
            {/* DevOps */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-transparent p-5 backdrop-blur-[var(--blur-card)]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
                {t('tech.stack.devops.title')}
              </h3>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li>Docker + Compose</li>
                <li>OCI ARM64 Free Tier</li>
                <li>Caddy (Auto-HTTPS)</li>
                <li>GitHub Actions CI/CD</li>
                <li>pnpm Monorepo</li>
              </ul>
            </div>
            {/* Voice & Audio */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-transparent p-5 backdrop-blur-[var(--blur-card)]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
                {t('tech.stack.voice.title')}
              </h3>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li>OpenWakeWord — Wake Word</li>
                <li>Whisper — Speech-to-Text</li>
                <li>macOS TTS — Text-to-Speech</li>
                <li>WebSocket Communication</li>
                <li>VAD Silence Detection</li>
              </ul>
            </div>
            {/* RAG & Knowledge */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-transparent p-5 backdrop-blur-[var(--blur-card)]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
                {t('tech.stack.rag.title')}
              </h3>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li>FAISS Vector Store</li>
                <li>all-MiniLM-L6-v2 Embeddings</li>
                <li>10 Knowledge Domains</li>
                <li>91 Indexed Chunks</li>
                <li>Semantic Search + Re-ranking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════════
         EVOLUTION TIMELINE
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <SectionLabel>{t('tech.evolution.label')}</SectionLabel>
            <h2 className="text-[clamp(28px,4vw,40px)] font-semibold text-[var(--text)]">
              {t('tech.evolution.headline')}
            </h2>
          </div>

          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-[var(--accent)] via-[var(--accent)]/40 to-transparent sm:left-8" />

            {[
              { date: t('tech.evolution.t1.date'), title: t('tech.evolution.t1.title'), desc: t('tech.evolution.t1.desc') },
              { date: t('tech.evolution.t2.date'), title: t('tech.evolution.t2.title'), desc: t('tech.evolution.t2.desc') },
              { date: t('tech.evolution.t3.date'), title: t('tech.evolution.t3.title'), desc: t('tech.evolution.t3.desc') },
              { date: t('tech.evolution.t4.date'), title: t('tech.evolution.t4.title'), desc: t('tech.evolution.t4.desc') },
              { date: t('tech.evolution.t5.date'), title: t('tech.evolution.t5.title'), desc: t('tech.evolution.t5.desc') },
              { date: t('tech.evolution.t6.date'), title: t('tech.evolution.t6.title'), desc: t('tech.evolution.t6.desc') },
            ].map((item, i) => (
              <div key={i} className="relative flex gap-6 pb-8 pl-14 sm:pl-20">
                <div className="absolute left-4 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--bg)] sm:left-6">
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                </div>
                <div>
                  <span className="text-xs font-medium text-[var(--accent)]">{item.date}</span>
                  <h3 className="mt-1 text-base font-semibold text-[var(--text)]">{item.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
         CLOSING CTA
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-[var(--radius-xl)] border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-[var(--glass-top)] p-10 backdrop-blur-[var(--blur-card)] sm:p-14">
            <p className="text-[clamp(18px,2.5vw,24px)] font-medium leading-relaxed text-[var(--text)]">
              {t('tech.closing.text')}
            </p>
            <a
              href="/about"
              className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg)] transition-all hover:opacity-90"
            >
              {t('tech.closing.cta')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
