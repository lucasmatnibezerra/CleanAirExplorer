import { useStations } from '../api/hooks'
import { Skeleton } from '../components/ui/Skeleton'
import type { Station } from '../api/types'

export function StationsPage(){
  const { data, isLoading } = useStations()
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Monitoring Stations (mock)</h1>
      {isLoading && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({length:6}).map((_,i)=>(<Skeleton key={i} className="h-24" />))}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
  {data?.map((st: Station) => (
          <div key={st.id} className="p-3 rounded-lg ring-1 ring-slate-700/50 bg-slate-800/60 backdrop-blur">
            <h2 className="font-medium">{st.name}</h2>
            <p className="text-xs text-slate-400">{st.location.lat.toFixed(2)}, {st.location.lon.toFixed(2)}</p>
            <p className="mt-1 text-sm">AQI: <span className="font-semibold" style={{color: aqiColor(st.latestAQI)}}>{st.latestAQI}</span></p>
          </div>
        ))}
      </div>
    </div>
  )
}

function aqiColor(val:number){
  if(val<=50) return '#22c55e'
  if(val<=100) return '#eab308'
  if(val<=150) return '#f97316'
  if(val<=200) return '#dc2626'
  return '#7e22ce'
}
