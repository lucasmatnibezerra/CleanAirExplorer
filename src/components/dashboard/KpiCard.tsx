import type { ReactNode } from 'react'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: ReactNode
  sub?: string
  intent?: 'good' | 'moderate' | 'warning' | 'unhealthy' | 'neutral'
}

const intentStyles: Record<NonNullable<KpiCardProps['intent']>, string> = {
  good: 'bg-aqi-good/15 border-aqi-good/40 text-aqi-good',
  moderate: 'bg-aqi-moderate/20 border-aqi-moderate/50 text-yellow-300',
  warning: 'bg-orange-500/15 border-orange-500/40 text-orange-300',
  unhealthy: 'bg-red-600/15 border-red-600/40 text-red-300',
  neutral: 'bg-slate-800/60 border-slate-600/40 text-slate-200'
}

export function KpiCard({ label, value, sub, intent='neutral' }: KpiCardProps){
  const isNumber = typeof value === 'number'
  const animated = useCountUp(isNumber ? value as number : null)
  return (
    <div className={cn('rounded-lg p-4 border backdrop-blur flex flex-col gap-1 min-w-[170px]', intentStyles[intent])}>
      <span className="text-[10px] tracking-wide uppercase font-semibold" style={{color:'hsl(var(--text-secondary))'}}>{label}</span>
      <div className="text-2xl md:text-3xl font-semibold leading-tight">
        {isNumber ? animated ?? 0 : value}
      </div>
      {sub && <span className="text-[10px]" style={{color:'hsl(var(--text-secondary))'}}>{sub}</span>}
    </div>
  )}
