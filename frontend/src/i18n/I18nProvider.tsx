import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  persistLocale,
  resolveInitialLocale,
} from './i18n.config';
import { I18nContext } from './i18n.context';
import type {
  I18nContextValue,
  LoadStatus,
  Locale,
  MessageKey,
  Messages,
} from './i18n.types';

type CatalogLoader = () => Promise<Messages>;

const catalogLoaders: Record<Locale, CatalogLoader> = {
  en: () => import('./locales/en.json').then((module) => module.default as Messages),
  tr: () => import('./locales/tr.json').then((module) => module.default as Messages),
};

const catalogCache = new Map<Locale, Messages>();
const missingKeyWarnings = new Set<string>();
const isDev = Boolean(import.meta.env?.DEV);

const loadCatalog = async (locale: Locale): Promise<Messages> => {
  if (catalogCache.has(locale)) {
    return catalogCache.get(locale)!;
  }

  const loader = catalogLoaders[locale];
  if (!loader) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  const catalog = await loader();
  catalogCache.set(locale, catalog);
  return catalog;
};

const updateDocumentLanguage = (locale: Locale) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.lang = locale;
  document.documentElement.dir = 'ltr';
};

const warnMissingKey = (key: MessageKey, locale: Locale, reason: 'missing' | 'default') => {
  if (!isDev) {
    return;
  }

  const warningKey = `${locale}:${key}:${reason}`;
  if (missingKeyWarnings.has(warningKey)) {
    return;
  }

  missingKeyWarnings.add(warningKey);
  const suffix =
    reason === 'default'
      ? ` Falling back to "${DEFAULT_LOCALE}".`
      : ' Missing in default locale as well.';

  if (isDev) console.warn(`[i18n] Missing translation for "${key}" in locale "${locale}".${suffix}`);
};

export function I18nProvider({ children }: PropsWithChildren) {
  const initialLocale = useMemo(resolveInitialLocale, []);

  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [status, setStatus] = useState<LoadStatus>('loading');

  const localeRef = useRef<Locale>(initialLocale);
  const messagesRef = useRef<Messages | null>(null);
  const defaultMessagesRef = useRef<Messages | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applyCatalog = useCallback(
    (nextLocale: Locale, catalog: Messages, shouldPersist: boolean) => {
      if (!mountedRef.current) {
        return;
      }

      localeRef.current = nextLocale;
      messagesRef.current = catalog;
      setLocaleState(nextLocale);
      setStatus('ready');
      updateDocumentLanguage(nextLocale);

      if (shouldPersist) {
        persistLocale(nextLocale);
      }

    },
    []
  );

  const loadAndApply = useCallback(
    async (
      nextLocale: Locale,
      { persist = true, showLoader = false }: { persist?: boolean; showLoader?: boolean } = {}
    ) => {
      if (localeRef.current === nextLocale && messagesRef.current) {
        if (persist) {
          persistLocale(nextLocale);
        }
        return;
      }

      if (showLoader) {
        setStatus('loading');
      }

      try {
        const catalog = await loadCatalog(nextLocale);
        applyCatalog(nextLocale, catalog, persist);
      } catch (error) {
        if (isDev) {
          console.warn(`[i18n] Failed to load locale "${nextLocale}".`, error);
        }
        if (showLoader && mountedRef.current) {
          setStatus('error');
        }
      }
    },
    [applyCatalog]
  );

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      try {
        const defaultCatalog = await loadCatalog(DEFAULT_LOCALE);
        if (isCancelled || !mountedRef.current) {
          return;
        }

        defaultMessagesRef.current = defaultCatalog;

        if (localeRef.current === DEFAULT_LOCALE) {
          applyCatalog(DEFAULT_LOCALE, defaultCatalog, false);
          return;
        }

        await loadAndApply(localeRef.current, { persist: false });
      } catch (error) {
        if (isDev) {
          console.error('[i18n] Unable to bootstrap default locale.', error);
        }
        if (mountedRef.current && defaultMessagesRef.current) {
          applyCatalog(DEFAULT_LOCALE, defaultMessagesRef.current, false);
        } else if (mountedRef.current) {
          setStatus('error');
        }
      }
    };

    bootstrap();

    return () => {
      isCancelled = true;
    };
  }, [applyCatalog, loadAndApply]);

  const translate = useCallback(
    (key: MessageKey): string => {
      const activeMessages = messagesRef.current;
      const defaultMessages = defaultMessagesRef.current;
      const activeLocale = localeRef.current;

      if (!defaultMessages) {
        return key;
      }

      if (activeMessages && key in activeMessages) {
        return activeMessages[key];
      }

      if (key in defaultMessages) {
        if (activeLocale !== DEFAULT_LOCALE) {
          warnMissingKey(key, activeLocale, 'default');
        }
        return defaultMessages[key];
      }

      warnMissingKey(key, activeLocale, 'missing');
      return key;
    },
    []
  );

  const handleSetLocale = useCallback(
    async (next: Locale) => {
      await loadAndApply(next, { showLoader: false });
    },
    [loadAndApply]
  );

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      availableLocales: SUPPORTED_LOCALES,
      status,
      t: translate,
      setLocale: handleSetLocale,
    }),
    [handleSetLocale, locale, status, translate]
  );

  // Gate children until i18n is ready to prevent "Missing translation" warnings
  // This ensures t() calls always have loaded messages available
  if (status === 'loading') {
    return (
      <I18nContext.Provider value={contextValue}>
        <div className="min-h-screen flex items-center justify-center bg-ak-bg">
          <div className="text-ak-text-secondary text-sm">Loading...</div>
        </div>
      </I18nContext.Provider>
    );
  }

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}
