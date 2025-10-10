import { useQuery } from '@tanstack/react-query'
import type { ForecastResponse, Alert, Station, HistoricalSeries } from './schemas'

function mockLatency<T>(data:T, ms=300){
  return new Promise<T>(res => setTimeout(()=> res(data), ms))
}

export function useForecast(){
  return useQuery<ForecastResponse>({
    queryKey:['forecast'],
    queryFn: async () => {
      const now = Date.now()
      const pollutants = ['O₃','NO₂','PM₂.₅','PM₁₀']
      const hours = Array.from({length: 24}, (_,i) => ({
        ts: now + i*3600_000,
        aqi: Math.round(40 + Math.random()*120),
        pollutant: pollutants[i % pollutants.length]
      }))
  const { ForecastResponseSchema } = await import('./schemas')
  const parsed = ForecastResponseSchema.parse({ hours })
      return mockLatency(parsed)
    },
    staleTime: 60_000,
  })
}

export function useAlerts(){
  return useQuery<Alert[]>({
    queryKey:['alerts'],
    queryFn: async () => {
      const alerts: Alert[] = Math.random() > 0.5 ? [
        { id:'1', title:'Elevated O₃ Afternoon', message:'Ozone may reach unhealthy for sensitive groups between 2-5pm.', severity:'moderate' }
      ] : []
  const { AlertSchema } = await import('./schemas')
  const parsed = alerts.map(a => AlertSchema.parse(a))
      return mockLatency(parsed)
    },
    refetchInterval: 5*60_000,
  })
}

export function useStations(){
  return useQuery<Station[]>({
    queryKey:['stations'],
    queryFn: async () => {
      const sources = ['OpenAQ','AirNow','Pandora'] as const
      const pollutants = ['PM2.5','PM10','O3','NO2']
      const cities = ['São Paulo','Belém','Austin','San Diego','Portland','Chicago','Miami','Seattle']
      const stations: Station[] = Array.from({length: 220}, (_,i)=> ({
        id: `ST-${i+1}`,
        name: `Station ${i+1}`,
        // Wider bounding box (CONUS-ish)
        location: { lat: 24 + Math.random()*25, lon: -125 + Math.random()*59 },
        latestAQI: Math.round(25 + Math.random()*160),
        dominantPollutant: pollutants[i % pollutants.length],
        source: sources[i % sources.length],
        status: Math.random() > 0.07 ? 'online' : 'offline',
        city: cities[i % cities.length],
        country: 'BR',
        lastUpdated: Date.now() - Math.round(Math.random()*1000*60*60*24)
      }))
  const { StationSchema } = await import('./schemas')
  const parsed = stations.map(s => StationSchema.parse(s))
      return mockLatency(parsed)
    },
    staleTime: 120_000,
  })
}

// small util: haversine distance in km between two coords
export function haversineKm(a:{lat:number,lon:number}, b:{lat:number,lon:number}){
  const toRad = (v:number)=> v * Math.PI / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2
  return 2*R*Math.asin(Math.sqrt(h))
}

export function useHistoricalSeries(stationId: string | null, pollutant: string){
  return useQuery<HistoricalSeries | null>({
    queryKey:['historical', stationId, pollutant],
    enabled: !!stationId,
    queryFn: async () => {
      if(!stationId) return null
      const now = Date.now()
      const points = Array.from({length: 48}, (_,i)=> ({
        ts: now - (48 - i)*3600_000,
        value: +(20 + Math.random()*40).toFixed(1),
        pollutant
      }))
  const { HistoricalSeriesSchema } = await import('./schemas')
  const parsed = HistoricalSeriesSchema.parse({ stationId, pollutant, points })
      return mockLatency(parsed)
    },
  })
}
