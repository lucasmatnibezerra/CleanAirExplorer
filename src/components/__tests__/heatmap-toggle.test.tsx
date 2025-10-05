// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MapPanel } from '../../sections/MapPanel'
import '../../i18n'

const qc = new QueryClient()

describe('Heatmap toggle', () => {
  test('toggles heatmap layer aria-pressed', () => {
    render(<QueryClientProvider client={qc}><MapPanel /></QueryClientProvider>)
    const btn = screen.getByRole('button', { name: /heatmap/i })
    expect(btn).toHaveAttribute('aria-pressed','false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed','true')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-pressed','false')
  })
})