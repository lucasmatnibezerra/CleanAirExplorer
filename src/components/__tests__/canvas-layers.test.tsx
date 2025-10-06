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

  it('heatmap canvas present by default (id #ca-heatmap)', async () => {
    setup()
    await waitFor(()=> expect(document.getElementById('ca-heatmap')).not.toBeNull())
  })

  it('ozone forecast canvas present by default (id #ca-ozone)', async () => {
    setup()
    await waitFor(()=> expect(document.getElementById('ca-ozone')).not.toBeNull())
  })
})
