export interface ForecastHour { ts: number; aqi: number; pollutant?: string }
export interface ForecastResponse { hours: ForecastHour[] }

export interface Alert { id: string; title: string; message: string; severity: 'info'|'moderate'|'unhealthy' }

export interface Station { id: string; name: string; location: { lat: number; lon: number }; latestAQI: number }
