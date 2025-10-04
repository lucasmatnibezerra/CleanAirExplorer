/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react';
import { StationDrawer } from '../StationDrawer';
import { MemoryRouter } from 'react-router-dom';
import { useAppStore } from '../../../state/store';
import * as hooks from '../../../api/hooks';
import React from 'react';

// Mock data
const stations = [
  { id: 's1', name: 'Station One', latestAQI: 42, location: { lat: 10, lon: 20 } }
];
const historical = { stationId: 's1', pollutant: 'PM2.5', points: Array.from({length:15}, (_,i)=>({ ts: `t${i}`, value: i})) };

vi.spyOn(hooks, 'useStations').mockReturnValue({ data: stations } as any);
vi.spyOn(hooks, 'useHistoricalSeries').mockImplementation((id: string | null) => ({ data: id ? historical : undefined } as any));

function openStation(id: string){
  useAppStore.getState().setSelectedStation(id);
}

function closeStation(){
  useAppStore.getState().setSelectedStation(null);
}

describe('StationDrawer', () => {
  beforeEach(() => {
    closeStation();
  });

  it('opens when station selected and closes resetting store', async () => {
  const { rerender } = render(<MemoryRouter><StationDrawer /></MemoryRouter>);
    // Initially not rendered
    expect(screen.queryByText('Station One')).toBeNull();

    // Open
    act(() => {
      openStation('s1');
    });
    rerender(<MemoryRouter><StationDrawer /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Station One')).toBeInTheDocument());

    // Click Close button inside footer (SheetClose -> Button)
  const closeButtons = screen.getAllByRole('button', { name: /close/i });
  // Prefer the footer 'Close' (last one) to trigger onOpenChange
  fireEvent.click(closeButtons[closeButtons.length - 1]);

    await waitFor(() => expect(useAppStore.getState().selectedStationId).toBeNull());
  });
});
