// import type { ReactNode } from "react";
import { useCountUp } from "../../hooks/useCountUp";
import { cn } from "../../lib/utils";

const intentStyles: Record<NonNullable<KpiCardProps["intent"]>, string> = {
  good: "bg-aqi-good/15 border-aqi-good/40 text-aqi-good",
  moderate: "bg-aqi-moderate/20 border-aqi-moderate/50 text-yellow-300",
  warning: "bg-orange-500/15 border-orange-500/40 text-orange-300",
  unhealthy: "bg-red-600/15 border-red-600/40 text-red-300",
  neutral: "bg-card border-border text-foreground",
};

type KpiCardProps = {
  label: string;
  value: number | string;
  sub?: string;
  intent?: "neutral" | "warning" | "danger" | "success";
  delta?: number | null;
  trend?: "up" | "down" | "flat";
  unit?: string;
};

export function KpiCard({
  label,
  value,
  sub,
  intent = "neutral",
  delta = null,
  trend,
  unit,
}: KpiCardProps) {
  const isNumber = typeof value === "number";
  const animated = useCountUp(isNumber ? (value as number) : null);

  const arrow =
    trend === "up"
      ? "▲"
      : trend === "down"
      ? "▼"
      : trend === "flat"
      ? "◆"
      : null;

  // Exibe delta somente se existir e for diferente de 0
  // (se a unidade do delta for a mesma do valor, ok; senão, troque aqui)
  const deltaStr =
    delta != null && delta !== 0
      ? `${delta > 0 ? "+" : ""}${delta}${unit ? unit : ""}`
      : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg p-4 border backdrop-blur flex flex-col gap-1 min-w-[170px]",
        intentStyles[intent]
      )}
    >
      <span className="text-[10px] tracking-wide uppercase font-semibold text-[hsl(var(--text-secondary))]">
        {label}
      </span>

      <div className="flex items-baseline gap-2">
        <div className="text-2xl md:text-3xl font-semibold leading-tight tabular-nums">
          {isNumber ? animated ?? 0 : value}
          {isNumber && unit ? (
            <span className="ml-1 text-xs font-medium opacity-70">{unit}</span>
          ) : null}
        </div>

        {arrow && deltaStr && (
          <span
            className={cn(
              "text-xs font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded",
              trend === "up" && "bg-red-500/15 text-red-300", // piorou
              trend === "down" && "bg-emerald-500/15 text-emerald-300", // melhorou
              trend === "flat" && "bg-slate-500/15 text-slate-300"
            )}
            aria-label={`Trend ${trend} ${deltaStr}`}
            title={`Trend ${trend} ${deltaStr}`}
          >
            {arrow} {deltaStr}
          </span>
        )}
      </div>

      {sub && (
        <span className="text-[10px] text-[hsl(var(--text-secondary))]">
          {sub}
        </span>
      )}
    </div>
  );
}
