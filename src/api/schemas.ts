import { z } from 'zod'

export const ForecastHourSchema = z.object({
  ts: z.number().int().positive(),
  aqi: z.number().min(0).max(500),
  pollutant: z.string().optional()
})
export const ForecastResponseSchema = z.object({ hours: z.array(ForecastHourSchema).min(1) })

export const AlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  severity: z.enum(['info','moderate','unhealthy'])
})

export const StationSchema = z.object({
  id: z.string(),
  name: z.string(),
  // basic geolocation
  location: z.object({ lat: z.number(), lon: z.number() }),
  latestAQI: z.number().min(0).max(500),
  // additional metadata for filtering / display
  dominantPollutant: z.string().optional(),
  source: z.enum(['OpenAQ','AirNow','Pandora']).optional(),
  status: z.enum(['online','offline']).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  lastUpdated: z.number().int().positive().optional()
})

export const HistoricalPointSchema = z.object({ ts: z.number(), value: z.number(), pollutant: z.string() })
export const HistoricalSeriesSchema = z.object({ stationId: z.string(), pollutant: z.string(), points: z.array(HistoricalPointSchema) })

export type ForecastResponse = z.infer<typeof ForecastResponseSchema>
export type Alert = z.infer<typeof AlertSchema>
export type Station = z.infer<typeof StationSchema>
export type HistoricalSeries = z.infer<typeof HistoricalSeriesSchema>
