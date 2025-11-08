# i18n quickstart

1. Duplicate `src/i18n/locales/en.json` to `src/i18n/locales/<locale>.json` and translate the existing keys.
2. Add the new locale code to `SUPPORTED_LOCALES` in `src/i18n/i18n.config.ts` and extend the `Locale` union in `src/i18n/i18n.types.ts`.
3. Re-export the lazy loader in `I18nProvider.tsx` (`catalogLoaders`) so the new catalog loads on demand.
4. Use `const { t, setLocale } = useI18n();` inside components; never access the JSON directly.
5. Keep message keys stable and update both `MESSAGE_KEYS` and the README when introducing new strings.
6. Run the app, toggle to the new locale via `setLocale(<locale>)`, and verify fallback warnings stay clean.

