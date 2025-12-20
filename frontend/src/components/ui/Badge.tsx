import { cn } from "../../utils/cn";

type BadgeState = "pending" | "running" | "completed" | "failed";

interface BadgeProps {
  state: BadgeState;
}

const stateStyles: Record<
  BadgeState,
  { container: string; dot: string; label: string }
> = {
  pending: {
    container:
      "border border-dashed border-ak-border text-ak-text-secondary",
    dot: "bg-ak-text-secondary",
    label: "Pending",
  },
  running: {
    container: "border border-ak-primary/40 text-ak-primary",
    dot: "bg-ak-primary",
    label: "Running",
  },
  completed: {
    container: "border border-ak-primary text-ak-primary",
    dot: "bg-ak-primary",
    label: "Completed",
  },
  failed: {
    container: "border border-ak-border text-ak-text-primary",
    dot: "bg-ak-text-primary",
    label: "Failed",
  },
};

// Default fallback for unknown states to prevent crashes
const defaultStyle = {
  container: "border border-ak-border text-ak-text-secondary",
  dot: "bg-ak-text-secondary",
  label: "Unknown",
};

/**
 * Job state badge with status indicator dot.
 * Gracefully handles unknown states with a fallback style.
 */
export function Badge({ state }: BadgeProps) {
  // Safe lookup with fallback to prevent crashes
  const theme = stateStyles[state] ?? defaultStyle;
  const displayLabel = theme.label || state || "Unknown";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-ak-surface px-3 py-1 text-xs font-medium uppercase tracking-wide",
        theme.container
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} aria-hidden />
      {displayLabel}
    </span>
  );
}

/**
 * Variant type for StatusBadge flexible component
 */
type StatusBadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface StatusBadgeProps {
  variant?: StatusBadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  success: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
  warning: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  error: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
  info: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  neutral: "bg-ak-surface-2 text-ak-text-secondary border-ak-border",
};

/**
 * Flexible status badge for custom content and variants.
 * Use this for mode indicators, custom labels, etc.
 * Falls back to neutral style for unknown variants.
 */
export function StatusBadge({ variant = "neutral", className, children }: StatusBadgeProps) {
  // Safe lookup with fallback to prevent crashes
  const variantStyle = variantStyles[variant] ?? variantStyles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        variantStyle,
        className
      )}
    >
      {children}
    </span>
  );
}
