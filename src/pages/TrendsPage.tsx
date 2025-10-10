import { useSearchParams } from 'react-router-dom'
import { useHistoricalSeries, useStations } from '../api/hooks'
import { useState, Suspense, lazy, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { Star, StarOff, Pin, PinOff, X, MapPin } from 'lucide-react'
import { ScrollArea } from '../components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useTranslation } from 'react-i18next'

const TrendChart = lazy(()=> import('../sections/TrendChart'))

export function TrendsPage(){
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const stationParam = params.get('station')
  const pollutantParam = params.get('pollutant') || 'PM2.5'
  const { data: stations } = useStations()
  const [pollutant, setPollutant] = useState(pollutantParam)
  const { data: series } = useHistoricalSeries(stationParam, pollutant)
  const [range, setRange] = useState<'24h'|'7d'|'30d'>('24h')
  const [pinned, setPinned] = useState<string|undefined>(() => localStorage.getItem('pinnedStation') || undefined)
  useEffect(()=> { if(pinned) localStorage.setItem('pinnedStation', pinned); else localStorage.removeItem('pinnedStation') }, [pinned])

  const filtered = useMemo(()=> {
    if(!series) return undefined
    // Mock filtering: assume points hourly & length ~= many hours
    if(range==='24h') return { ...series, points: series.points.slice(-24) }
    if(range==='7d') return { ...series, points: series.points.slice(-24*7) }
    return { ...series, points: series.points.slice(-24*30) }
  }, [series, range])

  // Mock enrich stations with metadata (until backend provides)
  const enriched = useMemo(()=> stations?.map(s => ({
    ...s,
    city: ['Belém','São Paulo','Recife','Curitiba','Austin','Denver','Toronto'][parseInt(s.id)%7],
    country: ['BR','US','CA'][parseInt(s.id)%3],
    source: ['OpenAQ','AirNow','Pandora'][parseInt(s.id)%3],
    status: (parseInt(s.id)%5===0? 'offline':'online')
  })), [stations])

  // Search & filters
  const [q, setQ] = useState('')
  const [filterCountry, setFilterCountry] = useState<string|undefined>()
  const [filterSource, setFilterSource] = useState<string|undefined>()
  const [filterStatus, setFilterStatus] = useState<string|undefined>()
  const debouncedQ = useDebounce(q, 250)

  const filteredStations = useMemo(()=>{
    if(!enriched) return []
    return enriched.filter(s => (
      (!debouncedQ || s.name.toLowerCase().includes(debouncedQ.toLowerCase()) || s.id.includes(debouncedQ)) &&
      (!filterCountry || s.country===filterCountry) &&
      (!filterSource || s.source===filterSource) &&
      (!filterStatus || s.status===filterStatus)
    ))
  }, [enriched, debouncedQ, filterCountry, filterSource, filterStatus])

  // Favorites / recent (localStorage)
  const [favorites, setFavorites] = useState<string[]>(()=> JSON.parse(localStorage.getItem('favStations')||'[]'))
  const [recent, setRecent] = useState<string[]>(()=> JSON.parse(localStorage.getItem('recentStations')||'[]'))
  useEffect(()=> { localStorage.setItem('favStations', JSON.stringify(favorites)) }, [favorites])
  useEffect(()=> { localStorage.setItem('recentStations', JSON.stringify(recent)) }, [recent])

  function toggleFavorite(id:string){
    setFavorites(f => f.includes(id)? f.filter(x=>x!==id): [...f,id])
  }
  function pinStation(id:string){ setPinned(id) }
  function unpinStation(){ setPinned(undefined) }

  function selectStation(id:string){
    params.set('station', id); setParams(params, { replace:true })
    setRecent(r => [id, ...r.filter(x=> x!==id)].slice(0,8))
  }

  // Simple manual windowing (virtualization lite)
  const listRef = useRef<HTMLDivElement|null>(null)
  const rowHeight = 36
  const buffer = 6
  const [scrollTop, setScrollTop] = useState(0)
  const visible = useMemo(()=>{
    const total = filteredStations.length
    const viewport = listRef.current?.clientHeight || 0
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer)
    const end = Math.min(total, Math.ceil((scrollTop+viewport)/rowHeight) + buffer)
    return { start, end, items: filteredStations.slice(start, end), total }
  }, [scrollTop, filteredStations])
  const onScroll = useCallback(()=> { if(listRef.current) setScrollTop(listRef.current.scrollTop) }, [])

  // Dynamically constrain the aside (station list) so only it scrolls, without forcing the whole layout to a fixed viewport height.
  // We measure the distance from the top of the viewport to the aside and subtract from window.innerHeight.
  const asideRef = useRef<HTMLDivElement|null>(null)
  const [asideMaxH, setAsideMaxH] = useState<number|undefined>()
  const listCardRef = useRef<HTMLDivElement|null>(null)
  const listHeaderRef = useRef<HTMLDivElement|null>(null)
  const listFooterRef = useRef<HTMLDivElement|null>(null)
  const [listViewportMaxH, setListViewportMaxH] = useState<number|undefined>()
  const recomputeAsideHeight = useCallback(()=>{
    if(!asideRef.current) return
    const rect = asideRef.current.getBoundingClientRect()
    // Reserve a slightly larger bottom margin (32px) to give breathing room visually.
    const availableRaw = window.innerHeight - rect.top - 32
    // Clamp so não cresce demais em telas muito altas
    const available = Math.min(availableRaw, 620)
    if(available > 180) setAsideMaxH(available) // guard
  },[])
  useLayoutEffect(()=>{
    recomputeAsideHeight()
    window.addEventListener('resize', recomputeAsideHeight)
    return ()=> window.removeEventListener('resize', recomputeAsideHeight)
  },[recomputeAsideHeight])
  // Recompute when pinned banner toggles (layout shift)
  useEffect(()=>{ recomputeAsideHeight() }, [pinned, recomputeAsideHeight])

  // Recalcula viewport interno da lista baseado em header/footer reais
  const recomputeListViewport = useCallback(()=>{
    if(!listCardRef.current) return
    const cardPaddingY = 0 // já contamos apenas área útil interna
    const headerH = listHeaderRef.current?.offsetHeight || 0
    const footerH = listFooterRef.current?.offsetHeight || 0
    const chrome = headerH + footerH + cardPaddingY
    if(asideMaxH){
      const vp = asideMaxH - chrome - 4 // pequeno ajuste
      if(vp > 80) setListViewportMaxH(vp)
    }
  },[asideMaxH])
  useLayoutEffect(()=> { recomputeListViewport() }, [recomputeListViewport, visible.start, visible.end])
  useEffect(()=> {
    recomputeListViewport()
  }, [asideMaxH, pinned, favorites.length, filteredStations.length, recomputeListViewport])

  return (
  <div className="flex flex-1 min-h-0 w-full gap-6 pb-6">
      {/* Left main content */}
  <div className="flex-1 flex flex-col min-w-0 min-h-0 gap-4">
        <div className="bg-gradient-to-b from-slate-950/70 to-slate-950/30 px-1 pt-3 pb-2 flex flex-wrap gap-4 items-start justify-between rounded-md border border-border/40">
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <span>{t('trends.title','Historical trends')}</span>
              {stationParam && (
                <span className="text-slate-400 font-normal truncate max-w-[240px]">— {enriched?.find(s=> s.id===stationParam)?.name}</span>
              )}
            </h1>
            {stationParam && enriched && (()=>{ const s = enriched.find(x=> x.id===stationParam); if(!s) return null; return (
              <div className="flex flex-wrap gap-2 items-center text-[11px]">
                <nav aria-label={t('trends.breadcrumb','Breadcrumb')} className="flex items-center gap-1 text-slate-500">
                  <button onClick={()=> setFilterCountry(s.country)} className="hover:text-slate-300 focus:outline-none underline-offset-2 hover:underline">{s.country}</button>
                  <span>/</span>
                  <button onClick={()=> setQ(s.city)} className="hover:text-slate-300 focus:outline-none underline-offset-2 hover:underline">{s.city}</button>
                  <span>/</span>
                  <span className="text-slate-400">{s.name}</span>
                </nav>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 ring-1 ring-slate-700/50">{s.source}</span>
                <span className={"text-[10px] px-1.5 py-0.5 rounded ring-1 " + (s.status==='online'? 'bg-emerald-500/10 ring-emerald-600/40 text-emerald-300':'bg-amber-500/10 ring-amber-600/40 text-amber-300')}>{s.status}</span>
                <button onClick={()=> pinStation(s.id)} className={`h-6 px-2 inline-flex items-center gap-1 rounded text-[10px] ${pinned===s.id? 'bg-sky-700/70 text-white':'bg-slate-700/60 hover:bg-slate-600/60'}`} aria-label={pinned===s.id? 'Pinned station':'Pin station'}>
                  {pinned===s.id? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
                  {pinned===s.id? 'Pinned':'Pin'}
                </button>
                {stationParam && <button onClick={()=> { params.delete('station'); setParams(params,{replace:true}) }} className="h-6 px-2 inline-flex items-center gap-1 rounded bg-slate-800/60 hover:bg-slate-700/60 text-[10px]" aria-label={t('trends.clearSelected','Clear selected station')}><X className="h-3 w-3" />{t('actions.clear','Clear')}</button>}
              </div>
            )})()}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <label className="text-slate-400">{t('trends.pollutant','Pollutant')}</label>
            <select value={pollutant} onChange={e=> setPollutant(e.target.value)} className="bg-slate-800/60 ring-1 ring-slate-700/50 rounded px-2 py-1">
              <option>PM2.5</option>
              <option>NO2</option>
              <option>O3</option>
            </select>
            <Tabs value={range} onValueChange={(v)=> setRange(v as '24h'|'7d'|'30d')} className="h-8">
              <TabsList className="h-8">
                <TabsTrigger value="24h">24h</TabsTrigger>
                <TabsTrigger value="7d">7d</TabsTrigger>
                <TabsTrigger value="30d">30d</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        {pinned && (()=>{ const s = enriched?.find(x=> x.id===pinned); if(!s) return null; return (
          <div className="px-1" data-banner-height>
            <div className="rounded-md bg-slate-800/60 ring-1 ring-slate-700/50 px-3 py-2 flex items-center justify-between gap-4 text-[11px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Pinned:</span>
                <button onClick={()=> selectStation(s.id)} className="underline-offset-2 hover:underline text-slate-200">{s.name}</button>
                <span className="text-slate-500">{s.city}, {s.country}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{s.source}</span>
              </div>
              <div className="flex items-center gap-2">
                {stationParam!==s.id && <button onClick={()=> selectStation(s.id)} className="h-7 px-2 inline-flex items-center gap-1 rounded bg-sky-600/70 hover:bg-sky-500/70 text-white text-[11px]" aria-label="Focus pinned station"><MapPin className="h-3 w-3" />Focus</button>}
                <button onClick={unpinStation} className="h-7 px-2 inline-flex items-center gap-1 rounded bg-slate-700/60 hover:bg-slate-600/60 text-[11px]" aria-label="Unpin station"><PinOff className="h-3 w-3" />Unpin</button>
              </div>
            </div>
          </div>
        )})()}
  <div className="flex-1 min-h-0 rounded-xl ring-1 ring-border bg-card/60 p-6 md:p-8 pb-10 flex flex-col overflow-visible" id="trend-chart-card">
          {!series && (!stationParam ? (
            <p className="text-xs text-muted-foreground">Select a station to view data.</p>
          ) : (
            <div className="flex flex-col gap-3 animate-pulse" aria-label="Loading series skeleton">
              <div className="h-4 w-40 rounded bg-slate-700/40" />
              <div className="h-full rounded bg-slate-800/40" />
            </div>
          ))}
          {series && (
            <>
              <div className="flex-1 min-h-0">
                <Suspense fallback={<p className="text-xs text-muted-foreground">{t('trends.loadingChart','Loading chart…')}</p>}>
                  <TrendChart series={filtered || series} />
                </Suspense>
              </div>
              <div className="mt-3 text-[10px] text-slate-500 flex justify-between">
                <span>{t('trends.source','Source mock · Updated just now')}</span>
                <span className="italic">{t('common.demo','(demo)')}</span>
              </div>
              {series.points.length === 0 && (
                <div className="mt-4 text-center text-xs text-slate-500">
                  {t('trends.empty','No data for this range/pollutant. Try another interval.')}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    {/* Station selector panel */}
  <aside ref={asideRef} style={asideMaxH? { maxHeight: asideMaxH } : undefined} className="w-72 shrink-0 flex flex-col gap-3 min-h-0 relative">
        <div className="rounded-lg ring-1 ring-border bg-card/60 p-3 flex flex-col gap-3">
          <input value={q} onChange={e=> setQ(e.target.value)} placeholder={t('trends.searchStation','Search station…')} className="w-full text-xs rounded bg-slate-800/70 px-2 py-1 ring-1 ring-slate-700/50 focus:outline-none focus:ring-sky-600" />
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <select value={filterCountry||''} onChange={e=> setFilterCountry(e.target.value||undefined)} className="bg-slate-800/70 rounded px-2 py-1 ring-1 ring-slate-700/50">
              <option value="">{t('trends.country','Country')}</option>
              <option value="BR">BR</option>
              <option value="US">US</option>
              <option value="CA">CA</option>
            </select>
            <select value={filterSource||''} onChange={e=> setFilterSource(e.target.value||undefined)} className="bg-slate-800/70 rounded px-2 py-1 ring-1 ring-slate-700/50">
              <option value="">{t('trends.sourceFilter','Source')}</option>
              <option value="OpenAQ">OpenAQ</option>
              <option value="AirNow">AirNow</option>
              <option value="Pandora">Pandora</option>
            </select>
            <select value={filterStatus||''} onChange={e=> setFilterStatus(e.target.value||undefined)} className="bg-slate-800/70 rounded px-2 py-1 ring-1 ring-slate-700/50 col-span-2">
              <option value="">{t('trends.status','Status')}</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div className="text-[10px] text-slate-400 space-y-1">
            {favorites.length>0 && (
              <div>
                <p className="uppercase tracking-wide text-[9px] mb-1 text-slate-500">{t('trends.favorites','Favorites')}</p>
                <div className="flex flex-wrap gap-1">
                  {favorites.map(id=> (
                    <button key={id} onClick={()=> selectStation(id)} className={`px-2 py-0.5 rounded ${stationParam===id? 'bg-sky-600 text-white':'bg-slate-700/60 hover:bg-slate-600/70'}`}>{id}</button>
                  ))}
                </div>
              </div>
            )}
            {recent.length>0 && (
              <div>
                <p className="uppercase tracking-wide text-[9px] mb-1 text-slate-500">{t('trends.recent','Recent')}</p>
                <div className="flex flex-wrap gap-1">
                  {recent.map(id=> (
                    <button key={id} onClick={()=> selectStation(id)} className={`px-2 py-0.5 rounded ${stationParam===id? 'bg-sky-600 text-white':'bg-slate-700/60 hover:bg-slate-600/70'}`}>{id}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div ref={listCardRef} className="flex-1 rounded-lg ring-1 ring-border bg-card/60 flex flex-col min-h-0 relative">
          <div ref={listHeaderRef} className="text-[11px] font-medium px-3 py-2 border-b border-border/60 bg-card/80 backdrop-blur sticky top-0 z-10">{t('nav.stations','Stations')}</div>
          <ScrollArea className="text-xs relative px-3 pr-3 pb-6" viewportRef={listRef} onScroll={onScroll}
            style={listViewportMaxH? { maxHeight: listViewportMaxH } : undefined}
          >
            <div style={{height: filteredStations.length * rowHeight}}>
              <div style={{transform:`translateY(${visible.start * rowHeight}px)`}}>
                {visible.items.map(s => (
                  <div key={s.id} style={{height: rowHeight}} className="flex items-stretch divide-x divide-slate-700/40">
                    <div className="flex flex-1">
                      <button
                        onClick={()=> selectStation(s.id)}
                        className={`flex-1 text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-700/40 focus:outline-none focus:bg-slate-700/60 ${stationParam===s.id ? 'bg-sky-600/30 text-sky-200':'text-slate-300'}`}
                        aria-label={`Select station ${s.name} ${s.city} ${s.country} status ${s.status}`}
                      >
                        <span className="truncate">{s.name}</span>
                        <span className="text-[9px] font-mono text-slate-400">{s.country}</span>
                      </button>
                    </div>
                    <button
                      onClick={()=> toggleFavorite(s.id)}
                      className="px-2 flex items-center justify-center" aria-label={favorites.includes(s.id)? 'Remove from favorites':'Add to favorites'}>
                      {favorites.includes(s.id)? <Star className="h-4 w-4 text-yellow-400" /> : <StarOff className="h-4 w-4 text-slate-500 hover:text-slate-300" />}
                    </button>
                    <button
                      onClick={()=> pinStation(s.id)}
                      className="px-2 flex items-center justify-center" aria-label={pinned===s.id? 'Pinned station (click to re-pin)':'Pin station'}>
                      {pinned===s.id? <Pin className="h-4 w-4 text-sky-400" /> : <PinOff className="h-4 w-4 text-slate-500 hover:text-slate-300" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
          {/* Bottom fade indicator to show more content is scrollable */}
          <div className="pointer-events-none absolute bottom-[26px] left-0 right-0 h-6 bg-gradient-to-t from-card/90 to-transparent" />
          <div ref={listFooterRef} className="text-[10px] px-3 py-1 border-t border-border/60 text-slate-500 flex justify-between"><span>{filteredStations.length} {t('trends.results','results')}</span><span>{favorites.length} {t('trends.favShort','fav')}</span></div>
        </div>
      </aside>
    </div>
  )
}

// Small debounce hook
function useDebounce<T>(value:T, ms:number){
  const [v,setV] = useState(value)
  useEffect(()=>{ const h = setTimeout(()=> setV(value), ms); return ()=> clearTimeout(h)}, [value, ms])
  return v
}
