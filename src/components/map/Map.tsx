import { useEffect, useRef } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useStations } from '../../api/hooks'
import { useAppStore } from '../../state/store'
// We import maplibre dynamically to avoid SSR issues (if later) & heavy initial bundle

export interface LazyMapProps {
  onMapLoaded?: () => void
  onMapError?: (err: unknown) => void
  onMapFallback?: () => void
}

export function LazyMap(props: LazyMapProps){
  return <MapContainer {...props} />
}

function MapContainer({ onMapLoaded, onMapError, onMapFallback }: LazyMapProps){
  const ref = useRef<HTMLDivElement | null>(null)
  const { data: stations } = useStations()
  const showStations = useAppStore(s => s.layers.find(l=>l.key==='stations')?.visible)
  const setSelected = useAppStore(s => s.setSelectedStation)
  useEffect(()=>{
    let map: any;
    let cancelled = false;
    let popup: any;
    (async () => {
      const ml = await import('maplibre-gl')
      if(cancelled) return
      const params = new URLSearchParams(window.location.search)
      const forceOsm = params.get('osm') === '1'
      let styleUrl = 'https://demotiles.maplibre.org/style.json'
      if(forceOsm){
        console.warn('[Map] Forcing OSM raster fallback via ?osm=1')
        onMapFallback?.()
        styleUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      } else {
        // Pre-fetch style to detect failure early & allow fallback
        try {
          console.log('[Map] Fetching style', styleUrl)
          const res = await fetch(styleUrl)
          if(!res.ok) throw new Error('Style HTTP '+res.status)
          await res.json() // validate JSON
          console.log('[Map] Style OK')
        } catch(err){
          console.error('[Map] Style fetch failed, falling back to OSM', err)
          onMapFallback?.()
          styleUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        }
      }

      const style = styleUrl.endsWith('.json') ? styleUrl : {
        version:8,
        sources:{
          'osm-tiles':{
            type:'raster',
            tiles:[styleUrl],
            tileSize:256,
            attribution:'© OpenStreetMap'
          }
        },
        layers:[{ id:'osm-tiles', type:'raster', source:'osm-tiles' }]
      } as any

      console.log('[Map] Initializing map with style', styleUrl)
      map = new ml.Map({
        container: ref.current!,
        style,
        center: [-95, 38],
        zoom: 3.5,
        attributionControl: false,
      })
      map.addControl(new ml.AttributionControl({ compact: true }))

      function addStations(){
        if(!stations || !showStations) return
        const features = stations.map(st => ({
          type:'Feature',
          geometry:{ type:'Point', coordinates:[st.location.lon, st.location.lat] },
          properties:{ id: st.id, name: st.name, aqi: st.latestAQI }
        }))
        const sourceId = 'stations-src'
        const layerId = 'stations-layer'
        if(map.getLayer(layerId)){
          (map.getSource(sourceId) as any).setData({ type:'FeatureCollection', features })
        } else {
          map.addSource(sourceId, { type:'geojson', data:{ type:'FeatureCollection', features } })
          map.addLayer({
            id: layerId,
            type:'circle',
            source: sourceId,
            paint:{
              'circle-radius': 5,
              'circle-color': [
                'interpolate', ['linear'], ['get','aqi'],
                0, '#22c55e',
                100, '#eab308',
                150, '#f97316',
                200, '#dc2626',
                300, '#7e22ce'
              ],
              'circle-stroke-width': 1,
              'circle-stroke-color': '#fff'
            }
          })
          map.on('click', layerId, (e: any) => {
            const f = e.features?.[0]
            if(f){
              setSelected(f.properties.id)
            }
          })
          popup = new ml.Popup({ closeButton:false, closeOnClick:false })
          map.on('mousemove', layerId, (e:any) => {
            const f = e.features?.[0];
            if(!f) return
            const { aqi, name } = f.properties
            popup.setLngLat(e.lngLat).setHTML(`<div style="font:12px system-ui"><strong>${name}</strong><br/>AQI: <b>${aqi}</b></div>`).addTo(map)
          })
          map.on('mouseleave', layerId, ()=> { popup?.remove() })
          map.on('mouseenter', layerId, () => map.getCanvas().style.cursor='pointer')
          map.on('mouseleave', layerId, () => map.getCanvas().style.cursor='')
        }
      }
      map.on('load', () => {
        console.log('[Map] load event')
        addStations()
        onMapLoaded?.()
      })
      map.on('styledata', () => {
        console.log('[Map] styledata event')
        addStations()
      })
      map.on('error', (e:any) => {
        if(e?.error){
          console.error('[Map] error event', e.error)
          onMapError?.(e.error)
        }
      })
    })()
    return () => { cancelled = true; popup?.remove(); if(map) map.remove() }
  },[stations, showStations, setSelected])
  return <div ref={ref} className="absolute inset-0" />
}
