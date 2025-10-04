import { useAppStore } from '../state/store'
import { useGeolocation } from '../api/geolocation'
import { useState, useEffect } from 'react'

export function SettingsPage(){
  const settings = useAppStore(s => s.settings)
  const update = useAppStore(s => s.updateSettings)
  const setHome = useAppStore(s => s.setHomeLocation)
  const [units, setUnits] = useState(settings.units)
  const [threshold, setThreshold] = useState(settings.alertThreshold)
  const geo = useGeolocation(false)

  useEffect(()=>{ setUnits(settings.units); setThreshold(settings.alertThreshold) }, [settings])

  function save(){
    update({ units, alertThreshold: threshold })
    alert('Saved!')
  }

  function setGeo(){
    if(geo.position){
      setHome(geo.position.lat, geo.position.lon)
    }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">Settings</h1>
      <form className="space-y-4 text-sm" onSubmit={e=> { e.preventDefault(); save() }}>
        <div>
          <label className="block font-medium mb-1">Units</label>
          <select value={units} onChange={e=> setUnits(e.target.value as any)} className="bg-slate-800/60 ring-1 ring-slate-700/50 rounded px-3 py-2 w-full">
            <option value="METRIC">Metric (µg/m³)</option>
            <option value="AQI">US AQI</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Alert Threshold (AQI)</label>
          <input type="number" value={threshold} onChange={e=> setThreshold(+e.target.value)} className="bg-slate-800/60 ring-1 ring-slate-700/50 rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">Home Location</label>
          <div className="flex gap-2 items-center">
            <input readOnly value={settings.homeLocation ? `${settings.homeLocation.lat.toFixed(2)}, ${settings.homeLocation.lon.toFixed(2)}`: ''} placeholder="Not set" className="flex-1 bg-slate-800/60 ring-1 ring-slate-700/50 rounded px-3 py-2" />
            <button type="button" onClick={setGeo} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded">Use Geo</button>
          </div>
        </div>
        <div className="pt-2">
          <button type="submit" className="bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded text-white">Save</button>
        </div>
      </form>
    </div>
  )
}
