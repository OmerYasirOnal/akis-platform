import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DARK_MEDIA_QUERY,
  THEME_STORAGE_KEY,
  ThemeContext,
  type ThemeContextValue,
  type ThemeName,
} from "./ThemeContext";

const getStoredTheme = (): ThemeName | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
};

const getSystemTheme = (): ThemeName => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
  }

  return "dark";
};

const applyThemeToDocument = (theme: ThemeName) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
};

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return getStoredTheme() ?? getSystemTheme();
  });
  const [hasExplicitPreference, setHasExplicitPreference] = useState<boolean>(
    () => getStoredTheme() !== null
  );

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);

    const handleChange = (event: MediaQueryListEvent) => {
      if (hasExplicitPreference) {
        return;
      }
      setThemeState(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [hasExplicitPreference]);

  const persistTheme = useCallback(
    (updater: ThemeName | ((prev: ThemeName) => ThemeName)) => {
      setThemeState((current) => {
        const nextTheme =
          typeof updater === "function"
            ? updater(current)
            : (updater as ThemeName);

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
          } catch {
            // ignore storage errors (e.g., private mode)
          }
        }

        return nextTheme;
      });
      setHasExplicitPreference(true);
    },
    []
  );

  const setTheme = useCallback(
    (nextTheme: ThemeName) => persistTheme(nextTheme),
    [persistTheme]
  );

  const toggleTheme = useCallback(
    () => persistTheme((current) => (current === "dark" ? "light" : "dark")),
    [persistTheme]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === "dark",
      isLight: theme === "light",
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};


