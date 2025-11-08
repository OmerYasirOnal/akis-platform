# AKIS Theme System

1. Core tokens live in `frontend/src/theme/theme.tokens.css`; map them via `frontend/src/styles/global.css`.
2. `ThemeProvider` (`frontend/src/theme/ThemeProvider.tsx`) applies `[data-theme]` + `.dark` and persists under `akis:theme`.
3. Inline guard in `frontend/index.html` resolves stored → system → dark to avoid FOUC before React boot.
4. Access the current theme with `useTheme()` and render the shared toggle from `frontend/src/components/ThemeToggle.tsx`.
5. When adding a theme, extend the CSS variables and update the mapping selectors—no direct hex in components.
6. Pricing, Landing, and shared surfaces should only use `ak-*` tokens so both themes stay in sync.

