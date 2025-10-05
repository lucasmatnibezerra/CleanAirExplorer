import { useAppStore } from '../state/store'
import { useGeolocation } from '../api/geolocation'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function SettingsPage(){
  const { t } = useTranslation()
  const settings = useAppStore(s => s.settings)
  const update = useAppStore(s => s.updateSettings)
  const setHome = useAppStore(s => s.setHomeLocation)
  const [units, setUnits] = useState(settings.units)
  const [threshold, setThreshold] = useState(settings.alertThreshold)
  const geo = useGeolocation(false)

  useEffect(()=>{ setUnits(settings.units); setThreshold(settings.alertThreshold) }, [settings])

  function save(){
    update({ units, alertThreshold: threshold })
    alert(t('settings.saved','Saved!'))
  }

  function setGeo(){
    if(geo.position){
      setHome(geo.position.lat, geo.position.lon)
    }
  }

  return (
    <div className="space-y-4 max-w-xl">
  <h1 className="text-xl font-semibold">{t('settings.title','Settings')}</h1>
      <form className="space-y-4 text-sm" onSubmit={e=> { e.preventDefault(); save() }}>
        <div>
          <label className="block font-medium mb-1">{t('settings.units','Units')}</label>
          <select value={units} onChange={e=> setUnits(e.target.value as any)} className="bg-slate-800/60 ring-1 ring-slate-700/50 rounded px-3 py-2 w-full">
            <option value="METRIC">{t('settings.unitsMetric','Metric (µg/m³)')}</option>
            <option value="AQI">{t('settings.unitsAqi','US AQI')}</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">{t('settings.alertThreshold','Alert Threshold (AQI)')}</label>
          <input type="number" value={threshold} onChange={e=> setThreshold(+e.target.value)} className="bg-slate-800/60 ring-1 ring-slate-700/50 rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">{t('settings.homeLocation','Home Location')}</label>
          <div className="flex gap-2 items-center">
            <input readOnly value={settings.homeLocation ? `${settings.homeLocation.lat.toFixed(2)}, ${settings.homeLocation.lon.toFixed(2)}`: ''} placeholder={t('settings.notSet','Not set')} className="flex-1 bg-slate-800/60 ring-1 ring-slate-700/50 rounded px-3 py-2" />
            <button type="button" onClick={setGeo} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded">{t('settings.useGeo','Use Geo')}</button>
          </div>
        </div>
        <div className="pt-2">
          <button type="submit" className="bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded text-white">{t('settings.save','Save')}</button>
        </div>
      </form>
    </div>
  )
}
