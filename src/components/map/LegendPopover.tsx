import { useRef, useEffect } from 'react'
import { useAppStore } from '@/state/store'

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
        Legend
      </button>
      {open && (
  <div ref={panelRef} id="map-legend-panel" role="dialog" aria-modal="false" aria-label="Map legend and layer toggles" className="absolute right-0 mt-2 w-72 max-h-[60vh] overflow-auto rounded-lg border border-slate-600/50 bg-slate-900/90 backdrop-blur p-4 shadow-lg space-y-4 text-[11px] z-50">
          <div>
            <p className="font-semibold text-sky-200 tracking-wide mb-2">Layers</p>
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
            <p className="font-semibold text-sky-200 tracking-wide mb-2">AQI Scale</p>
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
            <p>Data sources: TEMPO (satellite), local stations (mock)</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default LegendPopover