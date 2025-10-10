import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { StationsPage } from '../StationsPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function wrapper(ui: React.ReactNode){
  const qc = new QueryClient()
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
}

describe('StationsPage', () => {
  it('renders search bar and some station cards', async () => {
    render(wrapper(<StationsPage />))
    expect(screen.getByText(/Monitoring Stations/i)).toBeInTheDocument()
    await waitFor(async () => {
      // after data loads, we should see at least one AQI label or card action
      const el = await screen.findAllByRole('button', { name: /favorite/i })
      expect(el.length).toBeGreaterThan(0)
    })
  })
})
