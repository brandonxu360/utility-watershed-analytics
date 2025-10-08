import { create } from 'zustand';

type WatershedOverlayState = {
  subcatchment: boolean;
  channels: boolean;
  patches: boolean;
  landuse: boolean;
  landuselegend: boolean;
  landuseLegendMap: Record<string, string>;
  setSubcatchment: (value: boolean) => void;
  setChannels: (value: boolean) => void;
  setPatches: (value: boolean) => void;
  setLanduse: (value: boolean) => void;
  setLanduseLegend: (value: boolean) => void;
  setLanduseLegendMap: (legend: Record<string, string>) => void;
  reset: () => void;
};

export const useWatershedOverlayStore = create<WatershedOverlayState>((set) => ({
  subcatchment: false,
  channels: false,
  patches: false,
  landuse: false,
  landuselegend: false,
  landuseLegendMap: {},
  setSubcatchment: (value) => set({ subcatchment: value }),
  setChannels: (value) => set({ channels: value }),
  setPatches: (value) => set({ patches: value }),
  setLanduse: (value) => set({ landuse: value }),
  setLanduseLegend: (value) => set({ landuselegend: value }),
  setLanduseLegendMap: (legend) => set({ landuseLegendMap: legend }),
  reset: () =>
    set({
      subcatchment: false,
      channels: false,
      patches: false,
      landuse: false,
      landuselegend: false,
      landuseLegendMap: {},
    }),
}));
