import { useRef, useEffect, useState } from 'react'
import { useAppStore } from '../../state/store'
import { useTranslation } from 'react-i18next'

interface LegendPopoverProps {
  open: boolean
  onOpenChange: (open:boolean)=>void
}

// AQI scale ranges aligned with US EPA categories; values approximate breakpoints.
// descKey maps to existing aqi.* translation keys for consistency.
const aqiScale = [
  { range:'0–50', color:'#22c55e', descKey:'aqi.good' },
  { range:'51–100', color:'#eab308', descKey:'aqi.moderate' },
  { range:'101–150', color:'#f97316', descKey:'aqi.unhealthySG' },
  { range:'151–200', color:'#dc2626', descKey:'aqi.unhealthy' },
  { range:'201–300', color:'#7e22ce', descKey:'aqi.veryUnhealthy' },
  { range:'301+', color:'#7f1d1d', descKey:'aqi.hazardous' }
]

export function LegendPopover({ open, onOpenChange }: LegendPopoverProps){
  const btnRef = useRef<HTMLButtonElement|null>(null)
  const panelRef = useRef<HTMLDivElement|null>(null)
  const layers = useAppStore(s => s.layers)
  const toggle = useAppStore(s => s.toggleLayer)
  const heatmapOpacity = useAppStore(s => s.heatmapOpacity)
  const heatmapBlendMode = useAppStore(s => s.heatmapBlendMode)
  const setHeatmapOpacity = useAppStore(s => s.setHeatmapOpacity)
  const setHeatmapBlendMode = useAppStore(s => s.setHeatmapBlendMode)
  const { t } = useTranslation()

  useEffect(()=>{
    function onKey(e:KeyboardEvent){
      if(e.key === 'Escape' && open){ onOpenChange(false); btnRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  useEffect(()=>{
    function handleClick(e:MouseEvent){
      if(open && panelRef.current && !panelRef.current.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)){
        onOpenChange(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return ()=> document.removeEventListener('mousedown', handleClick)
  }, [open, onOpenChange])

  return (
    <div className="relative">
      <button data-testid="legend-trigger" ref={btnRef} aria-haspopup="dialog" aria-expanded={open} aria-controls="map-legend-panel" onClick={()=> onOpenChange(!open)} className="btn-soft text-xs font-medium shadow-lg shadow-black/40">
        {t('legend.button','Legend')}
      </button>
      {open && (
        <div ref={panelRef} id="map-legend-panel" role="dialog" aria-modal="false" aria-label="Map legend and layer toggles" className="absolute top-10 right-0 w-72 max-h-[70vh] overflow-y-auto border border-slate-700/70 bg-slate-900 px-5 pt-5 pb-6 shadow-xl space-y-5 text-[11px] rounded-lg z-[3600] animate-in fade-in-0">
          <div>
            <p className="font-semibold text-sky-200 tracking-wide mb-2">{t('legend.layers','Layers')}</p>
            <ul className="space-y-1">
              {layers.sort((a,b)=> a.order-b.order).map(l => (
                <li key={l.key}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-sky-500" checked={l.visible} onChange={()=> toggle(l.key)} />
                    <span className={l.visible? 'text-slate-100':'text-slate-400'}>{l.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sky-200 tracking-wide mb-2">{t('legend.aqiScale','AQI Scale')}</p>
            <div className="flex gap-3 flex-wrap">
              {aqiScale.map(s => {
                const cat = t(s.descKey)
                return (
                  <div key={s.range} className="flex items-center gap-1" aria-label={`${s.range} ${cat}`}>
                    <span className="w-4 h-3 rounded ring-1 ring-white/20" style={{background:s.color}} />
                    <span className="text-slate-300 tabular-nums">{s.range}</span>
                    <span className="text-slate-400">{cat}</span>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Heatmap controls */}
          <div>
            <p className="font-semibold text-sky-200 tracking-wide mb-2">{t('legend.heatmap','Heatmap')}</p>
            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-slate-300 text-[10px] uppercase tracking-wide">{t('legend.opacity','Opacity')} <span className="text-slate-500">{Math.round(heatmapOpacity*100)}%</span></span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={heatmapOpacity}
                  onChange={e=> setHeatmapOpacity(parseFloat(e.target.value))}
                  aria-label={t('legend.opacity','Opacity')}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-slate-300 text-[10px] uppercase tracking-wide">{t('legend.blendMode','Blend')}</span>
                <select
                  value={heatmapBlendMode}
                  onChange={e=> setHeatmapBlendMode(e.target.value)}
                  className="bg-slate-800/70 border border-slate-600/50 rounded px-2 py-1 text-[11px] focus-visible:outline focus-visible:outline-sky-500"
                  aria-label={t('legend.blendMode','Blend')}
                >
                  <option value="normal">normal</option>
                  <option value="multiply">multiply</option>
                  <option value="overlay">overlay</option>
                  <option value="screen">screen</option>
                  <option value="hard-light">hard-light</option>
                </select>
              </label>
            </div>
          </div>
          <div>
            <p className="font-semibold text-sky-200 tracking-wide mb-2">{t('legend.ozoneForecast','Ozone Forecast')}</p>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gradient-to-r from-sky-600 via-fuchsia-500 to-red-600 relative overflow-hidden">
                <span className="absolute left-0 -top-1 text-[9px] text-slate-200">0</span>
                <span className="absolute left-1/2 -translate-x-1/2 -top-1 text-[9px] text-slate-200">60</span>
                <span className="absolute right-0 -top-1 text-[9px] text-slate-200">120+</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-snug">{t('legend.ozoneForecastHint','ppb (prototype gradient; higher = elevated ozone)')}</p>
              <OzoneRangeMini />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-700/60 text-[10px] text-slate-400">
            <p>{t('legend.sources','Data sources: TEMPO (satellite), local stations (mock)')}</p>
          </div>
          <button onClick={()=> onOpenChange(false)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-200" aria-label={t('common.close','Close')}>&times;</button>
        </div>
      )}
    </div>
  )
}

function OzoneRangeMini(){
  const { t } = useTranslation()
  const [range, setRange] = useState<{min:string; max:string} | null>(null)
  useEffect(()=>{
    function pull(){
      const canvas = document.getElementById('ca-ozone') as HTMLCanvasElement | null
      if(canvas && canvas.dataset.ozMin && canvas.dataset.ozMax){
        setRange({ min: canvas.dataset.ozMin, max: canvas.dataset.ozMax })
      }
    }
    pull()
  const onEvt = () => pull()
    window.addEventListener('ozoneRangeUpdated', onEvt as any)
  const id = setInterval(pull, 100)
    return ()=> { window.removeEventListener('ozoneRangeUpdated', onEvt as any); clearInterval(id) }
  },[])
  if(!range) return null
  return <p className="text-[10px] text-slate-400" aria-label="ozone-range-line">{t('legend.ozoneRange','Range')}: <span className="text-slate-200 tabular-nums">{range.min}</span> – <span className="text-slate-200 tabular-nums">{range.max}</span> ppb</p>
}

export default LegendPopover