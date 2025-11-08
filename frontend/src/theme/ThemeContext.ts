import { createContext } from "react";

export type ThemeName = "dark" | "light";

export interface ThemeContextValue {
  theme: ThemeName;
  isDark: boolean;
  isLight: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "akis:theme";
export const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";


