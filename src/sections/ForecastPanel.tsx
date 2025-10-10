import { useTranslation } from 'react-i18next'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForecast } from '../api/hooks'
import { useAppStore } from '../state/store'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { aqiBadgeClass, aqiCategory, aqiColor } from '../lib/aqi'

export function ForecastPanel({ compact = false }: { compact?: boolean }){
  const { t } = useTranslation()
  const { data, isLoading } = useForecast()
  const [scrollIndex, setScrollIndex] = useState(0)
  const hourIndex = useAppStore(s => s.forecastHourIndex)
  const setHourIndex = useAppStore(s => s.setForecastHourIndex)

  const items = useMemo(() => {
    const hours = data?.hours ?? []
    return hours.map((h: { ts: number; aqi: number; pollutant?: string }, i: number) => {
      const prev = i > 0 ? hours[i - 1] : null
      const delta = prev ? h.aqi - prev.aqi : 0
      return {
        raw: h,
        ts: h.ts,
        hour: new Date(h.ts).getHours(),
        aqi: h.aqi,
        pollutant: h.pollutant as string | undefined,
        delta,
        category: t(aqiCategory(h.aqi, { key: true }) as string),
      }
    })
  }, [data?.hours, t])

  const slice = compact ? items.slice(scrollIndex, scrollIndex + 12) : items
  const current = items[hourIndex]
  const currentDelta = current?.delta ?? 0

  const [hoverTs, setHoverTs] = useState<number | null>(null)
  const hoverData = hoverTs ? items.find((h) => h.ts === hoverTs) : null

  const listRef = useRef<HTMLDivElement | null>(null)
  const announceRef = useRef<HTMLDivElement | null>(null)

  const focusHour = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= items.length) return
      setHourIndex(idx)
    },
    [items.length, setHourIndex]
  )

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (!items.length) return
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          focusHour(hourIndex + 1)
          break
        case 'ArrowLeft':
          e.preventDefault()
          focusHour(hourIndex - 1)
          break
        case 'Home':
          e.preventDefault()
          focusHour(0)
          break
        case 'End':
          e.preventDefault()
          focusHour(items.length - 1)
          break
        case 'PageUp':
          e.preventDefault()
          focusHour(Math.max(0, hourIndex - 6))
          break
        case 'PageDown':
          e.preventDefault()
          focusHour(Math.min(items.length - 1, hourIndex + 6))
          break
      }
    },
    [focusHour, hourIndex, items.length]
  )

  useEffect(() => {
    if (current && announceRef.current) {
      announceRef.current.textContent = `${current.hour}:00 AQI ${current.aqi} ${current.category}${currentDelta !== 0 ? (currentDelta > 0 ? ' rising ' + currentDelta : ' falling ' + Math.abs(currentDelta)) : ''}`
    }
  }, [current, currentDelta])

  // Sparkline path and metrics (shared with blue marker)
  const spark = useMemo(() => {
    if (items.length === 0)
      return null as null | { path: string; min: number; span: number; w: number; h: number }
    const values = items.map((i) => i.aqi)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = Math.max(1, max - min)
    const w = 100
    const h = 24
    const path = values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w
        const y = h - ((v - min) / span) * h
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
    return { path, min, span, w, h }
  }, [items])

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3 gap-4">
        <div>
          <h2 className="font-semibold text-sky-300 leading-snug">{t('forecast.title')}</h2>
          <p className="text-[10px] text-muted-foreground">{hourIndex + 1} / {items.length}</p>
          {spark && (
            <svg viewBox={`0 0 ${spark.w} ${spark.h}`} className="mt-1 w-24 h-6 overflow-visible">
              <path d={spark.path} fill="none" stroke="#38bdf8" strokeWidth={1} className="opacity-40" />
              {current && items.length > 1 && (
                <circle
                  cx={(hourIndex / (items.length - 1)) * spark.w}
                  cy={spark.h - ((current.aqi - spark.min) / spark.span) * spark.h}
                  r="2.5"
                  className="fill-sky-300"
                />
              )}
            </svg>
          )}
        </div>
        {current && (
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={aqiBadgeClass(current.aqi)}>{current.category}</Badge>
            <Badge
              variant="outline"
              className={`flex gap-1 items-center ${currentDelta === 0 ? 'border-slate-600 text-slate-300' : 'border-sky-600 text-sky-300'}`}
              aria-label="trend"
              title={currentDelta === 0 ? 'Stable' : currentDelta > 0 ? 'Rising' : 'Falling'}
            >
              <span>{currentDelta === 0 ? 'Stable' : `${currentDelta > 0 ? '+' : ''}${currentDelta}`}</span>
            </Badge>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: compact ? 6 : 12 }).map((_, i) => (
            <div key={i} className="min-w-20 flex-shrink-0 flex flex-col items-center gap-2">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className={compact ? 'space-y-2' : ''}>
          {compact && (
            <div className="flex justify-between items-center text-[10px] text-muted-foreground gap-2">
              <Button variant="ghost" size="icon" disabled={scrollIndex === 0} onClick={() => setScrollIndex((i) => Math.max(0, i - 4))} aria-label={t('actions.prev', 'Previous')} className="h-6 w-6 disabled:opacity-30">◀</Button>
              <span>{slice.length} / {items.length} {t('forecast.hours', 'hours')}</span>
              <Button variant="ghost" size="icon" disabled={scrollIndex + 12 >= items.length} onClick={() => setScrollIndex((i) => Math.min(items.length - 12, i + 4))} aria-label={t('actions.next', 'Next')} className="h-6 w-6 disabled:opacity-30">▶</Button>
            </div>
          )}

          <div
            ref={listRef}
            className="flex gap-4 overflow-x-auto text-xs relative outline-none py-1 pr-1"
            role="listbox"
            aria-label="Hourly AQI forecast"
            tabIndex={0}
            onKeyDown={onKey}
          >
            {slice.map((h) => {
              const globalIndex = items.findIndex((x) => x.ts === h.ts)
              const active = globalIndex === hourIndex
              const catColor = aqiColor(h.aqi)
              const delta = h.delta
              const deltaSym = delta === 0 ? '' : delta > 0 ? '↑' : '↓'
              return (
                <button
                  key={h.ts}
                  type="button"
                  role="option"
                  aria-selected={active}
                  aria-pressed={active}
                  aria-label={`${h.hour}:00 AQI ${h.aqi} ${h.category}${delta ? (delta > 0 ? ' rising ' + delta : ' falling ' + Math.abs(delta)) : ''}`}
                  onClick={() => focusHour(globalIndex)}
                  onMouseEnter={() => setHoverTs(h.ts)}
                  onMouseLeave={() => setHoverTs((cur) => (cur === h.ts ? null : cur))}
                  className={`relative cursor-pointer min-w-24 flex-shrink-0 flex flex-col items-center rounded px-3 py-3 transition-colors focus-visible:outline focus-visible:outline-sky-500 ${active ? 'bg-slate-900/70' : 'bg-slate-900/40 hover:bg-slate-800/60'} ${!active ? 'opacity-85' : ''}`}
                  style={active ? { boxShadow: `0 0 0 1px ${catColor}66, 0 0 0 4px rgba(56,189,248,0.08)` } : undefined}
                >
                  <span>{h.hour}:00</span>
                  <span className="text-lg font-semibold tracking-tight" style={{ color: catColor }}>{h.aqi}</span>
                  {active && delta !== 0 && (
                    <span className={`text-[10px] ${delta > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>{deltaSym} {Math.abs(delta)}</span>
                  )}
                </button>
              )
            })}

            {hoverData && (
              <div
                className="absolute -top-2 translate-y-[-100%] pointer-events-none left-0"
                style={{ transform: `translate(${(items.findIndex((h) => h.ts === hoverData.ts) - (compact ? scrollIndex : 0)) * 96}px, -8px)` }}
              >
                <div className="px-2 py-1 rounded bg-slate-900/95 border border-slate-600 text-[10px] shadow whitespace-nowrap flex gap-1">
                  <span className="font-semibold" style={{ color: aqiColor(hoverData.aqi) }}>AQI {hoverData.aqi}</span>
                  {hoverData.pollutant && <span>· {hoverData.pollutant}</span>}
                  <span>· {hoverData.hour}:00</span>
                  {hoverData.delta !== 0 && (
                    <span className={hoverData.delta > 0 ? 'text-amber-300' : 'text-emerald-300'}>· {hoverData.delta > 0 ? '+' : ''}{hoverData.delta}</span>
                  )}
                  <span>· {hoverData.category}</span>
                </div>
              </div>
            )}
          </div>

          {/* Removed redundant horizontal slider to avoid duplicate sideways controls */}
          <div aria-live="polite" className="sr-only" ref={announceRef} />
        </div>
      )}
    </Card>
  )
}

