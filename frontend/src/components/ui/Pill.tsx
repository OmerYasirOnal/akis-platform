import { cn } from "../../utils/cn";

type PillType = "scribe" | "trace" | "proto";

interface PillProps {
  type: PillType;
}

const typeStyles: Record<PillType, { bg: string; dot: string; label: string }> = {
  scribe: { bg: "bg-ak-primary/10", dot: "bg-ak-primary", label: "Scribe" },
  trace: { bg: "bg-blue-500/10", dot: "bg-blue-400", label: "Trace" },
  proto: { bg: "bg-purple-500/10", dot: "bg-purple-400", label: "Proto" },
};

export function Pill({ type }: PillProps) {
  const style = typeStyles[type];

  return (
    <span className={cn(
      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide text-ak-text-primary",
      style.bg
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </span>
  );
}
