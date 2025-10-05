export function aqiColor(val: number){
  if(val<=50) return '#22c55e'
  if(val<=100) return '#eab308'
  if(val<=150) return '#f97316'
  if(val<=200) return '#dc2626'
  return '#7e22ce'
}

export function aqiCategory(val:number, opts?: { key?: boolean }){
  const key = (():string => {
    if(val<=50) return 'aqi.good'
    if(val<=100) return 'aqi.moderate'
    if(val<=150) return 'aqi.unhealthySG'
    if(val<=200) return 'aqi.unhealthy'
    if(val<=300) return 'aqi.veryUnhealthy'
    return 'aqi.hazardous'
  })()
  if(opts?.key) return key
  return key // callers now expected to pass through t(key) externally
}

export function aqiBadgeClass(val:number){
  if(val<=50) return 'bg-aqi-good text-white'
  if(val<=100) return 'bg-aqi-moderate text-black'
  if(val<=150) return 'bg-aqi-sensitive text-white'
  if(val<=200) return 'bg-aqi-unhealthy text-white'
  if(val<=300) return 'bg-aqi-very text-white'
  return 'bg-aqi-hazardous text-white'
}
