import { useForecast } from '../api/hooks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../state/store'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/badge'
import { aqiBadgeClass, aqiCategory, aqiColor } from '../lib/aqi'

export function ForecastPanel({ compact = false }: { compact?: boolean }){
  const { data, isLoading } = useForecast()
  const [scrollIndex, setScrollIndex] = useState(0)
  const hourIndex = useAppStore(s => s.forecastHourIndex)
  const setHourIndex = useAppStore(s => s.setForecastHourIndex)
  const hours = data?.hours ?? []
  const items = useMemo(()=> {
    return hours.map((h, i) => {
      const prev = i>0 ? hours[i-1] : null
      const delta = prev ? h.aqi - prev.aqi : 0
      return {
        raw: h,
        ts: h.ts,
        hour: new Date(h.ts).getHours(),
        aqi: h.aqi,
        pollutant: (h as any).pollutant as string | undefined,
        delta,
        category: aqiCategory(h.aqi)
      }
    })
  },[hours])
  const slice = compact ? items.slice(scrollIndex, scrollIndex + 12) : items
  const current = items[hourIndex]
  const currentDelta = current?.delta ?? 0
  const deltaArrow = currentDelta === 0 ? '→' : currentDelta > 0 ? '↑' : '↓'
  const [hoverTs, setHoverTs] = useState<number|null>(null)
  const hoverData = hoverTs ? items.find(h=> h.ts===hoverTs) : null
  // Accessible focus & keyboard nav
  const listRef = useRef<HTMLDivElement | null>(null)
  const announceRef = useRef<HTMLDivElement | null>(null)
  const focusHour = useCallback((idx:number)=> {
    if(idx < 0 || idx >= items.length) return
    setHourIndex(idx)
  },[items.length, setHourIndex])
  const onKey = useCallback((e: React.KeyboardEvent) => {
    if(!items.length) return
    switch(e.key){
      case 'ArrowRight': e.preventDefault(); focusHour(hourIndex+1); break;
      case 'ArrowLeft': e.preventDefault(); focusHour(hourIndex-1); break;
      case 'Home': e.preventDefault(); focusHour(0); break;
      case 'End': e.preventDefault(); focusHour(items.length-1); break;
      case 'PageUp': e.preventDefault(); focusHour(Math.max(0, hourIndex-6)); break;
      case 'PageDown': e.preventDefault(); focusHour(Math.min(items.length-1, hourIndex+6)); break;
    }
  },[focusHour, hourIndex, items.length])
  useEffect(()=>{
    if(current && announceRef.current){
      announceRef.current.textContent = `${current.hour}:00 AQI ${current.aqi} ${current.category}${currentDelta!==0? (currentDelta>0? ' rising '+currentDelta : ' falling '+Math.abs(currentDelta)) : ''}`
    }
  },[current, currentDelta])
  // Sparkline path (simple linear)
  const spark = useMemo(()=> {
    if(items.length === 0) return ''
    const values = items.map(i=> i.aqi)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = Math.max(1, max-min)
    const w = 100; const h = 24
    return values.map((v,i)=> {
      const x = (i/(values.length-1))*w
      const y = h - ((v-min)/span)*h
      return `${i===0? 'M':'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  },[items])
  return (
    <section className="rounded-xl ring-1 ring-slate-700/50 p-4 bg-slate-800/60 backdrop-blur">
      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <h2 className="font-semibold text-sky-300 leading-snug">48h Forecast</h2>
          <p className="text-[10px] text-slate-400">Hour {hourIndex+1} / {items.length}</p>
          {spark && (
            <svg viewBox="0 0 100 24" className="mt-1 w-24 h-6 overflow-visible">
              <path d={spark} fill="none" stroke="#38bdf8" strokeWidth={1} className="opacity-40" />
              {current && items.length>1 && (
                <circle cx={(hourIndex/(items.length-1))*100} cy="12" r="2.5" className="fill-sky-300" />
              )}
            </svg>
          )}
        </div>
        {current && (
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={aqiBadgeClass(current.aqi)}>{current.category}</Badge>
            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${currentDelta===0? 'border-slate-600 text-slate-300':'border-sky-600 text-sky-300'}`}
              aria-label="trend" title={currentDelta===0? 'Stable': currentDelta>0? 'Rising':'Falling'}>
              <span>{deltaArrow}</span>
              <span>{currentDelta===0? 'Stable': `${currentDelta>0? '+':''}${currentDelta}`}</span>
            </span>
          </div>
        )}
      </div>
      {isLoading && (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({length: compact? 6: 12}).map((_,i)=>(
            <div key={i} className="min-w-20 flex-shrink-0 flex flex-col items-center gap-2">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      )}
      {!isLoading && (
        <div className={compact ? 'space-y-2' : ''}>
          {compact && (
            <div className="flex justify-between text-[10px] text-slate-400">
              <button disabled={scrollIndex===0} onClick={()=> setScrollIndex(i=> Math.max(0, i-4))} className="disabled:opacity-30">◀</button>
              <span>{slice.length} / {items.length} hours</span>
              <button disabled={scrollIndex+12>=items.length} onClick={()=> setScrollIndex(i=> Math.min(items.length-12, i+4))} className="disabled:opacity-30">▶</button>
            </div>
          )}
          <div
            ref={listRef}
            className="flex gap-3 overflow-x-auto text-xs relative outline-none"
            role="listbox"
            aria-label="Hourly AQI forecast"
            tabIndex={0}
            onKeyDown={onKey}
          >
            {slice.map(h => {
              const globalIndex = items.findIndex(x => x.ts === h.ts)
              const active = globalIndex === hourIndex
              const activeRing = active ? `ring-1 ring-[${aqiColor(h.aqi)}]` : ''
              const catColor = aqiColor(h.aqi)
              const delta = h.delta
              const deltaSym = delta === 0 ? '' : delta > 0 ? '↑' : '↓'
              return (
                <button
                  key={h.ts}
                  type="button"
                  role="option"
                  aria-selected={active}
                  aria-pressed={active}
                  aria-label={`${h.hour}:00 AQI ${h.aqi} ${h.category}${delta? (delta>0? ' rising '+delta : ' falling '+Math.abs(delta)) : ''}`}
                  onClick={()=> focusHour(globalIndex)}
                  onMouseEnter={()=> setHoverTs(h.ts)}
                  onMouseLeave={()=> setHoverTs(cur=> cur===h.ts? null: cur)}
                  className={`relative cursor-pointer min-w-20 flex-shrink-0 flex flex-col items-center rounded px-2 py-2 transition-colors focus-visible:outline focus-visible:outline-sky-500 ${active ? 'bg-slate-900/70 '+activeRing : 'bg-slate-900/40 hover:bg-slate-800/60'} ${!active ? 'opacity-85' : ''}`}
                  style={active ? { boxShadow: `0 0 0 1px ${catColor}66, 0 0 0 4px rgba(56,189,248,0.08)` } : undefined}
                >
                  <span>{h.hour}:00</span>
                  <span className="text-lg font-semibold tracking-tight" style={{color:catColor}}>{h.aqi}</span>
                  {active && delta !== 0 && (
                    <span className={`text-[10px] ${delta>0? 'text-amber-300':'text-emerald-300'}`}>{deltaSym} {Math.abs(delta)}</span>
                  )}
                </button>
              )
            })}
            {hoverData && (
              <div className="absolute -top-2 translate-y-[-100%] pointer-events-none left-0" style={{transform:`translate(${(items.findIndex(h=>h.ts===hoverData.ts)-(compact? scrollIndex:0))*80}px, -8px)`}}>
                <div className="px-2 py-1 rounded bg-slate-900/95 border border-slate-600 text-[10px] shadow whitespace-nowrap flex gap-1">
                  <span className="font-semibold" style={{color: aqiColor(hoverData.aqi)}}>AQI {hoverData.aqi}</span>
                  {hoverData.pollutant && <span>· {hoverData.pollutant}</span>}
                  <span>· {hoverData.hour}:00</span>
                  {hoverData.delta !== 0 && <span className={hoverData.delta>0? 'text-amber-300':'text-emerald-300'}>· {hoverData.delta>0? '+' : ''}{hoverData.delta}</span>}
                  <span>· {hoverData.category}</span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
            <span>0h</span>
            <input type="range" min={0} max={items.length-1} value={hourIndex} onChange={e=> setHourIndex(+e.target.value)} className="flex-1" />
            <span>{items.length-1}h</span>
          </div>
          <div aria-live="polite" className="sr-only" ref={announceRef} />
        </div>
      )}
    </section>
  )
}

