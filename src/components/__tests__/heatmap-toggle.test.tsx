// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MapPanel } from '../../sections/MapPanel'
import { withI18n } from '../../test/test-i18n'

const qc = new QueryClient()

describe('Heatmap toggle', () => {
  test('toggles heatmap layer aria-pressed (starts enabled by default now)', () => {
    render(withI18n(<QueryClientProvider client={qc}><MapPanel /></QueryClientProvider>))
    const btn = screen.getByRole('button', { name: /toggle aqi heatmap/i })
    // Default now true
    expect(btn.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(btn)
    expect(btn.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(btn)
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })
})