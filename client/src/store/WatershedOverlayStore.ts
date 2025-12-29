import { create } from 'zustand';

export type ChoroplethType = 'none' | 'evapotranspiration' | 'soilMoisture' | 'vegetationCover';
export type VegetationBandType = 'all' | 'shrub' | 'tree';

type ChoroplethState = {
  type: ChoroplethType;
  year: number | null;
  bands: VegetationBandType;
  data: Map<number, number> | null;
  range: { min: number; max: number } | null;
  loading: boolean;
  error: string | null;
};

const initialChoroplethState: ChoroplethState = {
  type: 'none',
  year: null,
  bands: 'all',
  data: null,
  range: null,
  loading: false,
  error: null,
};

type WatershedOverlayState = {
  subcatchment: boolean;
  channels: boolean;
  landuse: boolean;
  landuselegend: boolean;
  landuseLegendMap: Record<string, string>;

  // Choropleth state
  choropleth: ChoroplethState;

  // Actions
  setSubcatchment: (value: boolean) => void;
  setChannels: (value: boolean) => void;
  setLanduse: (value: boolean) => void;
  setLanduseLegend: (value: boolean) => void;
  setLanduseLegendMap: (legend: Record<string, string>) => void;

  // Choropleth actions
  setChoroplethType: (type: ChoroplethType) => void;
  setChoroplethYear: (year: number | null) => void;
  setChoroplethBands: (bands: VegetationBandType) => void;
  setChoroplethData: (data: Map<number, number> | null, range: { min: number; max: number } | null) => void;
  setChoroplethLoading: (loading: boolean) => void;
  setChoroplethError: (error: string | null) => void;
  resetChoropleth: () => void;

  reset: () => void;
};

export const useWatershedOverlayStore = create<WatershedOverlayState>((set) => ({
  subcatchment: false,
  channels: false,
  landuse: false,
  landuselegend: false,
  landuseLegendMap: {},
  choropleth: initialChoroplethState,

  setSubcatchment: (value) => set({ subcatchment: value }),
  setChannels: (value) => set({ channels: value }),
  setLanduse: (value) => set({ landuse: value }),
  setLanduseLegend: (value) => set({ landuselegend: value }),
  setLanduseLegendMap: (legend) => set({ landuseLegendMap: legend }),

  setChoroplethType: (type) => set((state) => ({ choropleth: { ...state.choropleth, type } })),
  setChoroplethYear: (year) => set((state) => ({ choropleth: { ...state.choropleth, year } })),
  setChoroplethBands: (bands) => set((state) => ({ choropleth: { ...state.choropleth, bands } })),
  setChoroplethData: (data, range) => set((state) => ({ choropleth: { ...state.choropleth, data, range } })),
  setChoroplethLoading: (loading) => set((state) => ({ choropleth: { ...state.choropleth, loading } })),
  setChoroplethError: (error) => set((state) => ({ choropleth: { ...state.choropleth, error } })),
  resetChoropleth: () => set({ choropleth: initialChoroplethState }),

  reset: () =>
    set({
      subcatchment: false,
      channels: false,
      landuse: false,
      landuselegend: false,
      landuseLegendMap: {},
      choropleth: initialChoroplethState,
    }),
}));
