import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { withI18n } from '../../test/test-i18n'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MapPanel } from '../../sections/MapPanel'

vi.mock('../../api/hooks', () => ({
  useStations: () => ({ data: [ { id:'s1', name:'Station 1', location:{ lat:40, lon:-100 }, latestAQI: 50 } ] })
}))

vi.mock('../../data/ozoneLoader', () => ({
  getOzoneGrid: async () => ({ meta: { lat_min:-60, lat_max:60, lon_min:-130, lon_max:-30, rows:4, cols:4 }, data: new Float32Array([
    10,20,30,40,
    15,25,35,45,
    20,30,40,50,
    12,22,32,60
  ]) })
}))

describe('legend ozone range', () => {
  it('shows ozone range after toggling layer and opening legend', async () => {
    const qc = new QueryClient()
    render(withI18n(<QueryClientProvider client={qc}><MapPanel /></QueryClientProvider>))

    // Toggle ozone forecast layer
    const ozoneBtn = screen.getByRole('button', { name: /toggle ozone forecast layer/i })
    fireEvent.click(ozoneBtn)

    // Open legend
    const legendBtn = screen.getByRole('button', { name: /legend/i })
    fireEvent.click(legendBtn)

    // Await deterministic render hook promise
    const ready: any = (window as any).__ozoneRangeReady
    if(ready && typeof ready.then === 'function'){
      await ready
    } else {
      // Fallback: small delay
      await new Promise(r=> setTimeout(r, 50))
    }
    const rangeEl = await screen.findByLabelText('ozone-range-line', {}, { timeout: 1500 })
    expect(rangeEl.textContent).toMatch(/10\.?/)
    expect(rangeEl.textContent).toMatch(/60\.?/)
  })
})
