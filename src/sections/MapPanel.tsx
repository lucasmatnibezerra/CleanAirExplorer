// Switched from MapLibre LazyMap to Google Maps wrapper
import { GoogleMap } from '../components/map/GoogleMap'
import { useState, useCallback, useEffect } from 'react'
import LegendPopover from '../components/map/LegendPopover'
import { useAppStore } from '@/state/store'

export function MapPanel(){
  const [legendOpen, setLegendOpen] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<unknown | null>(null)
  const [timeoutHit, setTimeoutHit] = useState(false)
  const handleMapLoaded = useCallback(()=> setMapLoaded(true), [])
  useEffect(()=>{
    if(mapLoaded) return
    const id = setTimeout(()=> setTimeoutHit(true), 4000)
    return ()=> clearTimeout(id)
  },[mapLoaded])
  const layers = useAppStore(s => s.layers)
  const toggle = useAppStore(s => s.toggleLayer)
  const aqiSurf = layers.find(l=> l.key==='aqi_surface')
  const no2 = layers.find(l=> l.key==='tempo_no2')
  const o3 = layers.find(l=> l.key==='tempo_o3')
  const visibleCount = layers.filter(l => l.visible).length
  const showEmpty = visibleCount === 0
  return (
  <section className="h-[380px] md:h-[520px] rounded-xl relative overflow-hidden ring-1 ring-slate-700/50 bg-slate-800/60 backdrop-blur group">
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 text-sm font-medium bg-slate-900/50 backdrop-blur border-b border-slate-700/40 z-10">
        <h2 className="text-sm font-semibold">Regional Air Quality Map</h2>
        <div className="flex gap-2 text-xs items-center" role="toolbar" aria-label="Map data layers">
          <button
            aria-label="Toggle AQI surface"
            aria-pressed={aqiSurf?.visible || false}
            onClick={()=> toggle('aqi_surface')}
            className={`btn-soft ${aqiSurf?.visible ? 'data-active ring-1 ring-sky-500/60 bg-sky-900/40 text-sky-300' : ''}`}
          >AQI</button>
          <button
            aria-label="Toggle nitrogen dioxide layer"
            aria-pressed={no2?.visible || false}
            onClick={()=> toggle('tempo_no2')}
            className={`btn-soft ${no2?.visible ? 'data-active ring-1 ring-amber-500/60 bg-amber-900/30 text-amber-200' : ''}`}
          >NO₂</button>
          <button
            aria-label="Toggle ozone layer"
            aria-pressed={o3?.visible || false}
            onClick={()=> toggle('tempo_o3')}
            className={`btn-soft ${o3?.visible ? 'data-active ring-1 ring-emerald-500/60 bg-emerald-900/30 text-emerald-200' : ''}`}
          >O₃</button>
          <LegendPopover open={legendOpen} onOpenChange={setLegendOpen} />
        </div>
      </header>
      <div className="w-full h-full">
        {!mapLoaded && (
          <div className="absolute inset-0 flex flex-col gap-4 p-6 bg-gradient-to-br from-slate-950/70 to-slate-800/50">
            <div className="h-6 w-40 rounded bg-slate-700/40 animate-pulse" />
            <div className="flex-1 rounded-lg bg-slate-700/30 animate-pulse" />
            <div className="h-5 w-52 rounded bg-slate-700/40 animate-pulse" />
            {(timeoutHit || !!mapError) && (
              <div className="text-[11px] text-amber-300/90 space-y-1">
                {!!mapError && <p>Map style failed. Using fallback…</p>}
                {timeoutHit && !mapError && <p>Still loading… check network or CORS.</p>}
                {/* Fallback indicator removed after Google Maps migration */}
              </div>
            )}
          </div>
        )}
        <GoogleMap
          onMapLoaded={handleMapLoaded}
          onMapError={(e)=> setMapError(e)}
        />
      </div>
      {mapLoaded && showEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/70 backdrop-blur-sm text-center p-6">
          <div className="space-y-2 max-w-sm">
            <h3 className="text-lg font-semibold text-slate-100">No layers active</h3>
            <p className="text-sm text-slate-300/80">Select layers or change time window.</p>
          </div>
          <a href="#layers" className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-sm font-medium text-white focus-visible:outline focus-visible:outline-sky-400">Choose Layers</a>
        </div>
      )}
      {/* Legends moved to popover */}
    </section>
  )
}

export default MapPanel
