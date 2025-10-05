// Support dynamic provider selection via VITE_MAP_PROVIDER (google | maplibre)
import { GoogleMap } from '../components/map/GoogleMap'
// Lazy import legacy MapLibre only if needed
let LegacyMap: React.ComponentType<any> | null = null
const provider = import.meta.env.VITE_MAP_PROVIDER || 'google'
if(provider === 'maplibre'){
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    LegacyMap = require('../components/map/Map').Map as React.ComponentType<any>
  } catch { /* ignore if missing */ }
}
import { useState, useCallback, useEffect } from 'react'
import LegendPopover from '../components/map/LegendPopover'
import { useAppStore } from '../state/store'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Icon } from '../components/ui/icons'
import { useTranslation } from 'react-i18next'

export function MapPanel(){
  const { t } = useTranslation()
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
	<Card className="h-[380px] md:h-[520px] relative overflow-hidden p-0 group">
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 text-xs bg-card/70 backdrop-blur border-b border-border/60 z-10">
        <div className="flex items-center gap-2">
          <Icon.map className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-semibold tracking-tight">{t('map.title','Regional Air Quality Map')}</h2>
          <Badge variant="outline" className="text-[9px] tracking-wide uppercase">{provider}</Badge>
        </div>
        <div className="flex gap-1" role="toolbar" aria-label={t('map.layersToolbar','Map data layers')}>
          <Button
            aria-label={t('map.toggleAqi','Toggle AQI surface')}
            aria-pressed={aqiSurf?.visible || false}
            onClick={()=> toggle('aqi_surface')}
            variant={aqiSurf?.visible? 'primary':'ghost'}
            size="sm"
            className={(aqiSurf?.visible? 'ring-1 ring-sky-500/50 bg-sky-600/20 ' : 'hover:bg-sky-500/10 focus-visible:bg-sky-500/15 ') + 'transition-colors focus-visible:outline-2 focus-visible:outline-sky-500/60'}
          >AQI</Button>
          <Button
            aria-label={t('map.toggleNo2','Toggle nitrogen dioxide layer')}
            aria-pressed={no2?.visible || false}
            onClick={()=> toggle('tempo_no2')}
            variant={no2?.visible? 'primary':'ghost'}
            size="sm"
            className={(no2?.visible? 'ring-1 ring-amber-500/50 text-amber-200 bg-amber-600/20 ' : 'text-amber-300 hover:bg-amber-500/10 focus-visible:bg-amber-500/15 ') + 'transition-colors focus-visible:outline-2 focus-visible:outline-amber-500/60'}
          >NO₂</Button>
          <Button
            aria-label={t('map.toggleO3','Toggle ozone layer')}
            aria-pressed={o3?.visible || false}
            onClick={()=> toggle('tempo_o3')}
            variant={o3?.visible? 'primary':'ghost'}
            size="sm"
            className={(o3?.visible? 'ring-1 ring-emerald-500/50 text-emerald-200 bg-emerald-600/20 ' : 'text-emerald-300 hover:bg-emerald-500/10 focus-visible:bg-emerald-500/15 ') + 'transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500/60'}
          >O₃</Button>
          <LegendPopover open={legendOpen} onOpenChange={setLegendOpen} />
        </div>
      </div>
      <div className="w-full h-full">
        {!mapLoaded && (
          <div className="absolute inset-0 flex flex-col gap-4 p-6 bg-gradient-to-br from-slate-950/70 to-slate-800/50">
            <div className="h-6 w-40 rounded bg-slate-700/40 animate-pulse" />
            <div className="flex-1 rounded-lg bg-slate-700/30 animate-pulse" />
            <div className="h-5 w-52 rounded bg-slate-700/40 animate-pulse" />
            {(timeoutHit || !!mapError) && (
              <div className="text-[11px] text-amber-300/90 space-y-2 max-w-sm">
                {!!mapError && <p>{t('map.failed','Map failed to load.')}</p>}
                {timeoutHit && !mapError && <p>{t('map.stillLoading','Still loading… check network or API key.')}</p>}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={()=> { setMapError(null); setTimeoutHit(false); setMapLoaded(false); }}>
                    {t('map.retry','Retry')}
                  </Button>
                  <p className="text-slate-400/80">{t('map.apiKeyHint','Verify API key, billing and referrer restrictions.')}</p>
                </div>
              </div>
            )}
          </div>
        )}
        {provider === 'google' && (
          <GoogleMap
            onMapLoaded={handleMapLoaded}
            onMapError={(e)=> setMapError(e)}
          />
        )}
        {provider === 'maplibre' && LegacyMap && (
          <LegacyMap onLoaded={handleMapLoaded} onError={(e:unknown)=> setMapError(e)} />
        )}
        {provider === 'maplibre' && !LegacyMap && (
          <div className="p-4 text-sm text-amber-300">MapLibre provider selected but legacy component not found.</div>
        )}
      </div>
      {mapLoaded && showEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/70 backdrop-blur-sm text-center p-6">
          <div className="space-y-2 max-w-sm">
            <h3 className="text-lg font-semibold text-slate-100">{t('map.noLayers','No layers active')}</h3>
            <p className="text-sm text-slate-300/80">{t('map.noLayersHint','Select layers or change time window.')}</p>
          </div>
          <a href="#layers" className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-sm font-medium text-white focus-visible:outline focus-visible:outline-sky-400">{t('map.chooseLayersCta','Choose Layers')}</a>
        </div>
      )}
      {/* Legends moved to popover */}
    </Card>
  )
}

export default MapPanel
