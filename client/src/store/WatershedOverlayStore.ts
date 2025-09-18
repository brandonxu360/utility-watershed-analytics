import { create } from 'zustand';

type WatershedOverlayState = {
  subcatchment: boolean;
  channels: boolean;
  patches: boolean;
  landuse: boolean;
  setSubcatchment: (value: boolean) => void;
  setChannels: (value: boolean) => void;
  setPatches: (value: boolean) => void;
  setLanduse: (value: boolean) => void;
  reset: () => void;
};

export const useWatershedOverlayStore = create<WatershedOverlayState>((set) => ({
  subcatchment: false,
  channels: false,
  patches: false,
  landuse: false,
  setSubcatchment: (value) => set({ subcatchment: value }),
  setChannels: (value) => set({ channels: value }),
  setPatches: (value) => set({ patches: value }),
  setLanduse: (value) => set({ landuse: value }),
  reset: () =>
    set({
      subcatchment: false,
      channels: false,
      patches: false,
      landuse: false,
    }),
}));
