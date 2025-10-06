// src/sections/ForecastPanel.tsx
import { useForecast } from "../api/hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../state/store";
import { Badge } from "../components/ui/badge";
import { aqiBadgeClass, aqiCategory, aqiColor } from "../lib/aqi";
import { useThemeMode } from "../hooks/useThemeMode";
import { useTranslation } from "react-i18next";

export function ForecastPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading } = useForecast();
  const isDark = useThemeMode();

  const [scrollIndex, setScrollIndex] = useState(0);
  const hourIndex = useAppStore((s) => s.forecastHourIndex);
  const setHourIndex = useAppStore((s) => s.setForecastHourIndex);
  const hours = data?.hours ?? [];

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

  const items = useMemo(() => {
    return hours.map((h, i) => {
      const prev = i > 0 ? hours[i - 1] : null;
      const delta = prev ? h.aqi - prev.aqi : 0;
      const catKeyOrLabel = (aqiCategory as any)(h.aqi, { key: true });
      const category =
        typeof catKeyOrLabel === "string"
          ? t(catKeyOrLabel, catKeyOrLabel)
          : String(catKeyOrLabel);

      return {
        raw: h,
        ts: h.ts,
        hour: new Date(h.ts).getHours(),
        aqi: h.aqi,
        pollutant: (h as any).pollutant as string | undefined,
        delta,
        category,
      };
    });
  }, [hours, t]);

  const slice = compact ? items.slice(scrollIndex, scrollIndex + 12) : items;
  const current = items[hourIndex];
  const currentDelta = current?.delta ?? 0;
  const deltaArrow = currentDelta === 0 ? "→" : currentDelta > 0 ? "↑" : "↓";

  const sparkColor = isDark ? "#38bdf8" : "hsl(var(--primary))";
  const trendClasses =
    currentDelta === 0
      ? "text-muted-foreground border-border"
      : isDark
      ? "text-sky-300 border-sky-600"
      : "text-primary border-primary/50";

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

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <h2 className="font-semibold text-foreground leading-snug">
            {t("forecast.title", "48h Forecast")}
          </h2>
          <p className="text-[10px] text-muted-foreground">
            {t("forecast.hourXofN", {
              defaultValue: "Hour {{x}} / {{n}}",
              x: hourIndex + 1,
              n: items.length,
            })}
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
            </span>
          </div>
        )}
      </div>

      {!isLoading && items.length > 0 && (
        <div className={compact ? "space-y-2" : ""}>
          {compact && (
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <button
                disabled={scrollIndex === 0}
                onClick={() => setScrollIndex((i) => Math.max(0, i - 4))}
                aria-label={t("actions.prev", "Previous")}
                className="disabled:opacity-30"
              >
                ◀
              </button>
              <span>
                {slice.length} / {items.length} {t("forecast.hours", "hours")}
              </span>
              <button
                disabled={scrollIndex + 12 >= items.length}
                onClick={() =>
                  setScrollIndex((i) => Math.min(items.length - 12, i + 4))
                }
                aria-label={t("actions.next", "Next")}
                className="disabled:opacity-30"
              >
                ▶
              </button>
            </div>
          )}

          <div
            className={`flex gap-2 overflow-x-auto text-xs relative py-1 ${
              isDark ? "bg-slate-800/60 p-1 rounded-lg" : "bg-transparent"
            }`}
            role="listbox"
            aria-label={t("forecast.listAria", "Hourly AQI forecast")}
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
                        ? "bg-slate-700  shadow-md"
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

          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>0h</span>
            <input
              aria-label={t("forecast.sliderAria", "Select hour")}
              type="range"
              min={0}
              max={Math.max(0, items.length - 1)}
              value={hourIndex}
              onChange={(e) => setHourIndex(+e.target.value)}
              className="flex-1"
            />
            <span>{Math.max(0, items.length - 1)}h</span>
          </div>
        </div>
      )}
    </section>
  );
}
