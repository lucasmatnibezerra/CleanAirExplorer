const aqiScale = [
  { label:'0-50', color:'#22c55e', desc:'Good' },
  { label:'51-100', color:'#eab308', desc:'Moderate' },
  { label:'101-150', color:'#f97316', desc:'Sensitive' },
  { label:'151-200', color:'#dc2626', desc:'Unhealthy' },
  { label:'201+', color:'#7e22ce', desc:'Very Unhealthy+' },
]

export function ColorLegend(){
  return (
    <div className="rounded-lg ring-1 ring-slate-700/60 bg-slate-900/70 backdrop-blur p-3 text-[10px] space-y-2">
      <p className="font-semibold text-sky-200 tracking-wide">AQI</p>
      <div className="flex gap-2">
        {aqiScale.map(s => (
          <div key={s.label} className="flex flex-col items-center">
            <span className="w-6 h-3 rounded" style={{background:s.color}} />
            <span className="mt-1 text-slate-300">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
