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

export function Badge({ state }: BadgeProps) {
  const theme = stateStyles[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-ak-surface px-3 py-1 text-xs font-medium uppercase tracking-wide",
        theme.container
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", theme.dot)} aria-hidden />
      {theme.label}
    </span>
  );
}
