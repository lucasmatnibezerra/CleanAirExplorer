import { useRef, useEffect } from 'react'
import { useAppStore } from '../../state/store'
import { useTranslation } from 'react-i18next'

interface LegendPopoverProps {
  open: boolean
  onOpenChange: (open:boolean)=>void
}

const aqiScale = [
  { label:'0-50', color:'#22c55e', desc:'Good' },
  { label:'51-100', color:'#eab308', desc:'Moderate' },
  { label:'101-150', color:'#f97316', desc:'Sensitive' },
  { label:'151-200', color:'#dc2626', desc:'Unhealthy' },
  { label:'201+', color:'#7e22ce', desc:'Very Unhealthy+' }
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
              {aqiScale.map(s => (
                <div key={s.label} className="flex items-center gap-1">
                  <span className="w-4 h-3 rounded" style={{background:s.color}} />
                  <span className="text-slate-300">{s.label}</span>
                </div>
              ))}
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

export default LegendPopover