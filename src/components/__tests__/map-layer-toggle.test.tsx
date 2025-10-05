/// <reference types="vitest" />
import { describe, test, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MapPanel } from '../../sections/MapPanel'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '../../i18n'
import { useAppStore } from '../../state/store'

// Simple test to ensure aria-pressed toggles when clicking AQI button

describe('Map layer toggles', () => {
  test('toggles AQI layer aria-pressed', async () => {
    // Ensure initial store state predictable
    useAppStore.setState({ layers: [
      { key: 'aqi_surface', label: 'AQI Surface', visible: true, order: 0 },
      { key: 'tempo_no2', label: 'NO2', visible: false, order: 1 },
      { key: 'tempo_o3', label: 'O3', visible: false, order: 2 },
    ] })
  const qc = new QueryClient()
  render(<QueryClientProvider client={qc}><MapPanel /></QueryClientProvider>)
  const aqiBtn = await screen.findByRole('button', { name: /toggle aqi surface/i })
    expect(aqiBtn).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(aqiBtn)
    await waitFor(()=> expect(aqiBtn).toHaveAttribute('aria-pressed', 'false'))
    fireEvent.click(aqiBtn)
    await waitFor(()=> expect(aqiBtn).toHaveAttribute('aria-pressed', 'true'))
  })
})
