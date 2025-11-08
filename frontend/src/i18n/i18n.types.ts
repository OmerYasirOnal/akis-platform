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

