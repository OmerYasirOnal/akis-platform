import { cn } from "../../utils/cn";

type BadgeState = "pending" | "running" | "completed" | "failed" | "awaiting_approval";

interface BadgeProps {
  state: BadgeState;
}

const stateStyles: Record<
  BadgeState,
  { container: string; dot: string; label: string }
> = {
  pending: {
    container: "bg-ak-surface text-ak-text-secondary",
    dot: "bg-ak-text-secondary",
    label: "Pending",
  },
  running: {
    container: "bg-ak-primary/10 text-ak-primary",
    dot: "bg-ak-primary animate-pulse",
    label: "Running",
  },
  completed: {
    container: "bg-green-500/10 text-green-400",
    dot: "bg-green-400",
    label: "Completed",
  },
  failed: {
    container: "bg-red-500/10 text-red-400",
    dot: "bg-red-400",
    label: "Failed",
  },
  awaiting_approval: {
    container: "bg-yellow-500/10 text-yellow-400",
    dot: "bg-yellow-500",
    label: "Awaiting Approval",
  },
};

const defaultStyle = {
  container: "bg-ak-surface text-ak-text-secondary",
  dot: "bg-ak-text-secondary",
  label: "Unknown",
};

export function Badge({ state }: BadgeProps) {
  const theme = stateStyles[state] ?? defaultStyle;
  const displayLabel = theme.label || state || "Unknown";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
        theme.container
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} aria-hidden />
      {displayLabel}
    </span>
  );
}

type StatusBadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface StatusBadgeProps {
  variant?: StatusBadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  success: "bg-green-500/10 text-green-400",
  warning: "bg-yellow-500/10 text-yellow-400",
  error: "bg-red-500/10 text-red-400",
  info: "bg-blue-500/10 text-blue-400",
  neutral: "bg-ak-surface-2 text-ak-text-secondary",
};

export function StatusBadge({ variant = "neutral", className, children }: StatusBadgeProps) {
  const variantStyle = variantStyles[variant] ?? variantStyles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        variantStyle,
        className
      )}
    >
      {children}
    </span>
  );
}
