import { useEffect } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import type L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useStations } from '../../api/hooks'
import { useAppStore } from '../../state/store'
import { getOzoneGrid } from '../../data/ozoneLoader'

export function LeafletMap({ onMapLoaded, onMapError: _onMapError }: { onMapLoaded?: ()=>void; onMapError?: (err:any)=>void }){
  const { data: stations } = useStations()
  const showStations = useAppStore(s => s.layers.find(l=>l.key==='stations')?.visible)
  const showHeatmap = useAppStore(s => s.layers.find(l=>l.key==='aqi_heatmap')?.visible)
  const showOzoneForecast = useAppStore(s => s.layers.find(l=>l.key==='ozone_forecast')?.visible)
  const hourIndex = useAppStore(s => s.forecastHourIndex)
  const setSelected = useAppStore(s => s.setSelectedStation)

  // We render a simple MapContainer and manage overlays via DOM canvases
  return (
    <MapContainer
      center={[38, -95]}
      zoom={4}
      className="absolute inset-0"
  // react-leaflet typings differ between versions; use whenCreated via a cast to avoid prop type mismatch
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  whenCreated={(map: L.Map) => { (window as any).leafletMap = map; onMapLoaded?.() }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
      {/* Markers and overlays: we'll draw markers as DOM elements appended to the map container */}
      <MarkersLayer stations={stations} visible={!!showStations} onSelect={setSelected} />
      <HeatmapLayer stations={stations} visible={!!showHeatmap} />
      <OzoneLayer hourIndex={hourIndex} visible={!!showOzoneForecast} />
    </MapContainer>
  )
}

function MarkersLayer({ stations, visible, onSelect }: any){
  useEffect(()=>{
    const map = (window as any).leafletMap
    if(!map) return
    const container = map.getContainer()
    // clear existing
    const prev = container.querySelectorAll('.ca-marker')
    prev.forEach((n:any)=>n.remove())
    if(!visible || !stations) return
    stations.forEach((st:any)=>{
      const el = document.createElement('div')
      el.className = 'ca-marker rounded-full text-[10px] font-semibold px-2 py-1 shadow'
      const color = st.latestAQI<=50? '#22c55e': st.latestAQI<=100? '#eab308': st.latestAQI<=150? '#f97316': st.latestAQI<=200? '#dc2626':'#7e22ce'
      el.style.background = color
      el.style.color = '#fff'
      el.textContent = String(st.latestAQI)
      el.style.position = 'absolute'
      container.appendChild(el)
      function update(){
        const p = (window as any).leafletMap.latLngToContainerPoint([st.location.lat, st.location.lon])
        el.style.left = `${p.x - el.offsetWidth/2}px`
        el.style.top = `${p.y - el.offsetHeight/2}px`
      }
      update()
      map.on('move resize zoom', update)
      el.addEventListener('click', ()=> onSelect(st.id))
    })
    return ()=>{
      map?.off('move resize zoom')
    }
  },[stations, visible])
  return null
}

function HeatmapLayer({ stations, visible }: any){
  useEffect(()=>{
    const map = (window as any).leafletMap
    if(!map) return
    const container = map.getContainer()
    let canvas = container.querySelector('#ca-heatmap') as HTMLCanvasElement | null
    if(!visible){ canvas?.remove(); return }
    if(!canvas){
      canvas = document.createElement('canvas')
      canvas.id = 'ca-heatmap'
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.pointerEvents = 'none'
      canvas.style.mixBlendMode = 'screen'
      container.appendChild(canvas)
    }
    function render(){
      if(!canvas) return
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width; canvas.height = rect.height
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0,0,canvas.width, canvas.height)
      if(!stations) return
      stations.forEach((st:any)=>{
        const p = map.latLngToContainerPoint([st.location.lat, st.location.lon])
        const rad = 20
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad)
        grd.addColorStop(0, 'rgba(255,255,255,0.8)')
        grd.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = grd
        ctx.fillRect(p.x-rad, p.y-rad, rad*2, rad*2)
      })
    }
    render()
    const idle = () => render()
    map.on('move zoom resize', idle)
    return ()=>{ map.off('move zoom resize', idle); canvas?.remove() }
  },[stations, visible])
  return null
}

function OzoneLayer({ hourIndex, visible }: any){
  useEffect(()=>{
    const map = (window as any).leafletMap
    if(!map) return
    const container = map.getContainer()
    let canvas = container.querySelector('#ca-ozone') as HTMLCanvasElement | null
    if(!visible){ canvas?.remove(); return }
    if(!canvas){
      canvas = document.createElement('canvas')
      canvas.id = 'ca-ozone'
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.pointerEvents = 'none'
      canvas.style.mixBlendMode = 'multiply'
      container.appendChild(canvas)
    }
    let cancelled = false
    async function render(){
      if(!canvas || !map) return
      try{
        const { meta, data } = await getOzoneGrid(hourIndex)
        if(cancelled) return
        const rect = container.getBoundingClientRect()
        canvas.width = rect.width; canvas.height = rect.height
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0,0,canvas.width, canvas.height)
        // naive projection using map.latLngToContainerPoint
        for(let y=0;y<canvas.height;y+=6){
          for(let x=0;x<canvas.width;x+=6){
            // approximate world lat/lng from container point: use map.containerPointToLatLng
            const latlng = map.containerPointToLatLng([x, y])
            const lat = latlng.lat, lon = latlng.lng
            if(lat < meta.lat_min || lat > meta.lat_max || lon < meta.lon_min || lon > meta.lon_max) continue
            const latFrac = (lat - meta.lat_min) / (meta.lat_max - meta.lat_min)
            const lonFrac = (lon - meta.lon_min) / (meta.lon_max - meta.lon_min)
            const ry = latFrac * (meta.rows - 1)
            const rx = lonFrac * (meta.cols - 1)
            const x0 = Math.floor(rx), x1 = Math.min(meta.cols-1, x0+1)
            const y0 = Math.floor(ry), y1 = Math.min(meta.rows-1, y0+1)
            const fx = rx - x0, fy = ry - y0
            const idx = (r:number, c:number) => r * meta.cols + c
            const v00 = data[idx(y0,x0)], v01 = data[idx(y0,x1)], v10 = data[idx(y1,x0)], v11 = data[idx(y1,x1)]
            const v0 = v00*(1-fx)+v01*fx
            const v1 = v10*(1-fx)+v11*fx
            const val = v0*(1-fy)+v1*fy
            const normalized = Math.min(1, Math.max(0, val / 120))
            const rcol = Math.round(255 * normalized)
            const gcol = Math.round(40 * (1-normalized))
            const bcol = Math.round(180 * (1-normalized) + 60 * normalized)
            ctx.fillStyle = `rgba(${rcol},${gcol},${bcol},0.35)`
            ctx.fillRect(x, y, 6, 6)
          }
        }
      } catch(err){ /* ignore */ }
    }
    render()
    const idleL = () => render()
    map.on('move zoom resize', idleL)
    return ()=>{ cancelled = true; map.off('move zoom resize', idleL); canvas?.remove() }
  },[hourIndex, visible])
  return null
}

export default LeafletMap
