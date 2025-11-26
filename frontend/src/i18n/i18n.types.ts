export type Locale = 'en' | 'tr';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export const MESSAGE_KEYS = [
  // App
  'app.title',
  'app.tagline',
  // Navigation
  'nav.home',
  'nav.dashboard',
  // CTA
  'cta.getStarted',
  'cta.primary',
  'cta.secondary',
  // Status
  'status.loading',
  'status.error',
  // Agents Index
  'agents.index.subtitle',
  'agents.index.title',
  'agents.index.description',
  'agents.index.agentLabel',
  'agents.index.viewDetails',
  'agents.index.runCta',
  'agents.index.runComingSoon',
  'agents.index.requireLogin',
  // Agents Scribe
  'agents.scribe.subtitle',
  'agents.scribe.title',
  'agents.scribe.description',
  'agents.scribe.form.docLabel',
  'agents.scribe.form.docPlaceholder',
  'agents.scribe.form.docHint',
  'agents.scribe.validation.doc',
  // Agents Trace
  'agents.trace.subtitle',
  'agents.trace.title',
  'agents.trace.description',
  'agents.trace.form.specLabel',
  'agents.trace.form.specPlaceholder',
  'agents.trace.form.specHint',
  'agents.trace.validation.spec',
  // Agents Proto
  'agents.proto.subtitle',
  'agents.proto.title',
  'agents.proto.description',
  'agents.proto.form.goalLabel',
  'agents.proto.form.goalPlaceholder',
  'agents.proto.form.goalHint',
  // Agents Form
  'agents.form.loginGate',
  'agents.form.submitting',
  'agents.form.submit',
  'agents.form.reset',
  // Agents Status
  'agents.status.empty',
  'agents.status.state.pending',
  'agents.status.state.running',
  'agents.status.state.completed',
  'agents.status.state.failed',
  'agents.status.polling',
  'agents.status.jobIdLabel',
  'agents.status.startedAt',
  'agents.status.updatedAt',
  'agents.status.type',
  'agents.status.result',
  'agents.status.error',
  // Header Navigation
  'header.nav.products',
  'header.nav.docs',
  'header.nav.pricing',
  'header.nav.contact',
  'header.nav.about',
  'header.cta',
  'header.locale.en',
  'header.locale.tr',
  // Hero
  'hero.title',
  'hero.sub',
  // Modules
  'modules.scribe.title',
  'modules.scribe.sub',
  'modules.scribe.b1',
  'modules.scribe.b2',
  'modules.scribe.b3',
  'modules.trace.title',
  'modules.trace.sub',
  'modules.trace.b1',
  'modules.trace.b2',
  'modules.trace.b3',
  'modules.proto.title',
  'modules.proto.sub',
  'modules.proto.b1',
  'modules.proto.b2',
  'modules.proto.b3',
  // About Page - Origin
  'about.origin.label',
  'about.origin.title',
  'about.origin.subtitle',
  'about.origin.echo.title',
  'about.origin.echo.body',
  'about.origin.flow.title',
  'about.origin.flow.body',
  'about.origin.closing',
  // About Page - Vision
  'about.vision.label',
  'about.vision.quote',
  'about.vision.body1',
  'about.vision.body2',
  // About Page - Mission
  'about.mission.label',
  'about.mission.quote',
  'about.mission.items.engine',
  'about.mission.items.scribe',
  'about.mission.items.trace',
  'about.mission.items.proto',
  'about.mission.items.logs',
  // About Page - Lineup
  'about.lineup.label',
  'about.lineup.headline',
  'about.lineup.scribe.title',
  'about.lineup.scribe.subtitle',
  'about.lineup.trace.title',
  'about.lineup.trace.subtitle',
  'about.lineup.proto.title',
  'about.lineup.proto.subtitle',
  // About Page - Closing
  'about.closing.text',
] as const;

export type MessageKey = (typeof MESSAGE_KEYS)[number];

export type Messages = Record<MessageKey, string>;

export interface I18nContextValue {
  locale: Locale;
  availableLocales: readonly Locale[];
  status: LoadStatus;
  t: (key: MessageKey) => string;
  setLocale: (next: Locale) => Promise<void>;
}

