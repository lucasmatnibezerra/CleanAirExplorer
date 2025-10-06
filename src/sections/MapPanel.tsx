// src/sections/MapPanel.tsx
import { useState, useCallback, useEffect } from "react";
import { GoogleMap } from "../components/map/GoogleMap";
import LegendPopover from "../components/map/LegendPopover";
import { useAppStore } from "@/state/store";

// Provedor dinâmico: google | maplibre
let LegacyMap: React.ComponentType<any> | null = null;
const provider = (import.meta.env.VITE_MAP_PROVIDER as string) || "google";
if (provider === "maplibre") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    LegacyMap = require("../components/map/Map")
      .Map as React.ComponentType<any>;
  } catch {
    /* se não existir, ignorar */
  }
}

export function MapPanel() {
  const [legendOpen, setLegendOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<unknown | null>(null);
  const [timeoutHit, setTimeoutHit] = useState(false);

  const handleMapLoaded = useCallback(() => setMapLoaded(true), []);

  useEffect(() => {
    if (mapLoaded) return;
    const id = setTimeout(() => setTimeoutHit(true), 4000);
    return () => clearTimeout(id);
  }, [mapLoaded]);

  const layers = useAppStore((s) => s.layers);
  const toggle = useAppStore((s) => s.toggleLayer);

  const aqiSurf = layers.find((l) => l.key === "aqi_surface");
  const no2 = layers.find((l) => l.key === "tempo_no2");
  const o3 = layers.find((l) => l.key === "tempo_o3");
  const heat = layers.find((l) => l.key === "aqi_heatmap");
  const ozoneForecast = layers.find((l) => l.key === "ozone_forecast");

  const visibleCount = layers.filter((l) => l.visible).length;
  const showEmpty = visibleCount === 0;

  // handlers auxiliares
  const retry = () => {
    setMapError(null);
    setTimeoutHit(false);
    setMapLoaded(false);
  };

  return (
    <section className="h-[380px] md:h-[520px] rounded-xl relative overflow-hidden border bg-card group min-w-0">
      {/* Header sobreposto ao mapa (estilo do HEAD) */}
      <header
        className="absolute top-0 left-0 right-0 flex items-center justify-between 
        p-3 text-sm font-semibold bg-black/40 backdrop-blur border-b border-border 
        z-10 text-white"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Regional Air Quality Map</h2>
          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded border border-white/20/50 bg-white/10">
            {provider}
          </span>
        </div>

        <div
          className="flex gap-2 text-xs items-center"
          role="toolbar"
          aria-label="Map data layers"
        >
          <button
            aria-label="Toggle AQI surface"
            aria-pressed={aqiSurf?.visible || false}
            onClick={() => toggle("aqi_surface")}
            className={`btn-soft ${
              aqiSurf?.visible
                ? "data-active ring-1 ring-sky-500/60 bg-sky-900/40 text-sky-300"
                : ""
            }`}
          >
            AQI
          </button>

          <button
            aria-label="Toggle nitrogen dioxide layer"
            aria-pressed={no2?.visible || false}
            onClick={() => toggle("tempo_no2")}
            className={`btn-soft ${
              no2?.visible
                ? "data-active ring-1 ring-amber-500/60 bg-amber-900/30 text-amber-200"
                : ""
            }`}
          >
            NO₂
          </button>

          <button
            aria-label="Toggle ozone layer"
            aria-pressed={o3?.visible || false}
            onClick={() => toggle("tempo_o3")}
            className={`btn-soft ${
              o3?.visible
                ? "data-active ring-1 ring-emerald-500/60 bg-emerald-900/30 text-emerald-200"
                : ""
            }`}
          >
            O₃
          </button>

          {/* Extras do branch: heatmap e previsão de ozônio (se existirem na store) */}
          <button
            aria-label="Toggle AQI heatmap"
            aria-pressed={heat?.visible || false}
            onClick={() => toggle("aqi_heatmap")}
            className={`btn-soft ${
              heat?.visible
                ? "data-active ring-1 ring-fuchsia-500/60 bg-fuchsia-900/30 text-fuchsia-200"
                : ""
            }`}
          >
            HM
          </button>

          <button
            aria-label="Toggle ozone forecast layer"
            aria-pressed={ozoneForecast?.visible || false}
            onClick={() => toggle("ozone_forecast")}
            className={`btn-soft ${
              ozoneForecast?.visible
                ? "data-active ring-1 ring-cyan-500/60 bg-cyan-900/30 text-cyan-200"
                : ""
            }`}
          >
            OF
          </button>

          <LegendPopover open={legendOpen} onOpenChange={setLegendOpen} />
        </div>
      </header>

      <div className="w-full h-full relative">
        {/* Skeleton / estados de erro */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex flex-col gap-4 p-6 bg-gradient-to-br from-slate-950/70 to-slate-800/50">
            <div className="h-6 w-40 rounded bg-slate-700/40 animate-pulse" />
            <div className="flex-1 rounded-lg bg-slate-700/30 animate-pulse" />
            <div className="h-5 w-52 rounded bg-slate-700/40 animate-pulse" />
            {(timeoutHit || !!mapError) && (
              <div className="text-[11px] text-amber-300/90 space-y-2 max-w-sm">
                {!!mapError && <p>Map failed to load.</p>}
                {timeoutHit && !mapError && (
                  <p>Still loading… check network or API key.</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 rounded border border-amber-400/40 hover:bg-amber-400/10"
                    onClick={retry}
                  >
                    Retry
                  </button>
                  <p className="text-white/70">
                    Verify API key, billing and referrer restrictions.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contêiner do mapa */}
        <div className="h-[60vh] md:h-[calc(100vh-12rem)] min-h-[320px]">
          {provider === "google" && (
            <GoogleMap
              onMapLoaded={handleMapLoaded}
              onMapError={(e) => setMapError(e)}
            />
          )}
          {provider === "maplibre" && LegacyMap && (
            <LegacyMap
              onLoaded={handleMapLoaded}
              onError={(e: unknown) => setMapError(e)}
            />
          )}
          {provider === "maplibre" && !LegacyMap && (
            <div className="p-4 text-sm text-amber-300">
              MapLibre provider selected but legacy component not found.
            </div>
          )}
        </div>

        {/* Overlay quando não há camadas visíveis */}
        {mapLoaded && showEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/70 backdrop-blur-sm text-center p-6">
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-semibold text-slate-100">
                No layers active
              </h3>
              <p className="text-sm text-slate-300/80">
                Select layers or change time window.
              </p>
            </div>
            <a
              href="#layers"
              className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-sm font-medium text-white focus-visible:outline focus-visible:outline-sky-400"
            >
              Choose Layers
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

export default MapPanel;
