import { create } from 'zustand';

export type ChoroplethType = 'none' | 'evapotranspiration' | 'soilMoisture';

type WatershedOverlayState = {
  subcatchment: boolean;
  channels: boolean;
  patches: boolean;
  landuse: boolean;
  landuselegend: boolean;
  landuseLegendMap: Record<string, string>;

  // Choropleth state
  choropleth: ChoroplethType;
  choroplethYear: number | null;
  choroplethData: Map<number, number> | null;
  choroplethRange: { min: number; max: number } | null;
  choroplethLoading: boolean;
  choroplethError: string | null;

  // Actions
  setSubcatchment: (value: boolean) => void;
  setChannels: (value: boolean) => void;
  setPatches: (value: boolean) => void;
  setLanduse: (value: boolean) => void;
  setLanduseLegend: (value: boolean) => void;
  setLanduseLegendMap: (legend: Record<string, string>) => void;
  setChoropleth: (type: ChoroplethType) => void;
  setChoroplethYear: (year: number | null) => void;
  setChoroplethData: (data: Map<number, number> | null, range: { min: number; max: number } | null) => void;
  setChoroplethLoading: (loading: boolean) => void;
  setChoroplethError: (error: string | null) => void;
  reset: () => void;
};

export const useWatershedOverlayStore = create<WatershedOverlayState>((set) => ({
  subcatchment: false,
  channels: false,
  patches: false,
  landuse: false,
  landuselegend: false,
  landuseLegendMap: {},
  choropleth: 'none',
  choroplethYear: null,
  choroplethData: null,
  choroplethRange: null,
  choroplethLoading: false,
  choroplethError: null,
  setSubcatchment: (value) => set({ subcatchment: value }),
  setChannels: (value) => set({ channels: value }),
  setPatches: (value) => set({ patches: value }),
  setLanduse: (value) => set({ landuse: value }),
  setLanduseLegend: (value) => set({ landuselegend: value }),
  setLanduseLegendMap: (legend) => set({ landuseLegendMap: legend }),
  setChoropleth: (type) => set({ choropleth: type }),
  setChoroplethYear: (year) => set({ choroplethYear: year }),
  setChoroplethData: (data, range) => set({ choroplethData: data, choroplethRange: range }),
  setChoroplethLoading: (loading) => set({ choroplethLoading: loading }),
  setChoroplethError: (error) => set({ choroplethError: error }),
  reset: () =>
    set({
      subcatchment: false,
      channels: false,
      patches: false,
      landuse: false,
      landuselegend: false,
      landuseLegendMap: {},
      choropleth: 'none',
      choroplethYear: null,
      choroplethData: null,
      choroplethRange: null,
      choroplethLoading: false,
      choroplethError: null,
    }),
}));
