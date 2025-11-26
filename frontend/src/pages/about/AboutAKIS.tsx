/**
 * AboutAKIS — Brand narrative page for the AKIS Platform
 * Fully i18n-aware with refined layout and consistent design language
 */

import { useI18n } from '../../i18n/useI18n';

/* ─────────────────────────────────────────────────────────────────────────────
   Section Label Component — reusable badge-style section header
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

/* ─────────────────────────────────────────────────────────────────────────────
   Section Divider — soft horizontal line between sections
   ───────────────────────────────────────────────────────────────────────────── */
function Divider() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--glass-bdr)] to-transparent" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Agent Card Component — for the lineup section
   ───────────────────────────────────────────────────────────────────────────── */
interface AgentCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

function AgentCard({ icon, title, subtitle }: AgentCardProps) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-transparent p-6 backdrop-blur-[var(--blur-card)] transition-all duration-[var(--transition-smooth)] hover:border-[var(--accent)]/40 hover:shadow-[0_0_24px_rgba(0,212,177,0.12)]">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--accent)]/5 blur-2xl transition-all duration-500 group-hover:bg-[var(--accent)]/10" />
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 transition-colors duration-300 group-hover:bg-[var(--accent)]/20">
          {icon}
        </div>
        <h3 className="mb-1.5 text-lg font-semibold text-[var(--text)]">{title}</h3>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Concept Card Component — for "Akis / Akış" cards
   ───────────────────────────────────────────────────────────────────────────── */
interface ConceptCardProps {
  icon: React.ReactNode;
  title: string;
  body: string;
}

