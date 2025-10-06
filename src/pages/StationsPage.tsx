import { useStations } from "../api/hooks";
import { Skeleton } from "../components/ui/Skeleton";
import type { Station } from "../api/types";
import { useThemeMode } from "../hooks/useThemeMode";

export function StationsPage() {
  const { data, isLoading } = useStations();
  const isDark = useThemeMode();

  const cardClass = isDark
    ? "bg-slate-800/60 ring-1 ring-slate-700/50 backdrop-blur"
    : "bg-white ring-1 ring-gray-200 shadow-sm";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">
        Monitoring Stations (mock)
      </h1>

      {isLoading && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((st: Station) => (
          <div key={st.id} className={`min-w-0 p-3 rounded-lg ${cardClass}`}>
            <h2 className="font-medium truncate">{st.name}</h2>
            <p
              className={`text-xs ${
                isDark ? "text-slate-400" : "text-gray-600"
              }`}
            >
              {st.location.lat.toFixed(2)}, {st.location.lon.toFixed(2)}
            </p>
            <p className="mt-1 text-sm">
              AQI:{" "}
              <span
                className="font-semibold"
                style={{ color: aqiColor(st.latestAQI) }}
              >
                {st.latestAQI}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function aqiColor(val: number) {
  if (val <= 50) return "#22c55e";
  if (val <= 100) return "#eab308";
  if (val <= 150) return "#f97316";
  if (val <= 200) return "#dc2626";
  return "#7e22ce";
}
