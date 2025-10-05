import type { ReactNode } from 'react'
import { useCountUp } from '../../hooks/useCountUp'
import { cn } from '../../lib/utils'

interface KpiCardProps {
  label: string
  value: ReactNode
  sub?: string
  intent?: 'good' | 'moderate' | 'warning' | 'unhealthy' | 'neutral'
  delta?: number | null
  trend?: 'up' | 'down' | 'flat'
  unit?: string
}

const intentStyles: Record<NonNullable<KpiCardProps['intent']>, string> = {
  good: 'bg-aqi-good/15 border-aqi-good/40 text-aqi-good',
  moderate: 'bg-aqi-moderate/20 border-aqi-moderate/50 text-yellow-300',
  warning: 'bg-orange-500/15 border-orange-500/40 text-orange-300',
  unhealthy: 'bg-red-600/15 border-red-600/40 text-red-300',
  neutral: 'bg-slate-800/60 border-slate-600/40 text-slate-200'
}

export function KpiCard({ label, value, sub, intent='neutral', delta=null, trend, unit }: KpiCardProps){
  const isNumber = typeof value === 'number'
  const animated = useCountUp(isNumber ? value as number : null)
  const arrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : trend === 'flat' ? '◆' : null
  const deltaStr = delta != null && delta !== 0 ? `${delta>0?'+':''}${delta}${unit? unit:''}` : null
  return (
    <div className={cn('rounded-lg p-4 border backdrop-blur flex flex-col gap-1 min-w-[170px] relative overflow-hidden', intentStyles[intent])}>
      <span className="text-[10px] tracking-wide uppercase font-semibold text-[hsl(var(--text-secondary))]">{label}</span>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-bold leading-tight tabular-nums">{isNumber ? animated ?? 0 : value}{unit && !isNumber ? <span className="text-xs font-medium ml-1 opacity-70">{unit}</span>: null}</div>
        {arrow && deltaStr && (
          <span className={cn('text-xs font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded',
            trend==='up' && 'bg-red-500/15 text-red-300',
            trend==='down' && 'bg-emerald-500/15 text-emerald-300',
            trend==='flat' && 'bg-slate-500/15 text-slate-300'
          )} aria-label={`Trend ${trend} ${deltaStr}`}>
            {arrow} {deltaStr}
          </span>
        )}
      </div>
      {sub && <span className="text-[11px] tracking-wide text-[hsl(var(--text-secondary))]">{sub}</span>}
    </div>
  )}