function ConceptCard({ icon, title, body }: ConceptCardProps) {
  return (
    <div className="flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--glass-bdr)] bg-gradient-to-b from-[var(--glass-top)] to-transparent p-6 backdrop-blur-[var(--blur-card)]">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[var(--text)]">{title}</h3>
      <p className="flex-1 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Mission Item Component — bullet point with accent dot
   ───────────────────────────────────────────────────────────────────────────── */
function MissionItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
      </span>
      <span className="text-base leading-relaxed text-[var(--text)]">{children}</span>
    </li>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SVG Icons
   ───────────────────────────────────────────────────────────────────────────── */
const EchoIcon = () => (
  <svg
    className="h-5 w-5 text-[var(--accent)]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
    />
  </svg>
);

const FlowIcon = () => (
  <svg
    className="h-5 w-5 text-[var(--accent)]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
    />
  </svg>
);

const ScribeIcon = () => (
  <svg
    className="h-6 w-6 text-[var(--accent)]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

const TraceIcon = () => (
  <svg
    className="h-6 w-6 text-[var(--accent)]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
    />
  </svg>
);

const ProtoIcon = () => (
  <svg
    className="h-6 w-6 text-[var(--accent)]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
    />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────────────────────── */
export default function AboutAKIS() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ═══════════════════════════════════════════════════════════════════════
         ORIGIN SECTION
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <SectionLabel>{t('about.origin.label')}</SectionLabel>

          <h1 className="mb-6 text-center text-[clamp(32px,5vw,52px)] font-semibold leading-[1.15] tracking-tight text-[var(--text)]">
            {t('about.origin.title').split('AKIS')[0]}
            <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/70 bg-clip-text text-transparent">
              AKIS
            </span>
            {t('about.origin.title').split('AKIS')[1]}
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-center text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            {t('about.origin.subtitle')}
          </p>

          {/* Two concept cards — equal height */}
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <ConceptCard
              icon={<EchoIcon />}
              title={t('about.origin.echo.title')}
              body={t('about.origin.echo.body')}
            />
            <ConceptCard
              icon={<FlowIcon />}
              title={t('about.origin.flow.title')}
              body={t('about.origin.flow.body')}
            />
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-lg font-medium leading-relaxed text-[var(--text)] sm:text-xl">
            {t('about.origin.closing')}
          </p>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════════
         VISION SECTION
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <SectionLabel>{t('about.vision.label')}</SectionLabel>

          <blockquote className="mb-10">
            <p className="text-[clamp(20px,3.5vw,32px)] font-semibold leading-[1.35] text-[var(--text)]">
              "{t('about.vision.quote').split('flow')[0]}
              <span className="text-[var(--accent)]">flow</span>
              {t('about.vision.quote').split('flow')[1]}"
            </p>
          </blockquote>

          <div className="rounded-[var(--radius-xl)] border border-[var(--glass-bdr)] bg-gradient-to-br from-[var(--glass-top)] via-transparent to-[var(--accent)]/5 p-8 backdrop-blur-[var(--blur-card)] sm:p-10">
            <p className="text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              {t('about.vision.body1').split(/architecture|mimari/i)[0]}
              <span className="text-[var(--text)]">
                {t('about.vision.body1').match(/architecture, design and problem-solving|mimari, tasarım ve gerçek problem çözme/i)?.[0] || 'architecture, design and problem-solving'}
              </span>
              {t('about.vision.body1').split(/architecture, design and problem-solving|mimari, tasarım ve gerçek problem çözme/i)[1] || '.'}
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              {t('about.vision.body2').split(/GitHub, Jira and Confluence|GitHub, Jira ve Confluence/i)[0]}
              <span className="text-[var(--text)]">GitHub, Jira & Confluence</span>
              {t('about.vision.body2').split(/GitHub, Jira and Confluence|GitHub, Jira ve Confluence/i)[1] || '.'}
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════════
         MISSION SECTION
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <SectionLabel>{t('about.mission.label')}</SectionLabel>

          <blockquote className="mb-10 text-center">
            <p className="text-[clamp(18px,2.5vw,24px)] font-semibold leading-[1.4] text-[var(--text)]">
              "{t('about.mission.quote')}"
            </p>
          </blockquote>

          <ul className="space-y-4">
            <MissionItem>
              <span className="font-medium text-[var(--accent)]">
                AI Agent Workflow Engine
              </span>{' '}
              — {t('about.mission.items.engine').replace(/^.*Engine/i, '').trim()}
            </MissionItem>
            <MissionItem>
              <span className="font-medium">AKIS Scribe</span> →{' '}
              {t('about.mission.items.scribe').split('→')[1]?.trim() || t('about.mission.items.scribe')}
            </MissionItem>
            <MissionItem>
              <span className="font-medium">AKIS Trace</span> →{' '}
              {t('about.mission.items.trace').split('→')[1]?.trim() || t('about.mission.items.trace')}
            </MissionItem>
            <MissionItem>
              <span className="font-medium">AKIS Proto</span> →{' '}
              {t('about.mission.items.proto').split('→')[1]?.trim() || t('about.mission.items.proto')}
            </MissionItem>
            <MissionItem>
              <span className="font-medium text-[var(--accent)]">
                {t('about.mission.items.logs').split(',')[0]}
              </span>
              , {t('about.mission.items.logs').split(',').slice(1).join(',').trim()}
            </MissionItem>
          </ul>
        </div>
      </section>

      <Divider />

      {/* ═══════════════════════════════════════════════════════════════════════
         AGENT LINEUP SECTION
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <SectionLabel>{t('about.lineup.label')}</SectionLabel>
            <h2 className="text-[clamp(28px,4vw,40px)] font-semibold text-[var(--text)]">
              {t('about.lineup.headline')}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            <AgentCard
              icon={<ScribeIcon />}
              title={t('about.lineup.scribe.title')}
              subtitle={t('about.lineup.scribe.subtitle')}
            />
            <AgentCard
              icon={<TraceIcon />}
              title={t('about.lineup.trace.title')}
              subtitle={t('about.lineup.trace.subtitle')}
            />
            <AgentCard
              icon={<ProtoIcon />}
              title={t('about.lineup.proto.title')}
              subtitle={t('about.lineup.proto.subtitle')}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
         CLOSING STATEMENT
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-[var(--radius-xl)] border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-[var(--glass-top)] p-10 backdrop-blur-[var(--blur-card)] sm:p-14">
            <p className="text-[clamp(18px,2.5vw,24px)] font-medium leading-relaxed text-[var(--text)]">
              {t('about.closing.text').split(/philosophy|felsefe/i)[0]}
              <span className="text-[var(--accent)]">
                {t('about.closing.text').match(/philosophy|felsefe/i)?.[0] || 'philosophy'}
              </span>
              {t('about.closing.text').split(/philosophy|felsefe/i)[1]?.split(/what matters|önemli olana/i)[0]}
              <span className="text-[var(--accent)]">
                {t('about.closing.text').match(/what matters|önemli olana/i)?.[0] || 'what matters'}
              </span>
              {t('about.closing.text').split(/what matters|önemli olana/i)[1] || '.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
