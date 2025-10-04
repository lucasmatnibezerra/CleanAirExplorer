import { describe, it, expect } from 'vitest'
import { ColorLegend } from '../../components/map/ColorLegend'
import { render } from '@testing-library/react'

describe('ColorLegend', () => {
  it('renders AQI scale labels', () => {
    const { getByText } = render(<ColorLegend />)
    expect(getByText('0-50')).toBeTruthy()
    expect(getByText('51-100')).toBeTruthy()
  })
})
