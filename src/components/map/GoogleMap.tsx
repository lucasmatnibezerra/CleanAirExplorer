import { useEffect, useRef, useState } from "react";
import { useStations } from "@/api/hooks";
import { useAppStore } from "@/state/store";
import { getOzoneGrid } from "@/data/ozoneLoader"; // se não existir, remova esta linha e o bloco de O3

declare global {
  interface Window {
    initGMap?: () => void;
    __ozoneRangeReady?: Promise<any>;
    __ozoneRangeResolve?: (v: any) => void;
  }
}

export interface GoogleMapProps {
  onMapLoaded?: () => void;
  onMapError?: (err: unknown) => void;
}

// TODO(feature-flag): permitir trocar para MapLibre via env (ex.: VITE_MAP_PROVIDER)
export function GoogleMap({ onMapLoaded, onMapError }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObj = useRef<google.maps.Map | null>(null);

  // marcadores (pontos) e “clusters” (tbm AdvancedMarkerElement, só agrupados)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const clusterRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const [zoom, setZoom] = useState<number>(4);

  const { data: stations } = useStations();

  const showStations =
    useAppStore((s) => s.layers.find((l) => l.key === "stations")?.visible) ??
    false;

  const showHeatmap =
    useAppStore(
      (s) => s.layers.find((l) => l.key === "aqi_heatmap")?.visible
    ) ?? false;

  const showOzoneForecast =
    useAppStore(
      (s) => s.layers.find((l) => l.key === "ozone_forecast")?.visible
    ) ?? false;

  const hourIndex = useAppStore((s) => s.forecastHourIndex ?? 0);
  const setSelected = useAppStore((s) => s.setSelectedStation);

  // Carrega Google Maps script 1x (idempotente)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ready = (w: any) => !!w.google?.maps;

    const initMap = () => {
      if (!mapRef.current || mapObj.current) return;
      mapObj.current = new google.maps.Map(mapRef.current, {
        center: { lat: 38, lng: -95 }, // approx. CONUS
        zoom: 4,
        mapId: "clean_air_dark",
        // gestureHandling: "greedy",
        // disableDefaultUI: true,
      });
      mapObj.current.addListener("zoom_changed", () => {
        const z = mapObj.current?.getZoom() ?? 4;
        setZoom(z);
      });
      onMapLoaded?.();
    };

    if (ready(window)) {
      initMap();
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      console.warn(
        "[GoogleMap] Missing VITE_GOOGLE_MAPS_KEY; trying unauthenticated load (may fail)."
      );
    }
    const id = "google-maps-script";
    if (document.getElementById(id)) return; // outro componente pode ter injetado

    const script = document.createElement("script");
    script.id = id;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      apiKey || ""
    }&callback=initGMap&libraries=marker`;
    script.async = true;
    script.onerror = (e) => onMapError?.(e);

    window.initGMap = () => {
      try {
        initMap();
      } catch (err) {
        onMapError?.(err);
      }
    };

    document.head.appendChild(script);
    return () => {
      // não removemos o script p/ remounts rápidos
      delete window.initGMap;
    };
  }, [onMapLoaded, onMapError]);

  // Render/atualiza marcadores (ou clusters) de estações
  useEffect(() => {
    if (!mapObj.current) return;

    // limpar anteriores
    markersRef.current.forEach((m) => ((m as any).map = null));
    markersRef.current = [];
    clusterRef.current.forEach((m) => ((m as any).map = null));
    clusterRef.current = [];

    if (!stations || !showStations) return;

    const useClusters = zoom < 6; // threshold simples

    if (useClusters) {
      // cluster grosso de grade 1° (evita dependência externa)
      const bucket: Record<
        string,
        { count: number; aqiSum: number; lat: number; lon: number }
      > = {};
      for (const st of stations) {
        const key = `${Math.round(st.location.lat)}:${Math.round(
          st.location.lon
        )}`;
        if (!bucket[key]) {
          bucket[key] = {
            count: 0,
            aqiSum: 0,
            lat: st.location.lat,
            lon: st.location.lon,
          };
        }
        bucket[key].count++;
        bucket[key].aqiSum += st.latestAQI;
      }
      Object.values(bucket).forEach((c) => {
        const avg = Math.round(c.aqiSum / c.count);
        const div = document.createElement("div");
        div.className =
          "rounded-full text-[11px] font-bold px-2 py-0.5 shadow ring-2 ring-white/40";
        const color =
          avg <= 50
            ? "#22c55e"
            : avg <= 100
            ? "#eab308"
            : avg <= 150
            ? "#f97316"
            : avg <= 200
            ? "#dc2626"
            : "#7e22ce";
        div.style.background = color;
        div.style.color = "#fff";
        div.textContent = `${avg}${c.count > 1 ? ` (${c.count})` : ""}`;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapObj.current!,
          position: { lat: c.lat, lng: c.lon },
          content: div,
          title: `Cluster ${c.count}`,
        });
        clusterRef.current.push(marker);
      });
      return;
    }

    // marcadores individuais
    for (const st of stations) {
      const div = document.createElement("div");
      div.className =
        "rounded-full text-[10px] font-semibold px-2 py-0.5 shadow ring-1 ring-white/40";
      const color =
        st.latestAQI <= 50
          ? "#22c55e"
          : st.latestAQI <= 100
          ? "#eab308"
          : st.latestAQI <= 150
          ? "#f97316"
          : st.latestAQI <= 200
          ? "#dc2626"
          : "#7e22ce";
      div.style.background = color;
      div.style.color = "#fff";
      div.textContent = String(st.latestAQI);

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapObj.current!,
        position: { lat: st.location.lat, lng: st.location.lon },
        content: div,
        title: st.name,
      });
      div.addEventListener("click", () => setSelected(st.id));
      marker.addEventListener("click", () => setSelected(st.id));
      markersRef.current.push(marker);
    }
  }, [stations, showStations, setSelected, zoom]);

  // Heatmap AQI (canvas) — IDW simplificado
  useEffect(() => {
    if (!mapObj.current) return;
    const existing = document.getElementById(
      "aqi-heatmap-layer"
    ) as HTMLCanvasElement | null;
    if (!showHeatmap) {
      existing?.remove();
      return;
    }
    if (!stations || stations.length === 0) return;

    let canvas = existing;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "aqi-heatmap-layer";
      Object.assign(canvas.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        mixBlendMode: "screen",
      } as CSSStyleDeclaration);
      mapRef.current?.appendChild(canvas);
    }

    const render = () => {
      if (!canvas || !mapObj.current || !mapRef.current) return;
      const rect = mapRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const projSys = (mapObj.current as any).getProjection?.();
      if (!projSys) return;

      const scale = Math.pow(2, mapObj.current!.getZoom() || 4);
      const center = projSys.fromLatLngToPoint(mapObj.current!.getCenter()!);

      const currentZoom = mapObj.current!.getZoom() || 4;
      const step =
        currentZoom < 5 ? 32 : currentZoom < 7 ? 24 : currentZoom < 9 ? 16 : 12;

      const project = (lat: number, lng: number) => {
        const pt = new google.maps.LatLng(lat, lng);
        const world = projSys.fromLatLngToPoint(pt);
        const x = (world.x - center.x) * scale * 256 + canvas.width / 2;
        const y = (world.y - center.y) * scale * 256 + canvas.height / 2;
        return { x, y };
      };

      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          let wSum = 0,
            vSum = 0;
          stations.forEach((st) => {
            const p = project(st.location.lat, st.location.lon);
            const dx = p.x - x;
            const dy = p.y - y;
            const d2 = dx * dx + dy * dy;
            const w = 1 / (1 + d2 * 0.002);
            wSum += w;
            vSum += w * st.latestAQI;
          });
          const aqi = vSum / Math.max(1, wSum);
          const color =
            aqi <= 50
              ? [34, 197, 94]
              : aqi <= 100
              ? [234, 179, 8]
              : aqi <= 150
              ? [249, 115, 22]
              : aqi <= 200
              ? [220, 38, 38]
              : [126, 34, 206];
          ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.25)`;
          ctx.fillRect(x - step / 2, y - step / 2, step, step);
        }
      }
    };

    render();
    const idleL = google.maps.event.addListener(mapObj.current, "idle", render);
    return () => {
      google.maps.event.removeListener(idleL);
    };
  }, [showHeatmap, stations]);

  // Grade de Ozônio (canvas) — bilinear
  useEffect(() => {
    if (!mapObj.current) return;

    const existing = document.getElementById(
      "ozone-forecast-layer"
    ) as HTMLCanvasElement | null;

    if (!showOzoneForecast) {
      existing?.remove();
      return;
    }

    // test hook determinístico
    if (!window.__ozoneRangeReady) {
      let _resolve: any;
      const p = new Promise((res) => {
        _resolve = res;
      });
      window.__ozoneRangeReady = p;
      window.__ozoneRangeResolve = _resolve;
    }

    let canvas = existing;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "ozone-forecast-layer";
      Object.assign(canvas.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        mixBlendMode: "multiply",
      } as CSSStyleDeclaration);
      mapRef.current?.appendChild(canvas);
    }

    let cancelled = false;

    async function render() {
      if (!canvas || !mapObj.current || !mapRef.current) return;
      try {
        const { meta, data } = await getOzoneGrid(hourIndex);
        if (cancelled) return;

        const rect = mapRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const projSys = (mapObj.current as any).getProjection?.();
        if (!projSys) return;

        const scale = Math.pow(2, mapObj.current.getZoom() || 4);
        const center = projSys.fromLatLngToPoint(mapObj.current.getCenter()!);

        const currentZoom = mapObj.current.getZoom() || 4;
        const step =
          currentZoom < 5 ? 14 : currentZoom < 7 ? 10 : currentZoom < 9 ? 8 : 6;

        let vMin = Number.POSITIVE_INFINITY;
        let vMax = Number.NEGATIVE_INFINITY;

        for (let py = 0; py < canvas.height; py += step) {
          for (let px = 0; px < canvas.width; px += step) {
            const worldX = center.x + (px - canvas.width / 2) / (scale * 256);
            const worldY = center.y + (py - canvas.height / 2) / (scale * 256);
            const latLng = projSys.fromPointToLatLng({ x: worldX, y: worldY });
            const lat = latLng.lat();
            const lon = latLng.lng();

            if (
              lat < meta.lat_min ||
              lat > meta.lat_max ||
              lon < meta.lon_min ||
              lon > meta.lon_max
            )
              continue;

            const latFrac =
              (lat - meta.lat_min) / (meta.lat_max - meta.lat_min);
            const lonFrac =
              (lon - meta.lon_min) / (meta.lon_max - meta.lon_min);

            const y = latFrac * (meta.rows - 1);
            const x = lonFrac * (meta.cols - 1);

            const y0 = Math.floor(y),
              y1 = Math.min(meta.rows - 1, y0 + 1);
            const x0 = Math.floor(x),
              x1 = Math.min(meta.cols - 1, x0 + 1);

            const fy = y - y0,
              fx = x - x0;

            const idx = (row: number, col: number) => row * meta.cols + col;

            const v00 = data[idx(y0, x0)],
              v01 = data[idx(y0, x1)],
              v10 = data[idx(y1, x0)],
              v11 = data[idx(y1, x1)];

            const v0 = v00 * (1 - fx) + v01 * fx;
            const v1 = v10 * (1 - fx) + v11 * fx;
            const val = v0 * (1 - fy) + v1 * fy; // ppb

            if (val < vMin) vMin = val;
            if (val > vMax) vMax = val;

            // escala simples azul→magenta→vermelho
            const normalized = Math.min(1, Math.max(0, val / 120));
            const r = Math.round(255 * normalized);
            const g = Math.round(40 * (1 - normalized));
            const b = Math.round(180 * (1 - normalized) + 60 * normalized);
            ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
            ctx.fillRect(px, py, step, step);
          }
        }

        if (!isFinite(vMin) || !isFinite(vMax)) {
          vMin = Number.POSITIVE_INFINITY;
          vMax = Number.NEGATIVE_INFINITY;
          for (let i = 0; i < data.length; i++) {
            const val = data[i];
            if (val < vMin) vMin = val;
            if (val > vMax) vMax = val;
          }
        }

        canvas.dataset.ozMin = isFinite(vMin) ? vMin.toFixed(1) : "";
        canvas.dataset.ozMax = isFinite(vMax) ? vMax.toFixed(1) : "";

        try {
          window.dispatchEvent(
            new CustomEvent("ozoneRangeUpdated", {
              detail: { min: vMin, max: vMax },
            })
          );
          if (!window.__ozoneRangeReady) {
            let _resolve: any;
            const p = new Promise((res) => {
              _resolve = res;
            });
            window.__ozoneRangeReady = p;
            window.__ozoneRangeResolve = _resolve;
          }
          if (window.__ozoneRangeResolve) {
            try {
              window.__ozoneRangeResolve({ min: vMin, max: vMax });
            } catch {
              /* empty */
            }
            delete window.__ozoneRangeResolve;
          }
        } catch {
          /* empty */
        }
      } catch {
        // ignore errors na renderização de O3
      }
    }

    render();
    const idleL = google.maps.event.addListener(mapObj.current, "idle", render);
    return () => {
      cancelled = true;
      google.maps.event.removeListener(idleL);
    };
  }, [showOzoneForecast, hourIndex]);

  return (
    <div ref={mapRef} className="absolute inset-0" aria-label="Google Map" />
  );
}

export default GoogleMap;
