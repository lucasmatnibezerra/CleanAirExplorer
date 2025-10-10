import { useEffect, useMemo, useState } from 'react'
import { useStations, haversineKm } from '../api/hooks'
import { Skeleton } from '../components/ui/Skeleton'
import type { Station } from '../api/types'
import { useAppStore } from '../state/store'
import { Star, MapPin, ArrowUpDown, List } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTranslation } from 'react-i18next'

type SortKey = 'severity' | 'distance' | 'updated' | 'name'

export function StationsPage(){
  const { t } = useTranslation()
  const { data, isLoading } = useStations()
  const home = useAppStore(s => s.settings.homeLocation)

  // persisted UI state in localStorage
  const [query, setQuery] = useState<string>(() => localStorage.getItem('stations:query') || '')
  const [sort, setSort] = useState<SortKey>(() => (localStorage.getItem('stations:sort') as SortKey) || 'severity')
  const [filters, setFilters] = useState<{source:Set<string>; status:Set<string>; pollutant:Set<string>; aqiRange:[number,number]}>(() => ({
    source: new Set(JSON.parse(localStorage.getItem('stations:filter:source') || '[]')),
    status: new Set(JSON.parse(localStorage.getItem('stations:filter:status') || '[]')),
    pollutant: new Set(JSON.parse(localStorage.getItem('stations:filter:pollutant') || '[]')),
    aqiRange: JSON.parse(localStorage.getItem('stations:filter:aqiRange') || '[0,500]')
  }))

  // show all stations in the ScrollArea, no pagination
  const storeFavorites = useAppStore(s => s.favorites)
  const toggleFavorite = useAppStore(s => s.toggleFavorite)
  const setSelected = useAppStore(s => s.setSelectedStation)
  const setHovered = useAppStore(s => s.setHoveredStation)
  const [favOnly, setFavOnly] = useState(false)

  useEffect(()=>{ localStorage.setItem('stations:query', query) }, [query])
  useEffect(()=>{ localStorage.setItem('stations:sort', sort) }, [sort])
  useEffect(()=>{ localStorage.setItem('stations:filter:source', JSON.stringify(Array.from(filters.source))) }, [filters.source])
  useEffect(()=>{ localStorage.setItem('stations:filter:status', JSON.stringify(Array.from(filters.status))) }, [filters.status])
  useEffect(()=>{ localStorage.setItem('stations:filter:pollutant', JSON.stringify(Array.from(filters.pollutant))) }, [filters.pollutant])
  useEffect(()=>{ localStorage.setItem('stations:filter:aqiRange', JSON.stringify(filters.aqiRange)) }, [filters.aqiRange])
  useEffect(()=>{ localStorage.setItem('stations:favs', JSON.stringify(storeFavorites || [])) }, [storeFavorites])

  // Ensure fresh view shows all stations if there are stale persisted filters
  useEffect(() => {
    const hasFilters = filters.source.size || filters.status.size || filters.pollutant.size || filters.aqiRange[0] !== 0 || filters.aqiRange[1] !== 500
    if (!query && hasFilters) {
      clearFilters()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const normalizedQuery = useMemo(()=> query.normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim(), [query])

  const filtered = useMemo(()=>{
    if(!data) return []
    return data.filter(st => {
      if(favOnly && storeFavorites && !storeFavorites.includes(st.id)) return false
      if(filters.source.size && st.source && !filters.source.has(st.source)) return false
      if(filters.status.size && st.status && !filters.status.has(st.status)) return false
      if(filters.pollutant.size && st.dominantPollutant && !filters.pollutant.has(st.dominantPollutant)) return false
      if(st.latestAQI < filters.aqiRange[0] || st.latestAQI > filters.aqiRange[1]) return false
      if(normalizedQuery){
        const hay = `${st.name} ${st.city || ''} ${st.id}`.normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase()
        if(!hay.includes(normalizedQuery)) return false
      }
      return true
    })
  }, [data, filters, normalizedQuery, favOnly, storeFavorites])

  const sorted = useMemo(()=>{
    const arr = [...filtered]
    if(sort==='severity') arr.sort((a,b)=> b.latestAQI - a.latestAQI)
    if(sort==='name') arr.sort((a,b)=> a.name.localeCompare(b.name))
    if(sort==='updated') arr.sort((a,b)=> (b.lastUpdated||0) - (a.lastUpdated||0))
    if(sort==='distance' && home) arr.sort((a,b)=> haversineKm(home, a.location) - haversineKm(home, b.location))
    return arr
  }, [filtered, sort, home])

  const shown = sorted

  function toggleFilter(type:'source'|'status'|'pollutant', value:string){
    setFilters(prev => {
      const next = { ...prev }
      const set = new Set(next[type]) as Set<string>
      if(set.has(value)) set.delete(value); else set.add(value)
      return { ...next, [type]: set } as typeof prev
    })
  }

  function clearFilters(){
    setFilters({ source: new Set(), status: new Set(), pollutant: new Set(), aqiRange:[0,500] })
  }

  function toggleFav(id:string){ toggleFavorite(id) }

  const counts = useMemo(()=>{
    const out = new Map<string, number>()
    for(const s of (data||[])){
      const key = s.dominantPollutant || 'unknown'
      out.set(key, (out.get(key)||0)+1)
    }
    return out
  },[data])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('stationsPage.title','Monitoring Stations (mock)')}</h1>

      <div className="sticky top-4 z-10 bg-slate-900/60 backdrop-blur rounded p-3 flex gap-3 items-center">
        <div className="flex-1">
          <label className="sr-only">{t('stationsPage.searchLabel','Search stations')}</label>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('stationsPage.searchPlaceholder','Search by name, city or id')} className="w-full p-2 rounded bg-slate-800/40 placeholder:text-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setSort('severity')} aria-pressed={sort==='severity'} title={t('stationsPage.sort.label','Sort')} className="p-2 rounded hover:bg-slate-800/40">
            <ArrowUpDown size={16} />
          </button>
          <button onClick={()=>setFavOnly(v=>!v)} aria-pressed={favOnly} aria-label={t('stationsPage.favorite','Favorite')} title={t('stationsPage.favorite','Favorite')} className="p-2 rounded hover:bg-slate-800/40">
            <Star size={16} className={favOnly? 'text-yellow-400':'text-slate-400'} />
          </button>
          <select value={sort} onChange={e=>setSort(e.target.value as SortKey)} className="p-2 rounded bg-slate-800/40">
            <option value="severity">{t('stationsPage.sort.severity','Severity')}</option>
            <option value="distance">{t('stationsPage.sort.distance','Distance')}</option>
            <option value="updated">{t('stationsPage.sort.updated','Updated')}</option>
            <option value="name">{t('stationsPage.sort.name','Name')}</option>
          </select>
          <button onClick={()=>clearFilters()} title={t('stationsPage.clearFilters','Clear filters')} className="p-2 rounded hover:bg-slate-800/40">{t('actions.clear','Clear')}</button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(Array.from(counts.entries()) as [string,number][])?.map(([pol, cnt])=> (
          <button key={pol} onClick={()=>toggleFilter('pollutant', pol)} className="px-2 py-1 bg-slate-800/40 rounded">{pol} ({cnt})</button>
        ))}
      </div>

      {isLoading && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({length:6}).map((_,i)=>(<Skeleton key={i} className="h-24" />))}
        </div>
      )}

      <VirtualizedStations shown={shown} favorites={storeFavorites||[]} onToggleFav={toggleFav} onSelect={setSelected} onHover={setHovered} />

      {sorted.length === 0 && !isLoading && (
        <div className="p-6 text-center text-slate-400">{t('stationsPage.empty','No stations match your filters.')} <button onClick={clearFilters} className="underline">{t('stationsPage.resetFilters','Reset filters')}</button></div>
      )}

      {/* Removed 'Show more' button; all stations are available via scrolling */}
    </div>
  )
}

