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
      <button ref={btnRef} aria-haspopup="dialog" aria-expanded={open} aria-controls="map-legend-panel" onClick={()=> onOpenChange(!open)} className="btn-soft text-xs font-medium">
        {t('legend.button','Legend')}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[95]" onClick={()=> onOpenChange(false)} aria-hidden="true" />
          <div ref={panelRef} id="map-legend-panel" role="dialog" aria-modal="true" aria-label="Map legend and layer toggles" className="fixed top-0 right-0 h-full w-80 md:w-72 overflow-y-auto border-l border-slate-700/60 bg-slate-900/95 backdrop-blur px-5 pt-6 pb-8 shadow-xl space-y-6 text-[11px] z-[100] animate-in slide-in-from-right">
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
            <button onClick={()=> onOpenChange(false)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-200" aria-label={t('common.close','Close')}>&times;</button>
          </div>
        </>
      )}
    </div>
  )
}

function OzoneRangeMini(){
  const { t } = useTranslation()
  const [range, setRange] = useState<{min:string; max:string} | null>(null)
  useEffect(()=>{
    function pull(){
      const canvas = document.getElementById('ozone-forecast-layer') as HTMLCanvasElement | null
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