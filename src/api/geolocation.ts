import { useEffect, useState } from 'react'

export interface GeoPosition { lat: number; lon: number; accuracy?: number }

export function useGeolocation(enabled: boolean){
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(()=>{
    if(!enabled || !('geolocation' in navigator)) return
    const id = navigator.geolocation.watchPosition(
      p => setPosition({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy }),
      err => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 20_000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [enabled])
  return { position, error }
}
