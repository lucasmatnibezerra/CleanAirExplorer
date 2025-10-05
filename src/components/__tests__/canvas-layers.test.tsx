import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { withI18n } from '../../test/test-i18n'

// Mock stations hook so heatmap has data to render
vi.mock('../../api/hooks', () => ({
  useStations: () => ({ data: [ { id:'s1', name:'Station 1', location:{ lat:40, lon:-100 }, latestAQI: 75 } ] })
}))

import { MapPanel } from '../../sections/MapPanel'

// Verifies that toggling heatmap and ozone forecast layers creates canvases with expected IDs

describe('map canvas layers', () => {
  function setup(){
    const qc = new QueryClient()
    render(withI18n(<QueryClientProvider client={qc}><MapPanel /></QueryClientProvider>))
  }

  it('creates AQI heatmap canvas when toggled', async () => {
    setup()
    const heatBtn = screen.getByRole('button', { name: /toggle aqi heatmap/i })
    fireEvent.click(heatBtn)
    await waitFor(()=> expect(document.getElementById('aqi-heatmap-layer')).not.toBeNull())
  })

  it('creates ozone forecast canvas when toggled', () => {
    setup()
    const ozoneBtn = screen.getByRole('button', { name: /toggle ozone forecast layer/i })
    fireEvent.click(ozoneBtn)
    const canvas = document.getElementById('ozone-forecast-layer') as HTMLCanvasElement | null
    expect(canvas).not.toBeNull()
  })
})
