import { cn } from "../../utils/cn";

interface PillStyle {
  bg: string;
  dot: string;
  label: string;
}

const typeStyles: Record<string, PillStyle> = {
  scribe: { bg: "bg-ak-primary/10", dot: "bg-ak-primary", label: "Scribe" },
  trace: { bg: "bg-blue-500/10", dot: "bg-blue-400", label: "Trace" },
  proto: { bg: "bg-purple-500/10", dot: "bg-purple-400", label: "Proto" },
  coder: { bg: "bg-amber-500/10", dot: "bg-amber-400", label: "Coder" },
  developer: { bg: "bg-emerald-500/10", dot: "bg-emerald-400", label: "Developer" },
};

const fallbackStyle: PillStyle = {
  bg: "bg-ak-surface-2",
  dot: "bg-ak-text-secondary",
  label: "Unknown",
};

interface PillProps {
  type: string;
}

export function Pill({ type }: PillProps) {
  const style = typeStyles[type] ?? fallbackStyle;
  const label = style.label || type || "Unknown";

  return (
    <span className={cn(
      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide text-ak-text-primary",
      style.bg
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden />
      {label}
    </span>
  );
}
