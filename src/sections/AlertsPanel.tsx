// src/sections/AlertsPanel.tsx
import { useAlerts } from "../api/hooks";
import { useMemo, useState } from "react";
import { Skeleton } from "../components/ui/Skeleton";
import { useThemeMode } from "../hooks/useThemeMode";
import type { Alert } from "../api/types";
import { useTranslation } from "react-i18next";

function severityMeta(
  sev: Alert["severity"],
  isDark: boolean,
  t: (k: string, d?: string) => string
) {
  const light = {
    info: {
      label: t("alerts.info", "Info"),
      icon: "ℹ",
      wrap: "bg-sky-100 border-sky-300",
      chip: "bg-sky-200 text-sky-800 border-sky-400",
    },
    moderate: {
      label: t("alerts.moderate", "Moderate"),
      icon: "⚠",
      wrap: "bg-amber-100 border-amber-300",
      chip: "bg-amber-200 text-amber-800 border-amber-400",
    },
    unhealthy: {
      label: t("alerts.unhealthy", "Unhealthy"),
      icon: "!",
      wrap: "bg-red-100 border-red-300",
      chip: "bg-red-200 text-red-800 border-red-400",
    },
    default: {
      label: t(`alerts.${sev}`, sev),
      icon: "ℹ",
      wrap: "bg-slate-100 border-slate-300",
      chip: "bg-slate-200 text-slate-800 border-slate-400",
    },
  } as const;

  const dark = {
    info: {
      label: t("alerts.info", "Info"),
      icon: "ℹ",
      wrap: "bg-sky-900/30 border-sky-700/40",
      chip: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    },
    moderate: {
      label: t("alerts.moderate", "Moderate"),
      icon: "⚠",
      wrap: "bg-amber-900/20 border-amber-700/40",
      chip: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    },
    unhealthy: {
      label: t("alerts.unhealthy", "Unhealthy"),
      icon: "!",
      wrap: "bg-red-900/30 border-red-700/40",
      chip: "bg-red-500/20 text-red-300 border-red-500/40",
    },
    default: {
      label: t(`alerts.${sev}`, sev),
      icon: "ℹ",
      wrap: "bg-slate-800/40 border-slate-600/40",
      chip: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    },
  } as const;

  const palette = isDark ? dark : light;
  return (palette as any)[sev] || palette.default;
}

