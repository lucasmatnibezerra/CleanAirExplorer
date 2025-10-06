// src/pages/DashboardPage.tsx
import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { useForecast } from "@/api/hooks";
import { useAppStore } from "@/state/store";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { aqiCategory } from "@/lib/aqi";

const MapPanel = lazy(() => import("../sections/MapPanel"));
import { ForecastPanel } from "../sections/ForecastPanel";
const AlertsPanel = lazy(() => import("../sections/AlertsPanel"));

export function DashboardPage() {
  const { t } = useTranslation();

  const { data: forecast } = useForecast();
  const hourIndex = useAppStore((s) => s.forecastHourIndex);

  const current = forecast?.hours[hourIndex];
  const prev = hourIndex > 0 ? forecast?.hours[hourIndex - 1] : undefined;
  const delta = current && prev ? current.aqi - prev.aqi : 0;

  const dominant = current
    ? current.aqi > 120
      ? "O₃"
      : current.aqi > 80
      ? "PM₂.₅"
      : "NO₂"
    : "—";

  const trendType = delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  const trendLabel =
    delta === 0
      ? "Stable"
      : delta > 0
      ? `Rising +${delta}`
      : `Falling ${delta}`;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="tracking-tight font-semibold text-[1.75rem] md:text-[2rem]">
          {t("dashboard.title", "Air Quality Overview")}
        </h1>
        <p className="text-xs text-slate-400">
          {t(
            "dashboard.subtitle",
            "Mock data — TEMPO + local network integration in progress."
          )}
        </p>
      </header>

      <div className="flex flex-wrap gap-4 animate-fadeSlideUp">
        <KpiCard
          label={t("dashboard.currentAqi", "Current AQI")}
          value={current ? current.aqi : "—"}
          sub={
            current
              ? t(
                  aqiCategory(current.aqi, { key: true }) as string,
                  aqiCategory(current.aqi)
                )
              : t("aqi.noData", "No data")
          }
          intent={
            current
              ? current.aqi <= 50
                ? "good"
                : current.aqi <= 100
                ? "moderate"
                : current.aqi <= 150
                ? "warning"
                : "unhealthy"
              : "neutral"
          }
          // opcional: só terá efeito se seu KpiCard já suportar
          delta={prev ? delta : (null as any)}
          trend={prev ? (trendType as any) : undefined}
        />

        <KpiCard
          label={t("dashboard.dominant", "Dominant")}
          value={dominant}
          sub={t("dashboard.pollutant", "Pollutant")}
        />

        <KpiCard
          label={t("dashboard.trend24h", "24h Trend")}
          // se seu KpiCard antigo não mostra número aqui, mantemos o texto de tendência
          value={prev ? trendLabel : "—"}
          sub={t("dashboard.vsPrevHour", "vs prev hour")}
          intent={delta > 0 ? "warning" : delta < 0 ? "good" : "neutral"}
          // opcional (novo KpiCard)
          delta={prev ? delta : (null as any)}
          trend={prev ? (trendType as any) : undefined}
        />

        <KpiCard
          label={t("dashboard.wind", "Wind")}
          value={3.4 as any}
          sub={t("dashboard.nowcast", "Nowcast")}
          // opcional (novo KpiCard)
          unit="m/s"
          as
          any
          trend={"flat" as any}
          delta={0 as any}
          intent="neutral"
        />
      </div>

      <div className="grid gap-4 md:gap-6 xl:grid-cols-12 animate-fadeSlideUp">
        <div className="xl:col-span-8 animate-fadeSlideUp">
          <Suspense
            fallback={
              <div className="h-[420px] flex items-center justify-center text-sm text-slate-400">
                {t("common.loadingMap", "Loading map…")}
              </div>
            }
          >
            <MapPanel />
          </Suspense>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-4 md:gap-6 animate-fadeSlideUp">
          <ForecastPanel compact />
          <Suspense
            fallback={
              <div className="h-24 flex items-center justify-center text-xs text-slate-400">
                {t("common.loadingAlerts", "Loading alerts…")}
              </div>
            }
          >
            <AlertsPanel />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
