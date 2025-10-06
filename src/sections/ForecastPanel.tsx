// src/sections/ForecastPanel.tsx
import { useForecast } from "../api/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../state/store";
import { Badge } from "../components/ui/badge";
import { aqiBadgeClass, aqiCategory, aqiColor } from "../lib/aqi";
import { useThemeMode } from "../hooks/useThemeMode";

export function ForecastPanel({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useForecast();
  const isDark = useThemeMode();

  const [scrollIndex, setScrollIndex] = useState(0);

  const hourIndex = useAppStore((s) => s.forecastHourIndex);
  const setHourIndex = useAppStore((s) => s.setForecastHourIndex);

  const hours = data?.hours ?? [];

  // Mapeia itens + delta e categoria (schema original do HEAD)
  const items = useMemo(() => {
    return hours.map((h, i) => {
      const prev = i > 0 ? hours[i - 1] : null;
      const delta = prev ? h.aqi - prev.aqi : 0;
      return {
        raw: h,
        ts: h.ts,
        hour: new Date(h.ts).getHours(),
        aqi: h.aqi,
        pollutant: (h as any).pollutant as string | undefined,
        delta,
        category: aqiCategory(h.aqi),
      };
    });
  }, [hours]);

  const current = items[hourIndex];
  const currentDelta = current?.delta ?? 0;
  const deltaArrow = currentDelta === 0 ? "→" : currentDelta > 0 ? "↑" : "↓";

  // Lista exibida (paginada no modo compacto)
  const slice = compact ? items.slice(scrollIndex, scrollIndex + 12) : items;

  // Focus/scroll para o item ativo (HEAD)
  const activeItemRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [hourIndex]);

  // A11y announcer (branch)
  const announceRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (current && announceRef.current) {
      announceRef.current.textContent = `${current.hour}:00 AQI ${
        current.aqi
      } ${current.category}${
        currentDelta !== 0
          ? currentDelta > 0
            ? " rising " + currentDelta
            : " falling " + Math.abs(currentDelta)
          : ""
      }`;
    }
  }, [current, currentDelta]);

  // Navegação por teclado (branch)
  const focusHour = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= items.length) return;
      setHourIndex(idx);
    },
    [items.length, setHourIndex]
  );
  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (!items.length) return;
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          focusHour(hourIndex + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          focusHour(hourIndex - 1);
          break;
        case "Home":
          e.preventDefault();
          focusHour(0);
          break;
        case "End":
          e.preventDefault();
          focusHour(items.length - 1);
          break;
        case "PageUp":
          e.preventDefault();
          focusHour(Math.max(0, hourIndex - 6));
          break;
        case "PageDown":
          e.preventDefault();
          focusHour(Math.min(items.length - 1, hourIndex + 6));
          break;
      }
    },
    [focusHour, hourIndex, items.length]
  );

  // Sparkline (HEAD, com cor por tema)
  const sparkColor = isDark ? "#38bdf8" : "hsl(var(--primary))";
  const sparklinePath = useMemo(() => {
    if (items.length < 2) return "";
    const values = items.map((i) => i.aqi);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(1, max - min);
    const w = 100;
    const h = 24;
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / span) * h;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [items]);

  const currentSparkY = useMemo(() => {
    if (!current || items.length < 2) return 12;
    const values = items.map((i) => i.aqi);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(1, max - min);
    return 24 - ((current.aqi - min) / span) * 24;
  }, [items, current]);

  // Ticks sob o slider (branch)
  const ticks = useMemo(() => {
    if (!items.length) return [] as number[];
    const lastHour = items[items.length - 1].hour;
    const base = [0, 6, 12, 18];
    const arr = base.filter((h) => h <= lastHour);
    if (!arr.includes(lastHour)) arr.push(lastHour);
    return arr;
  }, [items]);

  const trendClasses =
    currentDelta === 0
      ? "text-muted-foreground border-border"
      : isDark
      ? "text-sky-300 border-sky-600"
      : "text-primary border-primary/50";

  return (
    <section className="rounded-xl border bg-card p-4">
      {/* announcer A11y */}
      <div aria-live="polite" className="sr-only" ref={announceRef} />

      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <h2 className="font-semibold text-foreground leading-snug">
            48h Forecast
          </h2>
          <p className="text-[10px] text-muted-foreground">
            Hour {hourIndex + 1} / {items.length}
          </p>

          {sparklinePath && (
            <svg
              viewBox="0 0 100 24"
              className="mt-1 w-24 h-6 overflow-visible"
            >
              <path
                d={sparklinePath}
                fill="none"
                stroke={sparkColor}
                strokeWidth={1.5}
                className="opacity-60 dark:opacity-40"
              />
              {current && (
                <circle
                  cx={(hourIndex / Math.max(1, items.length - 1)) * 100}
                  cy={currentSparkY}
                  r="3"
                  fill={sparkColor}
                />
              )}
            </svg>
          )}
        </div>

        {current && (
          <div className="flex flex-col items-end gap-1">
            <Badge className={aqiBadgeClass(current.aqi)}>
              {current.category}
            </Badge>
            <span
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${trendClasses}`}
              aria-label="trend"
              title={
                currentDelta === 0
                  ? "Stable"
                  : currentDelta > 0
                  ? "Rising"
                  : "Falling"
              }
            >
              <span>{deltaArrow}</span>
              <span>
                {currentDelta === 0
                  ? "Stable"
                  : `${currentDelta > 0 ? "+" : ""}${currentDelta}`}
              </span>
            </span>
          </div>
        )}
      </div>

      {!isLoading && items.length > 0 && (
        <div className={compact ? "space-y-2" : ""} onKeyDown={onKey}>
          {/* paginação do modo compacto (branch) */}
          {compact && (
            <div className="flex justify-between items-center text-[10px] text-muted-foreground gap-2">
              <button
                className="h-6 w-6 rounded hover:bg-accent/50 disabled:opacity-30"
                disabled={scrollIndex === 0}
                onClick={() => setScrollIndex((i) => Math.max(0, i - 4))}
                aria-label="Previous"
              >
                ◀
              </button>
              <span>
                {slice.length} / {items.length} hours
              </span>
              <button
                className="h-6 w-6 rounded hover:bg-accent/50 disabled:opacity-30"
                disabled={scrollIndex + 12 >= items.length}
                onClick={() =>
                  setScrollIndex((i) => Math.min(items.length - 12, i + 4))
                }
                aria-label="Next"
              >
                ▶
              </button>
            </div>
          )}

          {/* lista horizontal de horas (HEAD), com roles/a11y do branch */}
          <div
            className={`flex gap-2 overflow-x-auto text-xs relative py-1 ${
              isDark ? "bg-slate-800/60 p-1 rounded-lg" : "bg-transparent"
            }`}
            role="listbox"
            aria-label="Hourly AQI forecast"
          >
            {slice.map((h) => {
              const globalIndex = items.findIndex((x) => x.ts === h.ts);
              const active = globalIndex === hourIndex;
              return (
                <button
                  key={h.ts}
                  ref={active ? activeItemRef : null}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setHourIndex(globalIndex)}
                  className={`relative flex-shrink-0 w-20 flex flex-col items-center rounded-lg px-2 py-2 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    active
                      ? isDark
                        ? "bg-slate-700 shadow-md"
                        : "bg-gray-300 shadow-sm"
                      : "bg-transparent hover:bg-gray-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`font-semibold ${
                      active
                        ? "text-primary-foreground/90"
                        : "text-muted-foreground"
                    }`}
                  >
                    {h.hour}:00
                  </span>
                  <span
                    className="text-xl font-bold tracking-tight"
                    style={{ color: aqiColor(h.aqi) }}
                  >
                    {h.aqi}
                  </span>
                </button>
              );
            })}
          </div>

          {/* slider com ticks (branch) */}
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground relative">
            <span>0h</span>
            <div className="relative flex-1">
              <input
                aria-label="Hourly AQI forecast"
                type="range"
                min={0}
                max={Math.max(0, items.length - 1)}
                value={hourIndex}
                onChange={(e) => setHourIndex(+e.target.value)}
                className="w-full"
              />
              <div className="absolute inset-x-0 top-4 flex justify-between text-[9px] text-foreground/60 pointer-events-none select-none">
                {ticks.map((h) => (
                  <span
                    key={h}
                    style={{ transform: "translateX(-50%)" }}
                    className="relative left-1/2"
                  >
                    {h}h
                  </span>
                ))}
              </div>
            </div>
            <span>{Math.max(0, items.length - 1)}h</span>
          </div>
        </div>
      )}
    </section>
  );
}
