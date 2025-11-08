export type Locale = 'en' | 'tr';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export const MESSAGE_KEYS = [
  'app.title',
  'app.tagline',
  'nav.home',
  'nav.dashboard',
  'cta.getStarted',
  'status.loading',
  'status.error',
  'agents.index.subtitle',
  'agents.index.title',
  'agents.index.description',
  'agents.index.agentLabel',
  'agents.index.viewDetails',
  'agents.index.runCta',
  'agents.index.runComingSoon',
  'agents.index.requireLogin',
  'agents.scribe.subtitle',
  'agents.scribe.title',
  'agents.scribe.description',
  'agents.scribe.form.docLabel',
  'agents.scribe.form.docPlaceholder',
  'agents.scribe.form.docHint',
  'agents.scribe.validation.doc',
  'agents.trace.subtitle',
  'agents.trace.title',
  'agents.trace.description',
  'agents.trace.form.specLabel',
  'agents.trace.form.specPlaceholder',
  'agents.trace.form.specHint',
  'agents.trace.validation.spec',
  'agents.proto.subtitle',
  'agents.proto.title',
  'agents.proto.description',
  'agents.proto.form.goalLabel',
  'agents.proto.form.goalPlaceholder',
  'agents.proto.form.goalHint',
  'agents.form.loginGate',
  'agents.form.submitting',
  'agents.form.submit',
  'agents.form.reset',
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

