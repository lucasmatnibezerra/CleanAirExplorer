import { useAppStore } from '../../state/store'
import { useStations, useHistoricalSeries } from '../../api/hooks'
import { Link } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '../ui/sheet'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { aqiBadgeClass, aqiCategory, aqiColor } from '../../lib/aqi'
import { useTranslation } from 'react-i18next'

export function StationDrawer(){
  const stationId = useAppStore(s => s.selectedStationId)
  const setSelected = useAppStore(s => s.setSelectedStation)
  const { data: stations } = useStations()
  const station = stations?.find(s => s.id === stationId)
  const { data: historical } = useHistoricalSeries(stationId, 'PM2.5')
  const { t } = useTranslation()
  useEffect(()=>{/* placeholder for future side-effects */}, [stationId])
  return (
    <Sheet open={!!station} onOpenChange={(open)=> !open && setSelected(null)}>
  <SheetContent side="bottom" className="max-h-[65vh] flex flex-col gap-0 p-0 overflow-hidden bg-slate-950/85 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
        {station && (
          <>
            <header className="px-6 pt-5 pb-3 border-b border-border/60 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-900/95 backdrop-blur">
              <SheetHeader className="text-left space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="text-base tracking-tight">{station.name}</SheetTitle>
                  <Badge variant="outline" className={aqiBadgeClass(station.latestAQI)}>{t(aqiCategory(station.latestAQI, {key:true}) as string)}</Badge>
                </div>
                <SheetDescription className="text-xs text-slate-400">{station.location.lat.toFixed(2)}, {station.location.lon.toFixed(2)}</SheetDescription>
              </SheetHeader>
            </header>
            <div className="flex-1 overflow-y-auto px-6 pb-5 pt-4 space-y-6">
              <section>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <Metric label={t('station.aqi','AQI')} value={station.latestAQI.toString()} color={aqiColor(station.latestAQI)} emphasize />
                  <Metric label={t('station.pm25','PM2.5')} value={(12+Math.random()*15).toFixed(1)} />
                  <Metric label={t('station.no2','NO₂')} value={(15+Math.random()*20).toFixed(0)} />
                </div>
              </section>
              <section className="space-y-3">
                <h3 className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{t('station.mockRecent','Mock recent points (PM2.5):')}</h3>
                <Sparkline values={historical?.points.slice(-24).map(p=>p.value) || []} />
                <div className="flex gap-1 flex-wrap mt-1">
                  {historical?.points.slice(-14).map(p => (
                    <span key={p.ts} className="px-1 py-0.5 rounded bg-slate-800/80 ring-1 ring-slate-700/50 text-[11px] text-slate-300 tabular-nums">{p.value}</span>
                  ))}
                </div>
              </section>
              <section className="grid grid-cols-2 gap-5 text-[11px] text-slate-400">
                <div>
                  <p className="font-semibold mb-1 text-slate-300">Meta</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Prototype data</li>
                    <li>Not operational</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1 text-slate-300">Next</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Real feed integration</li>
                    <li>Alert thresholds</li>
                  </ul>
                </div>
              </section>
            </div>
            <footer className="px-6 py-3 border-t border-border/60 flex items-center justify-between bg-slate-900/95">
              <Link to={`/trends?station=${station.id}`} className="text-primary hover:underline text-xs font-medium">{t('station.viewTrends','View Trends →')}</Link>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={()=> alert('Bookmark (mock)')} className="text-xs">{t('station.bookmark','☆ Bookmark')}</Button>
                <SheetClose asChild>
                  <Button variant="ghost" size="sm" className="text-xs">{t('station.close','Close')}</Button>
                </SheetClose>
              </div>
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Metric({label, value, color, emphasize}:{label:string; value:string; color?:string; emphasize?:boolean}){
  return (
    <div className="rounded-md bg-slate-800/70 ring-1 ring-slate-700/50 p-2 flex flex-col gap-0.5 shadow-sm">
      <span className="text-[10px] tracking-wide uppercase text-slate-400">{label}</span>
      <span className={"text-sm tabular-nums font-semibold " + (emphasize? 'text-lg':'')} style={color? {color}:{}}>{value}</span>
    </div>
  )
}

function Sparkline({ values }:{ values:number[] }){
  const computed = useMemo(()=>{
    if(!values.length) return null
    const slice = values.slice(-40)
    let min = Math.min(...slice), max = Math.max(...slice)
    if(max - min < 0.0001) { max = min + 1 }
    const span = max - min
    const coords = slice.map((v,i)=>({
      x:(i/(slice.length-1))*100,
      y:100 - ((v - min)/span)*100,
      v
    }))
    const line = coords.map(c=> `${c.x},${c.y}`).join(' ')
    const polygon = `0,100 ${line} 100,100`
    const last = coords[coords.length-1]
    return { line, polygon, last }
  },[values])
  if(!computed) return <div className="h-24" aria-hidden="true" />
  const { line, polygon, last } = computed
  return (
    <div className="h-24 relative rounded-md overflow-hidden ring-1 ring-slate-800/60 bg-slate-900/40" aria-label="recent pm2.5 trend mini chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full block">
        <defs>
          <linearGradient id="sparkArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={polygon} fill="url(#sparkArea)" />
        <polyline points={line} fill="none" stroke="#38bdf8" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
        <circle cx={last.x} cy={last.y} r={2.2} fill="#38bdf8" stroke="#0f172a" strokeWidth={0.7} />
      </svg>
    </div>
  )
}

