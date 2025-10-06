import { useForecast } from "../api/hooks";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../state/store";
import { Skeleton } from "../components/ui/Skeleton";
import { Badge } from "../components/ui/badge";
import { aqiBadgeClass, aqiCategory, aqiColor } from "../lib/aqi";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useThemeMode } from "@/hooks/useThemeMode";

export function ForecastPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading } = useForecast();
  const isDark = useThemeMode();

  const [scrollIndex, setScrollIndex] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const announceRef = useRef<HTMLDivElement | null>(null);

  const hourIndex = useAppStore((s) => s.forecastHourIndex);
  const setHourIndex = useAppStore((s) => s.setForecastHourIndex);

  const hours = data?.hours ?? [];

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
        category: t(aqiCategory(h.aqi, { key: true }) as string),
        categoryKey: aqiCategory(h.aqi, { key: true }) as string,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  const slice = compact ? items.slice(scrollIndex, scrollIndex + 12) : items;

  const current = items[hourIndex];
  const currentDelta = current?.delta ?? 0;
  const deltaArrow = currentDelta === 0 ? "→" : currentDelta > 0 ? "↑" : "↓";

  const [hoverTs, setHoverTs] = useState<number | null>(null);
  const hoverData = hoverTs ? items.find((h) => h.ts === hoverTs) : null;

  // -------- keyboard navigation
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

  // -------- announcer A11y
  useEffect(() => {
    if (current && announceRef.current) {
      announceRef.current.textContent =
        `${current.hour}:00 ${t("aqi.short", "AQI")} ${current.aqi} ${t(
          current.categoryKey as string
        )}` +
        (currentDelta !== 0
          ? currentDelta > 0
            ? ` ${t("forecast.rising", "Rising")} ${currentDelta}`
            : ` ${t("forecast.falling", "Falling")} ${Math.abs(currentDelta)}`
          : ` ${t("forecast.stable", "Stable")}`);
    }
  }, [current, currentDelta, t]);

  // -------- sparkline
  const spark = useMemo(() => {
    if (items.length === 0) return "";
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

  // -------- ticks do slider
  const ticks = useMemo(() => {
    if (!items.length) return [] as number[];
    const lastHour = items[items.length - 1].hour;
    const base = [0, 6, 12, 18];
    const arr = base.filter((h) => h <= lastHour);
    if (!arr.includes(lastHour)) arr.push(lastHour);
    return arr;
  }, [items]);

  // -------- seguir o item ativo no scroll (SEM* modo compacto)
  useEffect(() => {
    if (!listRef.current || items.length === 0) return;
    const activeKey = items[hourIndex]?.ts;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-key="${activeKey}"]`
    );
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [hourIndex, items]);

  // -------- no modo compacto, garanta que o item ativo esteja dentro da janela (12)
  useEffect(() => {
    if (!compact) return;
    if (hourIndex < scrollIndex) {
      setScrollIndex(hourIndex);
    } else if (hourIndex >= scrollIndex + 12) {
      setScrollIndex(Math.max(0, hourIndex - 11));
    }
  }, [hourIndex, compact, scrollIndex]);

  // -------- estilos por tema
  const sparkStroke = isDark ? "#38bdf8" : "hsl(var(--primary))";
  const itemActiveClass = isDark
    ? "bg-muted/70 shadow-md"
    : "bg-muted/80 shadow-sm";
  const itemInactiveHover = "hover:bg-accent/30";
  const itemBase =
    "relative cursor-pointer min-w-20 flex-shrink-0 flex flex-col items-center rounded px-2 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3 gap-4">
        <div>
          <h2 className="font-semibold leading-snug text-foreground">
            {t("forecast.title", "Hourly Forecast")}
          </h2>
          <p className="text-[10px] text-muted-foreground">
            {hourIndex + 1} / {items.length}
          </p>

          {spark && (
            <svg
              viewBox="0 0 100 24"
              className="mt-1 w-24 h-6 overflow-visible"
            >
              <path
                d={spark}
                fill="none"
                stroke={sparkStroke}
                strokeWidth={1}
                className={isDark ? "opacity-40" : "opacity-60"}
              />
              {current && items.length > 1 && (
                <circle
                  cx={(hourIndex / (items.length - 1)) * 100}
                  cy={12}
                  r={2.5}
                  style={{ fill: sparkStroke }}
                />
              )}
            </svg>
          )}
        </div>

        {current && (
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={aqiBadgeClass(current.aqi)}>
              {current.category}
            </Badge>
            <Badge
              variant="outline"
              className={`flex gap-1 items-center ${
                currentDelta === 0
                  ? "border-border text-muted-foreground"
                  : isDark
                  ? "border-sky-600 text-sky-300"
                  : "border-primary/60 text-primary"
              }`}
              aria-label={t("forecast.trend", "Trend")}
              title={
                currentDelta === 0
                  ? t("forecast.stable", "Stable")
                  : currentDelta > 0
                  ? t("forecast.rising", "Rising")
                  : t("forecast.falling", "Falling")
              }
            >
              <span>{deltaArrow}</span>
              <span>
                {currentDelta === 0
                  ? t("forecast.stable", "Stable")
                  : `${currentDelta > 0 ? "+" : ""}${currentDelta}`}
              </span>
            </Badge>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: compact ? 6 : 12 }).map((_, i) => (
            <div
              key={i}
              className="min-w-20 flex-shrink-0 flex flex-col items-center gap-2"
            >
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className={compact ? "space-y-2" : ""}>
          {compact && (
            <div className="flex justify-between items-center text-[10px] text-muted-foreground gap-2">
              <Button
                variant="ghost"
                size="icon"
                disabled={scrollIndex === 0}
                onClick={() => setScrollIndex((i) => Math.max(0, i - 4))}
                aria-label={t("actions.prev", "Previous")}
                className="h-6 w-6 disabled:opacity-30"
              >
                ◀
              </Button>
              <span>
                {slice.length} / {items.length} {t("forecast.hours", "hours")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                disabled={scrollIndex + 12 >= items.length}
                onClick={() =>
                  setScrollIndex((i) => Math.min(items.length - 12, i + 4))
                }
                aria-label={t("actions.next", "Next")}
                className="h-6 w-6 disabled:opacity-30"
              >
                ▶
              </Button>
            </div>
          )}

          <div
            ref={listRef}
            className="flex gap-3 overflow-x-auto text-xs relative outline-none"
            role="listbox"
            aria-label={t("forecast.listAria", "Hourly AQI forecast")}
            tabIndex={0}
            onKeyDown={onKey}
            style={{
              overscrollBehaviorX: "contain",
              WebkitOverflowScrolling: "touch",
              scrollbarGutter: "stable both-edges",
            }}
          >
            {slice.map((h) => {
              const globalIndex = items.findIndex((x) => x.ts === h.ts);
              const active = globalIndex === hourIndex;
              const catColor = aqiColor(h.aqi);
              const delta = h.delta;
              const deltaSym = delta === 0 ? "" : delta > 0 ? "↑" : "↓";

              return (
                <button
                  key={h.ts}
                  data-key={h.ts} /* <- usado para scrollIntoView */
                  type="button"
                  role="option"
                  aria-selected={active}
                  aria-pressed={active}
                  aria-label={`${h.hour}:00 ${t("aqi.short", "AQI")} ${h.aqi} ${
                    h.category
                  }${
                    delta
                      ? delta > 0
                        ? " " + t("forecast.rising", "Rising") + " " + delta
                        : " " +
                          t("forecast.falling", "Falling") +
                          " " +
                          Math.abs(delta)
                      : ""
                  }`}
                  onClick={() => focusHour(globalIndex)}
                  onMouseEnter={() => setHoverTs(h.ts)}
                  onMouseLeave={() =>
                    setHoverTs((cur) => (cur === h.ts ? null : cur))
                  }
                  className={`${itemBase} ${
                    active ? itemActiveClass : itemInactiveHover
                  }`}
                  style={
                    active
                      ? {
                          boxShadow: `0 0 0 1px ${catColor}66, 0 0 0 4px rgba(56,189,248,0.08)`,
                        }
                      : undefined
                  }
                >
                  <span className="text-foreground">{h.hour}:00</span>
                  <span
                    className="text-lg font-semibold tracking-tight"
                    style={{ color: catColor }}
                  >
                    {h.aqi}
                  </span>
                  {active && delta !== 0 && (
                    <span
                      className={`text-[10px] ${
                        delta > 0 ? "text-amber-500" : "text-emerald-500"
                      }`}
                    >
                      {deltaSym} {Math.abs(delta)}
                    </span>
                  )}
                </button>
              );
            })}

            {hoverData && (
              <div
                className="absolute -top-2 translate-y-[-100%] pointer-events-none left-0"
                style={{
                  transform: `translate(${
                    (items.findIndex((h) => h.ts === hoverData.ts) -
                      (compact ? scrollIndex : 0)) *
                    80
                  }px, -8px)`,
                }}
              >
                <div className="px-2 py-1 rounded bg-card/95 border border-border text-[10px] shadow whitespace-nowrap flex gap-1">
                  <span
                    className="font-semibold"
                    style={{ color: aqiColor(hoverData.aqi) }}
                  >
                    {t("aqi.short", "AQI")} {hoverData.aqi}
                  </span>
                  {hoverData.pollutant && <span>· {hoverData.pollutant}</span>}
                  <span>· {hoverData.hour}:00</span>
                  {hoverData.delta !== 0 && (
                    <span
                      className={
                        hoverData.delta > 0
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }
                    >
                      · {hoverData.delta > 0 ? "+" : ""}
                      {hoverData.delta}
                    </span>
                  )}
                  <span>· {t(hoverData.categoryKey as string)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground relative">
            <span>0h</span>
            <div className="relative flex-1">
              <input
                aria-label={t("forecast.listAria", "Hourly AQI forecast")}
                type="range"
                min={0}
                max={Math.max(0, items.length - 1)}
                value={hourIndex}
                onChange={(e) => setHourIndex(+e.target.value)}
                className="w-full"
              />
              <div className="absolute inset-x-0 top-4 flex justify-between text-[9px] text-muted-foreground pointer-events-none select-none">
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

          <div aria-live="polite" className="sr-only" ref={announceRef} />
        </div>
      )}
    </Card>
  );
}
