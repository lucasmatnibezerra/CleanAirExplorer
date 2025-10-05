import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LayerKey = 'tempo_no2' | 'tempo_o3' | 'aqi_surface' | 'stations' | 'wind_vectors' | 'aqi_heatmap'
export interface LayerState { key: LayerKey; label: string; visible: boolean; order: number }

export interface SettingsState {
  units: 'AQI' | 'METRIC';
  alertThreshold: number;
  homeLocation?: { lat:number; lon:number } | null;
}

interface AppState {
  layers: LayerState[];
  settings: SettingsState;
  selectedStationId: string | null;
  forecastHourIndex: number;
  language: string;
  toggleLayer: (key:LayerKey) => void;
  setSelectedStation: (id: string | null) => void;
  updateSettings: (partial: Partial<SettingsState>) => void;
  setHomeLocation: (lat:number, lon:number) => void;
  setForecastHourIndex: (idx:number) => void;
  setLanguage: (lang:string) => void;
}

const defaultLayers: LayerState[] = [
  { key:'tempo_no2', label:'TEMPO NO₂', visible:true, order:1 },
  { key:'tempo_o3', label:'TEMPO O₃', visible:false, order:2 },
  { key:'aqi_surface', label:'AQI Surface', visible:true, order:3 },
  { key:'stations', label:'Stations', visible:true, order:4 },
  { key:'wind_vectors', label:'Wind', visible:false, order:5 },
  { key:'aqi_heatmap', label:'AQI Heatmap', visible:false, order:6 },
]

const defaultSettings: SettingsState = { units:'AQI', alertThreshold:100, homeLocation: null }

export const useAppStore = create<AppState>()(persist((set)=>({
  layers: defaultLayers,
  settings: defaultSettings,
  selectedStationId: null,
  forecastHourIndex: 0,
  language: 'en',
  toggleLayer: (key) => set(s => ({
    layers: s.layers.map(l => l.key===key ? {...l, visible: !l.visible}: l)
  })),
  setSelectedStation: (id) => set({ selectedStationId: id }),
  updateSettings: (partial) => set(s => ({ settings: { ...s.settings, ...partial } })),
  setHomeLocation: (lat, lon) => set(s => ({ settings: { ...s.settings, homeLocation: {lat, lon} } })),
  setForecastHourIndex: (idx) => set({ forecastHourIndex: idx }),
  setLanguage: (lang) => set({ language: lang })
}), { name:'clean-air-app' }))
