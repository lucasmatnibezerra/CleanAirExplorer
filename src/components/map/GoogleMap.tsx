import { useEffect, useRef, useState } from 'react'
import { useStations } from '../../api/hooks'
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

  return <div ref={mapRef} className="absolute inset-0" aria-label="Google Map" />
}

export default GoogleMap