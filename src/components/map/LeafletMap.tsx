import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
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
  // Auto-enable heatmap if both overlays ended up false due to persisted state
  useEffect(()=>{
    if(!showHeatmap && !showOzoneForecast){
      const toggle = useAppStore.getState().toggleLayer
      toggle('aqi_heatmap')
    }
  // only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  // We render a simple MapContainer and manage overlays via DOM canvases
  return (
    <MapContainer
      center={[38, -95]}
      zoom={4}
      className="absolute inset-0 z-0"
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
  const map = useMap()
  useEffect(()=>{
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
      el.style.background = color; el.style.color = '#fff'; el.style.position = 'absolute'; el.style.zIndex = '5'
      el.textContent = String(st.latestAQI)
      container.appendChild(el)
      function update(){
        if(typeof (map as any).latLngToContainerPoint !== 'function') return
        const p = (map as any).latLngToContainerPoint([st.location.lat, st.location.lon])
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
  },[stations, visible, map])
  return null
}

function HeatmapLayer({ stations, visible }: any){
  const map = useMap()
  const opacity = useAppStore(s => s.heatmapOpacity)
  const blendMode = useAppStore(s => s.heatmapBlendMode)
  useEffect(()=>{
    if(!map) return
  // Use the map container itself so the canvas pans automatically with it
  const container: HTMLElement = map.getContainer()
    let canvas = container.querySelector('#ca-heatmap') as HTMLCanvasElement | null
    if(!visible){ canvas?.remove(); return }
    if(!canvas){
      canvas = document.createElement('canvas')
      canvas.id = 'ca-heatmap'
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.pointerEvents = 'none'
  // place behind header/legend; main header uses z-10; we keep heatmap low
  canvas.style.zIndex = '1'
      canvas.style.mixBlendMode = blendMode as any
      container.appendChild(canvas)
    } else {
      canvas.style.mixBlendMode = blendMode as any
    }
    function render(){
      if(!canvas) return
      const size = map.getSize()
      canvas.width = size.x; canvas.height = size.y
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0,0,canvas.width, canvas.height)
      if(!stations || stations.length===0) return
      const zoom = map.getZoom?.() || 4
      // radius cresce com zoom para preencher suavemente sem blocos.
      const baseRadius = zoom <=4 ? 55 : zoom <=6 ? 40 : zoom <=8 ? 30 : 22
      // Coletar valores para normalização
      const pts = stations.map((st:any)=>{
        const p = map.latLngToContainerPoint([st.location.lat, st.location.lon])
        return { x: p.x, y: p.y, v: st.latestAQI }
      })
      let vMin = Infinity, vMax = -Infinity
      for(const p of pts){ if(p.v < vMin) vMin = p.v; if(p.v > vMax) vMax = p.v }
      const span = (vMax - vMin) || 1
      // Desenhar gradiente radial por ponto
      for(const p of pts){
        const norm = (p.v - vMin)/span
        if(norm < 0.05) continue
        const r = baseRadius
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        // centro forte, cauda suave
        const color = heatColor(norm)
        // extrair rgba sem alpha para criar stops
        const m = /rgba\((\d+),(\d+),(\d+),(.*)\)/.exec(color)
        let rr=255,gg=0,bb=0,aa=0.6
        if(m){ rr=+m[1]; gg=+m[2]; bb=+m[3]; aa=parseFloat(m[4]) }
        grd.addColorStop(0, `rgba(${rr},${gg},${bb},${aa})`)
        grd.addColorStop(0.55, `rgba(${rr},${gg},${bb},${aa*0.7})`)
        grd.addColorStop(1, `rgba(${rr},${gg},${bb},0)`)
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI*2)
        ctx.fill()
      }
      // Opcional: leve suavização global (composite)
      // Poderíamos aplicar um blur se usarmos OffscreenCanvas + filter; por enquanto mantemos simples.
    }
    function heatColor(t:number){
      const stops = [
        { t:0, r:34, g:197, b:94 },
        { t:0.18, r:234, g:179, b:8 },
        { t:0.38, r:249, g:115, b:22 },
        { t:0.60, r:220, g:38, b:38 },
        { t:1, r:126, g:34, b:206 }
      ]
      for(let i=0;i<stops.length-1;i++){
        const a = stops[i], b = stops[i+1]
        if(t >= a.t && t <= b.t){
          const f = (t - a.t)/(b.t - a.t)
          const r = Math.round(a.r + (b.r - a.r)*f)
          const g = Math.round(a.g + (b.g - a.g)*f)
          const bcol = Math.round(a.b + (b.b - a.b)*f)
          // fade-in suave próximo ao cutoff
          const alpha = opacity * Math.min(1, Math.max(0.15, t))
          return `rgba(${r},${g},${bcol},${alpha})`
        }
      }
      const last = stops[stops.length-1]
      return `rgba(${last.r},${last.g},${last.b},${opacity*0.6})`
    }
    let frame: number | null = null
    const schedule = () => { if(frame) cancelAnimationFrame(frame); frame = requestAnimationFrame(()=> { render() }) }
    render()
    // Avoid rendering during the middle of a zoom animation to prevent flicker / size glitches.
    const onZoomStart = () => { /* noop: wait for zoomend */ }
    const onZoomEnd = () => schedule()
  // During move we redraw every frame for smoother tracking
  map.on('move', schedule)
    map.on('resize', schedule)
    map.on('zoomend', onZoomEnd)
    map.on('zoomstart', onZoomStart)
    return ()=>{ if(frame) cancelAnimationFrame(frame); map.off('move', schedule); map.off('resize', schedule); map.off('zoomend', onZoomEnd); map.off('zoomstart', onZoomStart); canvas?.remove() }
  },[stations, visible, map, opacity, blendMode])
  return null
}

function OzoneLayer({ hourIndex, visible }: any){
  const map = useMap()
  useEffect(()=>{
    if(!map) return
  const container: HTMLElement = map.getContainer()
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
  canvas.style.zIndex = '1'
      container.appendChild(canvas)
    }
    let cancelled = false
    async function render(){
      if(!canvas || !map) return
      try{
        const { meta, data } = await getOzoneGrid(hourIndex)
        if(cancelled) return
        const size = map.getSize()
        canvas.width = size.x; canvas.height = size.y
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0,0,canvas.width, canvas.height)
        let vMin = Infinity, vMax = -Infinity
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
            vMin = Math.min(vMin, val)
            vMax = Math.max(vMax, val)
            const normalized = Math.min(1, Math.max(0, val / 120))
            const rcol = Math.round(255 * normalized)
            const gcol = Math.round(40 * (1-normalized))
            const bcol = Math.round(180 * (1-normalized) + 60 * normalized)
            ctx.fillStyle = `rgba(${rcol},${gcol},${bcol},0.35)`
            ctx.fillRect(x, y, 6, 6)
          }
        }
        if(isFinite(vMin) && isFinite(vMax)){
          canvas.dataset.ozMin = vMin.toFixed(1)
          canvas.dataset.ozMax = vMax.toFixed(1)
          window.dispatchEvent(new Event('ozoneRangeUpdated'))
          if(!(window as any).__ozoneRangeReady){
            (window as any).__ozoneRangeReady = Promise.resolve()
          }
        }
      } catch(err){ /* ignore */ }
    }
    let frame: number | null = null
    const schedule = () => { if(frame) cancelAnimationFrame(frame); frame = requestAnimationFrame(()=> { render() }) }
    render()
    const onZoomEnd = () => schedule()
    map.on('move', schedule)
    map.on('resize', schedule)
    map.on('zoomend', onZoomEnd)
    return ()=>{ cancelled = true; if(frame) cancelAnimationFrame(frame); map.off('move', schedule); map.off('resize', schedule); map.off('zoomend', onZoomEnd); canvas?.remove() }
  },[hourIndex, visible, map])
  return null
}

export default LeafletMap
