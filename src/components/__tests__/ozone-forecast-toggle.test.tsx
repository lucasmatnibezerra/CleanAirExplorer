import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MapPanel } from '../../sections/MapPanel'
import { useAppStore } from '../../state/store'

// Basic test ensuring the ozone forecast toggle button updates aria-pressed

describe('ozone forecast toggle', () => {
  it('toggles aria-pressed state', () => {
    const qc = new QueryClient()
    // Ensure layer starts hidden (default false)
    render(<QueryClientProvider client={qc}><MapPanel /></QueryClientProvider>)
    const btn = screen.getByRole('button', { name: /toggle ozone forecast layer/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    // Also assert store state changed
    const layer = useAppStore.getState().layers.find(l => l.key === 'ozone_forecast')
    expect(layer?.visible).toBe(true)
  })
})
