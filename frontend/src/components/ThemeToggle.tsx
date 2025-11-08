import { memo } from "react";

import { cn } from "../utils/cn";
import { useTheme } from "../theme/useTheme";

type ThemeToggleSize = "sm" | "md";

interface ThemeToggleProps {
  className?: string;
  size?: ThemeToggleSize;
}

const sizeMap: Record<ThemeToggleSize, string> = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
};

const ThemeToggleComponent = ({ className, size = "md" }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark ? "Switch to light theme" : "Switch to dark theme"
      }
      aria-pressed={isDark}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border border-ak-border bg-ak-surface-2 text-ak-text-primary transition-colors duration-200 hover:border-ak-primary hover:text-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg",
        sizeMap[size],
        className
      )}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span className="sr-only">
        {isDark ? "Enable light theme" : "Enable dark theme"}
      </span>
    </button>
  );
};

const SunIcon = memo(() => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m16.95 4.95-1.4-1.4M6.45 6.45l-1.4-1.4m0 13.9 1.4-1.4m11.1-11.1 1.4-1.4" />
  </svg>
));
SunIcon.displayName = "SunIcon";

const MoonIcon = memo(() => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 0 1 12.21 3 7 7 0 0 0 12 17a7 7 0 0 0 9-4.21Z" />
  </svg>
));
MoonIcon.displayName = "MoonIcon";

const ThemeToggle = memo(ThemeToggleComponent);

export default ThemeToggle;


