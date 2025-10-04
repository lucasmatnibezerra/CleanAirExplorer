import { describe, it, expect } from 'vitest'
import { useAppStore } from './store'

describe('app store', () => {
  it('toggles a layer visibility', () => {
    const initial = useAppStore.getState().layers.find(l=> l.key==='tempo_no2')!
    const prev = initial.visible
    useAppStore.getState().toggleLayer('tempo_no2')
    const updated = useAppStore.getState().layers.find(l=> l.key==='tempo_no2')!
    expect(updated.visible).toBe(!prev)
  })

  it('sets forecast hour index', () => {
    useAppStore.getState().setForecastHourIndex(7)
    expect(useAppStore.getState().forecastHourIndex).toBe(7)
  })
})
