<div align="center">
  <h1>Clean Air Explorer</h1>
  <p><strong>NASA Space Apps Challenge Prototype – “From Earthdata to Action”</strong></p>
  <p><em>Interactive web interface for fusing TEMPO satellite observations, ground networks (OpenAQ / Pandora / TOLNet) and meteorological context to forecast and communicate local air quality & health risk.</em></p>
</div>

> Status: Front‑end prototype with mocked data sources. This document describes the intended full system so the data / backend track can implement endpoints with minimal friction.

---

## 1. Overview
Clean Air Explorer is a React + Vite + TypeScript dashboard that will visualize near‑real‑time atmospheric composition from NASA’s TEMPO mission together with ground station measurements and simple short‑term (48h) AQI forecasts. The prototype emphasizes: rapid tile overlay integration, accessible exploration UI, comparison between satellite column retrievals and surface observations, and extensibility toward health guidance.

## 2. Conceptual Background
Air quality decision support often needs multi‑scale fusion: column densities (satellite) reveal spatial structure while in‑situ monitors provide surface truth for exposure. TEMPO offers geostationary hourly retrievals (NO₂, HCHO, O₃ proxy via related products, Aerosol Index, PM estimate*). Combining these with OpenAQ (aggregated regulatory & community stations) enables validation and localized forecasting. A simplified AQI layer distills pollutant-specific concentrations into categorical health bands (Good → Hazardous). Short‑term persistence + light ML regression serves as a baseline; future improvements may incorporate meteorology (PBL height, wind, precipitation) from MERRA‑2 or IMERG.

## 3. Project Structure (Front‑End)
```
src/
  api/               # Query hooks (React Query), schemas, mock data
  components/        # Reusable UI primitives (buttons, dialogs, etc.)
  components/map/    # Map wrapper & legend popover
  lib/               # AQI utilities, animations, helpers
  sections/          # Dashboard panels (Map, Forecast, Alerts, Trends)
  state/             # Zustand store (layers, settings, selection)
  pages/             # Route-level pages (About, Settings, Trends)
  assets/            # SVG / static assets
  index.css          # Tailwind theme tokens + animations
```

## 4. Core Modules & Responsibilities
| Area | Module(s) | Responsibility |
|------|-----------|---------------|
| State | `state/store.ts` | Layer visibility, settings, forecast hour selection |
| Data hooks | `api/hooks.ts` | Fetch / mock forecast, stations, alerts |
| Validation | `api/schemas.ts` | (Planned) Zod parsing for runtime safety |
| AQI Logic | `lib/aqi.ts` | Category mapping, color & badge styling |
| UI Panels | `sections/*Panel.tsx` | Encapsulated dashboard segments |
| Map Integration | `components/map/GoogleMap.tsx` | Google Maps JS API (AdvancedMarkerElement) for stations (MapLibre legacy retained) |

## 5. Data Contracts (Current & Planned)
Current (mock):
```ts
interface Station { id:string; name:string; location:{lat:number; lon:number}; latestAQI:number }
interface ForecastHour { ts:number; aqi:number; pollutant?:string }
interface ForecastResponse { hours: ForecastHour[] }
interface Alert { id:string; title:string; message:string; severity:'info'|'moderate'|'unhealthy' }
```
Planned extensions:
```ts
interface PollutantSample { ts:number; value:number; unit:string; pollutant:'NO2'|'O3'|'PM25'|'HCHO'|'AI' }
interface StationTimeSeries { stationId:string; pollutant:string; samples:PollutantSample[] }
interface CompareSample { ts:number; satellite:number; ground:number; pollutant:string }
interface CompareResponse { samples:CompareSample[]; metrics:{ rmse:number; mae:number; bias:number; r:number; n:number } }
interface FusedForecastPoint { ts:number; aqi:number; dominantPollutant:string; confidence?:number }
interface ForecastAPI { location:{lat:number; lon:number}; horizonHours:number; points:FusedForecastPoint[] }
```

## 6. Backend Endpoint Specification (Target)
| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `/tempo/tiles/{z}/{x}/{y}.png?product=no2&time=ISO` | GET | Raster tile for TEMPO variable/time | AQI color ramp; cached |
| `/tempo/compare?lat&lng&start&end&pollutant=no2` | GET | Aligned satellite vs ground | Returns metrics + joined samples |
| `/ground/openaq?bbox&params&from&to` | GET | Ground stations measurements normalized | Aggregated & AQI enriched |
| `/forecast?lat&lng` | GET | 48h AQI | Persistence + ML baseline initially |
| `/health/guidance?aqi=150` | GET | Text guidance snippet | WHO/EPA ranges |

## 7. Map & Visualization Layers
| Layer | Source | Rendering | Status |
|-------|--------|-----------|--------|
| TEMPO NO₂ / HCHO / AI / PM / O₃ | NASA (Harmony) | Raster tiles (PNG/WEBP) | Planned |
| AQI Surface (interpolated) | Fused backend | Raster / vector contours | Planned |
| Stations (OpenAQ / Pandora) | OpenAQ / PGN | Google AdvancedMarkerElement + tooltip | Mocked |
| Wind Vectors | Model (MERRA‑2 / HRRR) | Arrows / particles overlay | Planned |
| Alerts Regions | Computation | Polygon fill + border | Planned |

