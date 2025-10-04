import { describe, it, expect } from 'vitest'
import { ForecastPanel } from '../../sections/ForecastPanel'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, findAllByRole } from '@testing-library/react'

function renderWithClient(ui: React.ReactElement){
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('ForecastPanel', () => {
  it('renders interactive hourly buttons listbox', async () => {
    const utils = renderWithClient(<ForecastPanel />)
    // Wait for at least one option in listbox (role option inside role listbox)
    const listbox = await utils.findByRole('listbox', { name: /hourly aqi forecast/i })
    const options = await findAllByRole(listbox, 'option')
    expect(options.length).toBeGreaterThan(0)
  })
})
