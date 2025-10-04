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
      const stations: Station[] = Array.from({length: 9}, (_,i)=> ({
        id: `ST-${i+1}`,
        name: `Station ${i+1}`,
        location: { lat: 25 + Math.random()*20, lon: -110 + Math.random()*20 },
        latestAQI: Math.round(30 + Math.random()*140)
      }))
  const { StationSchema } = await import('./schemas')
  const parsed = stations.map(s => StationSchema.parse(s))
      return mockLatency(parsed)
    },
    staleTime: 120_000,
  })
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
