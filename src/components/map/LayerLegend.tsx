import { useAppStore } from '../../state/store'

export function LayerLegend(){
  const layers = useAppStore(s => s.layers)
  const toggle = useAppStore(s => s.toggleLayer)
  return (
    <div className="rounded-lg ring-1 ring-slate-700/60 bg-slate-900/70 backdrop-blur p-3 text-xs space-y-2">
      <p className="font-semibold text-sky-200 text-[11px] tracking-wide">LAYERS</p>
      <ul className="space-y-1">
        {layers.sort((a,b)=> a.order - b.order).map(l => (
          <li key={l.key}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-sky-500" checked={l.visible} onChange={()=> toggle(l.key)} />
              <span className={l.visible ? 'text-slate-100' : 'text-slate-400'}>{l.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
