import { useSearchParams } from "react-router-dom";
import { useHistoricalSeries, useStations } from "../api/hooks";
import { useState, Suspense, lazy, useMemo } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { useThemeMode } from "@/hooks/useThemeMode";

const TrendChart = lazy(() => import("../sections/TrendChart"));

type Series = { points: [string | number, number][] } | undefined;

export function TrendsPage() {
  const [params, setParams] = useSearchParams();
  const stationParam = params.get("station");
  const pollutantParam = params.get("pollutant") || "PM2.5";
  const { data: stations } = useStations();
  const [pollutant, setPollutant] = useState(pollutantParam);
  const { data: series } = useHistoricalSeries(stationParam, pollutant);
  const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");

  const isDark = useThemeMode();

  const series24h: Series = useMemo(() => {
    if (!series) return undefined;
    return { ...series, points: series.points.slice(-24) };
  }, [series]);

  const series7d: Series = useMemo(() => {
    if (!series) return undefined;
    return { ...series, points: series.points.slice(-24 * 7) };
  }, [series]);

  const series30d: Series = useMemo(() => {
    if (!series) return undefined;
    return { ...series, points: series.points.slice(-24 * 30) };
  }, [series]);

  function selectStation(id: string) {
    params.set("station", id);
    setParams(params, { replace: true });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Historical Trends (mock)</h1>

      <div className="flex flex-wrap gap-2 text-xs items-center">
        <span className="text-muted-foreground">Station:</span>
        {stations?.map((st) => (
          <button
            key={st.id}
            onClick={() => selectStation(st.id)}
            className={`px-3 py-1 rounded transition-colors
              ${
                stationParam === st.id
                  ? "bg-sky-600 text-white"
                  : "bg-muted text-foreground/80 hover:bg-muted/80"
              }`}
          >
            {st.name}
          </button>
        ))}
      </div>

      <div className="flex gap-3 text-xs items-center">
        <label className="text-muted-foreground">Pollutant</label>
        <select
          value={pollutant}
          onChange={(e) => setPollutant(e.target.value)}
          className="bg-background ring-1 ring-border rounded px-2 py-1"
        >
          <option>PM2.5</option>
          <option>NO2</option>
          <option>O3</option>
        </select>
      </div>

      <div className="h-96 rounded-xl ring-1 ring-border bg-card/40 backdrop-blur-sm p-4 flex flex-col min-h-0">
        {!series && (
          <p className="text-xs text-muted-foreground">
            Select a station to view data.
          </p>
        )}

        {series && (
          <Tabs
            value={range}
            onValueChange={(v: any) => setRange(v)}
            className="flex flex-col flex-1 min-h-0"
          >
            <TabsList className="w-fit">
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
            </TabsList>
            <Separator className="my-2" />

            <TabsContent
              value="24h"
              forceMount
              className="flex-1 min-h-0 data-[state=inactive]:hidden"
            >
              <div className="h-full min-h-0">
                <Suspense
                  fallback={
                    <p className="text-xs text-muted-foreground">
                      Loading chart…
                    </p>
                  }
                >
                  <TrendChart series={series24h || series} isDark={isDark} />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent
              value="7d"
              forceMount
              className="flex-1 min-h-0 data-[state=inactive]:hidden"
            >
              <div className="h-full min-h-0">
                <Suspense
                  fallback={
                    <p className="text-xs text-muted-foreground">
                      Loading chart…
                    </p>
                  }
                >
                  <TrendChart series={series7d || series} isDark={isDark} />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent
              value="30d"
              forceMount
              className="flex-1 min-h-0 data-[state=inactive]:hidden"
            >
              <div className="h-full min-h-0">
                <Suspense
                  fallback={
                    <p className="text-xs text-muted-foreground">
                      Loading chart…
                    </p>
                  }
                >
                  <TrendChart series={series30d || series} />
                </Suspense>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