function VirtualizedStations({ shown, favorites, onToggleFav, onSelect, onHover }:{ shown: Station[]; favorites: string[]; onToggleFav:(id:string)=>void; onSelect:(id:string)=>void; onHover:(id:string|null)=>void }){
  return (
    <ScrollArea className="h-[60vh] rounded border border-border/40">
      <div className="p-2 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((st) => (
          <StationCard
            key={st.id}
            station={st}
            fav={favorites.includes(st.id)}
            onToggleFav={() => onToggleFav(st.id)}
            onFocusMap={() => onSelect(st.id)}
            onHover={() => onHover(st.id)}
            onBlur={() => onHover(null)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

function StationCard({station, fav, onToggleFav, onFocusMap, onHover, onBlur}:{station:Station; fav:boolean; onToggleFav:()=>void; onFocusMap:()=>void; onHover?:()=>void; onBlur?:()=>void}){
  const aqi = station.latestAQI
  return (
    <article onMouseEnter={onHover} onMouseLeave={onBlur} onClick={()=> onFocusMap()} role="button" tabIndex={0} aria-label={`${station.name}, ${station.city || ''}, AQI ${aqi}`} className="p-3 rounded-lg ring-1 ring-slate-700/50 bg-slate-800/60 backdrop-blur hover:shadow-lg focus:outline-2 focus:outline-sky-500">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{station.name} <span className="text-xs text-slate-400">· {station.city}</span></h3>
          <div className="mt-1 text-sm">Source: <span className="inline-block px-2 py-0.5 text-xs rounded bg-slate-700/40">{station.source}</span></div>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={onToggleFav} aria-pressed={fav} aria-label="Favorite" title="Favorite" className="p-1 rounded hover:bg-slate-800/40">
            <Star size={16} className={fav? 'text-yellow-400':'text-slate-400'} />
            <span className="sr-only">Favorite</span>
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div>
          <div className="text-2xl font-semibold" style={{color: aqiColor(aqi)}}>{aqi}</div>
          <div className="text-xs text-slate-400">{aqiLabel(aqi)}</div>
        </div>
        <div className="flex-1">
          <MiniSparkline points={generateSparkline(station)} />
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-400 flex justify-between items-center">
        <div>{station.location.lat.toFixed(2)}, {station.location.lon.toFixed(2)}</div>
        <div className="flex gap-2 items-center">
          <button onClick={onFocusMap} title="View on map" className="p-1 rounded hover:bg-slate-800/40"><MapPin size={14} /></button>
          <button title="Trends" className="p-1 rounded hover:bg-slate-800/40"><List size={14} /></button>
        </div>
      </div>
    </article>
  )
}

function generateSparkline(station:Station){
  const seed = station.id.split('-').pop() || '1'
  const n = 24
  const s = Number(seed)
  return Array.from({length:n}, (_,i)=> 40 + ((s * (i+1)) % 60) + (Math.sin((s+i)/3) * 8))
}

function MiniSparkline({points}:{points:number[]}){
  const w = 120, h = 28
  const max = Math.max(...points), min = Math.min(...points)
  const stepX = w / Math.max(1, points.length-1)
  const path = points.map((p,i)=> `${i===0? 'M':'L'} ${i*stepX} ${h - ((p-min)/(max-min||1))*(h-4)}`).join(' ')
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="opacity-80"><path d={path} fill="none" stroke="#9ca3af" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function aqiColor(val:number){
  if(val<=50) return '#22c55e'
  if(val<=100) return '#eab308'
  if(val<=150) return '#f97316'
  if(val<=200) return '#dc2626'
  return '#7e22ce'
}

function aqiLabel(val:number){
  if(val<=50) return 'Good'
  if(val<=100) return 'Moderate'
  if(val<=150) return 'Unhealthy'
  if(val<=200) return 'Very Unhealthy'
  return 'Hazardous'
}