Map Provider: The prototype now uses the Google Maps JavaScript API. A legacy MapLibre implementation (`components/map/Map.tsx`) remains in the repository for potential fallback or future feature flag controlled by an optional planned `VITE_MAP_PROVIDER` (values: `google` | `maplibre`). Only Google is currently wired in the UI.

## 8. State & Data Fetching Strategy
React Query for asynchronous caching (staleTime tuned per endpoint). Zustand keeps fast UI state (layer toggles, focus hour, user settings) persisted in localStorage. Separation ensures network data caching policies don’t leak into view logic.

## 9. Forecast Panel Implementation
Refactored with:
- Memoized hourly items (delta vs previous)
- Accessible listbox + keyboard navigation (← → Home End PgUp PgDn)
- Inline delta & sparkline trend
- Tooltip with pollutant, delta, category
- Aria-live announcements for active hour change

## 10. Comparison & Metrics (Planned)
Metrics: RMSE, MAE, Bias, Pearson r. Satellite pixel selection = nearest or bilinear. Optionally surface concentration estimate from column via scaling factor (future research). Returned alongside sample pairs in `/tempo/compare`.

## 11. Accessibility & UX Principles
| Concern | Approach |
|---------|---------|
| Keyboard navigation | Forecast listbox, layer toggles focus-visible |
| Motion reduction | CSS prefers-reduced-motion gates animations |
| Color contrast | AQI palette meets minimum contrast on dark bg |
| Semantics | aria-label, aria-pressed, aria-live for dynamic sections |

## 12. Testing
Currently: smoke tests for store, forecast, legend, dark-mode toggle, station drawer. Roadmap: contract tests for real endpoints, color scale snapshot, accessibility (axe) checks, forecasting metrics regression.

## 13. Development Workflow
Scripts:
```
npm install
npm run dev   # local server
npm test      # vitest
npm run build # production build
```
Recommend conventional commits or minimal prefixes (feat:, fix:, chore:).

## 14. Deployment & Environment (Planned Vars)
| Var | Purpose |
|-----|---------|
| `VITE_API_BASE` | Base URL for backend JSON endpoints |
| `VITE_TILE_BASE` | Base template for TEMPO tiles |
| `VITE_DEFAULT_BBOX` | Initial map view extent |
| `VITE_FEATURE_FLAGS` | Comma list (e.g. compare,wind) |
| `VITE_GOOGLE_MAPS_KEY` | API key for Google Maps JS API (required for map) |
| `VITE_MAP_PROVIDER` | `google` (default) or `maplibre` to switch map implementation |

## 14.1 Internationalization (i18n)

The UI supports three languages:

| Code | Language | File |
|------|----------|------|
| en | English | `src/i18n/locales/en.json` |
| pt | Português | `src/i18n/locales/pt.json` |
| es | Español | `src/i18n/locales/es.json` |

Implementation notes:
1. Library: `i18next` + `react-i18next` initialized in `src/i18n/index.ts`.
2. Auto-detect: If no stored preference, the browser language (primary subtag) is used when supported.
3. Persistence: Selected language stored in Zustand (`language`) and mirrored to `localStorage` key `lang`.
4. Switcher: `LanguageSwitcher` component in `src/components/i18n/LanguageSwitcher.tsx`.
5. Usage: Import `useTranslation()` and access `t('namespace.key')` (flat `translation` namespace).
6. Tests: A lightweight isolated i18n instance for tests lives in `src/test/test-i18n.tsx`.
7. Accessibility: The switcher has an accessible label (screen-reader only text).

Add a new language:
1. Create `src/i18n/locales/<code>.json`.
2. Add entry to `LANGS` array in `src/i18n/index.ts`.
3. Provide translations for existing keys; missing keys fall back to English.
4. (Optional) Update README table above.

Key coverage (initial): app title, navigation labels, forecast panel title, legend title, generic actions.

## 14.2 Design System & UI Primitives

The interface now standardizes on lightweight shadcn-style headless primitives layered over Tailwind tokens. Components live under `src/components/ui/` and intentionally stay minimal, exposing variants & sizes via simple prop contracts (no runtime styling library overhead).

Current primitives:
| Component | File | Purpose | Key Props |
|-----------|------|---------|-----------|
| Button | `ui/button.tsx` | Actions / triggers | `variant: primary | secondary | ghost | outline | danger`, `size: sm | md | icon` |
| Badge | `ui/badge.tsx` | Status/category label | `variant: outline | success | warning | danger` |
| Card | `ui/card.tsx` | Panel container | (children) |
| Select | `ui/select.tsx` | Language & option picking (Radix) | Inherits Radix props |
| Sheet | `ui/sheet.tsx` | Mobile navigation drawer (Radix Dialog) | `side: left|right|top|bottom` |
| Icons | `ui/icons.tsx` | Central lucide-react mapping | `Icon.name` components |

