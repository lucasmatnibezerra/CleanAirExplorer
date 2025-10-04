import { useSearchParams } from 'react-router-dom'
import { useHistoricalSeries, useStations } from '../api/hooks'
import { useState, Suspense, lazy, useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Separator } from '../components/ui/separator'

const TrendChart = lazy(()=> import('../sections/TrendChart'))

export function TrendsPage(){
  const [params, setParams] = useSearchParams()
  const stationParam = params.get('station')
  const pollutantParam = params.get('pollutant') || 'PM2.5'
  const { data: stations } = useStations()
  const [pollutant, setPollutant] = useState(pollutantParam)
  const { data: series } = useHistoricalSeries(stationParam, pollutant)
  const [range, setRange] = useState<'24h'|'7d'|'30d'>('24h')

  const filtered = useMemo(()=> {
    if(!series) return undefined
    // Mock filtering: assume points hourly & length ~= many hours
    if(range==='24h') return { ...series, points: series.points.slice(-24) }
    if(range==='7d') return { ...series, points: series.points.slice(-24*7) }
    return { ...series, points: series.points.slice(-24*30) }
  }, [series, range])

  function selectStation(id:string){
    params.set('station', id); setParams(params, { replace:true })
  }

  return (
    <div className="space-y-6">
  <h1 className="text-xl font-semibold">Historical Trends (mock)</h1>
      <div className="flex flex-wrap gap-2 text-xs items-center">
        <span className="text-slate-400">Station:</span>
        {stations?.map(st => (
          <button key={st.id} onClick={()=> selectStation(st.id)} className={`px-3 py-1 rounded ${stationParam===st.id ? 'bg-sky-600 text-white':'bg-slate-700/60 text-slate-200 hover:bg-slate-600/70'}`}>{st.name}</button>
        ))}
      </div>
      <div className="flex gap-3 text-xs items-center">
        <label className="text-slate-400">Pollutant</label>
        <select value={pollutant} onChange={e=> setPollutant(e.target.value)} className="bg-slate-800/60 ring-1 ring-slate-700/50 rounded px-2 py-1">
          <option>PM2.5</option>
          <option>NO2</option>
          <option>O3</option>
        </select>
      </div>
      <div className="h-96 rounded-xl ring-1 ring-border bg-card/60 p-4 flex flex-col">
        {!series && <p className="text-xs text-muted-foreground">Select a station to view data.</p>}
        {series && (
          <Tabs value={range} onValueChange={(v:any)=> setRange(v)} className="flex flex-col flex-1">
            <TabsList className="w-fit">
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
              <TabsTrigger value="30d">30d</TabsTrigger>
            </TabsList>
            <Separator className="my-2" />
            <TabsContent value={range} className="flex-1 min-h-0">
              <div className="h-full">
                <Suspense fallback={<p className="text-xs text-muted-foreground">Loading chart…</p>}>
                  <TrendChart series={filtered || series} />
                </Suspense>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