export function AlertsPanel() {
  const { t } = useTranslation();
  const { data, isLoading } = useAlerts();
  const [open, setOpen] = useState(false);
  const isDarkRaw = useThemeMode(); // pode ser null na primeira pintura
  const isDark = !!isDarkRaw; // normaliza para boolean SEM retornar antes

  // Mini-sparkline para estado vazio
  const spark = useMemo(() => {
    if (!data || data.length > 0) return "";
    const mock = [20, 32, 28, 40, 36, 44, 50];
    const min = Math.min(...mock);
    const max = Math.max(...mock);
    const span = Math.max(1, max - min);
    return mock
      .map((v, i) => {
        const x = (i / (mock.length - 1)) * 100;
        const y = 30 - ((v - min) / span) * 30;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [data]);

  return (
    <section
      className={`rounded-xl border bg-card p-4 backdrop-blur transition-colors duration-300 ${
        isDark
          ? "ring-slate-700/50 bg-slate-800/60"
          : "ring-slate-200 shadow-sm"
      }`}
    >
      <h2
        className={`font-semibold mb-2 ${
          isDark ? "text-rose-300" : "text-rose-600"
        }`}
      >
        {t("alerts.title", "Health Alerts")}
      </h2>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      )}

      <ul className="space-y-2 text-sm">
        {data?.map((a: Alert) => {
          const m = severityMeta(a.severity, isDark, t);
          return (
            <li
              key={a.id}
              className={`p-3 rounded border flex flex-col gap-2 ${m.wrap}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 font-medium tracking-wide ${m.chip}`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </span>
                <p
                  className={`font-medium leading-tight flex-1 ${
                    isDark ? "text-slate-100" : "text-slate-800"
                  }`}
                >
                  {a.title}
                </p>
              </div>
              <p
                className={`text-[11px] leading-snug ${
                  isDark ? "text-slate-300/80" : "text-slate-700/80"
                }`}
              >
                {a.message}
              </p>
              <div>
                <button
                  onClick={() => setOpen(true)}
                  className={`text-[10px] px-2 py-1 rounded focus-visible:outline focus-visible:outline-sky-400 ${
                    isDark
                      ? "bg-slate-700/60 hover:bg-slate-600 text-slate-100"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                  }`}
                >
                  {t("alerts.viewGuidance", "View guidance")}
                </button>
              </div>
            </li>
          );
        })}

        {data?.length === 0 && (
          <li
            className={`p-4 rounded border flex flex-col gap-3 ${
              isDark
                ? "border-slate-600 bg-slate-900/30"
                : "border-slate-300 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p
                  className={`text-xs font-medium ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {t("alerts.none", "No active alerts.")}
                </p>
                <p
                  className={`text-[11px] ${
                    isDark ? "text-slate-300/90" : "text-slate-600/90"
                  }`}
                >
                  {t(
                    "alerts.emptyCtaHint",
                    "Review general guidance to prepare for potential changes in air quality."
                  )}
                </p>
              </div>
              {spark && (
                <svg viewBox="0 0 100 30" className="w-24 h-8">
                  <path
                    d={spark}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={1}
                    className="opacity-60"
                  />
                </svg>
              )}
            </div>
            <div>
              <button
                onClick={() => setOpen(true)}
                className={`text-[11px] px-2 py-1.5 rounded font-medium focus-visible:outline focus-visible:outline-sky-400 ${
                  isDark
                    ? "bg-sky-600/80 hover:bg-sky-500 text-white"
                    : "bg-sky-500 hover:bg-sky-400 text-white"
                }`}
              >
                {t("alerts.viewGuidance", "View guidance")}
              </button>
            </div>
          </li>
        )}
      </ul>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("alerts.guidanceAria", "Health guidance")}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className={`${
              isDark ? "bg-slate-900/70" : "bg-slate-300/70"
            } absolute inset-0 backdrop-blur-sm`}
            onClick={() => setOpen(false)}
          />
          <div
            className={`relative z-10 w-full max-w-md rounded-lg border p-5 space-y-4 ${
              isDark
                ? "border-slate-600 bg-slate-900/90"
                : "border-slate-300 bg-white"
            }`}
          >
            <h3
              className={`text-sm font-semibold ${
                isDark ? "text-slate-100" : "text-slate-800"
              }`}
            >
              {t("alerts.guidanceTitle", "Health Guidance (Demo)")}
            </h3>
            <ul
              className={`text-[11px] space-y-2 ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}
            >
              <li>
                <strong>{t("alerts.children", "Children")}:</strong>{" "}
                {t(
                  "alerts.childrenGuidance",
                  "Limit prolonged outdoor exertion if AQI > 100."
                )}
              </li>
              <li>
                <strong>{t("alerts.olderAdults", "Older Adults")}:</strong>{" "}
                {t(
                  "alerts.olderAdultsGuidance",
                  "Prefer indoor activities when AQI > 150."
                )}
              </li>
              <li>
                <strong>{t("alerts.asthma", "Asthma")}:</strong>{" "}
                {t(
                  "alerts.asthmaGuidance",
                  "Keep rescue inhaler accessible; avoid heavy exercise."
                )}
              </li>
            </ul>
            <div className="flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className={`px-3 py-1.5 rounded text-xs font-medium focus-visible:outline focus-visible:outline-sky-400 ${
                  isDark
                    ? "bg-sky-600/80 hover:bg-sky-500 text-white"
                    : "bg-sky-500 hover:bg-sky-400 text-white"
                }`}
              >
                {t("actions.close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AlertsPanel;
