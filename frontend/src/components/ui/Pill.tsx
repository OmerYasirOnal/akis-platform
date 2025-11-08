import { cn } from "../../utils/cn";

type PillType = "scribe" | "trace" | "proto";

interface PillProps {
  type: PillType;
}

const typeStyles: Record<PillType, { dot: string; label: string }> = {
  scribe: { dot: "bg-ak-primary", label: "Scribe" },
  trace: { dot: "bg-ak-primary/80", label: "Trace" },
  proto: { dot: "bg-ak-primary/60", label: "Proto" },
};

export function Pill({ type }: PillProps) {
  const style = typeStyles[type];

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-ak-border bg-ak-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-ak-text-primary">
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </span>
  );
}
