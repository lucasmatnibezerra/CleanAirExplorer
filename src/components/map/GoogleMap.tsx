import { useEffect, useRef, useState } from 'react'
import { useStations } from '../../api/hooks'
import { getOzoneGrid } from '../../data/ozoneLoader'
import { useAppStore } from '../../state/store'

declare global {
  interface Window { initGMap?: () => void }
}

export interface GoogleMapProps {
  onMapLoaded?: () => void
  onMapError?: (err: unknown) => void
}

// TODO(feature-flag): optionally allow switching back to MapLibre via an env flag (e.g. VITE_MAP_PROVIDER)
export function GoogleMap({ onMapLoaded, onMapError }: GoogleMapProps){
  const mapRef = useRef<HTMLDivElement|null>(null)
  const mapObj = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const clusterRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const [zoom, setZoom] = useState<number>(4)
  const { data: stations } = useStations()
  const showStations = useAppStore(s => s.layers.find(l=>l.key==='stations')?.visible)
  const showHeatmap = useAppStore(s => s.layers.find(l=>l.key==='aqi_heatmap')?.visible)
  const showOzoneForecast = useAppStore(s => s.layers.find(l=>l.key==='ozone_forecast')?.visible)
  const hourIndex = useAppStore(s => s.forecastHourIndex)
  const setSelected = useAppStore(s => s.setSelectedStation)

  // Inject Google Maps script lazily (idempotent)
  useEffect(()=> {
    if(typeof window === 'undefined') return
    if((window as any).google?.maps){
      // script already loaded; initialize if needed
      if(!mapObj.current && mapRef.current){
        mapObj.current = new google.maps.Map(mapRef.current, {
          center: { lat: 38, lng: -95 }, // continental US centroid approximation
          zoom: 4,
          mapId: 'clean_air_dark'
        })
        mapObj.current.addListener('zoom_changed', () => {
          const z = mapObj.current?.getZoom() || 4
          setZoom(z)
        })
        onMapLoaded?.()
      }
      return
    }
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY
    if(!apiKey){
      console.warn('[GoogleMap] Missing VITE_GOOGLE_MAPS_KEY env; map will attempt unauthenticated load (may fail).')
    }
    const scriptId = 'google-maps-script'
    if(document.getElementById(scriptId)) return
    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey || ''}&callback=initGMap&libraries=marker`
    script.async = true
    script.onerror = (e) => onMapError?.(e)
    window.initGMap = () => {
      try {
        if(!mapRef.current) return
        mapObj.current = new google.maps.Map(mapRef.current, {
          center: { lat: 38, lng: -95 },
          zoom: 4,
          mapId: 'clean_air_dark'
        })
        mapObj.current.addListener('zoom_changed', () => {
          const z = mapObj.current?.getZoom() || 4
            setZoom(z)
        })
        onMapLoaded?.()
      } catch(err){
        onMapError?.(err)
      }
    }
    document.head.appendChild(script)
    return () => {
      // We intentionally do NOT remove the script to allow fast remounts
      delete window.initGMap
    }
  },[onMapLoaded, onMapError])

  // Render / update station markers OR clustered markers based on zoom
  useEffect(()=> {
    if(!mapObj.current){ return }

    // Clear previous markers if stations hidden or list changes drastically
    markersRef.current.forEach(m => { (m as any).map = null })
    markersRef.current = []
    clusterRef.current.forEach(m => { (m as any).map = null })
    clusterRef.current = []

    if(!stations || !showStations) return
    const useClusters = zoom < 6 // threshold
    if(useClusters){
      // Simple grid cluster (1° buckets) – low fidelity but avoids dependency
      const bucket: Record<string, { count:number; aqiSum:number; lat:number; lon:number }> = {}
      for(const st of stations){
        const key = `${Math.round(st.location.lat)}:${Math.round(st.location.lon)}`
        if(!bucket[key]) bucket[key] = { count:0, aqiSum:0, lat: st.location.lat, lon: st.location.lon }
        bucket[key].count++
        bucket[key].aqiSum += st.latestAQI
      }
      Object.values(bucket).forEach(c => {
        const avg = Math.round(c.aqiSum / c.count)
        const div = document.createElement('div')
        div.className = 'rounded-full text-[11px] font-bold px-2 py-1 shadow ring-2 ring-white/40'
        const color = avg<=50? '#22c55e': avg<=100? '#eab308': avg<=150? '#f97316': avg<=200? '#dc2626':'#7e22ce'
        div.style.background = color
        div.style.color = '#fff'
        div.textContent = `${avg}` + (c.count>1? ` (${c.count})`: '')
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapObj.current!,
          position: { lat: c.lat, lng: c.lon },
          content: div,
          title: `Cluster ${c.count}`
        })
        clusterRef.current.push(marker)
      })
      return
    }
    // Individual markers
    for(const st of stations){
      const div = document.createElement('div')
      div.className = 'rounded-full text-[10px] font-semibold px-2 py-1 shadow ring-1 ring-white/40'
      const color = st.latestAQI<=50? '#22c55e': st.latestAQI<=100? '#eab308': st.latestAQI<=150? '#f97316': st.latestAQI<=200? '#dc2626':'#7e22ce'
      div.style.background = color
      div.style.color = '#fff'
      div.textContent = String(st.latestAQI)
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapObj.current!,
        position: { lat: st.location.lat, lng: st.location.lon },
        content: div,
        title: st.name
      })
      div.addEventListener('click', ()=> setSelected(st.id))
      marker.addListener('click', () => setSelected(st.id))
      markersRef.current.push(marker)
    }
  },[stations, showStations, setSelected, zoom])

  // Simple heatmap via canvas sampling inverse-distance weighting of station AQI
  useEffect(()=> {
    if(!mapObj.current) return
    const existing = document.getElementById('aqi-heatmap-layer') as HTMLCanvasElement | null
    if(!showHeatmap){ existing?.remove(); return }
    if(!stations || stations.length===0) return
    let canvas = existing
    if(!canvas){
      canvas = document.createElement('canvas')
      canvas.id = 'aqi-heatmap-layer'
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.pointerEvents = 'none'
      canvas.style.mixBlendMode = 'screen'
      mapRef.current?.appendChild(canvas)
    }
    function render(){
      if(!canvas || !mapObj.current) return
      const rect = mapRef.current!.getBoundingClientRect()
      canvas.width = rect.width; canvas.height = rect.height
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0,0,canvas.width, canvas.height)
      const proj = (lat:number, lng:number) => {
        const pt = new google.maps.LatLng(lat, lng)
        const scale = Math.pow(2, mapObj.current!.getZoom() || 4)
        const projSys = (mapObj.current as any).getProjection?.()
        if(!projSys){ return { x:-9999, y:-9999 } }
        const world = projSys.fromLatLngToPoint(pt)
        const center = projSys.fromLatLngToPoint(mapObj.current!.getCenter()!)
        const x = (world.x - center.x) * scale * 256 + canvas.width/2
        const y = (world.y - center.y) * scale * 256 + canvas.height/2
        return { x, y }
      }
      // Sample grid every ~16px
      const step = 24
      for(let y=0; y<canvas.height; y+=step){
        for(let x=0; x<canvas.width; x+=step){
          // Estimate lat/lng for pixel by inverse of proj (approx using center offsets) – simplified radial weighting
          // Instead we just compute distance in screen space to station projections (cheap & approximate)
          let wSum = 0, vSum = 0
          stations?.forEach(st => {
            const p = proj(st.location.lat, st.location.lon)
            const dx = p.x - x; const dy = p.y - y
            const d2 = dx*dx + dy*dy
            const w = 1 / (1 + d2 * 0.002) // decay factor
            wSum += w
            vSum += w * st.latestAQI
          })
          const aqi = vSum / Math.max(1, wSum)
          const color = aqi<=50? [34,197,94]: aqi<=100? [234,179,8]: aqi<=150? [249,115,22]: aqi<=200? [220,38,38]: [126,34,206]
          ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.25)`
          ctx.fillRect(x - step/2, y - step/2, step, step)
        }
      }
    }
    render()
    const listener = google.maps.event.addListener(mapObj.current, 'idle', () => render())
    return () => { google.maps.event.removeListener(listener) }
  },[showHeatmap, stations])

  // Ozone forecast grid rendering (bilinear-sampled to pixels)
  useEffect(()=> {
    if(!mapObj.current) return
    const existing = document.getElementById('ozone-forecast-layer') as HTMLCanvasElement | null
    if(!showOzoneForecast){ existing?.remove(); return }
    let canvas = existing
    if(!canvas){
      canvas = document.createElement('canvas')
      canvas.id = 'ozone-forecast-layer'
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.pointerEvents = 'none'
      canvas.style.mixBlendMode = 'multiply'
      mapRef.current?.appendChild(canvas)
    }
    let cancelled = false
    async function render(){
      if(!canvas || !mapObj.current) return
      try {
        const { meta, data } = await getOzoneGrid(hourIndex)
        if(cancelled) return
        const rect = mapRef.current!.getBoundingClientRect()
        canvas.width = rect.width; canvas.height = rect.height
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0,0,canvas.width, canvas.height)
        const projSys = (mapObj.current as any).getProjection?.()
        if(!projSys) return
        const scale = Math.pow(2, mapObj.current.getZoom() || 4)
        const center = projSys.fromLatLngToPoint(mapObj.current.getCenter()!)
        // Iterate pixels in a coarser grid for performance
        const step = 8
        for(let py=0; py<canvas.height; py+=step){
          for(let px=0; px<canvas.width; px+=step){
            // Convert screen pixel to world point
            const worldX = center.x + (px - canvas.width/2)/(scale*256)
            const worldY = center.y + (py - canvas.height/2)/(scale*256)
            const latLng = projSys.fromPointToLatLng({x:worldX, y:worldY})
            const lat = latLng.lat(); const lon = latLng.lng()
            if(lat < meta.lat_min || lat > meta.lat_max || lon < meta.lon_min || lon > meta.lon_max) continue
            const latFrac = (lat - meta.lat_min) / (meta.lat_max - meta.lat_min)
            const lonFrac = (lon - meta.lon_min) / (meta.lon_max - meta.lon_min)
            const y = latFrac * (meta.rows - 1)
            const x = lonFrac * (meta.cols - 1)
            const y0 = Math.floor(y), y1 = Math.min(meta.rows -1, y0+1)
            const x0 = Math.floor(x), x1 = Math.min(meta.cols -1, x0+1)
            const fy = y - y0, fx = x - x0
            const idx = (row:number, col:number) => row * meta.cols + col
            const v00 = data[idx(y0,x0)], v01 = data[idx(y0,x1)], v10 = data[idx(y1,x0)], v11 = data[idx(y1,x1)]
            const v0 = v00*(1-fx)+v01*fx
            const v1 = v10*(1-fx)+v11*fx
            const val = v0*(1-fy)+v1*fy // ppb
            // Color scale (simple blue -> magenta -> red)
            const normalized = Math.min(1, Math.max(0, val / 120))
            const r = Math.round(255 * normalized)
            const g = Math.round(40 * (1-normalized))
            const b = Math.round(180 * (1-normalized) + 60 * normalized)
            ctx.fillStyle = `rgba(${r},${g},${b},0.35)`
            ctx.fillRect(px, py, step, step)
          }
        }
      } catch(err){
        // Silently ignore rendering errors for now
      }
    }
    render()
    const idleL = google.maps.event.addListener(mapObj.current, 'idle', () => render())
    return () => { cancelled = true; google.maps.event.removeListener(idleL) }
  },[showOzoneForecast, hourIndex])

  return <div ref={mapRef} className="absolute inset-0" aria-label="Google Map" />
}

export default GoogleMap