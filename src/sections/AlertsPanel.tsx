import { useAlerts } from '../api/hooks'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Skeleton } from '../components/ui/Skeleton'
import type { Alert } from '../api/types'

export function AlertsPanel(){
  const { t } = useTranslation()
  const { data, isLoading } = useAlerts()
  const [open, setOpen] = useState(false)
  function severityMeta(sev: Alert['severity']){
    switch(sev){
      case 'info': return { label: t('alerts.info','Info'), icon: 'ℹ', wrap: 'bg-sky-900/30 border-sky-700/40', chip: 'bg-sky-500/20 text-sky-300 border-sky-500/40' }
      case 'moderate': return { label: t('alerts.moderate','Moderate'), icon: '△', wrap: 'bg-amber-900/30 border-amber-700/40', chip: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
      case 'unhealthy': return { label: t('alerts.unhealthy','Unhealthy'), icon: '!', wrap: 'bg-red-900/30 border-red-700/40', chip: 'bg-red-500/20 text-red-300 border-red-500/40' }
    }
  }
  return (
    <section className="rounded-xl ring-1 ring-slate-700/50 p-4 bg-slate-800/60 backdrop-blur">
  <h2 className="font-semibold mb-2 text-rose-300">{t('alerts.title','Health Alerts')}</h2>
      {isLoading && (
        <div className="space-y-2">
          {Array.from({length:2}).map((_,i)=>(<Skeleton key={i} className="h-14" />))}
        </div>
      )}
      <ul className="space-y-2 text-sm">
        {data?.map((a: Alert) => {
          const m = severityMeta(a.severity)
          return (
            <li key={a.id} className={`p-3 rounded border flex flex-col gap-2 ${m.wrap} ${a.severity==='moderate'? 'border-amber-400/60': ''}`}>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 font-medium tracking-wide ${m.chip} ${a.severity==='unhealthy'? 'pulse-severity':''}`}>{m.icon}<span>{m.label}</span></span>
                <p className="font-medium leading-tight flex-1">{a.title}</p>
              </div>
              <p className="text-[11px] text-slate-300/80 leading-snug">{a.message}</p>
              <div>
                <button onClick={()=> setOpen(true)} className="text-[10px] px-2 py-1 rounded bg-slate-700/60 hover:bg-slate-600 focus-visible:outline focus-visible:outline-sky-400">{t('alerts.viewGuidance','View guidance')}</button>
              </div>
            </li>
          )})}
  {data?.length === 0 && <li className="text-xs text-slate-400">{t('alerts.none','No active alerts.')}</li>}
      </ul>
      {open && (
  <div role="dialog" aria-modal="true" aria-label={t('alerts.guidanceAria','Health guidance')} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={()=> setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg border border-slate-600 bg-slate-900/90 p-5 space-y-4">
            <h3 className="text-sm font-semibold">{t('alerts.guidanceTitle','Health Guidance (Demo)')}</h3>
            <ul className="text-[11px] space-y-2 text-slate-300">
              <li><strong>Children:</strong> Limit prolonged outdoor exertion if AQI &gt; 100.</li>
              <li><strong>Older Adults:</strong> Prefer indoor activities when AQI &gt; 150.</li>
              <li><strong>Asthma:</strong> Keep rescue inhaler accessible; avoid heavy exercise.</li>
            </ul>
            <div className="flex justify-end">
              <button onClick={()=> setOpen(false)} className="px-3 py-1.5 rounded bg-sky-600/80 hover:bg-sky-500 text-xs font-medium focus-visible:outline focus-visible:outline-sky-400">{t('actions.close','Close')}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AlertsPanel
