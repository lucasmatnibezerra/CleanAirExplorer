/// <reference types="vitest" />
import { describe, test, expect } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { RootLayout } from '../layout/RootLayout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '../../i18n'

// Minimal portal/root test for mobile sheet toggle

describe('Mobile navigation sheet', () => {
  test('opens and closes via floating action button', () => {
    // jsdom default width ~1024; force matchMedia to simulate mobile if needed
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('max-width'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      })
    })

  const qc = new QueryClient()
  render(<QueryClientProvider client={qc}><BrowserRouter><RootLayout /></BrowserRouter></QueryClientProvider>)
  const openBtn = screen.getByRole('button', { name: /open menu/i })
    fireEvent.click(openBtn)
    // Navigation links should appear
    expect(screen.getAllByRole('link', { name: /map|stations|forecast|alerts/i }).length).toBeGreaterThan(0)
  })
})