Design tokens derive from Tailwind CSS (dark-first palette). Opacity overlays + `backdrop-blur` provide layered depth on dark backgrounds without heavy drop shadows.

### Variants & Consistency
Buttons intentionally restrict palette to semantic roles; color accent is reused to reduce cognitive load. Badges use subtle backgrounds for non-critical states and stronger hues for success/warning/danger.

### Accessibility Alignment
- All interactive primitives forward refs for focus management.
- `focus-visible` styles provide clear outlines independent of color-only cues.
- Drawer (`Sheet`) uses proper aria-hidden sequencing via Radix Dialog.

## 14.3 Icons Migration

Icons replaced legacy Tabler CSS classes with `lucide-react` components for tree-shakable, consistent SVGs. Mapping is centralized in `ui/icons.tsx` so changes or aliasing are one-line updates.

| Old (Tabler class) | New (lucide) |
|--------------------|--------------|
| `i-tabler-menu-2` | `Icon.menu` |
| `i-tabler-chart-dots` | `Icon.gauge` |
| `i-tabler-building` | `Icon.layers` (placeholder until a station icon is added) |
| `i-tabler-settings` | `Icon.settings` |
| `i-tabler-info-circle` | `Icon.info` |
| `i-tabler-chevron-down` | `Icon.chevronDown` |
| `i-tabler-check` | `Icon.check` |

Rationale: reduce global CSS icon font dependency, improve a11y (titles/aria can be attached directly), and allow per-icon sizing control.

## 14.4 Responsive Layout Enhancements

- Desktop: Persistent sidebar with collapse toggle (`chevronDown` rotated). Width animates between `w-56` and `w-16`.
- Mobile: Floating action button opens a `Sheet` sliding from the left with navigation links.
 - (Update) The prototype originally used both a header hamburger button and a floating FAB to open navigation on mobile. For clarity and to avoid duplicate focus targets, the floating FAB sheet trigger has been removed; only the single TopBar hamburger now controls the mobile inline menu.
- Panels (Map, Forecast) are Card-based; stacking / spacing controlled via container `space-y-6`.
- Map panel height reduces on very small screens (`h-[380px]` base with potential future dynamic sizing). Further fine tuning can be added when real-time tiles land.

Planned refinements: prefer CSS container queries to tune font scale, and lazy mount off-screen panels for perf.

### 14.4.1 Recent i18n Additions
New translation keys were added for improved accessibility and clarity:
```
actions.openMenu / actions.closeMenu
map.toggleAqi / map.toggleNo2 / map.toggleO3
map.layersToolbar / map.chooseLayersCta
```
If you add further layers or actions, follow the flat key convention (`section.actionVerb`).


## 15. Caching & Performance (Backend Concept)
Layered cache: (1) Redis metadata/time series; (2) Filesystem tile cache keyed by `tempo:{product}:{time}:{z}:{x}:{y}`; (3) In-memory LRU for hot tiles. Conditional ETag + max-age=600 for short-term validity. Recompute only on new TEMPO overpass or data revision.

## 16. Roadmap
| Phase | Goals |
|-------|-------|
| MVP | Static TEMPO mock tiles, stations mock, forecast baseline |
| Data Integration | Real TEMPO tiles + OpenAQ ingestion + compare metrics |
| Enrichment | Wind vectors, AQI surface interpolation, health guidance |
| Validation | Pandora / TOLNet overlays, QA flags, provenance panel |
| Advanced | Model-assisted forecasts, anomaly detection, push alerts |

## 17. Provenance & Attribution (Planned)
Will record per session: dataset short_name, version, temporal range, granule IDs (TEMPO), OpenAQ query parameters, transformation commit hash. Display in an “About / Data Sources” modal.

## 18. Licensing & Data Notices
Code license: TBD (likely MIT) once data integration path final. NASA datasets subject to their respective open data policies; attribution required: “TEMPO Science Team / NASA”, “OpenAQ Platform”, plus any model/data disclaimers (e.g. MERRA‑2). Health guidance not medical advice.

## 19. Quick Start (Prototype)
```
git clone <repo>
cd nasa-clean-air
npm install
npm run dev
```
Tests:
```
npm test
```
Build production:
```
npm run build
```

## 20. Contributing (While in Hackathon Mode)
Open a short issue or checklist PR. Keep scope slices small: one panel enhancement or one endpoint integration per PR. Add or update a smoke test when changing UI structure.

## 21. Open Questions
1. Exact TEMPO products & resolution for first tile release? (L2 vs L3 subset)
2. AQI standardization (EPA vs WHO hybrid or region-specific?)
3. Forecast horizon extension (beyond 48h) worth complexity now?
4. Need offline fallback or static “last known” tiles?
5. Health guidance localization / multilingual requirements?

---
**Contact / Coordination:** Use project discussion board or tag the data pipeline lead for endpoint contract changes.

Let’s turn Earth observation into actionable local insight — rapidly, accessibly, and transparently.
