import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MapPanel } from '../../sections/MapPanel'
import { withI18n } from '../../test/test-i18n'
import { useAppStore } from '../../state/store'

// Basic test ensuring the ozone forecast toggle button updates aria-pressed

describe('ozone forecast toggle', () => {
  it('toggles aria-pressed state (starts enabled by default now)', () => {
    const qc = new QueryClient()
    render(withI18n(<QueryClientProvider client={qc}><MapPanel /></QueryClientProvider>))
    const btn = screen.getByRole('button', { name: /toggle ozone forecast layer/i })
    // Default now true
  expect(btn.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(btn)
  expect(btn.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(btn)
  expect(btn.getAttribute('aria-pressed')).toBe('true')
    const layer = useAppStore.getState().layers.find(l => l.key === 'ozone_forecast')
    expect(layer?.visible).toBe(true)
  })
})
